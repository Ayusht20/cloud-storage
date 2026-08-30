from datetime import datetime, timezone

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
)
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import verify_password
from app.models.file import File
from app.models.folder import Folder
from app.models.public_link import PublicLink
from app.models.user import User
from app.schemas.public_link import (
    PublicFileResponse,
    PublicLinkAccessRequest,
)
from app.services.storage_service import get_download_url


router = APIRouter(
    tags=["Public Links"],
)


def get_active_public_link(
    token: str,
    db: Session,
) -> PublicLink:
    public_link = db.scalar(
        select(PublicLink).where(
            PublicLink.token == token,
            PublicLink.is_active.is_(True),
        )
    )

    if not public_link:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Public link not found",
        )

    if public_link.expires_at is not None:
        now = datetime.now(timezone.utc)

        expires_at = public_link.expires_at

        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(
                tzinfo=timezone.utc
            )

        if expires_at <= now:
            raise HTTPException(
                status_code=status.HTTP_410_GONE,
                detail="Public link has expired",
            )

    return public_link


def verify_public_link_password(
    public_link: PublicLink,
    password: str | None,
):
    if not public_link.password_hash:
        return

    if not password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Password required",
        )

    if not verify_password(
        password,
        public_link.password_hash,
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid password",
        )


@router.post(
    "/public/{token}",
)
def access_public_link(
    token: str,
    access_data: PublicLinkAccessRequest | None = None,
    db: Session = Depends(get_db),
):
    public_link = get_active_public_link(
        token,
        db,
    )

    password = (
        access_data.password
        if access_data
        else None
    )

    verify_public_link_password(
        public_link,
        password,
    )

    if public_link.file_id:
        file = db.scalar(
            select(File).where(
                File.id == public_link.file_id,
                File.is_deleted.is_(False),
            )
        )

        if not file:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="File not found",
            )

        download_url = get_download_url(
            public_id=file.storage_public_id,
            resource_type=file.resource_type,
        )

        return PublicFileResponse(
            id=str(file.id),
            name=file.name,
            mime_type=file.mime_type,
            size=file.size,
            download_url=download_url,
        )

    if public_link.folder_id:
        folder = db.scalar(
            select(Folder).where(
                Folder.id == public_link.folder_id,
                Folder.is_deleted.is_(False),
            )
        )

        if not folder:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Folder not found",
            )

        return {
            "type": "folder",
            "id": str(folder.id),
            "name": folder.name,
        }

    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="Public resource not found",
    )


@router.post(
    "/public/{token}/contents",
)
def get_public_folder_contents(
    token: str,
    access_data: PublicLinkAccessRequest | None = None,
    db: Session = Depends(get_db),
):
    public_link = get_active_public_link(
        token,
        db,
    )

    password = (
        access_data.password
        if access_data
        else None
    )

    verify_public_link_password(
        public_link,
        password,
    )

    if not public_link.folder_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Public link does not point to a folder",
        )

    folder = db.scalar(
        select(Folder).where(
            Folder.id == public_link.folder_id,
            Folder.is_deleted.is_(False),
        )
    )

    if not folder:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Folder not found",
        )

    folders = db.scalars(
        select(Folder)
        .where(
            Folder.parent_id == folder.id,
            Folder.owner_id == folder.owner_id,
            Folder.is_deleted.is_(False),
        )
        .order_by(Folder.name.asc())
    ).all()

    files = db.scalars(
        select(File)
        .where(
            File.folder_id == folder.id,
            File.owner_id == folder.owner_id,
            File.is_deleted.is_(False),
        )
        .order_by(File.name.asc())
    ).all()

    return {
        "folder": {
            "id": str(folder.id),
            "name": folder.name,
        },
        "folders": [
            {
                "id": str(child.id),
                "name": child.name,
                "parent_id": (
                    str(child.parent_id)
                    if child.parent_id
                    else None
                ),
            }
            for child in folders
        ],
        "files": [
            {
                "id": str(file.id),
                "name": file.name,
                "mime_type": file.mime_type,
                "size": file.size,
                "download_url": get_download_url(
                    public_id=file.storage_public_id,
                    resource_type=file.resource_type,
                ),
            }
            for file in files
        ],
    }