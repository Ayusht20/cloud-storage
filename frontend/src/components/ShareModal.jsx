import {
  X,
  Share2,
  Mail,
  User,
  Trash2,
  Loader2,
  ChevronDown,
} from "lucide-react";

import {
  useEffect,
  useState,
} from "react";

import shareService from "../services/shareService";


const ShareModal = ({
  file,
  onClose,
}) => {

  const [email, setEmail] =
    useState("");

  const [role, setRole] =
    useState("viewer");

  const [shares, setShares] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [sharing, setSharing] =
    useState(false);

  const [removingId, setRemovingId] =
    useState(null);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");


  // ==========================================================
  // LOAD EXISTING SHARES
  // ==========================================================

  const loadShares = async () => {

    if (!file?.id) {
      return;
    }


    setLoading(true);
    setError("");


    try {

      const data =
        await shareService.getFileShares(
          file.id
        );

      setShares(
        Array.isArray(data)
          ? data
          : []
      );

    } catch (err) {

      setError(
        err.message ||
          "Unable to load shares"
      );

    } finally {

      setLoading(false);

    }
  };


  useEffect(() => {
    loadShares();
  }, [file?.id]);


  // ==========================================================
  // CREATE SHARE
  // ==========================================================

  const handleShare = async (
    event
  ) => {

    event.preventDefault();


    const trimmedEmail =
      email.trim();


    if (!trimmedEmail) {
      setError(
        "Please enter an email address"
      );
      return;
    }


    setError("");
    setSuccess("");
    setSharing(true);


    try {

      await shareService.createFileShare(
        file.id,
        trimmedEmail,
        role
      );


      setEmail("");

      setSuccess(
        "File shared successfully"
      );


      await loadShares();

    } catch (err) {

      setError(
        err.message ||
          "Unable to share file"
      );

    } finally {

      setSharing(false);

    }
  };


  // ==========================================================
  // REMOVE SHARE
  // ==========================================================

  const handleRemove = async (
    share
  ) => {

    if (!share?.id) {
      return;
    }


    setRemovingId(
      share.id
    );

    setError("");
    setSuccess("");


    try {

      await shareService.deleteShare(
        share.id
      );


      setShares(
        (current) =>
          current.filter(
            (item) =>
              item.id !==
              share.id
          )
      );


      setSuccess(
        "Access removed"
      );

    } catch (err) {

      setError(
        err.message ||
          "Unable to remove access"
      );

    } finally {

      setRemovingId(null);

    }
  };


  // ==========================================================
  // UPDATE ROLE
  // ==========================================================

  const handleRoleChange = async (
    share,
    newRole
  ) => {

    if (!share?.id) {
      return;
    }


    setError("");
    setSuccess("");


    try {

      const updated =
        await shareService.updateShare(
          share.id,
          newRole
        );


      setShares(
        (current) =>
          current.map(
            (item) =>
              item.id ===
              share.id
                ? updated
                : item
          )
      );


      setSuccess(
        "Permission updated"
      );

    } catch (err) {

      setError(
        err.message ||
          "Unable to update permission"
      );
    }
  };


  if (!file) {
    return null;
  }


  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {

        if (
          event.target ===
          event.currentTarget
        ) {
          onClose();
        }

      }}
    >

      <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">

        {/* ==================================================
            HEADER
            ================================================== */}

        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">

          <div className="flex min-w-0 items-center gap-3">

            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700">

              <Share2 size={20} />

            </div>


            <div className="min-w-0">

              <h2 className="font-semibold text-slate-900">
                Share file
              </h2>

              <p
                className="max-w-[300px] truncate text-xs text-slate-400"
                title={file.name}
              >
                {file.name}
              </p>

            </div>

          </div>


          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            title="Close"
          >
            <X size={20} />
          </button>

        </div>


        {/* ==================================================
            BODY
            ================================================== */}

        <div className="max-h-[70vh] overflow-y-auto p-5">

          {/* =================================================
              SHARE FORM
              ================================================= */}

          <form
            onSubmit={handleShare}
            className="space-y-4"
          >

            <div>

              <label className="mb-2 block text-sm font-medium text-slate-700">
                Add people
              </label>


              <div className="relative">

                <Mail
                  size={17}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />


                <input
                  type="email"
                  value={email}
                  onChange={(event) =>
                    setEmail(
                      event.target.value
                    )
                  }
                  placeholder="Enter email address"
                  className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                  disabled={sharing}
                />

              </div>

            </div>


            {/* PERMISSION */}

            <div>

              <label className="mb-2 block text-sm font-medium text-slate-700">
                Permission
              </label>


              <div className="relative">

                <select
                  value={role}
                  onChange={(event) =>
                    setRole(
                      event.target.value
                    )
                  }
                  disabled={sharing}
                  className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-3 py-3 pr-10 text-sm text-slate-700 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                >

                  <option value="viewer">
                    Viewer
                  </option>

                  <option value="editor">
                    Editor
                  </option>

                </select>


                <ChevronDown
                  size={17}
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

              </div>

            </div>


            <button
              type="submit"
              disabled={
                sharing ||
                !email.trim()
              }
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >

              {sharing ? (
                <>
                  <Loader2
                    size={17}
                    className="animate-spin"
                  />

                  Sharing...
                </>
              ) : (
                <>
                  <Share2 size={17} />

                  Share
                </>
              )}

            </button>

          </form>


          {/* =================================================
              STATUS
              ================================================= */}

          {error && (
            <div className="mt-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}


          {success && (
            <div className="mt-4 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-600">
              {success}
            </div>
          )}


          {/* =================================================
              PEOPLE WITH ACCESS
              ================================================= */}

          <div className="mt-6">

            <div className="mb-3 flex items-center justify-between">

              <h3 className="text-sm font-semibold text-slate-800">
                People with access
              </h3>


              {!loading && (
                <span className="text-xs text-slate-400">
                  {shares.length}{" "}
                  {shares.length === 1
                    ? "person"
                    : "people"}
                </span>
              )}

            </div>


            {loading ? (

              <div className="flex items-center justify-center rounded-xl border border-slate-100 py-8">

                <Loader2
                  size={22}
                  className="animate-spin text-slate-400"
                />

              </div>

            ) : shares.length === 0 ? (

              <div className="rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center">

                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-slate-100">

                  <User
                    size={18}
                    className="text-slate-400"
                  />

                </div>


                <p className="mt-3 text-sm font-medium text-slate-600">
                  Not shared yet
                </p>


                <p className="mt-1 text-xs text-slate-400">
                  Add someone above to give
                  them access.
                </p>

              </div>

            ) : (

              <div className="space-y-2">

                {shares.map((share) => (

                  <div
                    key={share.id}
                    className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/70 px-3 py-3"
                  >

                    {/* AVATAR */}

                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-sm font-semibold text-slate-600 shadow-sm">

                      {(
                        share.email ||
                        "U"
                      )
                        .charAt(0)
                        .toUpperCase()}

                    </div>


                    {/* EMAIL */}

                    <div className="min-w-0 flex-1">

                      <p
                        className="truncate text-sm font-medium text-slate-700"
                        title={share.email}
                      >
                        {share.email}
                      </p>

                    </div>


                    {/* ROLE */}

                    <select
                      value={
                        share.role
                      }
                      onChange={(event) =>
                        handleRoleChange(
                          share,
                          event.target.value
                        )
                      }
                      className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-medium text-slate-600 outline-none"
                    >

                      <option value="viewer">
                        Viewer
                      </option>

                      <option value="editor">
                        Editor
                      </option>

                    </select>


                    {/* REMOVE */}

                    <button
                      onClick={() =>
                        handleRemove(
                          share
                        )
                      }
                      disabled={
                        removingId ===
                        share.id
                      }
                      className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-500 disabled:opacity-50"
                      title="Remove access"
                    >

                      {removingId ===
                      share.id ? (
                        <Loader2
                          size={16}
                          className="animate-spin"
                        />
                      ) : (
                        <Trash2
                          size={16}
                        />
                      )}

                    </button>

                  </div>

                ))}

              </div>

            )}

          </div>

        </div>

      </div>

    </div>
  );
};


export default ShareModal;