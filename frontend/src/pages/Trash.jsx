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
    <Layout search={search} setSearch={setSearch}>
      <div className="min-h-full overflow-y-auto bg-slate-50 p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
                  <Trash2 size={21} className="text-slate-700" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                    Storage
                  </p>
                  <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                    Trash
                  </h1>
                </div>
              </div>
              <p className="max-w-xl text-sm text-slate-500">
                Manage deleted files and folders. Restore them or permanently
                remove them from your storage.
              </p>
            </div>

            {!isEmpty && (
              <button
                onClick={handleEmptyTrash}
                disabled={actionLoading === "empty"}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-red-700 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-red-500/30 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Trash2 size={16} />
                {actionLoading === "empty" ? "Emptying..." : "Empty Trash"}
              </button>
            )}
          </div>

          {!isEmpty && (
            <div className="mb-7 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                      Deleted files
                    </p>
                    <p className="mt-1 text-2xl font-bold text-slate-900">
                      {trash.files.length}
                    </p>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">
                    <File size={18} className="text-slate-600" />
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                      Deleted folders
                    </p>
                    <p className="mt-1 text-2xl font-bold text-slate-900">
                      {trash.folders.length}
                    </p>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">
                    <Folder size={18} className="text-slate-600" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {isEmpty ? (
            <div className="flex min-h-[430px] flex-col items-center justify-center rounded-3xl border border-slate-200 bg-white px-6 text-center shadow-sm">
              <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-slate-100">
                <Trash2 size={34} className="text-slate-400" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">
                Your Trash is empty
              </h2>
              <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                Deleted files and folders will appear here, where you can
                restore them or permanently delete them.
              </p>
            </div>
          ) : !hasFilteredResults ? (
            <div className="flex min-h-[320px] flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white px-6 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
                <File size={28} className="text-slate-400" />
              </div>
              <h2 className="text-lg font-bold text-slate-900">
                No matching items
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Try searching with a different name.
              </p>
            </div>
          ) : (
            <div className="space-y-7">
              {filteredFiles.length > 0 && (
                <section>
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
                        <File size={17} className="text-slate-600" />
                      </div>
                      <div>
                        <h2 className="text-sm font-bold text-slate-900">
                          Files
                        </h2>
                        <p className="text-xs text-slate-400">Deleted files</p>
                      </div>
                    </div>
                    <span className="rounded-full bg-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-600">
                      {filteredFiles.length}
                    </span>
                  </div>

                  <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    {filteredFiles.map((file) => {
                      const restoring =
                        actionLoading === `restore-file-${file.id}`;
                      const deleting =
                        actionLoading === `delete-file-${file.id}`;

                      return (
                        <div
                          key={file.id}
                          className="group flex flex-col gap-4 border-b border-slate-100 p-4 transition hover:bg-slate-50/80 last:border-b-0 sm:flex-row sm:items-center sm:justify-between sm:px-5"
                        >
                          <div className="flex min-w-0 items-center gap-3.5">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 transition group-hover:bg-white group-hover:shadow-sm">
                              <File size={19} className="text-slate-600" />
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-slate-800">
                                {file.name}
                              </p>
                              <p className="mt-1 truncate text-xs text-slate-400">
                                {file.deleted_at
                                  ? `Deleted ${new Date(file.deleted_at).toLocaleString()}`
                                  : "Deleted file"}
                              </p>
                            </div>
                          </div>

                          <div className="flex shrink-0 items-center gap-2 sm:ml-4">
                            <button
                              onClick={() => handleRestoreFile(file.id)}
                              disabled={restoring || deleting}
                              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-300/40 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <ArchiveRestore size={16} />
                              {restoring ? "Restoring..." : "Restore"}
                            </button>

                            <button
                              onClick={() => handlePermanentFileDelete(file.id)}
                              disabled={restoring || deleting}
                              className="inline-flex items-center justify-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <Trash2 size={16} />
                              {deleting ? "Deleting..." : "Delete permanently"}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}

              {filteredFolders.length > 0 && (
                <section>
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
                        <Folder size={17} className="text-slate-600" />
                      </div>
                      <div>
                        <h2 className="text-sm font-bold text-slate-900">
                          Folders
                        </h2>
                        <p className="text-xs text-slate-400">
                          Deleted folders
                        </p>
                      </div>
                    </div>
                    <span className="rounded-full bg-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-600">
                      {filteredFolders.length}
                    </span>
                  </div>

                  <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    {filteredFolders.map((folder) => {
                      const restoring =
                        actionLoading === `restore-folder-${folder.id}`;
                      const deleting =
                        actionLoading === `delete-folder-${folder.id}`;

                      return (
                        <div
                          key={folder.id}
                          className="group flex flex-col gap-4 border-b border-slate-100 p-4 transition hover:bg-slate-50/80 last:border-b-0 sm:flex-row sm:items-center sm:justify-between sm:px-5"
                        >
                          <div className="flex min-w-0 items-center gap-3.5">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 transition group-hover:bg-white group-hover:shadow-sm">
                              <Folder size={19} className="text-slate-600" />
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-slate-800">
                                {folder.name}
                              </p>
                              <p className="mt-1 truncate text-xs text-slate-400">
                                {folder.deleted_at
                                  ? `Deleted ${new Date(folder.deleted_at).toLocaleString()}`
                                  : "Deleted folder"}
                              </p>
                            </div>
                          </div>

                          <div className="flex shrink-0 items-center gap-2 sm:ml-4">
                            <button
                              onClick={() => handleRestoreFolder(folder.id)}
                              disabled={restoring || deleting}
                              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-300/40 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <ArchiveRestore size={16} />
                              {restoring ? "Restoring..." : "Restore"}
                            </button>

                            <button
                              onClick={() =>
                                handlePermanentFolderDelete(folder.id)
                              }
                              disabled={restoring || deleting}
                              className="inline-flex items-center justify-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <Trash2 size={16} />
                              {deleting ? "Deleting..." : "Delete permanently"}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}


export default Trash;