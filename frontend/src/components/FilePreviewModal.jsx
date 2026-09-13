import {
  X,
  Download,
  FileText,
  File,
  Loader2,
} from "lucide-react";

import {
  useEffect,
  useState,
} from "react";


const getFileType = (
  mimeType = ""
) => {

  if (
    mimeType.startsWith(
      "image/"
    )
  ) {
    return "image";
  }


  if (
    mimeType ===
    "application/pdf"
  ) {
    return "pdf";
  }


  if (
    mimeType.startsWith(
      "video/"
    )
  ) {
    return "video";
  }


  if (
    mimeType.startsWith(
      "audio/"
    )
  ) {
    return "audio";
  }


  if (
    mimeType.startsWith(
      "text/"
    ) ||
    mimeType ===
      "application/json" ||
    mimeType ===
      "application/javascript" ||
    mimeType ===
      "application/xml" ||
    mimeType ===
      "text/csv"
  ) {
    return "text";
  }


  return "unsupported";
};


const FilePreviewModal = ({
  file,
  previewUrl,
  loading,
  onClose,
  onDownload,
}) => {

  const [textContent, setTextContent] =
    useState("");


  const [textLoading, setTextLoading] =
    useState(false);


  const fileType =
    getFileType(
      file?.mime_type
    );


  // ==========================================================
  // LOAD TEXT CONTENT
  // ==========================================================

  useEffect(() => {

    if (
      !file ||
      fileType !== "text" ||
      !previewUrl
    ) {
      setTextContent("");
      return;
    }


    let cancelled = false;


    const loadText = async () => {

      setTextLoading(true);


      try {

        const response =
          await fetch(
            previewUrl
          );


        if (!response.ok) {
          throw new Error(
            "Unable to read file"
          );
        }


        const text =
          await response.text();


        if (!cancelled) {
          setTextContent(
            text
          );
        }

      } catch {

        if (!cancelled) {
          setTextContent(
            "Unable to display this text file."
          );
        }

      } finally {

        if (!cancelled) {
          setTextLoading(false);
        }

      }
    };


    loadText();


    return () => {
      cancelled = true;
    };

  }, [
    file,
    fileType,
    previewUrl,
  ]);


  if (!file) {
    return null;
  }


  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/80 p-3 backdrop-blur-md sm:p-5">

      <div className="flex h-full max-h-[94vh] w-full max-w-7xl flex-col overflow-hidden rounded-3xl border border-white/10 bg-white shadow-2xl">


        {/* ==================================================
            HEADER
            ================================================== */}

        <div className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 py-3.5 sm:px-6 sm:py-4">

          <div className="flex min-w-0 items-center gap-3">

            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 ring-1 ring-slate-200">

              {fileType === "text" ? (
                <FileText
                  size={20}
                  className="text-slate-600"
                />
              ) : (
                <File
                  size={20}
                  className="text-slate-600"
                />
              )}

            </div>


            <div className="min-w-0">

              <h2
                className="truncate text-sm font-bold text-slate-900 sm:text-base"
                title={file.name}
              >
                {file.name}
              </h2>

              <p className="mt-0.5 truncate text-xs text-slate-400">
                {file.mime_type ||
                  "Unknown file type"}
              </p>

            </div>

          </div>


          <div className="ml-3 flex shrink-0 items-center gap-2">

            <button
              onClick={() =>
                onDownload?.(file)
              }
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50 hover:shadow focus:outline-none focus:ring-2 focus:ring-slate-300/50"
            >
              <Download size={16} />
              <span className="hidden sm:inline">
                Download
              </span>
            </button>


            <button
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-300/50"
              title="Close"
              aria-label="Close preview"
            >
              <X size={20} />
            </button>

          </div>

        </div>


        {/* ==================================================
            CONTENT
            ================================================== */}

        <div className="min-h-0 flex-1 overflow-auto bg-slate-100">


          {/* LOADING */}

          {loading && (
            <div className="flex min-h-full items-center justify-center p-6">

              <div className="flex flex-col items-center">

                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">

                  <Loader2
                    size={25}
                    className="animate-spin text-slate-500"
                  />

                </div>

                <p className="mt-4 text-sm font-medium text-slate-500">
                  Loading preview...
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  Preparing your file
                </p>

              </div>

            </div>
          )}


          {/* IMAGE */}

          {!loading &&
            previewUrl &&
            fileType ===
              "image" && (
              <div className="flex min-h-full items-center justify-center bg-slate-950/95 p-4 sm:p-8">

                <div className="relative flex max-h-full max-w-full items-center justify-center">

                  <img
                    src={previewUrl}
                    alt={file.name}
                    className="max-h-[78vh] max-w-full rounded-2xl object-contain shadow-2xl ring-1 ring-white/10"
                  />

                </div>

              </div>
            )}


          {/* PDF */}

          {!loading &&
            previewUrl &&
            fileType ===
              "pdf" && (
              <div className="h-full bg-slate-200 p-2 sm:p-4">

                <div className="h-full overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">

                  <iframe
                    src={previewUrl}
                    title={file.name}
                    className="h-full min-h-[70vh] w-full border-0"
                  />

                </div>

              </div>
            )}


          {/* VIDEO */}

          {!loading &&
            previewUrl &&
            fileType ===
              "video" && (
              <div className="flex min-h-full items-center justify-center bg-slate-950/95 p-4 sm:p-8">

                <video
                  src={previewUrl}
                  controls
                  className="max-h-[78vh] max-w-full rounded-2xl shadow-2xl ring-1 ring-white/10"
                />

              </div>
            )}


          {/* AUDIO */}

          {!loading &&
            previewUrl &&
            fileType ===
              "audio" && (
              <div className="flex min-h-full items-center justify-center bg-gradient-to-br from-slate-100 via-slate-50 to-indigo-50 p-5 sm:p-8">

                <div className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-7 shadow-xl shadow-slate-200/60 sm:p-10">

                  <div className="mb-8 text-center">

                    <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-slate-900 text-white shadow-lg shadow-slate-900/20">

                      <File
                        size={32}
                      />

                    </div>

                    <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-indigo-600">
                      Audio file
                    </p>

                    <h3 className="break-words text-lg font-bold text-slate-900">
                      {file.name}
                    </h3>

                    <p className="mt-1 text-sm text-slate-400">
                      {file.mime_type ||
                        "Audio"}
                    </p>

                  </div>


                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">

                    <audio
                      src={previewUrl}
                      controls
                      className="w-full"
                    />

                  </div>

                </div>

              </div>
            )}


          {/* TEXT */}

          {!loading &&
            fileType ===
              "text" && (
              <div className="min-h-full p-4 sm:p-6">

                <div className="mx-auto max-w-6xl overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 shadow-xl">

                  <div className="flex items-center justify-between border-b border-white/10 bg-slate-900 px-4 py-3">

                    <div className="flex items-center gap-2">

                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10">

                        <FileText
                          size={14}
                          className="text-slate-300"
                        />

                      </div>

                      <span className="text-xs font-medium text-slate-300">
                        {file.name}
                      </span>

                    </div>

                    <span className="text-[11px] text-slate-500">
                      {file.mime_type ||
                        "Text"}
                    </span>

                  </div>


                  {textLoading ? (
                    <div className="flex min-h-[300px] items-center justify-center p-8 text-sm text-slate-400">

                      <div className="flex items-center gap-2">

                        <Loader2
                          size={17}
                          className="animate-spin"
                        />

                        Loading text...

                      </div>

                    </div>
                  ) : (
                    <pre className="max-h-[75vh] overflow-auto whitespace-pre-wrap break-words p-5 text-sm leading-6 text-slate-200 sm:p-6">
                      {textContent}
                    </pre>
                  )}

                </div>

              </div>
            )}


          {/* UNSUPPORTED */}

          {!loading &&
            fileType ===
              "unsupported" && (
              <div className="flex min-h-full items-center justify-center bg-slate-50 p-6">

                <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-xl shadow-slate-200/50 sm:p-10">

                  <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-slate-100 ring-1 ring-slate-200">

                    <File
                      size={32}
                      className="text-slate-500"
                    />

                  </div>


                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                    File preview
                  </p>


                  <h3 className="break-words text-xl font-bold text-slate-900">
                    Preview unavailable
                  </h3>


                  <p className="mt-3 text-sm leading-6 text-slate-500">
                    This file type cannot be
                    previewed directly in the
                    browser.
                  </p>


                  <button
                    onClick={() =>
                      onDownload?.(
                        file
                      )
                    }
                    className="mt-7 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-900/10 transition hover:-translate-y-0.5 hover:bg-indigo-600 hover:shadow-indigo-600/20 focus:outline-none focus:ring-4 focus:ring-indigo-500/20"
                  >
                    <Download size={17} />
                    Download file
                  </button>

                </div>

              </div>
            )}

        </div>

      </div>

    </div>
  );
};


export default FilePreviewModal;