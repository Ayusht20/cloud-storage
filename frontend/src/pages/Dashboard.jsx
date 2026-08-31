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


  const loadFolderContents =
    async (folder) => {
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

        const breadcrumbData =
          await folderService.getBreadcrumbs(
            folder.id
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


  useEffect(() => {
    loadRootContents();
  }, []);


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


  const handleUploadClick = () => {
    if (uploading) {
      return;
    }

    fileInputRef.current?.click();
  };


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
         * Reload the current folder so
         * the newly uploaded file appears
         * immediately in the dashboard.
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
         * Clear the input so the same file
         * can be selected again later.
         */
        event.target.value = "";
      }
    };


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


  const handleFolderOpen =
    (folder) => {
      loadFolderContents(folder);
    };


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


        {error && (
          <div className="mb-6 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-600">
            {error}
          </div>
        )}


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