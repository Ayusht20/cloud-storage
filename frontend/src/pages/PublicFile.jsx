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
} from "lucide-react";

import {
  useEffect,
  useState,
} from "react";

import {
  useParams,
  useNavigate,
} from "react-router-dom";

import publicLinkService from "../services/publicLinkService";


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

  const [requiresPassword, setRequiresPassword] =
    useState(false);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [passwordError, setPasswordError] =
    useState("");


  // ==========================================================
  // ACCESS PUBLIC LINK
  // ==========================================================

  const loadPublicFile = async (
    providedPassword = null
  ) => {

    setLoading(true);

    setError("");

    setPasswordError("");


    try {

      const data =
        await publicLinkService.accessLink(
          token,
          providedPassword
        );


      // ------------------------------------------------------
      // PUBLIC FOLDER
      // ------------------------------------------------------

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


      // ------------------------------------------------------
      // PUBLIC FILE
      // ------------------------------------------------------

      setFile(data);

      setRequiresPassword(false);

    } catch (err) {

      console.log(
        "PUBLIC LINK ERROR:",
        err.status,
        err.message,
        err.data
      );


      // ------------------------------------------------------
      // PASSWORD REQUIRED / INVALID PASSWORD
      // ------------------------------------------------------

      if (
        err.status === 401
      ) {

        if (!providedPassword) {

          setRequiresPassword(true);

          return;
        }


        setPasswordError(
          err.message ||
            "Invalid password"
        );

        setRequiresPassword(true);

        return;
      }


      // ------------------------------------------------------
      // EXPIRED LINK
      // ------------------------------------------------------

      if (
        err.status === 410
      ) {

        setError(
          "This public link has expired."
        );

        return;
      }


      // ------------------------------------------------------
      // NOT FOUND
      // ------------------------------------------------------

      if (
        err.status === 404
      ) {

        setError(
          err.message ||
            "This public link is no longer available."
        );

        return;
      }


      // ------------------------------------------------------
      // OTHER ERROR
      // ------------------------------------------------------

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


    await loadPublicFile(
      password
    );
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
  // PUBLIC PERMISSION
  // ==========================================================

  const permission =
    file?.permission || "viewer";

  const isViewer =
    permission === "viewer";

  const isEditor =
    permission === "editor";


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
              <div className="hidden items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-600 sm:flex">

                <Pencil size={14} />

                Editor

              </div>
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