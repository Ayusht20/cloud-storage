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
} from "lucide-react";

import Layout from "../components/Layout";
import FolderCard from "../components/FolderCard";
import FileCard from "../components/FileCard";

import fileService from "../services/fileService";
import folderService from "../services/folderService";


const Dashboard = () => {
  const [files, setFiles] = useState([]);
  const [folders, setFolders] = useState([]);

  const [currentFolder, setCurrentFolder] =
    useState(null);

  const [breadcrumbs, setBreadcrumbs] =
    useState([
      {
        id: null,
        name: "My Drive",
      },
    ]);

  const [search, setSearch] = useState("");

  const [loading, setLoading] =
    useState(true);

  const [uploading, setUploading] =
    useState(false);

  const [error, setError] =
    useState("");

  const fileInputRef = useRef(null);


  /*
   * Load root folder contents.
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

        setBreadcrumbs(
          data?.breadcrumbs || [
            {
              id: null,
              name: "My Drive",
            },
          ]
        );
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
   * Load a folder and its breadcrumbs
   * at the same time.
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

        setBreadcrumbs(
          breadcrumbData || []
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


  /*
   * Load the dashboard when the
   * component is mounted.
   */
  useEffect(() => {
    loadRootContents();
  }, []);


  /*
   * Create a new folder inside
   * the current folder.
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
   * Open the hidden file picker.
   */
  const handleUploadClick = () => {
    if (uploading) {
      return;
    }

    fileInputRef.current?.click();
  };


  /*
   * Upload the selected file.
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

        /*
         * Refresh the current location
         * so the uploaded file appears
         * immediately.
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
            "File upload failed"
        );
      } finally {
        setUploading(false);

        /*
         * Reset the input so the same
         * file can be selected again.
         */
        event.target.value = "";
      }
    };


  /*
   * Download a file.
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
   * Rename a file.
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
   * Move a file to another folder.
   *
   * This is temporarily using a
   * folder UUID prompt. We will replace
   * this with a proper folder picker UI.
   */
  const handleMove =
    async (file) => {
      const folderId =
        window.prompt(
          "Enter destination folder ID. Leave empty to move to My Drive."
        );

      if (folderId === null) {
        return;
      }

      const destination =
        folderId.trim() || null;

      try {
        setError("");

        await fileService.moveFile(
          file.id,
          destination
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
            "Failed to move file"
        );
      }
    };


  /*
   * Move a file to trash.
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
   * Open a folder.
   */
  const handleFolderOpen =
    (folder) => {
      loadFolderContents(folder);
    };


  /*
   * Navigate through breadcrumbs.
   */
  const handleBreadcrumbClick =
    async (breadcrumb) => {
      if (!breadcrumb.id) {
        await loadRootContents();
        return;
      }

      await loadFolderContents({
        id: breadcrumb.id,
        name: breadcrumb.name,
      });
    };


  /*
   * Filter folders using the
   * dashboard search box.
   */
  const filteredFolders =
    folders.filter((folder) =>
      folder.name
        ?.toLowerCase()
        .includes(
          search.toLowerCase()
        )
    );


  /*
   * Filter files using the
   * dashboard search box.
   */
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
        <div className="mb-6 flex items-center gap-2 overflow-x-auto rounded-xl border border-slate-200 bg-white px-4 py-3">

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
                      breadcrumb
                    )
                  }
                  className={`text-sm font-medium transition ${
                    index ===
                    breadcrumbs.length -
                      1
                      ? "text-slate-900"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  {breadcrumb.name}
                </button>

              </div>
            )
          )}

        </div>


        {/* Back button */}
        {currentFolder && (
          <button
            onClick={() => {
              const parent =
                breadcrumbs[
                  breadcrumbs.length - 2
                ];

              if (!parent?.id) {
                loadRootContents();
              } else {
                handleBreadcrumbClick(
                  parent
                );
              }
            }}
            className="mb-6 flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900"
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

    </Layout>
  );
};


export default Dashboard;