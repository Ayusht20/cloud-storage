from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.file import File
from app.models.user import User


router = APIRouter(
    prefix="/storage",
    tags=["Storage"],
)


STORAGE_LIMIT = 2.5 * 1024 * 1024 * 1024


@router.get("")
def get_storage_usage(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    used_storage = db.scalar(
        select(
            func.coalesce(
                func.sum(File.size),
                0,
            )
        ).where(
            File.owner_id == current_user.id,
            File.is_deleted.is_(False),
        )
    )

    used_storage = int(
        used_storage or 0
    )

    remaining_storage = max(
        int(STORAGE_LIMIT) - used_storage,
        0,
    )

    percentage = (
        (used_storage / STORAGE_LIMIT) * 100
        if STORAGE_LIMIT > 0
        else 0
    )

    return {
        "used": used_storage,
        "limit": int(STORAGE_LIMIT),
        "remaining": remaining_storage,
        "percentage": round(
            min(percentage, 100),
            2,
        ),
    }