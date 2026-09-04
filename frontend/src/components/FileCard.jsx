import {
  File,
  FileText,
  Image,
  Video,
  Music,
  MoreVertical,
  Eye,
  Download,
  Pencil,
  FolderInput,
  Share2,
  Trash2,
} from "lucide-react";

import {
  useEffect,
  useRef,
  useState,
} from "react";


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


const FileCard = ({
  file,
  permission,
  onView,
  onDownload,
  onRename,
  onMove,
  onShare,
  onDelete,
}) => {
  const [menuOpen, setMenuOpen] =
    useState(false);

  const menuRef = useRef(null);


  // ==================================================
  // PERMISSIONS
  // ==================================================

  const canEdit =
    permission === "owner" ||
    permission === "editor";

  const canShare =
    permission === "owner";


  // ==================================================
  // CLOSE MENU OUTSIDE
  // ==================================================

  useEffect(() => {
    const handleOutsideClick = (
      event
    ) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(
          event.target
        )
      ) {
        setMenuOpen(false);
      }
    };

    document.addEventListener(
      "mousedown",
      handleOutsideClick
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick
      );
    };
  }, []);


  const Icon = getFileIcon(
    file.mime_type
  );


  const handleAction = (
    action
  ) => {
    setMenuOpen(false);

    if (action) {
      action(file);
    }
  };


  const isShared =
    permission &&
    permission !== "owner";


  return (
    <div className="relative z-0 rounded-2xl border border-slate-200 bg-white p-4 transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md">

      {/* ==================================================
          TOP SECTION
      ================================================== */}

      <div className="flex items-start justify-between">

        <button
          type="button"
          onClick={() =>
            handleAction(onView)
          }
          className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-700 transition hover:bg-slate-200"
          title="View file"
        >
          <Icon size={24} />
        </button>


        {/* ==================================================
            ACTION MENU
        ================================================== */}

        <div
          ref={menuRef}
          className="relative z-50"
        >

          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();

              setMenuOpen(
                (value) => !value
              );
            }}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            title="File actions"
          >
            <MoreVertical size={18} />
          </button>


          {menuOpen && (
            <div
              className="absolute right-0 top-full z-[100] mt-2 w-48 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-xl"
              onClick={(event) =>
                event.stopPropagation()
              }
            >

              {/* VIEW */}

              {onView && (
                <button
                  type="button"
                  onClick={() =>
                    handleAction(onView)
                  }
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-slate-700 transition hover:bg-slate-50"
                >
                  <Eye size={16} />
                  View
                </button>
              )}


              {/* DOWNLOAD */}

              {onDownload && (
                <button
                  type="button"
                  onClick={() =>
                    handleAction(
                      onDownload
                    )
                  }
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-slate-700 transition hover:bg-slate-50"
                >
                  <Download size={16} />
                  Download
                </button>
              )}


              {/* RENAME */}

              {canEdit && onRename && (
                <button
                  type="button"
                  onClick={() =>
                    handleAction(
                      onRename
                    )
                  }
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-slate-700 transition hover:bg-slate-50"
                >
                  <Pencil size={16} />
                  Rename
                </button>
              )}


              {/* MOVE */}

              {canEdit && onMove && (
                <button
                  type="button"
                  onClick={() =>
                    handleAction(
                      onMove
                    )
                  }
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-slate-700 transition hover:bg-slate-50"
                >
                  <FolderInput size={16} />
                  Move
                </button>
              )}


              {/* SHARE — OWNER ONLY */}

              {canShare && onShare && (
                <button
                  type="button"
                  onClick={() =>
                    handleAction(
                      onShare
                    )
                  }
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-slate-700 transition hover:bg-slate-50"
                >
                  <Share2 size={16} />
                  Share
                </button>
              )}


              {/* DELETE */}

              {canEdit && onDelete && (
                <>
                  <div className="my-1 border-t border-slate-100" />

                  <button
                    type="button"
                    onClick={() =>
                      handleAction(
                        onDelete
                      )
                    }
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-red-500 transition hover:bg-red-50"
                  >
                    <Trash2 size={16} />
                    Move to trash
                  </button>
                </>
              )}

            </div>
          )}

        </div>

      </div>


      {/* ==================================================
          FILE INFORMATION
      ================================================== */}

      <div
        className="mt-4 cursor-pointer"
        onDoubleClick={() =>
          handleAction(onView)
        }
      >

        <p
          className="truncate font-semibold text-slate-800"
          title={file.name}
        >
          {file.name}
        </p>


        <div className="mt-2 flex items-center gap-2">

          <p className="text-xs text-slate-400">
            {formatSize(file.size)}
          </p>

          {isShared && (
            <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-600">
              Shared
            </span>
          )}

        </div>


        {isShared && (
          <p className="mt-1 text-xs capitalize text-slate-400">
            {permission}
          </p>
        )}

      </div>

    </div>
  );
};


export default FileCard;