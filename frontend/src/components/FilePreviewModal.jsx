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
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">

      <div className="flex h-full max-h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">


        {/* ==================================================
            HEADER
            ================================================== */}

        <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-5 py-4">

          <div className="flex min-w-0 items-center gap-3">

            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">

              {fileType === "text" ? (
                <FileText size={20} />
              ) : (
                <File size={20} />
              )}

            </div>


            <div className="min-w-0">

              <h2
                className="truncate font-semibold text-slate-900"
                title={file.name}
              >
                {file.name}
              </h2>

              <p className="text-xs text-slate-400">
                {file.mime_type ||
                  "Unknown file type"}
              </p>

            </div>

          </div>


          <div className="flex items-center gap-2">

            <button
              onClick={() =>
                onDownload?.(file)
              }
              className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              <Download size={16} />
              Download
            </button>


            <button
              onClick={onClose}
              className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              title="Close"
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
            <div className="flex min-h-full items-center justify-center">

              <div className="text-center">

                <Loader2
                  size={32}
                  className="mx-auto animate-spin text-slate-500"
                />

                <p className="mt-3 text-sm text-slate-500">
                  Loading preview...
                </p>

              </div>

            </div>
          )}


          {/* IMAGE */}

          {!loading &&
            previewUrl &&
            fileType ===
              "image" && (
              <div className="flex min-h-full items-center justify-center p-6">

                <img
                  src={previewUrl}
                  alt={file.name}
                  className="max-h-[75vh] max-w-full rounded-xl object-contain shadow-lg"
                />

              </div>
            )}


          {/* PDF */}

          {!loading &&
            previewUrl &&
            fileType ===
              "pdf" && (
              <iframe
                src={previewUrl}
                title={file.name}
                className="h-full min-h-[70vh] w-full border-0"
              />
            )}


          {/* VIDEO */}

          {!loading &&
            previewUrl &&
            fileType ===
              "video" && (
              <div className="flex min-h-full items-center justify-center p-6">

                <video
                  src={previewUrl}
                  controls
                  className="max-h-[75vh] max-w-full rounded-xl shadow-lg"
                />

              </div>
            )}


          {/* AUDIO */}

          {!loading &&
            previewUrl &&
            fileType ===
              "audio" && (
              <div className="flex min-h-full items-center justify-center p-6">

                <div className="w-full max-w-xl rounded-2xl bg-white p-8 shadow-lg">

                  <div className="mb-6 text-center">

                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">

                      <File
                        size={30}
                        className="text-slate-600"
                      />

                    </div>

                    <h3 className="font-semibold text-slate-800">
                      {file.name}
                    </h3>

                  </div>


                  <audio
                    src={previewUrl}
                    controls
                    className="w-full"
                  />

                </div>

              </div>
            )}


          {/* TEXT */}

          {!loading &&
            fileType ===
              "text" && (
              <div className="p-6">

                <div className="mx-auto max-w-5xl overflow-hidden rounded-2xl bg-slate-950 shadow-lg">

                  {textLoading ? (
                    <div className="p-8 text-center text-sm text-slate-400">
                      Loading text...
                    </div>
                  ) : (
                    <pre className="max-h-[75vh] overflow-auto whitespace-pre-wrap break-words p-6 text-sm leading-6 text-slate-200">
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
              <div className="flex min-h-full items-center justify-center p-6">

                <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-lg">

                  <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">

                    <File
                      size={30}
                      className="text-slate-500"
                    />

                  </div>


                  <h3 className="text-lg font-semibold text-slate-800">
                    Preview unavailable
                  </h3>


                  <p className="mt-2 text-sm leading-6 text-slate-500">
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
                    className="mt-6 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
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