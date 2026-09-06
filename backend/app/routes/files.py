import urllib.request
from datetime import datetime, timezone

from fastapi import (
    APIRouter,
    Depends,
    File as FastAPIFile,
    HTTPException,
    Response,
    UploadFile,
    status,
)
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.file import File
from app.models.folder import Folder
from app.models.user import User
from app.schemas.file import (
    FileDownloadResponse,
    FileListResponse,
    FileMoveRequest,
    FileResponse,
    FileUpdateRequest,
)
from app.services.storage_service import (
    get_download_url,
    upload_file,
)

from app.services.permission_service import (
    can_view,
    can_delete,
    can_edit,
)


router = APIRouter(
    prefix="/files",
    tags=["Files"],
)


# ============================================================
# UPLOAD FILE
# ============================================================

@router.post(
    "/upload",
    response_model=FileResponse,
    status_code=status.HTTP_201_CREATED,
)
async def upload_user_file(
    uploaded_file: UploadFile = FastAPIFile(...),
    folder_id: str | None = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not uploaded_file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File name is required",
        )

    filename = uploaded_file.filename.strip()

    if not filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File name cannot be empty",
        )

    # --------------------------------------------------------
    # Validate target folder
    # --------------------------------------------------------

    if folder_id:
        folder = db.scalar(
            select(Folder).where(
                Folder.id == folder_id,
                Folder.owner_id == current_user.id,
            )
        )

        if not folder:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Folder not found",
            )

    # --------------------------------------------------------
    # Prevent duplicate file names
    # --------------------------------------------------------

    existing_file = db.scalar(
        select(File).where(
            File.owner_id == current_user.id,
            File.folder_id == folder_id,
            File.name == filename,
            File.is_deleted.is_(False),
        )
    )

    if existing_file:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A file with this name already exists here",
        )

    # --------------------------------------------------------
    # Read file
    # --------------------------------------------------------

    file_content = await uploaded_file.read()
    file_size = len(file_content)

    if file_size == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Empty files are not allowed",
        )

    # --------------------------------------------------------
    # Check maximum file size
    # --------------------------------------------------------

    max_size = settings.MAX_FILE_SIZE_MB * 1024 * 1024

    if file_size > max_size:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=(
                f"File size exceeds the maximum allowed "
                f"limit of {settings.MAX_FILE_SIZE_MB} MB"
            ),
        )

    # --------------------------------------------------------
    # Upload to storage
    # --------------------------------------------------------

    try:
        upload_result = upload_file(
            file=file_content,
            filename=filename,
            content_type=uploaded_file.content_type,
            folder=(
                f"cloud-storage-service/"
                f"users/{current_user.id}"
            ),
        )

        file_record = File(
            name=filename,
            original_name=filename,
            storage_public_id=upload_result["public_id"],
            storage_url=upload_result["secure_url"],
            resource_type=upload_result["resource_type"],
            mime_type=uploaded_file.content_type,
            size=file_size,
            owner_id=current_user.id,
            folder_id=folder_id,
        )

        db.add(file_record)
        db.commit()
        db.refresh(file_record)

    except Exception as exc:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="File upload failed",
        ) from exc

    # --------------------------------------------------------
    # Response
    # --------------------------------------------------------

    return FileResponse(
        id=str(file_record.id),
        name=file_record.name,
        original_name=file_record.original_name,
        storage_public_id=file_record.storage_public_id,
        storage_url=file_record.storage_url,
        resource_type=file_record.resource_type,
        mime_type=file_record.mime_type,
        size=file_record.size,
        owner_id=str(file_record.owner_id),
        folder_id=(
            str(file_record.folder_id)
            if file_record.folder_id
            else None
        ),
        is_deleted=file_record.is_deleted,
    )


# ============================================================
# LIST FILES
# ============================================================

