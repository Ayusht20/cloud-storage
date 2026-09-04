from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Response,
    status,
)
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.file import File
from app.models.folder import Folder
from app.models.user import User
from app.schemas.file import FileListResponse
from app.schemas.folder import (
    BreadcrumbItem,
    FolderContentsResponse,
    FolderCreateRequest,
    FolderListResponse,
    FolderMoveRequest,
    FolderResponse,
    FolderUpdateRequest,
)
from app.services.permission_service import (
    Permission,
    can_delete_folder,
    can_edit_folder,
    get_folder_permission,
)


router = APIRouter(
    prefix="/folders",
    tags=["Folders"],
)


@router.post(
    "",
    response_model=FolderResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_folder(
    folder_data: FolderCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    parent_folder = None

    if folder_data.parent_id:
        parent_folder = db.scalar(
            select(Folder).where(
                Folder.id == folder_data.parent_id,
                Folder.is_deleted.is_(False),
            )
        )

        if not parent_folder:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Parent folder not found",
            )

        if not can_edit_folder(
            parent_folder,
            current_user,
            db,
        ):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=(
                    "You do not have permission "
                    "to create a folder here"
                ),
            )

    folder_name = folder_data.name.strip()

    if not folder_name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Folder name cannot be empty",
        )

    owner_id = (
        parent_folder.owner_id
        if parent_folder
        else current_user.id
    )

    existing_folder = db.scalar(
        select(Folder).where(
            Folder.owner_id == owner_id,
            Folder.parent_id == (
                parent_folder.id
                if parent_folder
                else None
            ),
            Folder.name == folder_name,
            Folder.is_deleted.is_(False),
        )
    )

    if existing_folder:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A folder with this name already exists here",
        )

    folder = Folder(
        name=folder_name,
        owner_id=owner_id,
        parent_id=(
            parent_folder.id
            if parent_folder
            else None
        ),
    )

    db.add(folder)
    db.commit()
    db.refresh(folder)

    return FolderResponse(
        id=str(folder.id),
        name=folder.name,
        owner_id=str(folder.owner_id),
        parent_id=(
            str(folder.parent_id)
            if folder.parent_id
            else None
        ),
    )


@router.get(
    "",
    response_model=list[FolderListResponse],
)
def list_root_folders(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    folders = db.scalars(
        select(Folder)
        .where(
            Folder.owner_id == current_user.id,
            Folder.parent_id.is_(None),
            Folder.is_deleted.is_(False),
        )
        .order_by(Folder.name.asc())
    ).all()

    return [
        FolderListResponse(
            id=str(folder.id),
            name=folder.name,
            parent_id=(
                str(folder.parent_id)
                if folder.parent_id
                else None
            ),
        )
        for folder in folders
    ]


# Keep this route before /{folder_id}.
@router.get(
    "/contents",
    response_model=FolderContentsResponse,
)
def get_root_contents(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    folders = db.scalars(
        select(Folder)
        .where(
            Folder.owner_id == current_user.id,
            Folder.parent_id.is_(None),
            Folder.is_deleted.is_(False),
        )
        .order_by(Folder.name.asc())
    ).all()

    files = db.scalars(
        select(File)
        .where(
            File.owner_id == current_user.id,
            File.folder_id.is_(None),
            File.is_deleted.is_(False),
        )
        .order_by(File.name.asc())
    ).all()

    return FolderContentsResponse(
        folder=None,
        breadcrumbs=[
            BreadcrumbItem(
                id=None,
                name="My Drive",
            )
        ],
        folders=[
            FolderListResponse(
                id=str(folder.id),
                name=folder.name,
                parent_id=None,
            )
            for folder in folders
        ],
        files=[
            FileListResponse(
                id=str(file.id),
                name=file.name,
                mime_type=file.mime_type,
                size=file.size,
                folder_id=None,
                is_deleted=file.is_deleted,
            )
            for file in files
        ],
    )


# Keep this route before /{folder_id}.
@router.get(
    "/{folder_id}/contents",
)
def get_folder_contents(
    folder_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    folder = db.scalar(
        select(Folder).where(
            Folder.id == folder_id,
            Folder.is_deleted.is_(False),
        )
    )

    if not folder:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Folder not found",
        )

    permission = get_folder_permission(
        folder,
        current_user,
        db,
    )

    if permission == Permission.NONE:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Folder not found",
        )

    folders = db.scalars(
        select(Folder).where(
            Folder.parent_id == folder.id,
            Folder.is_deleted.is_(False),
        ).order_by(Folder.name.asc())
    ).all()

    files = db.scalars(
        select(File).where(
            File.folder_id == folder.id,
            File.is_deleted.is_(False),
        ).order_by(File.name.asc())
    ).all()

    return {
        "folders": folders,
        "files": files,
    }


@router.get(
    "/{folder_id}",
    response_model=FolderResponse,
)
def get_folder(
    folder_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    folder = db.scalar(
        select(Folder).where(
            Folder.id == folder_id,
            Folder.is_deleted.is_(False),
        )
    )

    if not folder:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Folder not found",
        )

    permission = get_folder_permission(
        folder,
        current_user,
        db,
    )

    if permission == Permission.NONE:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Folder not found",
        )

    return FolderResponse(
        id=str(folder.id),
        name=folder.name,
        owner_id=str(folder.owner_id),
        parent_id=(
            str(folder.parent_id)
            if folder.parent_id
            else None
        ),
    )


