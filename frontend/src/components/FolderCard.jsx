import {
  Folder,
  MoreVertical,
  Pencil,
  Share2,
  Move,
  Trash2,
} from "lucide-react";

import {
  useEffect,
  useRef,
  useState,
} from "react";


const FolderCard = ({
  folder,
  permission,
  onOpen,
  onRename,
  onShare,
  onMove,
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


  const isShared =
    permission &&
    permission !== "owner";


  // ==================================================
  // CLOSE MENU OUTSIDE
  // ==================================================

  useEffect(() => {

    const handleClickOutside = (
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
      handleClickOutside
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
    };

  }, []);


  // ==================================================
  // MENU ACTION
  // ==================================================

  const handleAction = (
    callback
  ) => {

    setMenuOpen(false);

    if (callback) {
      callback(folder);
    }

  };


  return (
    <div
      className="group relative z-0 flex w-full items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 text-left transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
    >

      {/* ==================================================
          FOLDER CONTENT
      ================================================== */}

      <button
        type="button"
        onClick={() =>
          onOpen(folder)
        }
        className="flex min-w-0 flex-1 items-center gap-4 text-left"
      >

        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
          <Folder size={24} />
        </div>


        <div className="min-w-0 flex-1">

          <p
            className="truncate font-semibold text-slate-800"
            title={folder.name}
          >
            {folder.name}
          </p>


          <div className="mt-2 flex items-center gap-2">

            <p className="text-xs text-slate-400">
              Folder
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

      </button>


      {/* ==================================================
          THREE DOT MENU
      ================================================== */}

      <div
        ref={menuRef}
        className="relative z-50 shrink-0"
      >

        <button
          type="button"
          onClick={(event) => {

            event.stopPropagation();

            setMenuOpen(
              (previous) =>
                !previous
            );

          }}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          title="Folder actions"
        >

          <MoreVertical
            size={18}
          />

        </button>


        {/* ==================================================
            DROPDOWN
        ================================================== */}

        {menuOpen && (

          <div
            className="absolute right-0 top-full z-[100] mt-2 w-48 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-xl"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            {/* RENAME */}

            {canEdit && onRename && (
              <button
                type="button"
                onClick={() =>
                  handleAction(
                    onRename
                  )
                }
                className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-slate-700 transition hover:bg-slate-50"
              >
                <Pencil size={16} />
                Rename
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
                className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-slate-700 transition hover:bg-slate-50"
              >
                <Share2 size={16} />
                Share
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
                className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-slate-700 transition hover:bg-slate-50"
              >
                <Move size={16} />
                Move
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
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-600 transition hover:bg-red-50"
                >
                  <Trash2 size={16} />
                  Move to Trash
                </button>
              </>
            )}


            {/* VIEWER */}

            {permission === "viewer" && (
              <div className="px-4 py-2.5 text-xs text-slate-400">
                View only
              </div>
            )}

          </div>

        )}

      </div>

    </div>
  );
};


export default FolderCard;