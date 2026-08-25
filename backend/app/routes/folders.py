from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.folder import Folder
from app.models.user import User
from app.schemas.folder import (
    FolderCreateRequest,
    FolderResponse,
)


router = APIRouter(
    prefix="/folders",
    tags=["Folders"],
)


@router.post(
    "",
    response_model=FolderResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_folder(
    folder_data: FolderCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    parent_folder = None

    if folder_data.parent_id:
        parent_folder = db.scalar(
            select(Folder).where(
                Folder.id == folder_data.parent_id,
                Folder.owner_id == current_user.id,
            )
        )

        if not parent_folder:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Parent folder not found",
            )

    folder = Folder(
        name=folder_data.name.strip(),
        owner_id=current_user.id,
        parent_id=parent_folder.id if parent_folder else None,
    )

    db.add(folder)
    db.commit()
    db.refresh(folder)

    return FolderResponse(
        id=str(folder.id),
        name=folder.name,
        owner_id=str(folder.owner_id),
        parent_id=(
            str(folder.parent_id)
            if folder.parent_id
            else None
        ),
    )