from pydantic import BaseModel


class SearchFileResponse(BaseModel):
    id: str
    name: str
    mime_type: str | None
    size: int
    folder_id: str | None
    owner_id: str
    permission: str


class SearchFolderResponse(BaseModel):
    id: str
    name: str
    parent_id: str | None
    owner_id: str
    permission: str


class SearchResponse(BaseModel):
    query: str
    files: list[SearchFileResponse]
    folders: list[SearchFolderResponse]