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
} from "lucide-react";

import Layout from "../components/Layout";
import FolderCard from "../components/FolderCard";
import FileCard from "../components/FileCard";

import fileService from "../services/fileService";
import folderService from "../services/folderService";


const ROOT_BREADCRUMB = {
  id: null,
  name: "My Drive",
};


const Dashboard = () => {
  const [files, setFiles] = useState([]);
  const [folders, setFolders] = useState([]);

  const [currentFolder, setCurrentFolder] =
    useState(null);

  const [breadcrumbs, setBreadcrumbs] =
    useState([ROOT_BREADCRUMB]);

  const [search, setSearch] = useState("");

  const [loading, setLoading] =
    useState(true);

  const [uploading, setUploading] =
    useState(false);

  const [error, setError] =
    useState("");

  const fileInputRef = useRef(null);


  /*
   * Move modal state.
   */
  const [moveModalOpen, setMoveModalOpen] =
    useState(false);

  const [fileToMove, setFileToMove] =
    useState(null);

  const [moveFolders, setMoveFolders] =
    useState([]);

  const [movePath, setMovePath] =
    useState([ROOT_BREADCRUMB]);

  const [moveLoading, setMoveLoading] =
    useState(false);

  const [moving, setMoving] =
    useState(false);


  /*
   * Normalize breadcrumb order.
   */
  const normalizeBreadcrumbs =
    (items) => {
      if (!Array.isArray(items)) {
        return [ROOT_BREADCRUMB];
      }

      const cleaned = items
        .filter(Boolean)
        .map((item) => ({
          id: item.id || null,
          name:
            item.name || "Unnamed folder",
        }));


      const withoutRoot =
        cleaned.filter(
          (item) => item.id !== null
        );


      return [
        ROOT_BREADCRUMB,
        ...withoutRoot,
      ];
    };


  /*
   * Load root contents.
   */
  const loadRootContents =
    async () => {
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
          ROOT_BREADCRUMB,
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


  /*
   * Load folder contents and breadcrumbs
   * in parallel.
   */
  const loadFolderContents =
    async (folder) => {
      setLoading(true);
      setError("");

      try {
        const [
          data,
          breadcrumbData,
        ] = await Promise.all([
          folderService.getFolderContents(
            folder.id
          ),

          folderService.getBreadcrumbs(
            folder.id
          ),
        ]);


        setCurrentFolder(folder);

        setFolders(
          data?.folders || []
        );

        setFiles(
          data?.files || []
        );


        let nextBreadcrumbs =
          normalizeBreadcrumbs(
            breadcrumbData
          );


        const currentIndex =
          nextBreadcrumbs.findIndex(
            (item) =>
              item.id === folder.id
          );


        if (currentIndex !== -1) {
          nextBreadcrumbs =
            nextBreadcrumbs.slice(
              0,
              currentIndex + 1
            );
        } else {
          nextBreadcrumbs = [
            ...nextBreadcrumbs,
            {
              id: folder.id,
              name: folder.name,
            },
          ];
        }


        setBreadcrumbs(
          nextBreadcrumbs
        );
      } catch (err) {
        setError(
          err.message ||
            "Failed to open folder"
        );
      } finally {
        setLoading(false);
      }
    };


  useEffect(() => {
    loadRootContents();
  }, []);


  /*
   * Create folder.
   */
  const handleCreateFolder =
    async () => {
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
            currentFolder
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


  /*
   * Open upload picker.
   */
  const handleUploadClick = () => {
    if (uploading) {
      return;
    }

    fileInputRef.current?.click();
  };


  /*
   * Upload file.
   */
  const handleFileUpload =
    async (event) => {
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
            currentFolder
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


  /*
   * Download file.
   */
  const handleDownload =
    async (file) => {
      try {
        setError("");

        const data =
          await fileService.downloadFile(
            file.id
          );

        if (!data?.download_url) {
          throw new Error(
            "Download URL was not returned"
          );
        }

        window.open(
          data.download_url,
          "_blank",
          "noopener,noreferrer"
        );
      } catch (err) {
        setError(
          err.message ||
            "Failed to download file"
        );
      }
    };


  /*
   * Rename file.
   */
  const handleRename =
    async (file) => {
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
            currentFolder
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


  /*
   * Open the move modal.
   */
  const handleMove =
    async (file) => {
      setError("");

      setFileToMove(file);

      setMovePath([
        ROOT_BREADCRUMB,
      ]);

      setMoveModalOpen(true);

      await loadMoveFolders(null);
    };


  /*
   * Load folders for the current
   * location inside the move picker.
   *
   * null = My Drive/root
   */
  const loadMoveFolders =
    async (folderId) => {
      setMoveLoading(true);

      try {
        const data =
          folderId === null
            ? await folderService.getFolders()
            : await folderService.getFolders(
                folderId
              );

        setMoveFolders(
          Array.isArray(data)
            ? data
            : data?.folders || []
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


  /*
   * Enter a folder inside the
   * move picker.
   */
  const handleMoveFolderOpen =
    async (folder) => {
      setMovePath(
        (previous) => [
          ...previous,
          {
            id: folder.id,
            name: folder.name,
          },
        ]
      );

      await loadMoveFolders(
        folder.id
      );
    };


  /*
   * Navigate to a location inside
   * the move picker.
   */
  const handleMoveBreadcrumb =
    async (breadcrumb, index) => {
      const nextPath =
        movePath.slice(
          0,
          index + 1
        );

      setMovePath(nextPath);

      await loadMoveFolders(
        breadcrumb.id || null
      );
    };


  /*
   * Go one level back inside the
   * move picker.
   */
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

      const parent =
        nextPath[
          nextPath.length - 1
        ];

      setMovePath(nextPath);

      await loadMoveFolders(
        parent.id || null
      );
    };


  /*
   * Close move modal.
   */
  const closeMoveModal = () => {
    if (moving) {
      return;
    }

    setMoveModalOpen(false);

    setFileToMove(null);

    setMoveFolders([]);

    setMovePath([
      ROOT_BREADCRUMB,
    ]);
  };


  /*
   * Move the selected file into
   * the currently selected folder.
   */
  const handleConfirmMove =
    async () => {
      if (!fileToMove) {
        return;
      }

      const destination =
        movePath[
          movePath.length - 1
        ];


      /*
       * If the selected destination
       * is already the current folder,
       * there is nothing to do.
       */
      if (
        destination.id ===
        (currentFolder?.id || null)
      ) {
        setError(
          "The file is already in this folder"
        );

        return;
      }


      setMoving(true);
      setError("");

      try {
        await fileService.moveFile(
          fileToMove.id,
          destination.id || null
        );


        closeMoveModal();


        /*
         * Refresh the current location
         * after moving the file.
         */
        if (currentFolder) {
          await loadFolderContents(
            currentFolder
          );
        } else {
          await loadRootContents();
        }
      } catch (err) {
        setError(
          err.message ||
            "Failed to move file"
        );
      } finally {
        setMoving(false);
      }
    };


  /*
   * Delete file.
   */
  const handleDeleteFile =
    async (file) => {
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
            currentFolder
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


  /*
   * Open folder.
   */
  const handleFolderOpen =
    async (folder) => {
      await loadFolderContents(
        folder
      );
    };


  /*
   * Breadcrumb navigation.
   */
  const handleBreadcrumbClick =
    async (
      breadcrumb,
      index
    ) => {
      if (
        !breadcrumb.id ||
        index === 0
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

      await loadFolderContents({
        id: breadcrumb.id,
        name: breadcrumb.name,
      });
    };


  /*
   * Back one folder.
   */
  const handleBack =
    async () => {
      if (
        !currentFolder ||
        breadcrumbs.length <= 1
      ) {
        await loadRootContents();
        return;
      }

      const parentIndex =
        breadcrumbs.length - 2;

      const parent =
        breadcrumbs[parentIndex];


      if (!parent?.id) {
        await loadRootContents();
        return;
      }


      await loadFolderContents({
        id: parent.id,
        name: parent.name,
      });
    };


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


  return (
    <Layout
      search={search}
      setSearch={setSearch}
    >

      <div className="mx-auto max-w-7xl">

        {/* Header */}
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
              disabled={uploading}
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <FolderPlus size={18} />
              New folder
            </button>


            <button
              onClick={
                handleUploadClick
              }
              disabled={uploading}
              className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Upload size={18} />

              {uploading
                ? "Uploading..."
                : "Upload"}
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


        {/* Breadcrumbs */}
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
                  className={`text-sm font-medium transition ${
                    index ===
                    breadcrumbs.length - 1
                      ? "cursor-default text-slate-900"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  {breadcrumb.name}
                </button>

              </div>
            )
          )}

        </div>


        {/* Back */}
        {currentFolder && (
          <button
            onClick={
              handleBack
            }
            disabled={loading}
            className="mb-6 flex items-center gap-2 rounded-lg px-2 py-1 text-sm font-semibold text-slate-600 transition hover:bg-slate-200 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ArrowLeft size={17} />
            Back
          </button>
        )}


        {/* Error */}
        {error && (
          <div className="mb-6 flex items-center justify-between rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-600">

            <span>
              {error}
            </span>

            <button
              onClick={() =>
                setError("")
              }
              className="ml-4 font-semibold text-red-500 hover:text-red-700"
            >
              ×
            </button>

          </div>
        )}


        {/* Loading */}
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

            {/* Folders */}
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
                  {filteredFolders.length}
                </span>

              </div>


              {filteredFolders.length >
              0 ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">

                  {filteredFolders.map(
                    (folder) => (
                      <FolderCard
                        key={folder.id}
                        folder={folder}
                        onOpen={
                          handleFolderOpen
                        }
                      />
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

                  <p className="mt-1 text-sm text-slate-400">
                    Create a folder to organize your files.
                  </p>

                </div>
              )}

            </section>


            {/* Files */}
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
                  {filteredFiles.length}
                </span>

              </div>


              {filteredFiles.length >
              0 ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">

                  {filteredFiles.map(
                    (file) => (
                      <FileCard
                        key={file.id}
                        file={file}
                        onDownload={
                          handleDownload
                        }
                        onRename={
                          handleRename
                        }
                        onMove={
                          handleMove
                        }
                        onDelete={
                          handleDeleteFile
                        }
                      />
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

                  <p className="mt-1 text-sm text-slate-400">
                    Upload files to see them here.
                  </p>

                </div>
              )}

            </section>

          </>
        )}

      </div>


      {/* =====================================================
          MOVE FILE MODAL
          ===================================================== */}

      {moveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">

          <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">

            {/* Modal header */}
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">

              <div>
                <h2 className="font-semibold text-slate-900">
                  Move file
                </h2>

                <p
                  className="mt-1 max-w-sm truncate text-xs text-slate-400"
                  title={
                    fileToMove?.name
                  }
                >
                  {fileToMove?.name}
                </p>
              </div>


              <button
                onClick={
                  closeMoveModal
                }
                disabled={moving}
                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
              >
                <X size={19} />
              </button>

            </div>


            {/* Current destination */}
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
                        className={`rounded-md px-2 py-1 text-xs font-medium ${
                          index ===
                          movePath.length - 1
                            ? "cursor-default bg-slate-100 text-slate-800"
                            : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                        }`}
                      >
                        {breadcrumb.name}
                      </button>

                    </div>
                  )
                )}

              </div>

            </div>


            {/* Folder list */}
            <div className="max-h-80 overflow-y-auto p-3">

              {moveLoading ? (
                <div className="flex min-h-48 items-center justify-center">

                  <div className="text-center">

                    <div className="mx-auto mb-3 h-7 w-7 animate-spin rounded-full border-2 border-slate-200 border-t-slate-900" />

                    <p className="text-sm text-slate-400">
                      Loading folders...
                    </p>

                  </div>

                </div>
              ) : moveFolders.length >
                0 ? (
                <div className="space-y-1">

                  {moveFolders.map(
                    (folder) => {
                      const isCurrent =
                        folder.id ===
                        currentFolder?.id;

                      return (
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
                            moving
                          }
                          className={`flex w-full items-center justify-between rounded-xl px-3 py-3 text-left transition ${
                            isCurrent
                              ? "bg-slate-50 opacity-50"
                              : "hover:bg-slate-50"
                          }`}
                        >

                          <div className="flex min-w-0 items-center gap-3">

                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">

                              <Folder
                                size={18}
                              />

                            </div>


                            <span className="truncate text-sm font-medium text-slate-700">
                              {folder.name}
                            </span>

                          </div>


                          <ChevronRight
                            size={17}
                            className="shrink-0 text-slate-300"
                          />

                        </button>
                      );
                    }
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
                    You can move the file here.
                  </p>

                </div>
              )}

            </div>


            {/* Modal footer */}
            <div className="flex items-center justify-between border-t border-slate-200 px-5 py-4">

              <div className="min-w-0">

                <p className="text-xs text-slate-400">
                  Destination
                </p>

                <p className="max-w-56 truncate text-sm font-semibold text-slate-700">
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
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>


                <button
                  onClick={
                    handleConfirmMove
                  }
                  disabled={
                    moving ||
                    moveLoading ||
                    movePath.length === 0
                  }
                  className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
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