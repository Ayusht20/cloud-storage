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
  Pencil,
  X,
  Check,
} from "lucide-react";

import shareService from "../services/shareService";
import api from "../services/api";
import Layout from "../components/Layout";
import FilePreviewModal from "../components/FilePreviewModal";


// ==========================================================
// FILE ICON
// ==========================================================

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


// ==========================================================
// FORMAT SIZE
// ==========================================================

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


// ==========================================================
// BROWSER EDITABLE FILE
// ==========================================================

const isEditableMimeType = (
  mimeType = "",
  fileName = ""
) => {

  const mime =
    mimeType
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

  const extension =
    fileName
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


const Shared = () => {

  // ========================================================
  // SHARED DATA
  // ========================================================

  const [files, setFiles] =
    useState([]);

  const [folders, setFolders] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");


  // ========================================================
  // PREVIEW
  // ========================================================

  const [viewingFile, setViewingFile] =
    useState(null);

  const [previewUrl, setPreviewUrl] =
    useState("");

  const [previewLoading, setPreviewLoading] =
    useState(false);


  // ========================================================
  // EDITOR
  // ========================================================

  const [editingFile, setEditingFile] =
    useState(null);

  const [editorContent, setEditorContent] =
    useState("");

  const [editorLoading, setEditorLoading] =
    useState(false);

  const [editorSaving, setEditorSaving] =
    useState(false);

  const [editorSaved, setEditorSaved] =
    useState(false);

  const [editorError, setEditorError] =
    useState("");


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

      setError("");

      setViewingFile(file);

      setPreviewUrl("");

      setPreviewLoading(true);


      const blob =
        await api.getBlob(
          `/files/${encodeURIComponent(
            file.file_id ||
              file.id
          )}/content`
        );


      const url =
        URL.createObjectURL(
          blob
        );


      setPreviewUrl(url);

    } catch (err) {

      setViewingFile(null);

      setError(
        err.message ||
          "Unable to view file"
      );

    } finally {

      setPreviewLoading(false);

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
  // OPEN EDITOR
  // ==========================================================

  const openEditor = async (
    file
  ) => {

    if (
      file.role !== "editor"
    ) {
      return;
    }


    const fileName =
      file.file_name ||
      file.original_name ||
      "";


    if (
      !isEditableMimeType(
        file.mime_type,
        fileName
      )
    ) {

      setError(
        "This file type cannot be edited in the browser."
      );

      return;
    }


    setEditingFile(file);

    setEditorContent("");

    setEditorError("");

    setEditorSaved(false);

    setEditorLoading(true);


    try {

      const data =
        await shareService.getSharedFileContent(
          file.file_id
        );


      setEditorContent(
        data?.content || ""
      );

    } catch (err) {

      setEditorError(
        err.message ||
          "Unable to load file content"
      );

    } finally {

      setEditorLoading(false);

    }
  };


  // ==========================================================
  // SAVE EDITOR
  // ==========================================================

  const saveEditor = async () => {

    if (!editingFile) {
      return;
    }


    if (
      editingFile.role !== "editor"
    ) {
      return;
    }


    setEditorSaving(true);

    setEditorError("");

    setEditorSaved(false);


    try {

      await shareService.updateSharedFileContent(
        editingFile.file_id,
        editorContent
      );


      setEditorSaved(true);


      // Keep shared file metadata fresh.
      setFiles(
        (current) =>
          current.map(
            (item) =>
              item.file_id ===
              editingFile.file_id
                ? {
                    ...item,
                    size:
                      new Blob([
                        editorContent,
                      ]).size,
                  }
                : item
          )
      );

    } catch (err) {

      setEditorError(
        err.message ||
          "Unable to save file"
      );

    } finally {

      setEditorSaving(false);

    }
  };


  // ==========================================================
  // CLOSE EDITOR
  // ==========================================================

  const closeEditor = () => {

    if (editorSaving) {
      return;
    }

    setEditingFile(null);

    setEditorContent("");

    setEditorError("");

    setEditorSaved(false);

  };


  // ==========================================================
  // LOADING
  // ==========================================================

  if (loading) {

    return (
      <Layout>

        <div className="flex min-h-[60vh] items-center justify-center">

          <div className="flex items-center gap-3 text-slate-500">

            <Loader2
              size={22}
              className="animate-spin"
            />

            Loading shared files...

          </div>

        </div>

      </Layout>
    );
  }


  return (
    <Layout>

      <div className="mx-auto max-w-7xl px-6 py-8">

        {/* ====================================================
            HEADER
            ==================================================== */}

        <div className="mb-8">

          <h1 className="text-2xl font-bold text-slate-900">
            Shared with me
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Files and folders shared with you
          </p>

        </div>


        {/* ====================================================
            ERROR
            ==================================================== */}

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


                  const fileName =
                    file.file_name ||
                    file.original_name ||
                    "";


                  const canEdit =
                    file.role ===
                      "editor" &&
                    isEditableMimeType(
                      file.mime_type,
                      fileName
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


                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${
                            file.role ===
                            "editor"
                              ? "bg-emerald-50 text-emerald-600"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
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

<div className="mt-4 grid grid-cols-2 gap-2">

  {/* VIEW */}
  <button
    type="button"
    onClick={() => handleView(file)}
    className="flex min-w-0 items-center justify-center gap-2 rounded-xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-200"
  >
    <Eye size={15} />
    <span>View</span>
  </button>


  {/* DOWNLOAD */}
  <button
    type="button"
    onClick={() => handleDownload(file)}
    className="flex min-w-0 items-center justify-center gap-2 rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-800"
  >
    <Download size={15} />
    <span>Download</span>
  </button>


  {/* EDITOR ONLY */}
  {file.role === "editor" && (
    <button
      type="button"
      onClick={() => openEditor(file)}
      className="col-span-2 flex w-full min-w-0 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700"
    >
      <Pencil size={15} />
      <span>Edit</span>
    </button>
  )}

</div>

                    </div>

                  );

                }
              )}

            </div>

          )}

        </section>

      </div>


      {/* ====================================================
          PREVIEW MODAL
          ==================================================== */}

      {viewingFile && (

        <FilePreviewModal

          file={{
            ...viewingFile,

            id:
              viewingFile.file_id,

            name:
              viewingFile.file_name ||
              viewingFile.original_name ||
              "Shared file",
          }}

          previewUrl={
            previewUrl
          }

          loading={
            previewLoading
          }

          onClose={() => {

            if (previewUrl) {

              URL.revokeObjectURL(
                previewUrl
              );

            }


            setViewingFile(
              null
            );

            setPreviewUrl("");

            setPreviewLoading(
              false
            );

          }}

          onDownload={
            handleDownload
          }

        />

      )}


      {/* ====================================================
          EDITOR MODAL
          ==================================================== */}

      {editingFile && (

        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4 sm:p-6">

          <div className="flex h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">

            {/* EDITOR HEADER */}

            <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-5 py-4">

              <div className="min-w-0">

                <h2 className="truncate text-base font-semibold text-slate-900">

                  Edit{" "}

                  {
                    editingFile.file_name ||
                    editingFile.original_name
                  }

                </h2>


                <p className="mt-1 text-xs text-slate-400">

                  Editor access • Changes are saved to the shared file

                </p>

              </div>


              <div className="flex items-center gap-2">

                {editorSaved && (

                  <span className="hidden items-center gap-1 text-xs font-medium text-emerald-600 sm:flex">

                    <Check
                      size={14}
                    />

                    Saved

                  </span>

                )}


                <button
                  type="button"
                  onClick={
                    closeEditor
                  }
                  disabled={
                    editorSaving
                  }
                  className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
                >

                  <X
                    size={18}
                  />

                </button>

              </div>

            </div>


            {/* EDITOR ERROR */}

            {editorError && (

              <div className="mx-5 mt-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">

                {editorError}

              </div>

            )}


            {/* EDITOR */}

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
                    value={
                      editorContent
                    }
                    onChange={(
                      event
                    ) => {

                      setEditorContent(
                        event.target.value
                      );

                      setEditorSaved(
                        false
                      );

                    }}
                    spellCheck={
                      false
                    }
                    className="h-full w-full resize-none rounded-xl border border-slate-700 bg-slate-900 p-5 font-mono text-sm leading-6 text-slate-100 outline-none focus:border-slate-500"
                  />

                </div>


                {/* EDITOR FOOTER */}

                <div className="flex shrink-0 items-center justify-between border-t border-slate-200 bg-white px-5 py-4">

                  <span className="text-xs text-slate-400">

                    {editorContent.length} characters

                  </span>


                  <div className="flex items-center gap-2">

                    <button
                      type="button"
                      onClick={
                        closeEditor
                      }
                      disabled={
                        editorSaving
                      }
                      className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                    >

                      Cancel

                    </button>


                    <button
                      type="button"
                      onClick={
                        saveEditor
                      }
                      disabled={
                        editorSaving
                      }
                      className="flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                    >

                      {editorSaving ? (

                        <>

                          <Loader2
                            size={16}
                            className="animate-spin"
                          />

                          Saving...

                        </>

                      ) : (

                        <>

                          <Check
                            size={16}
                          />

                          Save changes

                        </>

                      )}

                    </button>

                  </div>

                </div>

              </>

            )}

          </div>

        </div>

      )}

    </Layout>
  );
};


export default Shared;