from enum import Enum

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.file import File
from app.models.folder import Folder
from app.models.share import Share
from app.models.user import User


class Permission(str, Enum):
    OWNER = "owner"
    EDITOR = "editor"
    VIEWER = "viewer"
    NONE = "none"


def _role_to_permission(role: str) -> Permission:
    if role == Permission.EDITOR.value:
        return Permission.EDITOR

    if role == Permission.VIEWER.value:
        return Permission.VIEWER

    return Permission.NONE


def get_folder_permission(
    folder: Folder,
    current_user: User,
    db: Session,
) -> Permission:
    """
    Determine the user's permission for a folder.

    Permission is inherited from the nearest shared folder
    while walking up the folder hierarchy.
    """

    if folder.owner_id == current_user.id:
        return Permission.OWNER

    current_folder = folder

    while current_folder:
        share = db.scalar(
            select(Share).where(
                Share.folder_id == current_folder.id,
                Share.shared_with_user_id == current_user.id,
            )
        )

        if share:
            return _role_to_permission(share.role)

        if not current_folder.parent_id:
            break

        current_folder = db.scalar(
            select(Folder).where(
                Folder.id == current_folder.parent_id
            )
        )

    return Permission.NONE


def get_file_permission(
    file: File,
    current_user: User,
    db: Session,
) -> Permission:
    """
    Determine the user's permission for a file.

    Priority:

    1. File owner
    2. Direct file share
    3. Shared parent folder
    4. No access
    """

    if file.owner_id == current_user.id:
        return Permission.OWNER

    direct_share = db.scalar(
        select(Share).where(
            Share.file_id == file.id,
            Share.shared_with_user_id == current_user.id,
        )
    )

    if direct_share:
        return _role_to_permission(
            direct_share.role
        )

    if file.folder_id:
        folder = db.scalar(
            select(Folder).where(
                Folder.id == file.folder_id
            )
        )

        if folder:
            return get_folder_permission(
                folder,
                current_user,
                db,
            )

    return Permission.NONE


def can_view(
    file: File,
    current_user: User,
    db: Session,
) -> bool:
    permission = get_file_permission(
        file,
        current_user,
        db,
    )

    return permission in {
        Permission.OWNER,
        Permission.EDITOR,
        Permission.VIEWER,
    }


def can_edit(
    file: File,
    current_user: User,
    db: Session,
) -> bool:
    permission = get_file_permission(
        file,
        current_user,
        db,
    )

    return permission in {
        Permission.OWNER,
        Permission.EDITOR,
    }


def can_delete(
    file: File,
    current_user: User,
    db: Session,
) -> bool:
    permission = get_file_permission(
        file,
        current_user,
        db,
    )

    return permission in {
        Permission.OWNER,
        Permission.EDITOR,
    }


def can_share(
    file: File,
    current_user: User,
    db: Session,
) -> bool:
    permission = get_file_permission(
        file,
        current_user,
        db,
    )

    return permission == Permission.OWNER

def can_view_folder(
    folder: Folder,
    current_user: User,
    db: Session,
) -> bool:
    permission = get_folder_permission(
        folder,
        current_user,
        db,
    )

    return permission in {
        Permission.OWNER,
        Permission.EDITOR,
        Permission.VIEWER,
    }


def can_edit_folder(
    folder: Folder,
    current_user: User,
    db: Session,
) -> bool:
    permission = get_folder_permission(
        folder,
        current_user,
        db,
    )

    return permission in {
        Permission.OWNER,
        Permission.EDITOR,
    }


def can_delete_folder(
    folder: Folder,
    current_user: User,
    db: Session,
) -> bool:
    permission = get_folder_permission(
        folder,
        current_user,
        db,
    )

    return permission in {
        Permission.OWNER,
        Permission.EDITOR,
    }