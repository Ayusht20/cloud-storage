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
from app.models.file import File
from app.models.share import Share
from app.models.user import User
from app.schemas.share import (
    ShareCreateRequest,
    ShareResponse,
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
            User.email == share_data.email
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