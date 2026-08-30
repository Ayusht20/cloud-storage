from datetime import datetime

from pydantic import BaseModel


class PublicLinkCreateRequest(BaseModel):
    expires_at: datetime | None = None
    password: str | None = None


class PublicLinkResponse(BaseModel):
    id: str
    token: str
    file_id: str | None = None
    folder_id: str | None = None
    expires_at: datetime | None = None
    is_active: bool
    created_at: datetime


class PublicLinkAccessRequest(BaseModel):
    password: str | None = None


class PublicFileResponse(BaseModel):
    id: str
    name: str
    mime_type: str | None
    size: int
    download_url: str