@router.get(
    "",
    response_model=list[FileListResponse],
)
def list_files(
    folder_id: str | None = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = (
        select(File)
        .where(
            File.owner_id == current_user.id,
            File.is_deleted.is_(False),
        )
        .order_by(File.name.asc())
    )

    # --------------------------------------------------------
    # Files inside a folder
    # --------------------------------------------------------

    if folder_id:
        folder = db.scalar(
            select(Folder).where(
                Folder.id == folder_id,
                Folder.owner_id == current_user.id,
            )
        )

        if not folder:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Folder not found",
            )

        query = query.where(
            File.folder_id == folder_id
        )

    # --------------------------------------------------------
    # Root files
    # --------------------------------------------------------

    else:
        query = query.where(
            File.folder_id.is_(None)
        )

    files = db.scalars(query).all()

    return [
        FileListResponse(
            id=str(file.id),
            name=file.name,
            mime_type=file.mime_type,
            size=file.size,
            folder_id=(
                str(file.folder_id)
                if file.folder_id
                else None
            ),
            is_deleted=file.is_deleted,
        )
        for file in files
    ]


# ============================================================
# VIEW / STREAM FILE CONTENT
# ============================================================

@router.get(
    "/{file_id}/content",
)
def get_file_content(
    file_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # --------------------------------------------------------
    # Find file
    # --------------------------------------------------------

    file_record = db.scalar(
        select(File).where(
            File.id == file_id,
            File.is_deleted.is_(False),
        )
    )

    if not file_record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found",
        )

    # --------------------------------------------------------
    # Permission check
    # --------------------------------------------------------

    if not can_view(
        file_record,
        current_user,
        db,
    ):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found",
        )

    # --------------------------------------------------------
    # Retrieve actual file bytes from storage
    # --------------------------------------------------------

    try:
        with urllib.request.urlopen(
            file_record.storage_url,
            timeout=30,
        ) as storage_response:
            file_content = storage_response.read()

    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Unable to retrieve file from storage",
        ) from exc

    # --------------------------------------------------------
    # Return the original content type
    #
    # inline = browser should attempt to display the file
    # --------------------------------------------------------

    filename = (
        file_record.name
        .replace('"', "")
        .replace("\r", "")
        .replace("\n", "")
    )

    return Response(
        content=file_content,
        media_type=(
            file_record.mime_type
            or "application/octet-stream"
        ),
        headers={
            "Content-Disposition": (
                f'inline; filename="{filename}"'
            )
        },
    )


# ============================================================
# DOWNLOAD FILE
# ============================================================

@router.get(
    "/{file_id}/download",
    response_model=FileDownloadResponse,
)
def download_file(
    file_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # --------------------------------------------------------
    # Find file
    # --------------------------------------------------------

    file_record = db.scalar(
        select(File).where(
            File.id == file_id,
            File.is_deleted.is_(False),
        )
    )

    if not file_record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found",
        )

    # --------------------------------------------------------
    # Permission check
    # --------------------------------------------------------

    if not can_view(
        file_record,
        current_user,
        db,
    ):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found",
        )

    # --------------------------------------------------------
    # Generate storage download URL
    # --------------------------------------------------------

    download_url = get_download_url(
        public_id=file_record.storage_public_id,
        resource_type=file_record.resource_type,
    )

    return FileDownloadResponse(
        file_name=file_record.name,
        download_url=download_url,
    )


# ============================================================
# GET SINGLE FILE
# ============================================================

@router.get(
    "/{file_id}",
    response_model=FileResponse,
)
def get_file(
    file_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    file_record = db.scalar(
        select(File).where(
            File.id == file_id,
            File.is_deleted.is_(False),
        )
    )

    if not file_record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found",
        )

    if not can_view(
        file_record,
        current_user,
        db,
    ):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found",
        )

    return FileResponse(
        id=str(file_record.id),
        name=file_record.name,
        original_name=file_record.original_name,
        storage_public_id=file_record.storage_public_id,
        storage_url=file_record.storage_url,
        resource_type=file_record.resource_type,
        mime_type=file_record.mime_type,
        size=file_record.size,
        owner_id=str(file_record.owner_id),
        folder_id=(
            str(file_record.folder_id)
            if file_record.folder_id
            else None
        ),
        is_deleted=file_record.is_deleted,
    )


