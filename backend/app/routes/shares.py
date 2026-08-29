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
from app.models.share import Share
from app.models.user import User
from app.models.folder import Folder
from app.schemas.share import (
    FolderShareCreateRequest,
    ShareCreateRequest,
    ShareResponse,
    ShareUpdateRequest,
    SharedFileResponse,
    SharedFolderResponse,
)


router = APIRouter(
    prefix="/shares",
    tags=["Sharing"],
)


@router.post(
    "",
    response_model=ShareResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_share(
    share_data: ShareCreateRequest,
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

    target_user = db.scalar(
        select(User).where(
            User.email == share_data.email,
        )
    )

    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    if target_user.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot share a file with yourself",
        )

    existing_share = db.scalar(
        select(Share).where(
            Share.file_id == file_record.id,
            Share.shared_with_user_id == target_user.id,
        )
    )

    if existing_share:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="File is already shared with this user",
        )

    share = Share(
        file_id=file_record.id,
        shared_with_user_id=target_user.id,
        role=share_data.role.value,
    )

    db.add(share)
    db.commit()
    db.refresh(share)

    return ShareResponse(
        id=str(share.id),
        file_id=str(share.file_id),
        shared_with_user_id=str(
            share.shared_with_user_id
        ),
        email=target_user.email,
        role=share.role,
    )

@router.post(
    "/folders",
    response_model=ShareResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_folder_share(
    folder_data: FolderShareCreateRequest,
    folder_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
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

    target_user = db.scalar(
        select(User).where(
            User.email == folder_data.email,
        )
    )

    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    if target_user.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot share a folder with yourself",
        )

    existing_share = db.scalar(
        select(Share).where(
            Share.folder_id == folder.id,
            Share.shared_with_user_id == target_user.id,
        )
    )

    if existing_share:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Folder is already shared with this user",
        )

    share = Share(
        folder_id=folder.id,
        file_id=None,
        shared_with_user_id=target_user.id,
        role=folder_data.role.value,
    )

    db.add(share)
    db.commit()
    db.refresh(share)

    return ShareResponse(
        id=str(share.id),
        file_id=None,
        folder_id=str(share.folder_id),
        shared_with_user_id=str(
            share.shared_with_user_id
        ),
        email=target_user.email,
        role=share.role,
    )

@router.get(
    "",
    response_model=list[SharedFileResponse],
)
def list_shared_files(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    results = db.execute(
        select(Share, File)
        .join(
            File,
            Share.file_id == File.id,
        )
        .where(
            Share.shared_with_user_id == current_user.id,
            File.is_deleted.is_(False),
        )
        .order_by(
            Share.created_at.desc()
        )
    ).all()

    return [
        SharedFileResponse(
            share_id=str(share.id),
            file_id=str(file.id),
            file_name=file.name,
            original_name=file.original_name,
            mime_type=file.mime_type,
            size=file.size,
            owner_id=str(file.owner_id),
            folder_id=(
                str(file.folder_id)
                if file.folder_id
                else None
            ),
            role=share.role,
        )
        for share, file in results
    ]

@router.get(
    "/folders",
    response_model=list[SharedFolderResponse],
)
def list_shared_folders(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    results = db.execute(
        select(Share, Folder)
        .join(
            Folder,
            Share.folder_id == Folder.id,
        )
        .where(
            Share.shared_with_user_id == current_user.id,
        )
        .order_by(
            Share.created_at.desc()
        )
    ).all()

    return [
        SharedFolderResponse(
            share_id=str(share.id),
            folder_id=str(folder.id),
            folder_name=folder.name,
            owner_id=str(folder.owner_id),
            parent_id=(
                str(folder.parent_id)
                if folder.parent_id
                else None
            ),
            role=share.role,
        )
        for share, folder in results
    ]

@router.patch(
    "/{share_id}",
    response_model=ShareResponse,
)
def update_share(
    share_id: str,
    share_data: ShareUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    share = db.scalar(
        select(Share)
        .join(
            File,
            Share.file_id == File.id,
        )
        .where(
            Share.id == share_id,
            File.owner_id == current_user.id,
            File.is_deleted.is_(False),
        )
    )

    if not share:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Share not found",
        )

    share.role = share_data.role.value

    db.commit()
    db.refresh(share)

    target_user = db.scalar(
        select(User).where(
            User.id == share.shared_with_user_id,
        )
    )

    return ShareResponse(
        id=str(share.id),
        file_id=str(share.file_id),
        shared_with_user_id=str(
            share.shared_with_user_id
        ),
        email=target_user.email,
        role=share.role,
    )


@router.delete(
    "/{share_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_share(
    share_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    share = db.scalar(
        select(Share)
        .join(
            File,
            Share.file_id == File.id,
        )
        .where(
            Share.id == share_id,
            File.owner_id == current_user.id,
        )
    )

    if not share:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Share not found",
        )

    db.delete(share)
    db.commit()

    return Response(
        status_code=status.HTTP_204_NO_CONTENT
    )