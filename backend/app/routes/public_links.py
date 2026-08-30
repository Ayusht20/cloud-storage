import secrets

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Response,
    status,
)
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.core.security import hash_password
from app.models.file import File
from app.models.folder import Folder
from app.models.public_link import PublicLink
from app.models.user import User
from app.schemas.public_link import (
    PublicLinkCreateRequest,
    PublicLinkResponse,
)


router = APIRouter(
    prefix="/public-links",
    tags=["Public Links"],
)


def generate_public_token() -> str:
    """
    Generate a cryptographically secure public link token.
    """
    return secrets.token_urlsafe(32)


@router.post(
    "",
    response_model=PublicLinkResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_public_link(
    file_id: str | None = None,
    folder_id: str | None = None,
    link_data: PublicLinkCreateRequest = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if file_id is None and folder_id is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Either file_id or folder_id is required",
        )

    if file_id is not None and folder_id is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A public link cannot target both a file and a folder",
        )

    if link_data is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Public link data is required",
        )

    if link_data.expires_at is not None:
        from datetime import datetime, timezone

        if link_data.expires_at <= datetime.now(timezone.utc):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Expiry time must be in the future",
            )

    if file_id is not None:
        file = db.scalar(
            select(File).where(
                File.id == file_id,
                File.owner_id == current_user.id,
                File.is_deleted.is_(False),
            )
        )

        if not file:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="File not found",
            )

    if folder_id is not None:
        folder = db.scalar(
            select(Folder).where(
                Folder.id == folder_id,
                Folder.owner_id == current_user.id,
                Folder.is_deleted.is_(False),
            )
        )

        if not folder:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Folder not found",
            )

    token = generate_public_token()

    while db.scalar(
        select(PublicLink).where(
            PublicLink.token == token
        )
    ):
        token = generate_public_token()

    password_hash = None

    if link_data.password:
        password_hash = hash_password(
            link_data.password
        )

    public_link = PublicLink(
        token=token,
        file_id=file_id,
        folder_id=folder_id,
        password_hash=password_hash,
        expires_at=link_data.expires_at,
        is_active=True,
    )

    db.add(public_link)
    db.commit()
    db.refresh(public_link)

    return PublicLinkResponse(
        id=str(public_link.id),
        token=public_link.token,
        file_id=(
            str(public_link.file_id)
            if public_link.file_id
            else None
        ),
        folder_id=(
            str(public_link.folder_id)
            if public_link.folder_id
            else None
        ),
        expires_at=public_link.expires_at,
        is_active=public_link.is_active,
        created_at=public_link.created_at,
    )


@router.get(
    "",
    response_model=list[PublicLinkResponse],
)
def list_public_links(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    links = db.scalars(
        select(PublicLink)
        .outerjoin(
            File,
            PublicLink.file_id == File.id,
        )
        .outerjoin(
            Folder,
            PublicLink.folder_id == Folder.id,
        )
        .where(
            (
                (File.owner_id == current_user.id)
                | (Folder.owner_id == current_user.id)
            )
        )
        .order_by(
            PublicLink.created_at.desc()
        )
    ).all()

    return [
        PublicLinkResponse(
            id=str(link.id),
            token=link.token,
            file_id=(
                str(link.file_id)
                if link.file_id
                else None
            ),
            folder_id=(
                str(link.folder_id)
                if link.folder_id
                else None
            ),
            expires_at=link.expires_at,
            is_active=link.is_active,
            created_at=link.created_at,
        )
        for link in links
    ]


@router.delete(
    "/{link_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def disable_public_link(
    link_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    public_link = db.scalar(
        select(PublicLink)
        .outerjoin(
            File,
            PublicLink.file_id == File.id,
        )
        .outerjoin(
            Folder,
            PublicLink.folder_id == Folder.id,
        )
        .where(
            PublicLink.id == link_id,
            (
                (File.owner_id == current_user.id)
                | (Folder.owner_id == current_user.id)
            ),
        )
    )

    if not public_link:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Public link not found",
        )

    public_link.is_active = False

    db.commit()

    return Response(
        status_code=status.HTTP_204_NO_CONTENT
    )