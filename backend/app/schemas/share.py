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


class SharedFolderResponse(BaseModel):
    share_id: str
    folder_id: str
    folder_name: str
    owner_id: str
    parent_id: str | None
    role: ShareRole


class ShareResponse(BaseModel):
    id: str
    file_id: str | None = None
    folder_id: str | None = None
    shared_with_user_id: str
    email: EmailStr
    role: ShareRole

class FolderShareCreateRequest(BaseModel):
    email: EmailStr
    role: ShareRole


class SharedFolderResponse(BaseModel):
    share_id: str
    folder_id: str
    folder_name: str
    owner_id: str
    parent_id: str | None
    role: ShareRole

class SharedFileContentResponse(BaseModel):
    id: str
    name: str
    mime_type: str | None
    size: int
    content: str
    role: ShareRole

class SharedFileContentUpdateRequest(BaseModel):
    content: str