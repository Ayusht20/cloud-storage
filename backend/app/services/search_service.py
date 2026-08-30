from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.models.file import File
from app.models.folder import Folder
from app.models.share import Share
from app.models.user import User
from app.services.permission_service import (
    Permission,
    get_file_permission,
    get_folder_permission,
)


def search_files(
    query: str,
    current_user: User,
    db: Session,
):
    search_pattern = f"%{query}%"

    files = db.scalars(
        select(File)
        .outerjoin(
            Share,
            Share.file_id == File.id,
        )
        .where(
            File.is_deleted.is_(False),
            File.name.ilike(search_pattern),
            or_(
                File.owner_id == current_user.id,
                Share.shared_with_user_id == current_user.id,
            ),
        )
        .distinct()
        .order_by(File.name.asc())
    ).all()

    results = []

    for file in files:
        permission = get_file_permission(
            file,
            current_user,
            db,
        )

        if permission == Permission.NONE:
            continue

        results.append(
            {
                "id": str(file.id),
                "name": file.name,
                "mime_type": file.mime_type,
                "size": file.size,
                "folder_id": (
                    str(file.folder_id)
                    if file.folder_id
                    else None
                ),
                "owner_id": str(file.owner_id),
                "permission": permission.value,
            }
        )

    return results


def search_folders(
    query: str,
    current_user: User,
    db: Session,
):
    search_pattern = f"%{query}%"

    folders = db.scalars(
        select(Folder)
        .outerjoin(
            Share,
            Share.folder_id == Folder.id,
        )
        .where(
            Folder.is_deleted.is_(False),
            Folder.name.ilike(search_pattern),
            or_(
                Folder.owner_id == current_user.id,
                Share.shared_with_user_id == current_user.id,
            ),
        )
        .distinct()
        .order_by(Folder.name.asc())
    ).all()

    results = []

    for folder in folders:
        permission = get_folder_permission(
            folder,
            current_user,
            db,
        )

        if permission == Permission.NONE:
            continue

        results.append(
            {
                "id": str(folder.id),
                "name": folder.name,
                "parent_id": (
                    str(folder.parent_id)
                    if folder.parent_id
                    else None
                ),
                "owner_id": str(folder.owner_id),
                "permission": permission.value,
            }
        )

    return results