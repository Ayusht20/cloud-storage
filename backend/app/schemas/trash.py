from pydantic import BaseModel


class TrashFileResponse(BaseModel):
    id: str
    name: str
    mime_type: str | None
    size: int
    folder_id: str | None
    deleted_at: str | None


class TrashFolderResponse(BaseModel):
    id: str
    name: str
    parent_id: str | None
    deleted_at: str | None


class TrashResponse(BaseModel):
    files: list[TrashFileResponse]
    folders: list[TrashFolderResponse]