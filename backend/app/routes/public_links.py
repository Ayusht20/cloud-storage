import secrets
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
from app.core.dependencies import get_current_user
from app.core.security import (
    hash_password,
    verify_password,
)

from app.models.file import File
from app.models.folder import Folder
from app.models.public_link import PublicLink
from app.models.user import User

from app.schemas.public_link import (
    PublicFileResponse,
    PublicLinkAccessRequest,
    PublicLinkCreateRequest,
    PublicLinkResponse,
)

from app.services.storage_service import get_download_url


# ============================================================
# AUTHENTICATED PUBLIC LINK MANAGEMENT
# ============================================================

router = APIRouter(
    prefix="/public-links",
    tags=["Public Links"],
)


# ============================================================
# PUBLIC LINK ACCESS
#
# IMPORTANT:
# This router intentionally has NO prefix.
#
# Public URLs are:
#
# POST /public/{token}
# POST /public/{token}/contents
#
# These endpoints do NOT require login.
# ============================================================

public_access_router = APIRouter(
    tags=["Public Access"],
)


# ============================================================
# HELPERS
# ============================================================

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


# ============================================================
# CREATE PUBLIC LINK
#
# POST /public-links?file_id=<UUID>
#
# OR
#
# POST /public-links?folder_id=<UUID>
# ============================================================

@router.post(
    "",
    response_model=PublicLinkResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_public_link(
    link_data: PublicLinkCreateRequest,
    file_id: str | None = None,
    folder_id: str | None = None,
    current_user: User = Depends(
        get_current_user
    ),
    db: Session = Depends(get_db),
):

    # --------------------------------------------------------
    # Exactly one resource must be supplied
    # --------------------------------------------------------

    if bool(file_id) == bool(folder_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Provide either file_id or folder_id"
            ),
        )

    # --------------------------------------------------------
    # Validate file
    # --------------------------------------------------------

    if file_id:

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

    # --------------------------------------------------------
    # Validate folder
    # --------------------------------------------------------

    if folder_id:

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

    # --------------------------------------------------------
    # Validate expiration
    # --------------------------------------------------------

    expires_at = link_data.expires_at

    if expires_at is not None:

        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(
                tzinfo=timezone.utc
            )

        if expires_at <= datetime.now(
            timezone.utc
        ):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    "Expiration must be in the future"
                ),
            )

    # --------------------------------------------------------
    # Generate secure token
    # --------------------------------------------------------

    token = secrets.token_urlsafe(32)

    # --------------------------------------------------------
    # Create public link
    # --------------------------------------------------------

    public_link = PublicLink(
        token=token,
        file_id=file_id,
        folder_id=folder_id,

        # Public links default to viewer
        # unless editor was explicitly selected.
        permission=link_data.permission.value,

        password_hash=(
            hash_password(
                link_data.password
            )
            if link_data.password
            else None
        ),

        expires_at=expires_at,
        is_active=True,
    )

    db.add(public_link)

    db.commit()
    db.refresh(public_link)

    # --------------------------------------------------------
    # Response
    # --------------------------------------------------------

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

        permission=public_link.permission,

        expires_at=public_link.expires_at,

        is_active=public_link.is_active,

        created_at=public_link.created_at,
    )


# ============================================================
# LIST MY PUBLIC LINKS
#
# GET /public-links
# ============================================================

@router.get(
    "",
    response_model=list[PublicLinkResponse],
)
def list_public_links(
    current_user: User = Depends(
        get_current_user
    ),
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
                File.owner_id == current_user.id
            )
            |
            (
                Folder.owner_id == current_user.id
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

            permission=link.permission,

            expires_at=link.expires_at,

            is_active=link.is_active,

            created_at=link.created_at,
        )

        for link in links
    ]


# ============================================================
# REVOKE PUBLIC LINK
#
# DELETE /public-links/{link_id}
# ============================================================

@router.delete(
    "/{link_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def revoke_public_link(
    link_id: str,
    current_user: User = Depends(
        get_current_user
    ),
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
                File.owner_id == current_user.id
            )
            |
            (
                Folder.owner_id == current_user.id
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

    return None


# ============================================================
# PUBLIC FILE / FOLDER ACCESS
#
# POST /public/{token}
#
# NO LOGIN REQUIRED
# ============================================================

@public_access_router.post(
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

    # --------------------------------------------------------
    # FILE
    # --------------------------------------------------------

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

            permission=public_link.permission,
        )

    # --------------------------------------------------------
    # FOLDER
    # --------------------------------------------------------

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

            "permission": public_link.permission,
        }

    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="Public resource not found",
    )


# ============================================================
# PUBLIC FOLDER CONTENTS
#
# POST /public/{token}/contents
#
# NO LOGIN REQUIRED
# ============================================================

@public_access_router.post(
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

    # --------------------------------------------------------
    # Verify folder link
    # --------------------------------------------------------

    if not public_link.folder_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Public link does not point to a folder"
            ),
        )

    # --------------------------------------------------------
    # Get folder
    # --------------------------------------------------------

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

    # --------------------------------------------------------
    # Get subfolders
    # --------------------------------------------------------

    folders = db.scalars(
        select(Folder)
        .where(
            Folder.parent_id == folder.id,
            Folder.owner_id == folder.owner_id,
            Folder.is_deleted.is_(False),
        )
        .order_by(
            Folder.name.asc()
        )
    ).all()

    # --------------------------------------------------------
    # Get files
    # --------------------------------------------------------

    files = db.scalars(
        select(File)
        .where(
            File.folder_id == folder.id,
            File.owner_id == folder.owner_id,
            File.is_deleted.is_(False),
        )
        .order_by(
            File.name.asc()
        )
    ).all()

    # --------------------------------------------------------
    # Response
    # --------------------------------------------------------

    return {
        "folder": {
            "id": str(folder.id),

            "name": folder.name,

            "permission": public_link.permission,
        },

        "permission": public_link.permission,

        "folders": [
            {
                "id": str(child.id),

                "name": child.name,

                "parent_id": (
                    str(child.parent_id)
                    if child.parent_id
                    else None
                ),

                "permission": public_link.permission,
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

                "permission": public_link.permission,
            }

            for file in files
        ],
    }