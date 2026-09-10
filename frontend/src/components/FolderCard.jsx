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



const cardMotionStyles = `
  @keyframes cardLiftIn {
    from {
      opacity: 0;
      transform: translateY(8px) scale(.985);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  @keyframes menuPop {
    from {
      opacity: 0;
      transform: translateY(-5px) scale(.97);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  .drive-card {
    animation: cardLiftIn 360ms cubic-bezier(.22, 1, .36, 1) both;
    transition:
      transform 240ms cubic-bezier(.22, 1, .36, 1),
      border-color 240ms ease,
      box-shadow 240ms ease,
      background-color 240ms ease;
  }

  .drive-card:hover {
    transform: translateY(-3px);
    border-color: rgb(203 213 225);
    box-shadow:
      0 14px 30px rgba(15, 23, 42, .08),
      0 3px 8px rgba(15, 23, 42, .04);
  }

  .drive-card-icon {
    transition:
      transform 260ms cubic-bezier(.22, 1, .36, 1),
      background-color 220ms ease,
      box-shadow 220ms ease;
  }

  .drive-card:hover .drive-card-icon {
    transform: translateY(-2px) scale(1.04);
    box-shadow: 0 8px 18px rgba(15, 23, 42, .08);
  }

  .drive-menu-button {
    transition:
      transform 180ms cubic-bezier(.22, 1, .36, 1),
      background-color 180ms ease,
      color 180ms ease;
  }

  .drive-menu-button:hover {
    transform: scale(1.05);
  }

  .drive-menu {
    animation: menuPop 180ms cubic-bezier(.22, 1, .36, 1) both;
    transform-origin: top right;
  }

  .drive-menu-item {
    transition:
      background-color 160ms ease,
      padding-left 160ms cubic-bezier(.22, 1, .36, 1);
  }

  .drive-menu-item:hover {
    padding-left: 18px;
  }

  .drive-file-open {
    transition:
      transform 200ms cubic-bezier(.22, 1, .36, 1),
      background-color 180ms ease;
  }

  .drive-file-open:hover {
    transform: translateY(-2px) scale(1.02);
  }

  @media (prefers-reduced-motion: reduce) {
    .drive-card,
    .drive-menu,
    .drive-card-icon,
    .drive-menu-button,
    .drive-menu-item,
    .drive-file-open {
      animation: none !important;
      transition: none !important;
    }
  }
`;

const DriveCardMotion = () => (
  <style>{cardMotionStyles}</style>
);


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
    <>
      <DriveCardMotion />
      <div
      className="drive-card group relative z-0 flex w-full items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 text-left"
    >

      {/* ==================================================
          FOLDER CONTENT
      ================================================== */}

      <button
        type="button"
        onClick={() =>
          onOpen(folder)
        }
        aria-label={`Open ${folder.name}`}
        title={`Open ${folder.name}`}
        className="flex min-w-0 flex-1 items-center gap-4 text-left outline-none focus-visible:ring-2 focus-visible:ring-slate-300 focus-visible:ring-offset-2"
      >

        <div className="drive-card-icon flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
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
          aria-label={`Actions for ${folder.name}`}
          aria-expanded={menuOpen}
          className="drive-menu-button flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
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
            className="drive-menu absolute right-0 top-full z-[100] mt-2 w-48 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-xl"
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
                className="drive-menu-item flex w-full items-center gap-3 px-4 py-2.5 text-sm text-slate-700"
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
                className="drive-menu-item flex w-full items-center gap-3 px-4 py-2.5 text-sm text-slate-700"
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
                className="drive-menu-item flex w-full items-center gap-3 px-4 py-2.5 text-sm text-slate-700"
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
                  className="drive-menu-item flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-600"
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
    </>
  );
};


export default FolderCard;