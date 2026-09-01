import {
  useEffect,
  useState,
} from "react";

import {
  File,
  FileText,
  Image,
  Video,
  Music,
  Loader2,
  Download,
  Eye,
  Folder,
} from "lucide-react";

import shareService from "../services/shareService";
import api from "../services/api";


const getFileIcon = (mimeType) => {
  if (mimeType?.startsWith("image/")) {
    return Image;
  }

  if (mimeType?.startsWith("video/")) {
    return Video;
  }

  if (mimeType?.startsWith("audio/")) {
    return Music;
  }

  if (
    mimeType?.includes("pdf") ||
    mimeType?.includes("text")
  ) {
    return FileText;
  }

  return File;
};


const formatSize = (size) => {
  if (!size) {
    return "0 B";
  }

  const units = [
    "B",
    "KB",
    "MB",
    "GB",
  ];

  let value = size;
  let unitIndex = 0;

  while (
    value >= 1024 &&
    unitIndex < units.length - 1
  ) {
    value /= 1024;
    unitIndex++;
  }

  return `${value.toFixed(
    value >= 10 || unitIndex === 0
      ? 0
      : 1
  )} ${units[unitIndex]}`;
};


const Shared = () => {

  const [files, setFiles] =
    useState([]);

  const [folders, setFolders] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [viewingFile, setViewingFile] =
    useState(null);


  // ==========================================================
  // LOAD SHARED CONTENT
  // ==========================================================

  useEffect(() => {

    const loadSharedContent =
      async () => {

        setLoading(true);
        setError("");


        try {

          const [
            sharedFiles,
            sharedFolders,
          ] = await Promise.all([
            shareService.getSharedFiles(),
            shareService.getSharedFolders(),
          ]);


          setFiles(
            Array.isArray(
              sharedFiles
            )
              ? sharedFiles
              : []
          );


          setFolders(
            Array.isArray(
              sharedFolders
            )
              ? sharedFolders
              : []
          );

        } catch (err) {

          setError(
            err.message ||
              "Unable to load shared files"
          );

        } finally {

          setLoading(false);

        }
      };


    loadSharedContent();

  }, []);


  // ==========================================================
  // VIEW FILE
  // ==========================================================

  const handleView = async (
    file
  ) => {

    try {

      const blob =
        await api.getBlob(
          `/files/${encodeURIComponent(
            file.file_id
          )}/content`
        );


      const url =
        URL.createObjectURL(
          blob
        );


      window.open(
        url,
        "_blank",
        "noopener,noreferrer"
      );


      setTimeout(() => {
        URL.revokeObjectURL(
          url
        );
      }, 60000);

    } catch (err) {

      setError(
        err.message ||
          "Unable to view file"
      );

    }
  };


  // ==========================================================
  // DOWNLOAD FILE
  // ==========================================================

  const handleDownload = async (
    file
  ) => {

    try {

      const blob =
        await api.getBlob(
          `/files/${encodeURIComponent(
            file.file_id
          )}/content`
        );


      const url =
        URL.createObjectURL(
          blob
        );


      const link =
        document.createElement(
          "a"
        );

      link.href = url;

      link.download =
        file.original_name ||
        file.file_name ||
        "download";

      document.body.appendChild(
        link
      );

      link.click();

      link.remove();


      setTimeout(() => {
        URL.revokeObjectURL(
          url
        );
      }, 1000);

    } catch (err) {

      setError(
        err.message ||
          "Unable to download file"
      );

    }
  };


  // ==========================================================
  // LOADING
  // ==========================================================

  if (loading) {

    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">

        <div className="flex items-center gap-3 text-slate-500">

          <Loader2
            size={22}
            className="animate-spin"
          />

          Loading shared files...

        </div>

      </div>
    );
  }


  return (
    <div className="min-h-screen bg-slate-50">

      {/* ====================================================
          HEADER
          ==================================================== */}

      <header className="border-b border-slate-200 bg-white">

        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">

          <div>

            <h1 className="text-2xl font-bold text-slate-900">
              Shared with me
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Files and folders shared with you
            </p>

          </div>

        </div>

      </header>


      {/* ====================================================
          CONTENT
          ==================================================== */}

      <main className="mx-auto max-w-7xl px-6 py-8">

        {error && (
          <div className="mb-6 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}


        {/* ==================================================
            FOLDERS
            ================================================== */}

        {folders.length > 0 && (

          <section className="mb-10">

            <div className="mb-4 flex items-center justify-between">

              <h2 className="text-lg font-semibold text-slate-900">
                Shared folders
              </h2>

              <span className="text-sm text-slate-400">
                {folders.length}
              </span>

            </div>


            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">

              {folders.map(
                (folder) => (

                  <div
                    key={
                      folder.share_id
                    }
                    className="rounded-2xl border border-slate-200 bg-white p-4 transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
                  >

                    <div className="flex items-center gap-3">

                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-700">

                        <Folder
                          size={22}
                        />

                      </div>


                      <div className="min-w-0 flex-1">

                        <p
                          className="truncate font-semibold text-slate-800"
                          title={
                            folder.folder_name
                          }
                        >
                          {
                            folder.folder_name
                          }
                        </p>


                        <p className="mt-1 text-xs capitalize text-slate-400">
                          {
                            folder.role
                          }
                        </p>

                      </div>

                    </div>

                  </div>

                )
              )}

            </div>

          </section>
        )}


        {/* ==================================================
            FILES
            ================================================== */}

        <section>

          <div className="mb-4 flex items-center justify-between">

            <h2 className="text-lg font-semibold text-slate-900">
              Shared files
            </h2>

            <span className="text-sm text-slate-400">
              {files.length}
            </span>

          </div>


          {files.length === 0 ? (

            <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-16 text-center">

              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">

                <File
                  size={24}
                  className="text-slate-400"
                />

              </div>


              <h3 className="mt-4 font-semibold text-slate-700">
                Nothing shared with you yet
              </h3>


              <p className="mt-1 text-sm text-slate-400">
                Files shared with your account
                will appear here.
              </p>

            </div>

          ) : (

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">

              {files.map(
                (file) => {

                  const Icon =
                    getFileIcon(
                      file.mime_type
                    );


                  return (
                    <div
                      key={
                        file.share_id
                      }
                      className="rounded-2xl border border-slate-200 bg-white p-4 transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
                    >

                      {/* FILE ICON */}

                      <div className="flex items-start justify-between">

                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-700">

                          <Icon
                            size={24}
                          />

                        </div>


                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium capitalize text-slate-500">
                          {
                            file.role
                          }
                        </span>

                      </div>


                      {/* FILE INFO */}

                      <div className="mt-4">

                        <p
                          className="truncate font-semibold text-slate-800"
                          title={
                            file.file_name
                          }
                        >
                          {
                            file.file_name
                          }
                        </p>


                        <p className="mt-1 text-xs text-slate-400">
                          {
                            formatSize(
                              file.size
                            )
                          }
                        </p>

                      </div>


                      {/* ACTIONS */}

                      <div className="mt-4 flex gap-2">

                        <button
                          onClick={() =>
                            handleView(
                              file
                            )
                          }
                          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-200"
                        >

                          <Eye
                            size={15}
                          />

                          View

                        </button>


                        <button
                          onClick={() =>
                            handleDownload(
                              file
                            )
                          }
                          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-800"
                        >

                          <Download
                            size={15}
                          />

                          Download

                        </button>

                      </div>

                    </div>
                  );
                }
              )}

            </div>

          )}

        </section>

      </main>

    </div>
  );
};


export default Shared;