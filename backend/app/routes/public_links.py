import secrets
from urllib.request import urlopen
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

# public_links.py

from app.schemas.public_link import (
    PublicFileContentResponse,
    PublicFileContentUpdateRequest,
    PublicFileResponse,
    PublicLinkAccessRequest,
    PublicLinkCreateRequest,
    PublicLinkPermissionUpdateRequest,
    PublicLinkResponse,
    PublicLinkUpdateRequest,
)

from app.services.storage_service import (
    get_download_url,
    upload_file,
)


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
    permission=link_data.permission.value,
    password_hash=(
        hash_password(link_data.password)
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
# UPDATE PUBLIC LINK PERMISSION
#
# PATCH /public-links/{link_id}/permission
#
# OWNER ONLY
#
# Allows:
#
# viewer -> editor
# editor -> viewer
# ============================================================

@router.patch(
    "/{link_id}/permission",
    response_model=PublicLinkResponse,
)
def update_public_link_permission(
    link_id: str,
    link_data: PublicLinkPermissionUpdateRequest,
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

    if not public_link.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Public link is inactive",
        )

    public_link.permission = (
        link_data.permission.value
    )

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

        permission=public_link.permission,

        expires_at=public_link.expires_at,

        is_active=public_link.is_active,

        created_at=public_link.created_at,
    )


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

# ============================================================
# PUBLIC EDITOR HELPERS
# ============================================================

def require_public_editor(public_link: PublicLink):
    if public_link.permission != "editor":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This public link is view-only",
        )


def _public_folder_contains(
    root_folder_id: str,
    target_folder_id: str,
    db: Session,
) -> bool:
    """Return True when target_folder_id is root or a descendant of root."""
    current_id = target_folder_id
    visited: set[str] = set()

    while current_id is not None:
        if current_id == root_folder_id:
            return True
        if current_id in visited:
            return False
        visited.add(current_id)

        current = db.scalar(
            select(Folder).where(Folder.id == current_id)
        )
        if not current:
            return False
        current_id = current.parent_id

    return False


def _public_file_allowed(
    public_link: PublicLink,
    file: File,
    db: Session,
) -> bool:
    if public_link.file_id:
        return str(file.id) == str(public_link.file_id)

    if not public_link.folder_id or not file.folder_id:
        return False

    return _public_folder_contains(
        str(public_link.folder_id),
        str(file.folder_id),
        db,
    )


def _public_folder_allowed(
    public_link: PublicLink,
    folder: Folder,
    db: Session,
) -> bool:
    if not public_link.folder_id:
        return False

    return _public_folder_contains(
        str(public_link.folder_id),
        str(folder.id),
        db,
    )


def _public_password(
    request: dict | None,
) -> str | None:
    if not request:
        return None
    return request.get("password")



def _is_text_editable(file: File) -> bool:
    mime_type = (
        (file.mime_type or "")
        .lower()
        .split(";")[0]
    )

    if (
        mime_type.startswith("text/")
        or mime_type in {
            "application/json",
            "application/javascript",
            "application/xml",
            "application/x-javascript",
        }
    ):
        return True

    name = file.name or ""

    extension = (
        name.lower().rsplit(".", 1)[-1]
        if "." in name
        else ""
    )

    return extension in {
        "txt",
        "md",
        "html",
        "htm",
        "css",
        "js",
        "jsx",
        "ts",
        "tsx",
        "json",
        "xml",
        "csv",
        "py",
        "java",
        "c",
        "cpp",
        "h",
        "hpp",
        "php",
        "sql",
        "sh",
        "yml",
        "yaml",
    }


# ============================================================
# PUBLIC EDITOR - RENAME FILE
#
# PATCH /public/{token}/file/{file_id}
#
# Body:
# {
#     "name": "new-name.pdf",
#     "password": "optional-password"
# }
# ============================================================

# ============================================================
# PUBLIC EDITOR - GET FILE CONTENT
# ============================================================

@public_access_router.get(
    "/public/{token}/file/{file_id}/content",
    response_model=PublicFileContentResponse,
)
def public_get_file_content(
    token: str,
    file_id: str,
    password: str | None = None,
    db: Session = Depends(get_db),
):
    public_link = get_active_public_link(token, db)

    verify_public_link_password(
        public_link,
        password,
    )

    file = db.scalar(
        select(File).where(
            File.id == file_id,
            File.is_deleted.is_(False),
        )
    )

    if not file or not _public_file_allowed(
        public_link,
        file,
        db,
    ):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found",
        )

    if not _is_text_editable(file):
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="This file type cannot be edited in the browser",
        )

    try:
        download_url = get_download_url(
            public_id=file.storage_public_id,
            resource_type=file.resource_type,
        )

        with urlopen(
            download_url,
            timeout=30,
        ) as response:
            raw_content = response.read()

        content = raw_content.decode(
            "utf-8",
            errors="replace",
        )

    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Unable to read file content",
        ) from exc

    return PublicFileContentResponse(
        id=str(file.id),
        name=file.name,
        mime_type=file.mime_type,
        size=len(raw_content),
        content=content,
        permission=public_link.permission,
    )


