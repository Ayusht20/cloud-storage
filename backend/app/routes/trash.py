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
from app.models.file import File
from app.models.folder import Folder
from app.models.user import User
from app.schemas.trash import (
    TrashFileResponse,
    TrashFolderResponse,
    TrashResponse,
)


router = APIRouter(
    prefix="/trash",
    tags=["Trash"],
)


@router.get(
    "",
    response_model=TrashResponse,
)
def get_trash(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    files = db.scalars(
        select(File)
        .where(
            File.owner_id == current_user.id,
            File.is_deleted.is_(True),
        )
        .order_by(File.name.asc())
    ).all()

    folders = db.scalars(
        select(Folder)
        .where(
            Folder.owner_id == current_user.id,
            Folder.is_deleted.is_(True),
        )
        .order_by(Folder.name.asc())
    ).all()

    return TrashResponse(
        files=[
            TrashFileResponse(
                id=str(file.id),
                name=file.name,
                mime_type=file.mime_type,
                size=file.size,
                folder_id=(
                    str(file.folder_id)
                    if file.folder_id
                    else None
                ),
                deleted_at=(
                    file.deleted_at.isoformat()
                    if file.deleted_at
                    else None
                ),
            )
            for file in files
        ],
        folders=[
            TrashFolderResponse(
                id=str(folder.id),
                name=folder.name,
                parent_id=(
                    str(folder.parent_id)
                    if folder.parent_id
                    else None
                ),
                deleted_at=(
                    folder.deleted_at.isoformat()
                    if folder.deleted_at
                    else None
                ),
            )
            for folder in folders
        ],
    )


@router.post(
    "/files/{file_id}/restore",
    response_model=TrashFileResponse,
)
def restore_file(
    file_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    file = db.scalar(
        select(File).where(
            File.id == file_id,
            File.owner_id == current_user.id,
            File.is_deleted.is_(True),
        )
    )

    if not file:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Deleted file not found",
        )

    file.is_deleted = False
    file.deleted_at = None

    db.commit()
    db.refresh(file)

    return TrashFileResponse(
        id=str(file.id),
        name=file.name,
        mime_type=file.mime_type,
        size=file.size,
        folder_id=(
            str(file.folder_id)
            if file.folder_id
            else None
        ),
        deleted_at=None,
    )


@router.post(
    "/folders/{folder_id}/restore",
    response_model=TrashFolderResponse,
)
def restore_folder(
    folder_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    folder = db.scalar(
        select(Folder).where(
            Folder.id == folder_id,
            Folder.owner_id == current_user.id,
            Folder.is_deleted.is_(True),
        )
    )

    if not folder:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Deleted folder not found",
        )

    folder.is_deleted = False
    folder.deleted_at = None

    db.commit()
    db.refresh(folder)

    return TrashFolderResponse(
        id=str(folder.id),
        name=folder.name,
        parent_id=(
            str(folder.parent_id)
            if folder.parent_id
            else None
        ),
        deleted_at=None,
    )


@router.delete(
    "/files/{file_id}/permanent",
    status_code=status.HTTP_204_NO_CONTENT,
)
def permanently_delete_file(
    file_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    file = db.scalar(
        select(File).where(
            File.id == file_id,
            File.owner_id == current_user.id,
            File.is_deleted.is_(True),
        )
    )

    if not file:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Deleted file not found",
        )

    db.delete(file)
    db.commit()

    return Response(
        status_code=status.HTTP_204_NO_CONTENT
    )


@router.delete(
    "/folders/{folder_id}/permanent",
    status_code=status.HTTP_204_NO_CONTENT,
)
def permanently_delete_folder(
    folder_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    folder = db.scalar(
        select(Folder).where(
            Folder.id == folder_id,
            Folder.owner_id == current_user.id,
            Folder.is_deleted.is_(True),
        )
    )

    if not folder:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Deleted folder not found",
        )

    db.delete(folder)
    db.commit()

    return Response(
        status_code=status.HTTP_204_NO_CONTENT
    )