from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class NotificationResponse(BaseModel):
    model_config = ConfigDict(
        from_attributes=True
    )

    id: UUID
    type: str
    title: str
    message: str

    file_id: UUID | None = None
    folder_id: UUID | None = None
    share_id: str | None = None

    is_read: bool
    created_at: datetime


class NotificationReadAllResponse(BaseModel):
    updated: int