# ============================================================
# PUBLIC EDITOR - UPDATE FILE CONTENT
# ============================================================

@public_access_router.patch(
    "/public/{token}/file/{file_id}/content",
    response_model=PublicFileContentResponse,
)
def public_update_file_content(
    token: str,
    file_id: str,
    data: PublicFileContentUpdateRequest,
    db: Session = Depends(get_db),
):
    public_link = get_active_public_link(token, db)

    verify_public_link_password(
        public_link,
        data.password,
    )

    require_public_editor(public_link)

    file = db.scalar(
        select(File).where(
            File.id == file_id,
            File.is_deleted.is_(False),
        )
    )

    if not file or not _public_file_allowed(
        public_link,
        file,
        db,
    ):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found",
        )

    if not _is_text_editable(file):
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="This file type cannot be edited in the browser",
        )

    content_bytes = data.content.encode("utf-8")

    try:
        upload_result = upload_file(
            file=content_bytes,
            filename=file.name,
            content_type=(
                file.mime_type
                or "text/plain"
            ),
            folder=(
                f"cloud-storage-service/"
                f"users/{file.owner_id}"
            ),
        )

        file.storage_public_id = upload_result["public_id"]
        file.storage_url = upload_result["secure_url"]
        file.resource_type = upload_result["resource_type"]
        file.size = len(content_bytes)

        db.commit()
        db.refresh(file)

    except Exception as exc:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to save file content",
        ) from exc

    return PublicFileContentResponse(
        id=str(file.id),
        name=file.name,
        mime_type=file.mime_type,
        size=file.size,
        content=data.content,
        permission=public_link.permission,
    )


# ============================================================
# PUBLIC EDITOR - RENAME FILE
# ============================================================

@public_access_router.patch(
    "/public/{token}/file/{file_id}",
)
def public_rename_file(
    token: str,
    file_id: str,
    data: dict,
    db: Session = Depends(get_db),
):
    public_link = get_active_public_link(token, db)
    verify_public_link_password(
        public_link,
        _public_password(data),
    )
    require_public_editor(public_link)

    file = db.scalar(
        select(File).where(
            File.id == file_id,
            File.is_deleted.is_(False),
        )
    )

    if not file or not _public_file_allowed(public_link, file, db):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found",
        )

    new_name = str(data.get("name", "")).strip()
    if not new_name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File name cannot be empty",
        )

    existing = db.scalar(
        select(File).where(
            File.owner_id == file.owner_id,
            File.folder_id == file.folder_id,
            File.name == new_name,
            File.id != file.id,
            File.is_deleted.is_(False),
        )
    )

    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A file with this name already exists here",
        )

    file.name = new_name
    db.commit()
    db.refresh(file)

    return {
        "id": str(file.id),
        "name": file.name,
        "folder_id": str(file.folder_id) if file.folder_id else None,
        "permission": public_link.permission,
    }


# ============================================================
# PUBLIC EDITOR - MOVE FILE
#
# PATCH /public/{token}/file/{file_id}/move
#
# Body:
# {
#     "folder_id": "destination-folder-id-or-null",
#     "password": "optional-password"
# }
# ============================================================

@public_access_router.patch(
    "/public/{token}/file/{file_id}/move",
)
def public_move_file(
    token: str,
    file_id: str,
    data: dict,
    db: Session = Depends(get_db),
):
    public_link = get_active_public_link(token, db)
    verify_public_link_password(
        public_link,
        _public_password(data),
    )
    require_public_editor(public_link)

    file = db.scalar(
        select(File).where(
            File.id == file_id,
            File.is_deleted.is_(False),
        )
    )

    if not file or not _public_file_allowed(public_link, file, db):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found",
        )

    target_id = data.get("folder_id")
    target_folder = None

    if target_id:
        target_folder = db.scalar(
            select(Folder).where(
                Folder.id == target_id,
                Folder.is_deleted.is_(False),
            )
        )
        if not target_folder:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Target folder not found",
            )

        if not public_link.folder_id or not _public_folder_allowed(
            public_link, target_folder, db
        ):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You cannot move the file outside the shared folder",
            )

        if target_folder.owner_id != file.owner_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You cannot move the file to this location",
            )

    existing = db.scalar(
        select(File).where(
            File.owner_id == file.owner_id,
            File.folder_id == target_id,
            File.name == file.name,
            File.id != file.id,
            File.is_deleted.is_(False),
        )
    )

    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A file with this name already exists in the target folder",
        )

    file.folder_id = target_id
    db.commit()
    db.refresh(file)

    return {
        "id": str(file.id),
        "name": file.name,
        "folder_id": str(file.folder_id) if file.folder_id else None,
        "permission": public_link.permission,
    }


# ============================================================
# PUBLIC EDITOR - DELETE FILE
#
# DELETE /public/{token}/file/{file_id}
# ============================================================

