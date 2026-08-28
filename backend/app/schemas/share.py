from enum import Enum

from pydantic import BaseModel, EmailStr


class ShareRole(str, Enum):
    VIEWER = "viewer"
    EDITOR = "editor"


class ShareCreateRequest(BaseModel):
    email: EmailStr
    role: ShareRole


class ShareUpdateRequest(BaseModel):
    role: ShareRole


class SharedFileResponse(BaseModel):
    share_id: str
    file_id: str
    file_name: str
    original_name: str
    mime_type: str | None
    size: int
    owner_id: str
    folder_id: str | None
    role: ShareRole


class ShareResponse(BaseModel):
    id: str
    file_id: str
    shared_with_user_id: str
    email: EmailStr
    role: ShareRole