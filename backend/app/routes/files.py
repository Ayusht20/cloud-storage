import os

from fastapi import (
    APIRouter,
    Depends,
    File as FastAPIFile,
    HTTPException,
    UploadFile,
    status,
    Response
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
    FileListResponse,
    FileResponse,
     FileUpdateRequest,
)
from app.services.storage_service import upload_file


router = APIRouter(
    prefix="/files",
    tags=["Files"],
)


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

    file_content = await uploaded_file.read()

    file_size = len(file_content)

    if file_size == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Empty files are not allowed",
        )

    max_size = settings.MAX_FILE_SIZE_MB * 1024 * 1024

    if file_size > max_size:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=(
                f"File size exceeds the maximum allowed "
                f"limit of {settings.MAX_FILE_SIZE_MB} MB"
            ),
        )

    try:
        upload_result = upload_file(
            file=file_content,
            filename=uploaded_file.filename,
            content_type=uploaded_file.content_type,
            folder=f"cloud-storage-service/users/{current_user.id}",
        )

        file_record = File(
            name=uploaded_file.filename,
            original_name=uploaded_file.filename,
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
@router.get(
    "/{file_id}/download",
    response_model=FileDownloadResponse,
)
def download_file(
    file_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    file_record = db.scalar(
        select(File).where(
            File.id == file_id,
            File.owner_id == current_user.id,
            File.is_deleted.is_(False),
        )
    )

    if not file_record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found",
        )

    download_url = get_download_url(
        public_id=file_record.storage_public_id,
        resource_type=file_record.resource_type,
    )

    return FileDownloadResponse(
        file_name=file_record.name,
        download_url=download_url,
    )

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
            File.owner_id == current_user.id,
            File.is_deleted.is_(False),
        )
    )

    if not file_record:
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
            File.owner_id == current_user.id,
            File.is_deleted.is_(False),
        )
    )

    if not file_record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found",
        )

    file_record.name = file_data.name.strip()

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
            File.owner_id == current_user.id,
            File.is_deleted.is_(False),
        )
    )

    if not file_record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found",
        )

    file_record.is_deleted = True

    db.commit()

    return Response(status_code=status.HTTP_204_NO_CONTENT)