@router.get(
    "/{folder_id}/breadcrumbs",
    response_model=list[BreadcrumbItem],
)
def get_folder_breadcrumbs(
    folder_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    folder = db.scalar(
        select(Folder).where(
            Folder.id == folder_id,
            Folder.is_deleted.is_(False),
        )
    )

    if not folder:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Folder not found",
        )

    permission = get_folder_permission(
        folder,
        current_user,
        db,
    )

    if permission == Permission.NONE:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Folder not found",
        )

    breadcrumbs = [
        BreadcrumbItem(
            id=None,
            name="My Drive",
        )
    ]

    current_folder = folder

    while current_folder:
        breadcrumbs.append(
            BreadcrumbItem(
                id=str(current_folder.id),
                name=current_folder.name,
            )
        )

        if current_folder.parent_id is None:
            break

        current_folder = db.scalar(
            select(Folder).where(
                Folder.id == current_folder.parent_id,
                Folder.is_deleted.is_(False),
            )
        )

        if not current_folder:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Folder hierarchy is inconsistent",
            )

    breadcrumbs.reverse()

    return breadcrumbs


@router.patch(
    "/{folder_id}",
    response_model=FolderResponse,
)
def update_folder(
    folder_id: str,
    folder_data: FolderUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    folder = db.scalar(
        select(Folder).where(
            Folder.id == folder_id,
            Folder.is_deleted.is_(False),
        )
    )

    if not folder:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Folder not found",
        )

    if not can_edit_folder(
        folder,
        current_user,
        db,
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to edit this folder",
        )

    new_name = folder_data.name.strip()

    if not new_name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Folder name cannot be empty",
        )

    existing_folder = db.scalar(
        select(Folder).where(
            Folder.owner_id == folder.owner_id,
            Folder.parent_id == folder.parent_id,
            Folder.name == new_name,
            Folder.id != folder.id,
            Folder.is_deleted.is_(False),
        )
    )

    if existing_folder:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A folder with this name already exists here",
        )

    folder.name = new_name

    db.commit()
    db.refresh(folder)

    return FolderResponse(
        id=str(folder.id),
        name=folder.name,
        owner_id=str(folder.owner_id),
        parent_id=(
            str(folder.parent_id)
            if folder.parent_id
            else None
        ),
    )


@router.patch(
    "/{folder_id}/move",
    response_model=FolderResponse,
)
def move_folder(
    folder_id: str,
    move_data: FolderMoveRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    folder = db.scalar(
        select(Folder).where(
            Folder.id == folder_id,
            Folder.is_deleted.is_(False),
        )
    )

    if not folder:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Folder not found",
        )

    if not can_edit_folder(
        folder,
        current_user,
        db,
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to move this folder",
        )

    # Moving to root is only allowed when the user
    # has ownership of the folder.
    if move_data.parent_id is None:

        if folder.owner_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=(
                    "You cannot move a shared folder "
                    "to the root"
                ),
            )

        folder.parent_id = None

        db.commit()
        db.refresh(folder)

        return FolderResponse(
            id=str(folder.id),
            name=folder.name,
            owner_id=str(folder.owner_id),
            parent_id=None,
        )

    if move_data.parent_id == folder_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A folder cannot be moved inside itself",
        )

    target_folder = db.scalar(
        select(Folder).where(
            Folder.id == move_data.parent_id,
            Folder.is_deleted.is_(False),
        )
    )

    if not target_folder:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Target folder not found",
        )

    # The destination must also be editable.
    if not can_edit_folder(
        target_folder,
        current_user,
        db,
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=(
                "You do not have permission "
                "to move a folder here"
            ),
        )

    # A folder can only be moved inside a folder
    # belonging to the same owner.
    if target_folder.owner_id != folder.owner_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You cannot move the folder to this location",
        )

    # Walk through the target folder's ancestors.
    # If the folder being moved is encountered,
    # the move would create a circular hierarchy.
    current_parent_id = target_folder.parent_id

    while current_parent_id is not None:
        if current_parent_id == folder.id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    "A folder cannot be moved inside "
                    "one of its own descendants"
                ),
            )

        current_parent = db.scalar(
            select(Folder).where(
                Folder.id == current_parent_id,
                Folder.is_deleted.is_(False),
            )
        )

        if not current_parent:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Folder hierarchy is inconsistent",
            )

        current_parent_id = current_parent.parent_id

    # Prevent duplicate folder names in the target location.
    existing_folder = db.scalar(
        select(Folder).where(
            Folder.owner_id == folder.owner_id,
            Folder.parent_id == target_folder.id,
            Folder.name == folder.name,
            Folder.id != folder.id,
            Folder.is_deleted.is_(False),
        )
    )

    if existing_folder:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "A folder with this name already exists "
                "in the target folder"
            ),
        )

    folder.parent_id = target_folder.id

    db.commit()
    db.refresh(folder)

    return FolderResponse(
        id=str(folder.id),
        name=folder.name,
        owner_id=str(folder.owner_id),
        parent_id=str(folder.parent_id),
    )


@router.delete(
    "/{folder_id}",
    response_model=FolderResponse,
)
def delete_folder(
    folder_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    folder = db.scalar(
        select(Folder).where(
            Folder.id == folder_id,
            Folder.owner_id == current_user.id,
            Folder.is_deleted.is_(False),
        )
    )

    if not folder:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Folder not found",
        )

    folder.is_deleted = True

    db.commit()
    db.refresh(folder)

    return FolderResponse(
        id=str(folder.id),
        name=folder.name,
        owner_id=str(folder.owner_id),
        parent_id=(
            str(folder.parent_id)
            if folder.parent_id
            else None
        ),
        is_deleted=folder.is_deleted,
    )