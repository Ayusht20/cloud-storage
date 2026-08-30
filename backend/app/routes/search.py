from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.search import SearchResponse
from app.services.search_service import (
    search_files,
    search_folders,
)


router = APIRouter(
    prefix="/search",
    tags=["Search"],
)


@router.get(
    "",
    response_model=SearchResponse,
)
def search(
    q: str = Query(
        min_length=1,
        max_length=100,
    ),
    type: str | None = Query(
        default=None,
        pattern="^(file|folder)$",
    ),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = q.strip()

    if not query:
        return SearchResponse(
            query="",
            files=[],
            folders=[],
        )

    files = []
    folders = []

    if type in (None, "file"):
        files = search_files(
            query,
            current_user,
            db,
        )

    if type in (None, "folder"):
        folders = search_folders(
            query,
            current_user,
            db,
        )

    return SearchResponse(
        query=query,
        files=files,
        folders=folders,
    )