# ============================================================
# RENAME FILE
# ============================================================

@router.patch(
    "/{file_id}",
    response_model=FileResponse,
)
def update_file(
    file_id: str,
    file_data: FileUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    file_record = db.scalar(
        select(File).where(
            File.id == file_id,
            File.is_deleted.is_(False),
        )
    )

    if not file_record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found",
        )

    if not can_edit(
        file_record,
        current_user,
        db,
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to edit this file",
        )

    new_name = file_data.name.strip()

    if not new_name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File name cannot be empty",
        )

    # --------------------------------------------------------
    # Prevent duplicate names
    # --------------------------------------------------------

    existing_file = db.scalar(
        select(File).where(
            File.owner_id == file_record.owner_id,
            File.folder_id == file_record.folder_id,
            File.name == new_name,
            File.id != file_record.id,
            File.is_deleted.is_(False),
        )
    )

    if existing_file:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A file with this name already exists here",
        )

    file_record.name = new_name

    db.commit()
    db.refresh(file_record)

    return FileResponse(
        id=str(file_record.id),
        name=file_record.name,
        original_name=file_record.original_name,
        storage_public_id=file_record.storage_public_id,
        storage_url=file_record.storage_url,
        resource_type=file_record.resource_type,
        mime_type=file_record.mime_type,
        size=file_record.size,
        owner_id=str(file_record.owner_id),
        folder_id=(
            str(file_record.folder_id)
            if file_record.folder_id
            else None
        ),
        is_deleted=file_record.is_deleted,
    )


# ============================================================
# MOVE FILE
# ============================================================

@router.patch(
    "/{file_id}/move",
    response_model=FileResponse,
)
def move_file(
    file_id: str,
    move_data: FileMoveRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    file_record = db.scalar(
        select(File).where(
            File.id == file_id,
            File.is_deleted.is_(False),
        )
    )

    if not file_record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found",
        )

    if not can_edit(
        file_record,
        current_user,
        db,
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to move this file",
        )

    # --------------------------------------------------------
    # Validate target folder
    # --------------------------------------------------------

    if move_data.folder_id:
        target_folder = db.scalar(
            select(Folder).where(
                Folder.id == move_data.folder_id,
                Folder.owner_id == file_record.owner_id,
            )
        )

        if not target_folder:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Target folder not found",
            )

    # --------------------------------------------------------
    # Prevent duplicate file names
    # --------------------------------------------------------

    existing_file = db.scalar(
        select(File).where(
            File.owner_id == file_record.owner_id,
            File.folder_id == move_data.folder_id,
            File.name == file_record.name,
            File.id != file_record.id,
            File.is_deleted.is_(False),
        )
    )

    if existing_file:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A file with this name already exists in the target folder",
        )

    # --------------------------------------------------------
    # Move file
    # --------------------------------------------------------

    file_record.folder_id = move_data.folder_id

    db.commit()
    db.refresh(file_record)

    return FileResponse(
        id=str(file_record.id),
        name=file_record.name,
        original_name=file_record.original_name,
        storage_public_id=file_record.storage_public_id,
        storage_url=file_record.storage_url,
        resource_type=file_record.resource_type,
        mime_type=file_record.mime_type,
        size=file_record.size,
        owner_id=str(file_record.owner_id),
        folder_id=(
            str(file_record.folder_id)
            if file_record.folder_id
            else None
        ),
        is_deleted=file_record.is_deleted,
    )


# ============================================================
# MOVE FILE TO TRASH
# ============================================================

@router.delete(
    "/{file_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_file(
    file_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    file_record = db.scalar(
        select(File).where(
            File.id == file_id,
            File.is_deleted.is_(False),
        )
    )

    if not file_record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found",
        )

    if not can_delete(
        file_record,
        current_user,
        db,
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to delete this file",
        )

    # --------------------------------------------------------
    # Soft delete
    # --------------------------------------------------------

    file_record.is_deleted = True
    file_record.deleted_at = datetime.now(timezone.utc)

    db.commit()

    return Response(
        status_code=status.HTTP_204_NO_CONTENT
    )