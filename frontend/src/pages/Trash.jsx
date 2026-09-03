import { useEffect, useState } from "react";

import {
  ArchiveRestore,
  File,
  Folder,
  RefreshCw,
  Trash2,
} from "lucide-react";

import Layout from "../components/Layout";
import trashService from "../services/trashService";


const Trash = () => {

  const [trash, setTrash] = useState({
    files: [],
    folders: [],
  });

  const [loading, setLoading] = useState(true);

  const [actionLoading, setActionLoading] =
    useState(null);

  const [search, setSearch] = useState("");


  // ==========================================================
  // LOAD TRASH
  // ==========================================================

  const loadTrash = async () => {

    try {

      setLoading(true);

      const data =
        await trashService.getTrash();

      setTrash({
        files: data?.files || [],
        folders: data?.folders || [],
      });

    } catch (error) {

      console.error(
        "Failed to load trash:",
        error
      );

    } finally {

      setLoading(false);

    }
  };


  useEffect(() => {
    loadTrash();
  }, []);


  // ==========================================================
  // RESTORE FILE
  // ==========================================================

  const handleRestoreFile = async (
    fileId
  ) => {

    try {

      setActionLoading(
        `restore-file-${fileId}`
      );

      await trashService.restoreFile(
        fileId
      );

      await loadTrash();

    } catch (error) {

      alert(
        error.message ||
          "Unable to restore file"
      );

    } finally {

      setActionLoading(null);

    }
  };


  // ==========================================================
  // RESTORE FOLDER
  // ==========================================================

  const handleRestoreFolder = async (
    folderId
  ) => {

    try {

      setActionLoading(
        `restore-folder-${folderId}`
      );

      await trashService.restoreFolder(
        folderId
      );

      await loadTrash();

    } catch (error) {

      alert(
        error.message ||
          "Unable to restore folder"
      );

    } finally {

      setActionLoading(null);

    }
  };


  // ==========================================================
  // PERMANENT DELETE FILE
  // ==========================================================

  const handlePermanentFileDelete =
    async (fileId) => {

      const confirmed =
        window.confirm(
          "Permanently delete this file? This action cannot be undone."
        );

      if (!confirmed) {
        return;
      }

      try {

        setActionLoading(
          `delete-file-${fileId}`
        );

        await trashService
          .permanentlyDeleteFile(
            fileId
          );

        await loadTrash();

      } catch (error) {

        alert(
          error.message ||
            "Unable to permanently delete file"
        );

      } finally {

        setActionLoading(null);

      }
    };


  // ==========================================================
  // PERMANENT DELETE FOLDER
  // ==========================================================

  const handlePermanentFolderDelete =
    async (folderId) => {

      const confirmed =
        window.confirm(
          "Permanently delete this folder? This action cannot be undone."
        );

      if (!confirmed) {
        return;
      }

      try {

        setActionLoading(
          `delete-folder-${folderId}`
        );

        await trashService
          .permanentlyDeleteFolder(
            folderId
          );

        await loadTrash();

      } catch (error) {

        alert(
          error.message ||
            "Unable to permanently delete folder"
        );

      } finally {

        setActionLoading(null);

      }
    };


  // ==========================================================
  // EMPTY TRASH
  // ==========================================================

  const handleEmptyTrash = async () => {

    if (
      trash.files.length === 0 &&
      trash.folders.length === 0
    ) {
      return;
    }

    const confirmed =
      window.confirm(
        "Empty Trash permanently? This action cannot be undone."
      );

    if (!confirmed) {
      return;
    }

    try {

      setActionLoading("empty");

      await trashService.emptyTrash();

      await loadTrash();

    } catch (error) {

      alert(
        error.message ||
          "Unable to empty trash"
      );

    } finally {

      setActionLoading(null);

    }
  };


  // ==========================================================
  // FILTER CONTENT
  // ==========================================================

  const filteredFiles =
    trash.files.filter((file) =>
      file.name
        ?.toLowerCase()
        .includes(
          search.toLowerCase()
        )
    );


  const filteredFolders =
    trash.folders.filter((folder) =>
      folder.name
        ?.toLowerCase()
        .includes(
          search.toLowerCase()
        )
    );


  const isEmpty =
    trash.files.length === 0 &&
    trash.folders.length === 0;


  const hasFilteredResults =
    filteredFiles.length > 0 ||
    filteredFolders.length > 0;


  // ==========================================================
  // LOADING
  // ==========================================================

  if (loading) {

    return (
      <Layout
        search={search}
        setSearch={setSearch}
      >

        <div className="flex min-h-[500px] items-center justify-center">

          <div className="flex items-center gap-2 text-gray-500">

            <RefreshCw
              size={18}
              className="animate-spin"
            />

            Loading Trash...

          </div>

        </div>

      </Layout>
    );
  }


  // ==========================================================
  // MAIN UI
  // ==========================================================

  return (

    <Layout
      search={search}
      setSearch={setSearch}
    >

      <div className="h-full overflow-y-auto p-6">

        {/* ==================================================
            HEADER
        ================================================== */}

        <div className="mb-6 flex items-center justify-between">

          <div>

            <div className="flex items-center gap-3">

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gray-100">

                <Trash2
                  size={22}
                  className="text-gray-700"
                />

              </div>

              <div>

                <h1 className="text-2xl font-semibold text-gray-900">
                  Trash
                </h1>

                <p className="text-sm text-gray-500">
                  Files and folders you've moved to Trash
                </p>

              </div>

            </div>

          </div>


          {!isEmpty && (

            <button
              onClick={
                handleEmptyTrash
              }
              disabled={
                actionLoading === "empty"
              }
              className="flex items-center gap-2 rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
            >

              <Trash2 size={16} />

              {actionLoading === "empty"
                ? "Emptying..."
                : "Empty Trash"}

            </button>

          )}

        </div>


        {/* ==================================================
            EMPTY TRASH
        ================================================== */}

        {isEmpty ? (

          <div className="flex min-h-[420px] flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-white">

            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">

              <Trash2
                size={30}
                className="text-gray-400"
              />

            </div>

            <h2 className="text-lg font-semibold text-gray-800">
              Trash is empty
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Deleted files and folders will appear here.
            </p>

          </div>

        ) : !hasFilteredResults ? (

          <div className="flex min-h-[300px] flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-white">

            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">

              <File
                size={26}
                className="text-gray-400"
              />

            </div>

            <h2 className="text-lg font-semibold text-gray-800">
              No matching items
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Try searching with a different name.
            </p>

          </div>

        ) : (

          <div className="space-y-8">


            {/* ==================================================
                FILES
            ================================================== */}

            {filteredFiles.length > 0 && (

              <section>

                <div className="mb-3 flex items-center gap-2">

                  <File
                    size={18}
                    className="text-gray-500"
                  />

                  <h2 className="font-semibold text-gray-800">
                    Files
                  </h2>

                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                    {filteredFiles.length}
                  </span>

                </div>


                <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">

                  {filteredFiles.map(
                    (file) => {

                      const restoring =
                        actionLoading ===
                        `restore-file-${file.id}`;

                      const deleting =
                        actionLoading ===
                        `delete-file-${file.id}`;

                      return (

                        <div
                          key={file.id}
                          className="flex items-center justify-between border-b border-gray-100 px-4 py-4 last:border-b-0"
                        >

                          <div className="flex min-w-0 items-center gap-3">

                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100">

                              <File
                                size={19}
                                className="text-gray-600"
                              />

                            </div>


                            <div className="min-w-0">

                              <p className="truncate font-medium text-gray-800">
                                {file.name}
                              </p>

                              <p className="text-xs text-gray-500">

                                {file.deleted_at
                                  ? `Deleted ${new Date(
                                      file.deleted_at
                                    ).toLocaleString()}`
                                  : "Deleted file"}

                              </p>

                            </div>

                          </div>


                          <div className="ml-4 flex shrink-0 items-center gap-2">

                            <button
                              onClick={() =>
                                handleRestoreFile(
                                  file.id
                                )
                              }
                              disabled={
                                restoring ||
                                deleting
                              }
                              className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100 disabled:opacity-50"
                            >

                              <ArchiveRestore
                                size={16}
                              />

                              {restoring
                                ? "Restoring..."
                                : "Restore"}

                            </button>


                            <button
                              onClick={() =>
                                handlePermanentFileDelete(
                                  file.id
                                )
                              }
                              disabled={
                                restoring ||
                                deleting
                              }
                              className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                            >

                              <Trash2
                                size={16}
                              />

                              {deleting
                                ? "Deleting..."
                                : "Delete permanently"}

                            </button>

                          </div>

                        </div>

                      );

                    }
                  )}

                </div>

              </section>

            )}


            {/* ==================================================
                FOLDERS
            ================================================== */}

            {filteredFolders.length > 0 && (

              <section>

                <div className="mb-3 flex items-center gap-2">

                  <Folder
                    size={18}
                    className="text-gray-500"
                  />

                  <h2 className="font-semibold text-gray-800">
                    Folders
                  </h2>

                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                    {filteredFolders.length}
                  </span>

                </div>


                <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">

                  {filteredFolders.map(
                    (folder) => {

                      const restoring =
                        actionLoading ===
                        `restore-folder-${folder.id}`;

                      const deleting =
                        actionLoading ===
                        `delete-folder-${folder.id}`;

                      return (

                        <div
                          key={folder.id}
                          className="flex items-center justify-between border-b border-gray-100 px-4 py-4 last:border-b-0"
                        >

                          <div className="flex min-w-0 items-center gap-3">

                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100">

                              <Folder
                                size={19}
                                className="text-gray-600"
                              />

                            </div>


                            <div className="min-w-0">

                              <p className="truncate font-medium text-gray-800">
                                {folder.name}
                              </p>

                              <p className="text-xs text-gray-500">

                                {folder.deleted_at
                                  ? `Deleted ${new Date(
                                      folder.deleted_at
                                    ).toLocaleString()}`
                                  : "Deleted folder"}

                              </p>

                            </div>

                          </div>


                          <div className="ml-4 flex shrink-0 items-center gap-2">

                            <button
                              onClick={() =>
                                handleRestoreFolder(
                                  folder.id
                                )
                              }
                              disabled={
                                restoring ||
                                deleting
                              }
                              className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100 disabled:opacity-50"
                            >

                              <ArchiveRestore
                                size={16}
                              />

                              {restoring
                                ? "Restoring..."
                                : "Restore"}

                            </button>


                            <button
                              onClick={() =>
                                handlePermanentFolderDelete(
                                  folder.id
                                )
                              }
                              disabled={
                                restoring ||
                                deleting
                              }
                              className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                            >

                              <Trash2
                                size={16}
                              />

                              {deleting
                                ? "Deleting..."
                                : "Delete permanently"}

                            </button>

                          </div>

                        </div>

                      );

                    }
                  )}

                </div>

              </section>

            )}

          </div>

        )}

      </div>

    </Layout>
  );
};


export default Trash;