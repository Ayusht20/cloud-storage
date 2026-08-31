import {
  Folder,
  MoreVertical,
} from "lucide-react";


const FolderCard = ({
  folder,
  onOpen,
}) => {
  return (
    <button
      onClick={() =>
        onOpen(folder)
      }
      className="group flex w-full items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 text-left transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
    >

      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
        <Folder size={24} />
      </div>


      <div className="min-w-0 flex-1">

        <p className="truncate font-semibold text-slate-800">
          {folder.name}
        </p>

        <p className="mt-1 text-xs text-slate-400">
          Folder
        </p>

      </div>


      <MoreVertical
        size={18}
        className="text-slate-400"
      />

    </button>
  );
};


export default FolderCard;