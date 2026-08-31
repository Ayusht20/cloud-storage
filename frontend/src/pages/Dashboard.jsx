import {
  useEffect,
  useState,
} from "react";

import {
  FolderPlus,
  Upload,
  Folder,
  Files,
} from "lucide-react";

import Layout from "../components/Layout";
import FolderCard from "../components/FolderCard";
import FileCard from "../components/FileCard";

import fileService from "../services/fileService";
import folderService from "../services/folderService";


const Dashboard = () => {
  const [files, setFiles] =
    useState([]);

  const [folders, setFolders] =
    useState([]);

  const [search, setSearch] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");


  const loadFiles = async () => {
    try {
      const data =
        await fileService.getFiles();

      setFiles(
        Array.isArray(data)
          ? data
          : data?.files || []
      );
    } catch (err) {
      setError(
        err.message ||
          "Failed to load files"
      );
    }
  };


  const loadFolders = async () => {
    try {
      const data =
        await folderService.getFolders();

      setFolders(
        Array.isArray(data)
          ? data
          : data?.folders || []
      );
    } catch (err) {
      setError(
        err.message ||
          "Failed to load folders"
      );
    }
  };


  const loadDashboard =
    async () => {
      setLoading(true);
      setError("");

      await Promise.all([
        loadFiles(),
        loadFolders(),
      ]);

      setLoading(false);
    };


  useEffect(() => {
    loadDashboard();
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
          name.trim()
        );

        await loadFolders();
      } catch (err) {
        setError(
          err.message ||
            "Failed to create folder"
        );
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

        await loadFiles();
      } catch (err) {
        setError(
          err.message ||
            "Failed to delete file"
        );
      }
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
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">

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
              className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
            >
              <Upload size={18} />
              Upload
            </button>

          </div>

        </div>


        {error && (
          <div className="mb-6 rounded-xl bg-red-50 p-4 text-sm text-red-600">
            {error}
          </div>
        )}


        {loading ? (
          <div className="flex min-h-64 items-center justify-center">
            <p className="text-sm text-slate-400">
              Loading your files...
            </p>
          </div>
        ) : (
          <>

            {/* Folders */}
            <section className="mb-10">

              <div className="mb-4 flex items-center gap-2">
                <Folder
                  size={20}
                  className="text-slate-500"
                />

                <h2 className="font-semibold text-slate-800">
                  Folders
                </h2>
              </div>


              {filteredFolders.length >
              0 ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">

                  {filteredFolders.map(
                    (folder) => (
                      <FolderCard
                        key={folder.id}
                        folder={folder}
                        onOpen={(item) =>
                          console.log(
                            "Open folder:",
                            item
                          )
                        }
                      />
                    )
                  )}

                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
                  <Folder
                    size={32}
                    className="mx-auto mb-3 text-slate-300"
                  />

                  <p className="font-medium text-slate-600">
                    No folders found
                  </p>
                </div>
              )}

            </section>


            {/* Files */}
            <section>

              <div className="mb-4 flex items-center gap-2">
                <Files
                  size={20}
                  className="text-slate-500"
                />

                <h2 className="font-semibold text-slate-800">
                  Files
                </h2>
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
                    size={32}
                    className="mx-auto mb-3 text-slate-300"
                  />

                  <p className="font-medium text-slate-600">
                    No files found
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