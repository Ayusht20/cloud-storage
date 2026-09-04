from datetime import datetime
from enum import Enum

from pydantic import BaseModel, Field


class PublicLinkPermission(str, Enum):
    VIEWER = "viewer"
    EDITOR = "editor"


class PublicLinkCreateRequest(BaseModel):

    expires_at: datetime | None = None

    password: str | None = None

    permission: PublicLinkPermission = Field(
        default=PublicLinkPermission.VIEWER
    )


class PublicLinkPermissionUpdateRequest(BaseModel):

    permission: PublicLinkPermission


class PublicLinkResponse(BaseModel):

    id: str

    token: str

    file_id: str | None = None

    folder_id: str | None = None

    permission: PublicLinkPermission

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

    permission: PublicLinkPermission