@public_access_router.delete(
    "/public/{token}/file/{file_id}",
)
def public_delete_file(
    token: str,
    file_id: str,
    data: dict | None = None,
    db: Session = Depends(get_db),
):
    public_link = get_active_public_link(token, db)
    verify_public_link_password(
        public_link,
        _public_password(data),
    )
    require_public_editor(public_link)

    file = db.scalar(
        select(File).where(
            File.id == file_id,
            File.is_deleted.is_(False),
        )
    )

    if not file or not _public_file_allowed(public_link, file, db):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found",
        )

    file.is_deleted = True
    db.commit()

    return {"message": "File moved to trash"}


# ============================================================
# PUBLIC EDITOR - RENAME FOLDER
#
# PATCH /public/{token}/folder/{folder_id}
# ============================================================

@public_access_router.patch(
    "/public/{token}/folder/{folder_id}",
)
def public_rename_folder(
    token: str,
    folder_id: str,
    data: dict,
    db: Session = Depends(get_db),
):
    public_link = get_active_public_link(token, db)
    verify_public_link_password(
        public_link,
        _public_password(data),
    )
    require_public_editor(public_link)

    folder = db.scalar(
        select(Folder).where(
            Folder.id == folder_id,
            Folder.is_deleted.is_(False),
        )
    )

    if not folder or not _public_folder_allowed(public_link, folder, db):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Folder not found",
        )

    new_name = str(data.get("name", "")).strip()
    if not new_name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Folder name cannot be empty",
        )

    existing = db.scalar(
        select(Folder).where(
            Folder.owner_id == folder.owner_id,
            Folder.parent_id == folder.parent_id,
            Folder.name == new_name,
            Folder.id != folder.id,
            Folder.is_deleted.is_(False),
        )
    )

    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A folder with this name already exists here",
        )

    folder.name = new_name
    db.commit()
    db.refresh(folder)

    return {
        "id": str(folder.id),
        "name": folder.name,
        "parent_id": str(folder.parent_id) if folder.parent_id else None,
        "permission": public_link.permission,
    }


# ============================================================
# PUBLIC EDITOR - MOVE FOLDER
#
# PATCH /public/{token}/folder/{folder_id}/move
# ============================================================

@public_access_router.patch(
    "/public/{token}/folder/{folder_id}/move",
)
def public_move_folder(
    token: str,
    folder_id: str,
    data: dict,
    db: Session = Depends(get_db),
):
    public_link = get_active_public_link(token, db)
    verify_public_link_password(
        public_link,
        _public_password(data),
    )
    require_public_editor(public_link)

    folder = db.scalar(
        select(Folder).where(
            Folder.id == folder_id,
            Folder.is_deleted.is_(False),
        )
    )

    if not folder or not _public_folder_allowed(public_link, folder, db):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Folder not found",
        )

    target_id = data.get("folder_id")
    target_folder = None

    if target_id:
        target_folder = db.scalar(
            select(Folder).where(
                Folder.id == target_id,
                Folder.is_deleted.is_(False),
            )
        )
        if not target_folder:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Target folder not found",
            )

        if not _public_folder_allowed(public_link, target_folder, db):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You cannot move the folder outside the shared folder",
            )

        if target_folder.owner_id != folder.owner_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You cannot move the folder to this location",
            )

        if str(target_folder.id) == str(folder.id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A folder cannot be moved inside itself",
            )

        if _public_folder_contains(str(folder.id), str(target_folder.id), db):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A folder cannot be moved inside one of its own descendants",
            )

    existing = db.scalar(
        select(Folder).where(
            Folder.owner_id == folder.owner_id,
            Folder.parent_id == target_id,
            Folder.name == folder.name,
            Folder.id != folder.id,
            Folder.is_deleted.is_(False),
        )
    )

    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A folder with this name already exists in the target folder",
        )

    folder.parent_id = target_id
    db.commit()
    db.refresh(folder)

    return {
        "id": str(folder.id),
        "name": folder.name,
        "parent_id": str(folder.parent_id) if folder.parent_id else None,
        "permission": public_link.permission,
    }


# ============================================================
# PUBLIC EDITOR - DELETE FOLDER
#
# DELETE /public/{token}/folder/{folder_id}
# ============================================================

@public_access_router.delete(
    "/public/{token}/folder/{folder_id}",
)
def public_delete_folder(
    token: str,
    folder_id: str,
    data: dict | None = None,
    db: Session = Depends(get_db),
):
    public_link = get_active_public_link(token, db)
    verify_public_link_password(
        public_link,
        _public_password(data),
    )
    require_public_editor(public_link)

    folder = db.scalar(
        select(Folder).where(
            Folder.id == folder_id,
            Folder.is_deleted.is_(False),
        )
    )

    if not folder or not _public_folder_allowed(public_link, folder, db):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Folder not found",
        )

    if public_link.folder_id and str(folder.id) == str(public_link.folder_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="The shared root folder cannot be deleted through its public link",
        )

    folder.is_deleted = True
    db.commit()

    return {"message": "Folder moved to trash"}
