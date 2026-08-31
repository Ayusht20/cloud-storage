import {
  File,
  FileText,
  Image,
  Video,
  Music,
  MoreVertical,
} from "lucide-react";


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
  onDelete,
}) => {
  const Icon = getFileIcon(
    file.mime_type
  );


  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md">

      <div className="flex items-start justify-between">

        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
          <Icon size={24} />
        </div>


        <button
          className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          title="More"
        >
          <MoreVertical size={18} />
        </button>

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


      {onDelete && (
        <button
          onClick={() =>
            onDelete(file)
          }
          className="mt-4 text-xs font-medium text-red-500 hover:text-red-600"
        >
          Move to trash
        </button>
      )}

    </div>
  );
};


export default FileCard;