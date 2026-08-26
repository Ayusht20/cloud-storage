from pydantic import BaseModel, Field
from app.schemas.file import FileListResponse

class FolderCreateRequest(BaseModel):
    name: str = Field(
        min_length=1,
        max_length=255,
    )

    parent_id: str | None = None


class FolderResponse(BaseModel):
    id: str
    name: str
    owner_id: str
    parent_id: str | None


class FolderListResponse(BaseModel):
    id: str
    name: str
    parent_id: str | None


class FolderUpdateRequest(BaseModel):
    name: str = Field(
        min_length=1,
        max_length=255,
    )

class FolderMoveRequest(BaseModel):
    parent_id: str | None = None

class BreadcrumbItem(BaseModel):
    id: str | None
    name: str

class FolderContentsResponse(BaseModel):
    folder: FolderResponse | None
    breadcrumbs: list[BreadcrumbItem]
    folders: list[FolderListResponse]
    files: list[FileListResponse]