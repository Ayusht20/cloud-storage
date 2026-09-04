import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  FolderPlus,
  Upload,
  Folder,
  Files,
  ChevronRight,
  Home,
  ArrowLeft,
  X,
  Check,
  FolderOpen,
  Download,
  Bell,
  CheckCheck,
} from "lucide-react";

import Layout from "../components/Layout";
import FolderCard from "../components/FolderCard";
import FileCard from "../components/FileCard";
import FilePreviewModal from "../components/FilePreviewModal";
import ShareModal from "../components/ShareModal";

import fileService from "../services/fileService";
import folderService from "../services/folderService";
import notificationService from "../services/notificationService";
import { useAuth } from "../context/AuthContext";


const ROOT_FOLDER = {
  id: null,
  name: "My Drive",
};


const Dashboard = () => {
  const { user, logout } = useAuth();

  // ==================================================
  // PERMISSIONS
  // ==================================================

  const getPermission = (item) => {
    if (
      item?.owner_id &&
      user?.id &&
      item.owner_id === user.id
    ) {
      return "owner";
    }

    return (
      item?.permission ||
      item?.role ||
      "owner"
    );
  };

  const canEditItem = (item) => {
    const permission = getPermission(item);

    return (
      permission === "owner" ||
      permission === "editor"
    );
  };

  const canShareItem = (item) => {
    return getPermission(item) === "owner";
  };

  const [files, setFiles] = useState([]);
  const [folders, setFolders] = useState([]);

  const [currentFolder, setCurrentFolder] =
    useState(null);

  const [breadcrumbs, setBreadcrumbs] =
    useState([ROOT_FOLDER]);

  const [search, setSearch] = useState("");

  const [loading, setLoading] =
    useState(true);

  const [uploading, setUploading] =
    useState(false);

  const [error, setError] =
    useState("");

  // ==================================================
  // NOTIFICATIONS
  // ==================================================

  const [notifications, setNotifications] =
    useState([]);

  const [notificationOpen, setNotificationOpen] =
    useState(false);

  const [notificationLoading, setNotificationLoading] =
    useState(false);

  const fileInputRef = useRef(null);


  // ==================================================
  // PREVIEW
  // ==================================================

  const [previewFile, setPreviewFile] =
    useState(null);

  const [previewUrl, setPreviewUrl] =
    useState("");

  const [previewLoading, setPreviewLoading] =
    useState(false);


  // ==================================================
  // SHARE MODAL
  // ==================================================

  const [shareFile, setShareFile] =
    useState(null);


  // ==================================================
  // MOVE MODAL
  // ==================================================

  const [moveModalOpen, setMoveModalOpen] =
    useState(false);

  const [fileToMove, setFileToMove] =
    useState(null);

  const [moveFolders, setMoveFolders] =
    useState([]);

  const [movePath, setMovePath] =
    useState([ROOT_FOLDER]);

  const [moveLoading, setMoveLoading] =
    useState(false);

  const [moving, setMoving] =
    useState(false);


  // ==================================================
  // LOAD ROOT
  // ==================================================

  const loadRootContents = async () => {
    setLoading(true);
    setError("");

    try {
      const data =
        await folderService.getRootContents();

      setCurrentFolder(null);

      setFolders(
        data?.folders || []
      );

      setFiles(
        data?.files || []
      );

      setBreadcrumbs([
        ROOT_FOLDER,
      ]);
    } catch (err) {
      setError(
        err.message ||
          "Failed to load your files"
      );
    } finally {
      setLoading(false);
    }
  };


  // ==================================================
  // LOAD FOLDER
  // ==================================================

  const loadFolderContents = async (
    folder,
    nextBreadcrumbs = null
  ) => {
    setLoading(true);
    setError("");

    try {
      const data =
        await folderService.getFolderContents(
          folder.id
        );

      setCurrentFolder(folder);

      setFolders(
        data?.folders || []
      );

      setFiles(
        data?.files || []
      );

      if (nextBreadcrumbs) {
        setBreadcrumbs(
          nextBreadcrumbs
        );
      }
    } catch (err) {
      setError(
        err.message ||
          "Failed to open folder"
      );
    } finally {
      setLoading(false);
    }
  };


  // ==================================================
  // INITIAL LOAD
  // ==================================================

  useEffect(() => {
    loadRootContents();
  }, []);


  // ==================================================
  // NOTIFICATIONS
  // ==================================================

  const loadNotifications = async () => {
    try {
      setNotificationLoading(true);

      const data =
        await notificationService.getNotifications();

      setNotifications(
        Array.isArray(data) ? data : []
      );
    } catch (err) {
      console.error(
        "Failed to load notifications",
        err
      );
    } finally {
      setNotificationLoading(false);
    }
  };


  useEffect(() => {
    loadNotifications();

    const interval =
      window.setInterval(
        loadNotifications,
        30000
      );

    return () =>
      window.clearInterval(interval);
  }, []);


  const unreadNotifications =
    notifications.filter(
      (notification) => !notification.is_read
    );


const handleNotificationClick = async (
  notification
) => {
  try {
    // --------------------------------------------------------
    // MARK AS READ
    // --------------------------------------------------------

    if (!notification.is_read) {
      const updated =
        await notificationService.markAsRead(
          notification.id
        );

      setNotifications((current) =>
        current.map((item) =>
          item.id === notification.id
            ? updated
            : item
        )
      );
    }

    // --------------------------------------------------------
    // CLOSE NOTIFICATION DROPDOWN
    // --------------------------------------------------------

    setNotificationOpen(false);

    // --------------------------------------------------------
    // OPEN SHARED FILE INSIDE DASHBOARD
    // --------------------------------------------------------

    if (notification.file_id) {
      try {
        const file =
          await fileService.getFile(
            notification.file_id
          );

        await handleView(file);

        return;
      } catch (err) {
        setError(
          err.message ||
            "Unable to open the shared file"
        );

        return;
      }
    }

    // --------------------------------------------------------
    // OPEN SHARED FOLDER INSIDE DASHBOARD
    // --------------------------------------------------------

    if (notification.folder_id) {
      try {
        const folder =
          await folderService.getFolder(
            notification.folder_id
          );

        await loadFolderContents(
          folder
        );

        return;
      } catch (err) {
        setError(
          err.message ||
            "Unable to open the shared folder"
        );
      }
    }

  } catch (err) {
    console.error(
      "Failed to handle notification",
      err
    );
  }
};


  const handleMarkAllNotificationsRead =
    async () => {
      if (!unreadNotifications.length) {
        return;
      }

      try {
        await notificationService.markAllAsRead();

        setNotifications((current) =>
          current.map((notification) => ({
            ...notification,
            is_read: true,
          }))
        );
      } catch (err) {
        console.error(
          "Failed to mark all notifications as read",
          err
        );
      }
    };


  const formatNotificationTime = (
    createdAt
  ) => {
    if (!createdAt) {
      return "";
    }

    const date = new Date(createdAt);

    if (Number.isNaN(date.getTime())) {
      return "";
    }

    return date.toLocaleString();
  };


  // ==================================================
  // CREATE FOLDER
  // ==================================================

  const handleCreateFolder = async () => {
    const name =
      window.prompt(
        "Enter folder name"
      );

    if (!name?.trim()) {
      return;
    }

    try {
      setError("");

      await folderService.createFolder(
        name.trim(),
        currentFolder?.id || null
      );

      if (currentFolder) {
        await loadFolderContents(
          currentFolder,
          breadcrumbs
        );
      } else {
        await loadRootContents();
      }
    } catch (err) {
      setError(
        err.message ||
          "Failed to create folder"
      );
    }
  };


  // ==================================================
  // UPLOAD
  // ==================================================

  const handleUploadClick = () => {
    if (uploading) {
      return;
    }

    fileInputRef.current?.click();
  };


  const handleFileUpload = async (
    event
  ) => {
    const selectedFile =
      event.target.files?.[0];

    if (!selectedFile) {
      return;
    }

    setError("");
    setUploading(true);

    try {
      await fileService.uploadFile(
        selectedFile,
        currentFolder?.id || null
      );

      if (currentFolder) {
        await loadFolderContents(
          currentFolder,
          breadcrumbs
        );
      } else {
        await loadRootContents();
      }
    } catch (err) {
      setError(
        err.message ||
          "File upload failed"
      );
    } finally {
      setUploading(false);

      event.target.value = "";
    }
  };


  // ==================================================
  // VIEW FILE
  // ==================================================

  const handleView = async (file) => {
    setError("");

    setPreviewFile(file);
    setPreviewUrl("");
    setPreviewLoading(true);

    try {
      const blob =
        await fileService.getFileContent(
          file.id
        );

      const url =
        window.URL.createObjectURL(
          blob
        );

      setPreviewUrl(url);

    } catch (err) {

      setPreviewFile(null);

      setError(
        err.message ||
          "Unable to preview this file"
      );

    } finally {

      setPreviewLoading(false);

    }
  };


  // ==================================================
  // CLOSE PREVIEW
  // ==================================================

  const handleClosePreview = () => {

    if (previewUrl) {
      window.URL.revokeObjectURL(
        previewUrl
      );
    }

    setPreviewFile(null);
    setPreviewUrl("");
    setPreviewLoading(false);
  };


  // ==================================================
  // DOWNLOAD FILE
  // ==================================================

  const handleDownload = async (
    file
  ) => {

    try {

      setError("");

      await fileService.downloadFile(
        file
      );

    } catch (err) {

      setError(
        err.message ||
          "Failed to download file"
      );

    }
  };


  // ==================================================
  // SHARE
  // ==================================================

  const handleShare = (file) => {
    setError("");
    setShareFile(file);
  };


  const handleCloseShare = () => {
    setShareFile(null);
  };


  // ==================================================
  // RENAME
  // ==================================================

  const handleRename = async (
    file
  ) => {

    const newName =
      window.prompt(
        "Enter new file name",
        file.name
      );

    if (
      !newName ||
      !newName.trim() ||
      newName.trim() === file.name
    ) {
      return;
    }

    try {

      setError("");

      await fileService.renameFile(
        file.id,
        newName.trim()
      );

      if (currentFolder) {

        await loadFolderContents(
          currentFolder,
          breadcrumbs
        );

      } else {

        await loadRootContents();

      }

    } catch (err) {

      setError(
        err.message ||
          "Failed to rename file"
      );

    }
  };
// ==================================================
// RENAME FOLDER
// ==================================================

const handleRenameFolder = async (
  folder
) => {
  const newName =
    window.prompt(
      "Enter new folder name",
      folder.name
    );

  if (
    !newName ||
    !newName.trim() ||
    newName.trim() === folder.name
  ) {
    return;
  }

  try {
    setError("");

    await folderService.updateFolder(
      folder.id,
      newName.trim()
    );

    if (currentFolder) {
      await loadFolderContents(
        currentFolder,
        breadcrumbs
      );
    } else {
      await loadRootContents();
    }

  } catch (err) {
    setError(
      err.message ||
        "Failed to rename folder"
    );
  }
};

  // ==================================================
  // DELETE FILE
  // ==================================================

  const handleDeleteFile = async (
    file
  ) => {

    const confirmed =
      window.confirm(
        `Move "${file.name}" to trash?`
      );

    if (!confirmed) {
      return;
    }

    try {

      setError("");

      await fileService.deleteFile(
        file.id
      );

      if (currentFolder) {

        await loadFolderContents(
          currentFolder,
          breadcrumbs
        );

      } else {

        await loadRootContents();

      }

    } catch (err) {

      setError(
        err.message ||
          "Failed to move file to trash"
      );

    }
  };


  // ==================================================
  // DELETE FOLDER
  // ==================================================

  const handleDeleteFolder = async (
    folder
  ) => {

    const confirmed =
      window.confirm(
        `Move "${folder.name}" to trash?`
      );

    if (!confirmed) {
      return;
    }

    try {

      setError("");

      await folderService.deleteFolder(
        folder.id
      );

      if (currentFolder) {

        await loadFolderContents(
          currentFolder,
          breadcrumbs
        );

      } else {

        await loadRootContents();

      }

    } catch (err) {

      setError(
        err.message ||
          "Failed to move folder to trash"
      );

    }
  };


  // ==================================================
  // OPEN FOLDER
  // ==================================================

  const handleFolderOpen = async (
    folder
  ) => {

    const nextBreadcrumbs = [
      ...breadcrumbs,
      {
        id: folder.id,
        name: folder.name,
      },
    ];

    await loadFolderContents(
      folder,
      nextBreadcrumbs
    );
  };


  // ==================================================
  // BREADCRUMB
  // ==================================================

  const handleBreadcrumbClick =
    async (
      breadcrumb,
      index
    ) => {

      if (
        index === 0 ||
        !breadcrumb.id
      ) {

        await loadRootContents();

        return;
      }

      if (
        currentFolder?.id ===
        breadcrumb.id
      ) {
        return;
      }

      const nextBreadcrumbs =
        breadcrumbs.slice(
          0,
          index + 1
        );

      await loadFolderContents(
        {
          id: breadcrumb.id,
          name: breadcrumb.name,
        },
        nextBreadcrumbs
      );
    };


  // ==================================================
  // BACK
  // ==================================================

  const handleBack = async () => {

    if (
      breadcrumbs.length <= 1
    ) {

      await loadRootContents();

      return;
    }

    const nextBreadcrumbs =
      breadcrumbs.slice(
        0,
        -1
      );

    const parent =
      nextBreadcrumbs[
        nextBreadcrumbs.length - 1
      ];

    if (!parent.id) {

      await loadRootContents();

      return;
    }

    await loadFolderContents(
      {
        id: parent.id,
        name: parent.name,
      },
      nextBreadcrumbs
    );
  };


  // ==================================================
  // MOVE
  // ==================================================

const loadMoveFolders = async (
  folderId = null,
  movingItem = fileToMove
) =>  {

    setMoveLoading(true);

    try {

      let folderList = [];

      if (!folderId) {

        const data =
          await folderService.getFolders();

        folderList =
          Array.isArray(data)
            ? data
            : data?.folders || [];

      } else {

        const data =
          await folderService.getFolderContents(
            folderId
          );

        folderList =
          data?.folders || [];
      }
folderList =
  folderList.filter(
    (folder) => {

      // Never show the current folder
if (
  movingItem?._moveType ===
    "folder" &&
  folder.id ===
    movingItem?.id
) {
  return false;
}

      // Never allow a folder to be
      // moved into itself
      if (
        fileToMove?._moveType ===
          "folder" &&
        folder.id ===
          fileToMove?.id
      ) {
        return false;
      }

      return true;
    }
  );

      setMoveFolders(
        folderList
      );

    } catch (err) {

      setError(
        err.message ||
          "Failed to load folders"
      );

      setMoveFolders([]);

    } finally {

      setMoveLoading(false);

    }
  };


const handleMove = async (
  item,
  itemType = "file"
) => {
  setError("");

  const moveItem = {
    ...item,
    _moveType: itemType,
  };

  setFileToMove(moveItem);

  setMovePath([
    ROOT_FOLDER,
  ]);

  setMoveModalOpen(true);

  await loadMoveFolders(
    null,
    moveItem
  );
};

  const handleMoveFolderOpen =
    async (folder) => {

      const nextPath = [
        ...movePath,
        {
          id: folder.id,
          name: folder.name,
        },
      ];

      setMovePath(
        nextPath
      );

      await loadMoveFolders(
        folder.id
      );
    };


  const handleMoveBreadcrumb =
    async (
      breadcrumb,
      index
    ) => {

      const nextPath =
        movePath.slice(
          0,
          index + 1
        );

      setMovePath(
        nextPath
      );

      await loadMoveFolders(
        breadcrumb.id || null
      );
    };


  const handleMoveBack =
    async () => {

      if (
        movePath.length <= 1
      ) {
        return;
      }

      const nextPath =
        movePath.slice(
          0,
          -1
        );

      setMovePath(
        nextPath
      );

      const parent =
        nextPath[
          nextPath.length - 1
        ];

      await loadMoveFolders(
        parent.id || null
      );
    };


  const closeMoveModal = () => {

    if (moving) {
      return;
    }

    setMoveModalOpen(false);

    setFileToMove(null);

    setMoveFolders([]);

    setMovePath([
      ROOT_FOLDER,
    ]);
  };


const handleConfirmMove =
  async () => {

    if (!fileToMove) {
      return;
    }

    const destination =
      movePath[
        movePath.length - 1
      ];

    const itemType =
      fileToMove._moveType ||
      "file";

    if (
      destination.id ===
      (currentFolder?.id || null)
    ) {
      setError(
        `The ${
          itemType === "folder"
            ? "folder"
            : "file"
        } is already in this folder`
      );

      return;
    }

    setMoving(true);
    setError("");

    try {

      if (itemType === "folder") {

        await folderService.moveFolder(
          fileToMove.id,
          destination.id || null
        );

      } else {

        await fileService.moveFile(
          fileToMove.id,
          destination.id || null
        );

      }

      closeMoveModal();

      if (currentFolder) {

        await loadFolderContents(
          currentFolder,
          breadcrumbs
        );

      } else {

        await loadRootContents();

      }

    } catch (err) {

      setError(
        err.message ||
          `Failed to move ${
            itemType === "folder"
              ? "folder"
              : "file"
          }`
      );

    } finally {

      setMoving(false);

    }
  };


  // ==================================================
  // SEARCH
  // ==================================================

  const filteredFolders =
    folders.filter((folder) =>
      folder.name
        ?.toLowerCase()
        .includes(
          search.toLowerCase()
        )
    );


  const filteredFiles =
    files.filter((file) =>
      file.name
        ?.toLowerCase()
        .includes(
          search.toLowerCase()
        )
    );


  // ==================================================
  // RENDER
  // ==================================================

  return (
    <Layout
      search={search}
      setSearch={setSearch}
    >

      <div className="mx-auto max-w-7xl">

        {/* HEADER */}

        <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">

          <div>

            <h1 className="text-2xl font-bold text-slate-900">
              My Files
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Manage your files and folders
            </p>

          </div>


          <div className="flex gap-3">

            <button
              onClick={
                handleCreateFolder
              }
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              <FolderPlus size={18} />
              New folder
            </button>


            <button
              onClick={
                handleUploadClick
              }
              disabled={uploading}
              className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:opacity-60"
            >

              <Upload size={18} />

              {uploading
                ? "Uploading..."
                : "Upload"}

            </button>


            {/* NOTIFICATIONS */}

            <div className="relative">

              <button
                type="button"
                onClick={() =>
                  setNotificationOpen(
                    (open) => !open
                  )
                }
                className="relative flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50"
                title="Notifications"
              >
                <Bell size={19} />

                {unreadNotifications.length > 0 && (
                  <span className="absolute -right-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                    {unreadNotifications.length > 99
                      ? "99+"
                      : unreadNotifications.length}
                  </span>
                )}
              </button>


              {notificationOpen && (
                <div className="absolute right-0 top-14 z-50 w-[360px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">

                  <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900">
                        Notifications
                      </h3>
                      <p className="mt-0.5 text-xs text-slate-400">
                        {unreadNotifications.length}
                        {" "}
                        unread
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={
                        handleMarkAllNotificationsRead
                      }
                      disabled={
                        unreadNotifications.length === 0
                      }
                      className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <CheckCheck size={14} />
                      Mark all read
                    </button>
                  </div>


                  <div className="max-h-[360px] overflow-y-auto">

                    {notificationLoading ? (
                      <div className="flex min-h-32 items-center justify-center">
                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-slate-900" />
                      </div>
                    ) : notifications.length > 0 ? (
                      notifications.map((notification) => (
                        <button
                          type="button"
                          key={notification.id}
                          onClick={() =>
                            handleNotificationClick(
                              notification
                            )
                          }
                          className={`w-full border-b border-slate-100 px-4 py-3 text-left transition last:border-b-0 hover:bg-slate-50 ${
                            notification.is_read
                              ? "bg-white"
                              : "bg-slate-50"
                          }`}
                        >
                          <div className="flex gap-3">
                            <div className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${
                              notification.is_read
                                ? "bg-slate-200"
                                : "bg-slate-900"
                            }`} />

                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold text-slate-800">
                                {notification.title}
                              </p>

                              <p className="mt-1 text-xs leading-5 text-slate-500">
                                {notification.message}
                              </p>

                              <p className="mt-1.5 text-[10px] text-slate-400">
                                {formatNotificationTime(
                                  notification.created_at
                                )}
                              </p>
                            </div>
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className="flex min-h-32 flex-col items-center justify-center px-6 text-center">
                        <Bell
                          size={28}
                          className="mb-2 text-slate-300"
                        />
                        <p className="text-sm font-medium text-slate-600">
                          No notifications
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                          You're all caught up.
                        </p>
                      </div>
                    )}

                  </div>

                </div>
              )}

            </div>


            <button
              onClick={logout}
              className="flex items-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-3 text-sm font-semibold text-red-600 shadow-sm transition hover:bg-red-50"
              title={
                user?.email
                  ? `Logout ${user.email}`
                  : "Logout"
              }
            >
              Logout
            </button>


            <input
              ref={fileInputRef}
              type="file"
              onChange={
                handleFileUpload
              }
              className="hidden"
            />

          </div>

        </div>


        {/* BREADCRUMBS */}

        <div className="mb-4 flex items-center gap-2 overflow-x-auto rounded-xl border border-slate-200 bg-white px-4 py-3">

          <Home
            size={17}
            className="shrink-0 text-slate-400"
          />

          {breadcrumbs.map(
            (
              breadcrumb,
              index
            ) => (

              <div
                key={
                  breadcrumb.id ||
                  "root"
                }
                className="flex shrink-0 items-center gap-2"
              >

                {index > 0 && (
                  <ChevronRight
                    size={16}
                    className="text-slate-300"
                  />
                )}


                <button
                  onClick={() =>
                    handleBreadcrumbClick(
                      breadcrumb,
                      index
                    )
                  }
                  disabled={
                    index ===
                    breadcrumbs.length - 1
                  }
                  className={`text-sm font-medium ${
                    index ===
                    breadcrumbs.length - 1
                      ? "cursor-default text-slate-900"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  {
                    breadcrumb.name
                  }
                </button>

              </div>

            )
          )}

        </div>


        {/* BACK */}

        {currentFolder && (

          <button
            onClick={
              handleBack
            }
            disabled={loading}
            className="mb-6 flex items-center gap-2 rounded-lg px-2 py-1 text-sm font-semibold text-slate-600 transition hover:bg-slate-200 hover:text-slate-900 disabled:opacity-50"
          >

            <ArrowLeft size={17} />

            Back

          </button>

        )}


        {/* ERROR */}

        {error && (

          <div className="mb-6 flex items-center justify-between rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-600">

            <span>
              {error}
            </span>

            <button
              onClick={() =>
                setError("")
              }
            >
              ×
            </button>

          </div>

        )}


        {/* CONTENT */}

        {loading ? (

          <div className="flex min-h-64 items-center justify-center">

            <div className="text-center">

              <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-slate-900" />

              <p className="text-sm text-slate-400">
                Loading your files...
              </p>

            </div>

          </div>

        ) : (

          <>

            {/* FOLDERS */}

            <section className="mb-10">

              <div className="mb-4 flex items-center justify-between">

                <div className="flex items-center gap-2">

                  <Folder
                    size={20}
                    className="text-slate-500"
                  />

                  <h2 className="font-semibold text-slate-800">
                    Folders
                  </h2>

                </div>


                <span className="text-xs text-slate-400">
                  {
                    filteredFolders.length
                  }
                </span>

              </div>


              {filteredFolders.length >
              0 ? (

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">

                  {filteredFolders.map(
                    (folder) => (

<div
  key={folder.id}
  className="relative z-20"
>
<FolderCard
  folder={folder}
  permission={getPermission(folder)}
  onOpen={handleFolderOpen}

  onRename={
    canEditItem(folder)
      ? handleRenameFolder
      : undefined
  }

  onMove={
    canEditItem(folder)
      ? (item) =>
          handleMove(
            item,
            "folder"
          )
      : undefined
  }

  onDelete={
    canEditItem(folder)
      ? handleDeleteFolder
      : undefined
  }
/>
</div>

                    )
                  )}

                </div>

              ) : (

                <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">

                  <Folder
                    size={36}
                    className="mx-auto mb-3 text-slate-300"
                  />

                  <p className="font-medium text-slate-600">
                    No folders here
                  </p>

                </div>

              )}

            </section>


            {/* FILES */}

            <section>

              <div className="mb-4 flex items-center justify-between">

                <div className="flex items-center gap-2">

                  <Files
                    size={20}
                    className="text-slate-500"
                  />

                  <h2 className="font-semibold text-slate-800">
                    Files
                  </h2>

                </div>


                <span className="text-xs text-slate-400">
                  {
                    filteredFiles.length
                  }
                </span>

              </div>


              {filteredFiles.length >
              0 ? (

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">

                  {filteredFiles.map(
                    (file) => (

                      <div
                        key={file.id}
                        className="relative z-0"
                      >
                        <FileCard
                          file={file}
                          permission={getPermission(file)}
                          onView={handleView}
                          onDownload={handleDownload}
                          onRename={
                            canEditItem(file)
                              ? handleRename
                              : undefined
                          }
                          onMove={
  canEditItem(file)
    ? (item) =>
        handleMove(
          item,
          "file"
        )
    : undefined
}
                          onShare={
                            canShareItem(file)
                              ? handleShare
                              : undefined
                          }
                          onDelete={
                            canEditItem(file)
                              ? handleDeleteFile
                              : undefined
                          }
                        />
                      </div>

                    )
                  )}

                </div>

              ) : (

                <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">

                  <Files
                    size={36}
                    className="mx-auto mb-3 text-slate-300"
                  />

                  <p className="font-medium text-slate-600">
                    No files here
                  </p>

                </div>

              )}

            </section>

          </>

        )}

      </div>


      {/* ==================================================
          PREVIEW MODAL
          ================================================== */}

      {previewFile && (

        <FilePreviewModal
          file={previewFile}
          previewUrl={previewUrl}
          loading={previewLoading}
          onClose={
            handleClosePreview
          }
          onDownload={
            handleDownload
          }
        />

      )}


      {/* ==================================================
          SHARE MODAL
          ================================================== */}

      {shareFile && (

        <ShareModal
          file={shareFile}
          onClose={handleCloseShare}
        />

      )}


      {/* ==================================================
          MOVE MODAL
          ================================================== */}

      {moveModalOpen && (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">

          <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">

            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">

              <div className="min-w-0">
<h2 className="font-semibold text-slate-900">
  Move{" "}
  {fileToMove?._moveType === "folder"
    ? "folder"
    : "file"}
</h2>

                <p
                  className="mt-1 truncate text-xs text-slate-400"
                  title={
                    fileToMove?.name
                  }
                >
                  {
                    fileToMove?.name
                  }
                </p>

              </div>


              <button
                onClick={
                  closeMoveModal
                }
                disabled={moving}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
              >
                <X size={19} />
              </button>

            </div>


            {/* MOVE BREADCRUMB */}

            <div className="border-b border-slate-100 px-5 py-3">

              <div className="flex items-center gap-1 overflow-x-auto">

                {movePath.map(
                  (
                    breadcrumb,
                    index
                  ) => (

                    <div
                      key={
                        breadcrumb.id ||
                        "root"
                      }
                      className="flex shrink-0 items-center"
                    >

                      {index > 0 && (

                        <ChevronRight
                          size={15}
                          className="mx-1 text-slate-300"
                        />

                      )}


                      <button
                        onClick={() =>
                          handleMoveBreadcrumb(
                            breadcrumb,
                            index
                          )
                        }
                        disabled={
                          index ===
                          movePath.length - 1
                        }
                        className="rounded-md px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100"
                      >
                        {
                          breadcrumb.name
                        }
                      </button>

                    </div>

                  )
                )}

              </div>

            </div>


            {/* FOLDERS */}

            <div className="max-h-80 overflow-y-auto p-3">

              {moveLoading ? (

                <div className="flex min-h-48 items-center justify-center">

                  <div className="h-7 w-7 animate-spin rounded-full border-2 border-slate-200 border-t-slate-900" />

                </div>

              ) : moveFolders.length >
                0 ? (

                <div className="space-y-1">

                  {moveFolders.map(
                    (folder) => (

                      <button
                        key={
                          folder.id
                        }
                        onClick={() =>
                          handleMoveFolderOpen(
                            folder
                          )
                        }
                        disabled={
                          moving ||
                          folder.id ===
                            currentFolder?.id
                        }
                        className="flex w-full items-center justify-between rounded-xl px-3 py-3 text-left hover:bg-slate-50 disabled:opacity-40"
                      >

                        <div className="flex min-w-0 items-center gap-3">

                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100">

                            <Folder
                              size={18}
                              className="text-slate-600"
                            />

                          </div>

                          <span className="truncate text-sm font-medium text-slate-700">
                            {
                              folder.name
                            }
                          </span>

                        </div>


                        <ChevronRight
                          size={17}
                          className="text-slate-300"
                        />

                      </button>

                    )
                  )}

                </div>

              ) : (

                <div className="flex min-h-48 flex-col items-center justify-center text-center">

                  <FolderOpen
                    size={36}
                    className="mb-3 text-slate-300"
                  />

                  <p className="font-medium text-slate-600">
                    No subfolders
                  </p>

<p className="mt-1 text-xs text-slate-400">
  You can move the{" "}
  {fileToMove?._moveType === "folder"
    ? "folder"
    : "file"}{" "}
  here.
</p>

                </div>

              )}

            </div>


            {/* FOOTER */}

            <div className="flex items-center justify-between border-t border-slate-200 px-5 py-4">

              <div className="min-w-0">

                <p className="text-xs text-slate-400">
                  Destination
                </p>

                <p className="truncate text-sm font-semibold text-slate-700">
                  {
                    movePath[
                      movePath.length - 1
                    ]?.name
                  }
                </p>

              </div>


              <div className="flex gap-2">

                <button
                  onClick={
                    closeMoveModal
                  }
                  disabled={moving}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>


                <button
                  onClick={
                    handleConfirmMove
                  }
                  disabled={
                    moving ||
                    moveLoading
                  }
                  className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
                >

                  {moving ? (

                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-500 border-t-white" />

                      Moving...
                    </>

                  ) : (

                    <>
                      <Check size={16} />

                      Move here
                    </>

                  )}

                </button>

              </div>

            </div>

          </div>

        </div>

      )}

    </Layout>
  );
};


export default Dashboard;