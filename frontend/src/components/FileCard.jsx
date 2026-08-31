import {
  File,
  FileText,
  Image,
  Video,
  Music,
  MoreVertical,
  Download,
  Pencil,
  FolderInput,
  Trash2,
} from "lucide-react";

import {
  useEffect,
  useRef,
  useState,
} from "react";


const getFileIcon = (
  mimeType
) => {
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
    unitIndex <
      units.length - 1
  ) {
    value /= 1024;
    unitIndex++;
  }

  return `${value.toFixed(
    value >= 10 ||
      unitIndex === 0
      ? 0
      : 1
  )} ${units[unitIndex]}`;
};


const FileCard = ({
  file,
  onDownload,
  onRename,
  onMove,
  onDelete,
}) => {
  const [menuOpen, setMenuOpen] =
    useState(false);

  const menuRef = useRef(null);


  useEffect(() => {
    const handleOutsideClick =
      (event) => {
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
    action?.(file);
  };


  return (
    <div className="relative rounded-2xl border border-slate-200 bg-white p-4 transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md">

      <div className="flex items-start justify-between">

        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
          <Icon size={24} />
        </div>


        <div
          ref={menuRef}
          className="relative"
        >

          <button
            onClick={() =>
              setMenuOpen(
                (value) => !value
              )
            }
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            title="File actions"
          >
            <MoreVertical size={18} />
          </button>


          {menuOpen && (
            <div className="absolute right-0 z-20 mt-2 w-44 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-xl">

              <button
                onClick={() =>
                  handleAction(
                    onDownload
                  )
                }
                className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50"
              >
                <Download size={16} />
                Download
              </button>


              <button
                onClick={() =>
                  handleAction(
                    onRename
                  )
                }
                className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50"
              >
                <Pencil size={16} />
                Rename
              </button>


              <button
                onClick={() =>
                  handleAction(
                    onMove
                  )
                }
                className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50"
              >
                <FolderInput size={16} />
                Move
              </button>


              <div className="my-1 border-t border-slate-100" />


              <button
                onClick={() =>
                  handleAction(
                    onDelete
                  )
                }
                className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-red-500 hover:bg-red-50"
              >
                <Trash2 size={16} />
                Move to trash
              </button>

            </div>
          )}

        </div>

      </div>


      <div className="mt-4">

        <p
          className="truncate font-semibold text-slate-800"
          title={file.name}
        >
          {file.name}
        </p>

        <p className="mt-1 text-xs text-slate-400">
          {formatSize(file.size)}
        </p>

      </div>

    </div>
  );
};


export default FileCard;