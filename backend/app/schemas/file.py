from pydantic import BaseModel


class FileResponse(BaseModel):
    id: str
    name: str
    original_name: str
    storage_public_id: str
    storage_url: str
    resource_type: str
    mime_type: str | None
    size: int
    owner_id: str
    folder_id: str | None
    is_deleted: bool


class FileListResponse(BaseModel):
    id: str
    name: str
    mime_type: str | None
    size: int
    folder_id: str | None
    is_deleted: bool