import {
  Download,
  File,
  FileText,
  Image,
  Video,
  Music,
  Lock,
  AlertCircle,
  Loader2,
  Pencil,
  Save,
  X,
  Check,
} from "lucide-react";



import {
  useParams,
  useNavigate,
} from "react-router-dom";

import publicLinkService from "../services/publicLinkService";

import React, {
  useEffect,
  useRef,
  useState,
} from "react";

// ============================================================
// FORMAT FILE SIZE
// ============================================================

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


// ============================================================
// FILE ICON
// ============================================================

const getFileIcon = (mimeType) => {
  if (
    mimeType?.startsWith("image/")
  ) {
    return Image;
  }

  if (
    mimeType?.startsWith("video/")
  ) {
    return Video;
  }

  if (
    mimeType?.startsWith("audio/")
  ) {
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


// ============================================================
// BROWSER-EDITABLE FILE TYPES
// ============================================================

const isEditableMimeType = (
  mimeType = "",
  fileName = ""
) => {
  const mime = mimeType
    .toLowerCase()
    .split(";")[0];

  if (
    mime.startsWith("text/") ||
    [
      "application/json",
      "application/javascript",
      "application/xml",
      "application/x-javascript",
    ].includes(mime)
  ) {
    return true;
  }

  const extension = fileName
    .toLowerCase()
    .split(".")
    .pop();

  return [
    "txt",
    "md",
    "html",
    "htm",
    "css",
    "js",
    "jsx",
    "ts",
    "tsx",
    "json",
    "xml",
    "csv",
    "py",
    "java",
    "c",
    "cpp",
    "h",
    "hpp",
    "php",
    "sql",
    "sh",
    "yml",
    "yaml",
  ].includes(extension);
};


// ============================================================
// PUBLIC FILE
// ============================================================

const PublicFile = () => {

  const { token } =
    useParams();

  const navigate =
    useNavigate();


  // ==========================================================
  // STATE
  // ==========================================================

  const [file, setFile] =
    useState(null);

  const [password, setPassword] =
    useState("");
  const passwordRef =
  useRef("");
  const [requiresPassword, setRequiresPassword] =
    useState(false);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [passwordError, setPasswordError] =
    useState("");

  const [editorOpen, setEditorOpen] =
    useState(false);

  const [editorLoading, setEditorLoading] =
    useState(false);

  const [editorSaving, setEditorSaving] =
    useState(false);

  const [editorContent, setEditorContent] =
    useState("");

  const [editorError, setEditorError] =
    useState("");

  const [editorSaved, setEditorSaved] =
    useState(false);


  // ==========================================================
  // ACCESS PUBLIC LINK
  // ==========================================================

const loadPublicFile = async (
  providedPassword = null
) => {

  setLoading(true);

  setError("");

  setPasswordError("");


  // ==========================================================
  // KEEP PASSWORD IN BOTH STATE AND REF
  // ==========================================================

  if (providedPassword) {

    passwordRef.current =
      providedPassword;

    setPassword(
      providedPassword
    );
  }


  try {

    const data =
      await publicLinkService.accessLink(
        token,
        providedPassword
      );


    // ========================================================
    // PUBLIC FOLDER
    // ========================================================

    if (
      data?.type === "folder"
    ) {

      navigate(
        `/public/${token}/folder`,
        {
          replace: true,
        }
      );

      return;
    }


    // ========================================================
    // PUBLIC FILE
    // ========================================================

    setFile(data);

    setRequiresPassword(false);

  } catch (err) {

    console.log(
      "PUBLIC LINK ERROR:",
      err.status,
      err.message,
      err.data
    );


    // ========================================================
    // PASSWORD REQUIRED / INVALID PASSWORD
    // ========================================================

    if (
      err.status === 401
    ) {

      if (!providedPassword) {

        setRequiresPassword(
          true
        );

        return;
      }


      setPasswordError(
        err.message ||
          "Invalid password"
      );

      setRequiresPassword(
        true
      );

      return;
    }


    // ========================================================
    // EXPIRED
    // ========================================================

    if (
      err.status === 410
    ) {

      setError(
        "This public link has expired."
      );

      return;
    }


    // ========================================================
    // NOT FOUND
    // ========================================================

    if (
      err.status === 404
    ) {

      setError(
        err.message ||
          "This public link is no longer available."
      );

      return;
    }


    setError(
      err.message ||
        "Unable to access this file"
    );

  } finally {

    setLoading(false);

  }
};


  // ==========================================================
  // INITIAL LOAD
  // ==========================================================

  useEffect(() => {

    if (token) {
      loadPublicFile();
    }

  }, [token]);


  // ==========================================================
  // PASSWORD SUBMIT
  // ==========================================================

const handlePasswordSubmit = async (
  event
) => {

  event.preventDefault();


  if (!password.trim()) {

    setPasswordError(
      "Please enter the password"
    );

    return;
  }


  passwordRef.current =
    password;


  await loadPublicFile(
    password
  );
};


  // ==========================================================
  // PUBLIC PERMISSION
  // ==========================================================

  const permission =
    file?.permission || "viewer";

  const isViewer =
    permission === "viewer";

  const isEditor =
    permission === "editor";


  // ==========================================================
  // PUBLIC EDITOR
  // ==========================================================

  const canEditFile =
    isEditor &&
    isEditableMimeType(
      file?.mime_type,
      file?.name
    );


  const openEditor = async () => {
    if (!canEditFile || !file?.id) {
      return;
    }

    setEditorOpen(true);
    setEditorLoading(true);
    setEditorError("");
    setEditorSaved(false);

    try {
      const data =
        await publicLinkService.getPublicFileContent(
          token,
          file.id,
          passwordRef.current || null
        );

      setEditorContent(
        data?.content ?? ""
      );
    } catch (err) {
      setEditorError(
        err?.message ||
          "Unable to load file content."
      );
    } finally {
      setEditorLoading(false);
    }
  };


  const closeEditor = () => {
    if (editorSaving) {
      return;
    }

    setEditorOpen(false);
    setEditorError("");
    setEditorSaved(false);
  };


  const saveEditor = async () => {
    if (!canEditFile || !file?.id) {
      return;
    }

    setEditorSaving(true);
    setEditorError("");
    setEditorSaved(false);

    try {
      const data =
        await publicLinkService.updatePublicFileContent(
          token,
          file.id,
          editorContent,
         passwordRef.current || null
        );

      setFile((current) => ({
        ...current,
        size:
          data?.size ??
          new Blob([
            editorContent,
          ]).size,
      }));

      setEditorSaved(true);
    } catch (err) {
      setEditorError(
        err?.message ||
          "Unable to save file."
      );
    } finally {
      setEditorSaving(false);
    }
  };


  // ==========================================================
  // DOWNLOAD
  // ==========================================================

  const handleDownload = () => {

    if (
      !file?.download_url
    ) {
      return;
    }


    window.open(
      file.download_url,
      "_blank",
      "noopener,noreferrer"
    );
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

          <span className="text-sm">
            Loading file...
          </span>

        </div>

      </div>
    );
  }


  // ==========================================================
  // PASSWORD SCREEN
  // ==========================================================

  if (requiresPassword) {

    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">

        <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-xl">

          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">

            <Lock size={25} />

          </div>


          <div className="mt-5 text-center">

            <h1 className="text-xl font-bold text-slate-900">
              Password protected
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              This file is protected by a password.
              Enter it to continue.
            </p>

          </div>


          <form
            onSubmit={
              handlePasswordSubmit
            }
            className="mt-6 space-y-4"
          >

            <input
              type="password"
              value={password}
              onChange={(event) =>
                setPassword(
                  event.target.value
                )
              }
              placeholder="Enter password"
              autoFocus
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
            />


            {passwordError && (
              <p className="text-sm text-red-500">
                {passwordError}
              </p>
            )}


            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center rounded-xl bg-slate-900 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Access file
            </button>

          </form>

        </div>

      </div>
    );
  }


  // ==========================================================
  // ERROR SCREEN
  // ==========================================================

  if (error) {

    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">

        <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-xl">

          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-500">

            <AlertCircle
              size={26}
            />

          </div>


          <h1 className="mt-5 text-xl font-bold text-slate-900">
            Unable to access file
          </h1>


          <p className="mt-2 text-sm text-slate-500">
            {error}
          </p>


          <button
            onClick={() =>
              navigate("/")
            }
            className="mt-6 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Go home
          </button>

        </div>

      </div>
    );
  }


  // ==========================================================
  // SAFETY CHECK
  // ==========================================================

  if (!file) {
    return null;
  }


  // ==========================================================
  // FILE TYPE
  // ==========================================================

  const Icon =
    getFileIcon(
      file.mime_type
    );


  const isImage =
    file.mime_type?.startsWith(
      "image/"
    );


  const isVideo =
    file.mime_type?.startsWith(
      "video/"
    );


  const isAudio =
    file.mime_type?.startsWith(
      "audio/"
    );


  const isPdf =
    file.mime_type?.includes(
      "pdf"
    );


  // ==========================================================
  // FILE VIEW
  // ==========================================================

  return (
    <div className="min-h-screen bg-slate-50">

      {/* ====================================================
          HEADER
      ==================================================== */}

      <header className="border-b border-slate-200 bg-white">

        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">

          {/* FILE INFO */}

          <div className="flex min-w-0 items-center gap-3">

            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700">

              <Icon size={20} />

            </div>


            <div className="min-w-0">

              <h1
                title={file.name}
                className="truncate font-semibold text-slate-900"
              >
                {file.name}
              </h1>

              <div className="flex items-center gap-2">

                <p className="text-xs text-slate-400">
                  {formatSize(file.size)}
                </p>

                <span className="text-slate-300">
                  •
                </span>

                <span
                  className={`text-xs font-medium ${
                    isEditor
                      ? "text-slate-700"
                      : "text-slate-400"
                  }`}
                >
                  {isEditor
                    ? "Editor access"
                    : "View only"}
                </span>

              </div>

            </div>

          </div>


          {/* ACTIONS */}

          <div className="flex items-center gap-2">

            {isEditor && (
              <button
                type="button"
                onClick={openEditor}
                disabled={!canEditFile}
                title={
                  canEditFile
                    ? "Edit file"
                    : "This file type cannot be edited in the browser"
                }
                className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Pencil size={15} />
                Edit
              </button>
            )}


            {/* DOWNLOAD */}

            <button
              type="button"
              onClick={
                handleDownload
              }
              className="flex shrink-0 items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
            >

              <Download size={17} />

              Download

            </button>

          </div>

        </div>

      </header>


      {editorOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4 sm:p-6">
          <div className="flex h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-5 py-4">
              <div className="min-w-0">
                <h2 className="truncate text-base font-semibold text-slate-900">
                  Edit {file.name}
                </h2>

                <p className="mt-1 text-xs text-slate-400">
                  Editor access • Changes are saved to the shared file
                </p>
              </div>

              <div className="flex items-center gap-2">
                {editorSaved && (
                  <span className="hidden items-center gap-1 text-xs font-medium text-emerald-600 sm:flex">
                    <Check size={14} />
                    Saved
                  </span>
                )}

                <button
                  type="button"
                  onClick={closeEditor}
                  disabled={editorSaving}
                  className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {editorLoading ? (
              <div className="flex flex-1 items-center justify-center text-slate-500">
                <div className="flex items-center gap-3">
                  <Loader2
                    size={20}
                    className="animate-spin"
                  />
                  Loading file content...
                </div>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-hidden bg-slate-950 p-3 sm:p-5">
                  <textarea
                    value={editorContent}
                    onChange={(event) => {
                      setEditorContent(
                        event.target.value
                      );
                      setEditorSaved(false);
                    }}
                    spellCheck={false}
                    className="h-full w-full resize-none rounded-xl border border-slate-700 bg-slate-900 p-5 font-mono text-sm leading-6 text-slate-100 outline-none focus:border-slate-500"
                  />
                </div>

                {editorError && (
                  <div className="border-t border-red-100 bg-red-50 px-5 py-3 text-sm text-red-600">
                    {editorError}
                  </div>
                )}

                <div className="flex shrink-0 items-center justify-between border-t border-slate-200 px-5 py-4">
                  <p className="text-xs text-slate-400">
                    {editorContent.length.toLocaleString()} characters
                  </p>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={closeEditor}
                      disabled={editorSaving}
                      className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                    >
                      <X size={16} />
                      Close
                    </button>

                    <button
                      type="button"
                      onClick={saveEditor}
                      disabled={editorSaving}
                      className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {editorSaving ? (
                        <Loader2
                          size={16}
                          className="animate-spin"
                        />
                      ) : (
                        <Save size={16} />
                      )}

                      {editorSaving
                        ? "Saving..."
                        : "Save changes"}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ====================================================
          CONTENT
      ==================================================== */}

      <main className="mx-auto max-w-6xl px-6 py-8">

        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">

          {/* =================================================
              IMAGE
          ================================================= */}

          {isImage && (

            <div className="flex min-h-[500px] items-center justify-center bg-slate-100 p-8">

              <img
                src={file.download_url}
                alt={file.name}
                className="max-h-[75vh] max-w-full rounded-xl object-contain shadow-lg"
              />

            </div>

          )}


          {/* =================================================
              VIDEO
          ================================================= */}

          {isVideo && (

            <div className="flex min-h-[500px] items-center justify-center bg-slate-950 p-6">

              <video
                controls
                className="max-h-[75vh] max-w-full rounded-xl"
                src={file.download_url}
              />

            </div>

          )}


          {/* =================================================
              AUDIO
          ================================================= */}

          {isAudio && (

            <div className="flex min-h-[400px] flex-col items-center justify-center gap-6">

              <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-slate-100 text-slate-700">

                <Music size={42} />

              </div>


              <audio
                controls
                className="w-full max-w-lg"
                src={file.download_url}
              />

            </div>

          )}


          {/* =================================================
              PDF
          ================================================= */}

          {isPdf && (

            <div className="h-[75vh] min-h-[500px]">

              <iframe
                src={file.download_url}
                title={file.name}
                className="h-full w-full border-0"
              />

            </div>

          )}


          {/* =================================================
              OTHER FILE TYPES
          ================================================= */}

          {!isImage &&
            !isVideo &&
            !isAudio &&
            !isPdf && (

              <div className="flex min-h-[450px] flex-col items-center justify-center p-8 text-center">

                <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-slate-100 text-slate-600">

                  <Icon size={38} />

                </div>


                <h2 className="mt-5 text-lg font-semibold text-slate-800">
                  {file.name}
                </h2>


                <p className="mt-2 max-w-md text-sm text-slate-400">
                  This file type cannot be previewed
                  in the browser.
                </p>


                <button
                  type="button"
                  onClick={
                    handleDownload
                  }
                  className="mt-6 flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                >

                  <Download size={17} />

                  Download file

                </button>

              </div>

            )}

        </div>

      </main>

    </div>
  );
};


export default PublicFile;