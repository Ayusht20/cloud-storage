from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Response,
    status,
)

from sqlalchemy import select, update
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user

from app.models.notification import Notification
from app.models.user import User

from app.schemas.notification import (
    NotificationReadAllResponse,
    NotificationResponse,
)


router = APIRouter(
    prefix="/notifications",
    tags=["Notifications"],
)


# ==========================================================
# LIST NOTIFICATIONS
# ==========================================================

@router.get(
    "",
    response_model=list[NotificationResponse],
)
def list_notifications(
    current_user: User = Depends(
        get_current_user
    ),
    db: Session = Depends(get_db),
):
    notifications = db.scalars(
        select(Notification)
        .where(
            Notification.user_id ==
            current_user.id
        )
        .order_by(
            Notification.created_at.desc()
        )
    ).all()

    return notifications


# ==========================================================
# MARK ONE AS READ
# ==========================================================

@router.patch(
    "/{notification_id}/read",
    response_model=NotificationResponse,
)
def mark_notification_read(
    notification_id: str,
    current_user: User = Depends(
        get_current_user
    ),
    db: Session = Depends(get_db),
):
    notification = db.scalar(
        select(Notification).where(
            Notification.id == notification_id,
            Notification.user_id ==
            current_user.id,
        )
    )

    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found",
        )

    notification.is_read = True

    db.commit()
    db.refresh(notification)

    return notification


# ==========================================================
# MARK ALL AS READ
# ==========================================================

@router.patch(
    "/read-all",
    response_model=NotificationReadAllResponse,
)
def mark_all_notifications_read(
    current_user: User = Depends(
        get_current_user
    ),
    db: Session = Depends(get_db),
):
    result = db.execute(
        update(Notification)
        .where(
            Notification.user_id ==
            current_user.id,
            Notification.is_read.is_(False),
        )
        .values(
            is_read=True
        )
    )

    db.commit()

    return NotificationReadAllResponse(
        updated=result.rowcount or 0
    )