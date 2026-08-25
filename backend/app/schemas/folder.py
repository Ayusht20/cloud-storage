from pydantic import BaseModel, Field


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