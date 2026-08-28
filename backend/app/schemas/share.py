from enum import Enum

from pydantic import BaseModel, EmailStr


class ShareRole(str, Enum):
    VIEWER = "viewer"
    EDITOR = "editor"


class ShareCreateRequest(BaseModel):
    email: EmailStr
    role: ShareRole


class ShareResponse(BaseModel):
    id: str
    file_id: str
    shared_with_user_id: str
    email: EmailStr
    role: ShareRole