import {
  X,
  Share2,
  Mail,
  User,
  Trash2,
  Loader2,
  ChevronDown,
  Link,
  Copy,
  CheckCircle2,
  Globe,
  Lock,
  Calendar,
  Eye,
  Pencil,
} from "lucide-react";

import {
  useEffect,
  useState,
} from "react";

import shareService from "../services/shareService";
import publicLinkService from "../services/publicLinkService";


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
  // PUBLIC LINK STATES
  // ==========================================================

  const [publicLink, setPublicLink] =
    useState(null);

  const [linkLoading, setLinkLoading] =
    useState(false);

  const [copied, setCopied] =
    useState(false);

  const [password, setPassword] =
    useState("");

  const [expiry, setExpiry] =
    useState("");

  const [publicPermission, setPublicPermission] =
    useState("viewer");


  // ==========================================================
  // LOAD SHARES + PUBLIC LINK
  // ==========================================================

  const loadData = async () => {

    if (!file?.id) {
      return;
    }

    setLoading(true);
    setError("");

    try {

      const [
        shareData,
        links,
      ] = await Promise.all([
        shareService.getFileShares(
          file.id
        ),
        publicLinkService.getPublicLinks(),
      ]);


      setShares(
        Array.isArray(shareData)
          ? shareData
          : []
      );


      const existing =
        Array.isArray(links)
          ? links.find(
              (item) =>
                item.file_id === file.id &&
                item.is_active
            )
          : null;


      setPublicLink(
        existing || null
      );


      if (existing?.permission) {
        setPublicPermission(
          existing.permission
        );
      } else {
        setPublicPermission(
          "viewer"
        );
      }

    } catch (err) {

      setError(
        err.message ||
          "Unable to load sharing information"
      );

    } finally {

      setLoading(false);

    }
  };


  useEffect(() => {
    loadData();
  }, [file?.id]);


  // ==========================================================
  // SHARE FILE
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


    setSharing(true);
    setError("");
    setSuccess("");


    try {

      await shareService.createFileShare(
        file.id,
        trimmedEmail,
        role
      );


      setEmail("");

      setSuccess(
        `${file.name} was shared with ${trimmedEmail}`
      );


      await loadData();

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

    setRemovingId(
      share.id
    );


    try {

      await shareService.deleteShare(
        share.id
      );


      setShares(
        (current) =>
          current.filter(
            (item) =>
              item.id !== share.id
          )
      );


      setSuccess(
        "Access removed successfully"
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
  // UPDATE PEOPLE ROLE
  // ==========================================================

  const handleRoleChange = async (
    share,
    newRole
  ) => {

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
              item.id === share.id
                ? updated
                : item
          )
      );


      setSuccess(
        "Permission updated successfully"
      );

    } catch (err) {

      setError(
        err.message ||
          "Unable to update permission"
      );

    }
  };


  // ==========================================================
  // CREATE PUBLIC LINK
  // ==========================================================

  const handleCreateLink =
    async () => {

      setLinkLoading(true);
      setError("");
      setSuccess("");


      try {

        const data =
          await publicLinkService.createFileLink(
            file.id,
            {
              password:
                password || null,

              expires_at:
                expiry
                  ? new Date(
                      expiry
                    ).toISOString()
                  : null,

              permission:
                publicPermission,
            }
          );


        setPublicLink(data);


        setPublicPermission(
          data?.permission ||
            publicPermission
        );


        setSuccess(
          "Public link created successfully"
        );

      } catch (err) {

        setError(
          err.message ||
            "Unable to create public link"
        );

      } finally {

        setLinkLoading(false);

      }
    };


  // ==========================================================
  // UPDATE PUBLIC LINK PERMISSION
  // ==========================================================

  const handlePublicPermissionChange =
    async (event) => {

      const newPermission =
        event.target.value;


      if (!publicLink) {
        return;
      }


      const previousPermission =
        publicLink.permission ||
        "viewer";


      setPublicPermission(
        newPermission
      );

      setLinkLoading(true);
      setError("");
      setSuccess("");


      try {

        const updated =
          await publicLinkService.updatePermission(
            publicLink.id,
            newPermission
          );


        const updatedLink = {
          ...publicLink,
          ...updated,
          permission:
            updated?.permission ||
            newPermission,
        };


        setPublicLink(
          updatedLink
        );


        setPublicPermission(
          updatedLink.permission
        );


        setSuccess(
          `Public link permission changed to ${
            updatedLink.permission === "editor"
              ? "Editor"
              : "Viewer"
          }`
        );

      } catch (err) {

        setPublicPermission(
          previousPermission
        );

        setError(
          err.message ||
            "Unable to update public link permission"
        );

      } finally {

        setLinkLoading(false);

      }
    };


  // ==========================================================
  // COPY LINK
  // ==========================================================

  const handleCopy = async () => {

    if (!publicLink) {
      return;
    }


    const url =
      `${window.location.origin}/public/${publicLink.token}`;


    await navigator.clipboard.writeText(
      url
    );


    setCopied(true);


    setTimeout(() => {
      setCopied(false);
    }, 1800);
  };


  // ==========================================================
  // REVOKE LINK
  // ==========================================================

  const handleRevoke = async () => {

    if (!publicLink) {
      return;
    }


    setLinkLoading(true);
    setError("");
    setSuccess("");


    try {

      await publicLinkService.revokeLink(
        publicLink.id
      );


      setPublicLink(null);

      setPublicPermission(
        "viewer"
      );

      setPassword("");
      setExpiry("");


      setSuccess(
        "Public link revoked"
      );

    } catch (err) {

      setError(
        err.message ||
          "Unable to revoke link"
      );

    } finally {

      setLinkLoading(false);

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

      <div className="w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl">

        {/* HEADER */}

        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">

          <div className="flex items-center gap-3">

            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
              <Share2 size={21} />
            </div>

            <div>

              <h2 className="font-semibold text-slate-900">
                Share file
              </h2>

              <p className="max-w-[300px] truncate text-xs text-slate-400">
                {file.name}
              </p>

            </div>

          </div>


          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X size={20} />
          </button>

        </div>


        <div className="max-h-[75vh] space-y-6 overflow-y-auto p-6">

          {/* ==================================================
              ADD PEOPLE
          ================================================== */}

          <form
            onSubmit={handleShare}
            className="space-y-4"
          >

            <div>

              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Add people
              </label>

              <div className="relative">

                <Mail
                  size={17}
                  className="absolute left-3 top-3.5 text-slate-400"
                />

                <input
                  type="email"
                  value={email}
                  onChange={(e) =>
                    setEmail(
                      e.target.value
                    )
                  }
                  placeholder="Enter email address"
                  className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-3 text-sm outline-none focus:border-slate-400"
                />

              </div>

            </div>


            <div>

              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Permission
              </label>

              <div className="relative">

                <select
                  value={role}
                  onChange={(e) =>
                    setRole(
                      e.target.value
                    )
                  }
                  className="w-full appearance-none rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none"
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
                  className="pointer-events-none absolute right-3 top-3.5 text-slate-400"
                />

              </div>

            </div>


            <button
              type="submit"
              disabled={sharing}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
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


          {/* STATUS */}

          {error && (
            <div className="rounded-2xl bg-red-50 p-4 text-sm text-red-600">
              {error}
            </div>
          )}


          {success && (
            <div className="flex items-start gap-3 rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-700">

              <CheckCircle2
                size={20}
                className="mt-0.5"
              />

              <span>
                {success}
              </span>

            </div>
          )}


          {/* ==================================================
              PEOPLE ACCESS
          ================================================== */}

          <div>

            <div className="mb-3 flex items-center justify-between">

              <div>

                <h3 className="font-semibold text-slate-800">
                  People with access
                </h3>

                <p className="text-xs text-slate-400">
                  Manage file permissions
                </p>

              </div>

              <span className="text-xs text-slate-400">
                {shares.length}
              </span>

            </div>


            {loading ? (

              <div className="flex justify-center py-8">

                <Loader2
                  className="animate-spin text-slate-400"
                />

              </div>

            ) : shares.length === 0 ? (

              <div className="rounded-2xl border border-dashed border-slate-200 py-8 text-center">

                <User
                  className="mx-auto text-slate-300"
                  size={28}
                />

                <p className="mt-3 text-sm font-medium text-slate-600">
                  No one has access yet
                </p>

              </div>

            ) : (

              <div className="space-y-2">

                {shares.map((share) => (

                  <div
                    key={share.id}
                    className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-3 py-3"
                  >

                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white font-semibold text-slate-600">

                      {share.email
                        .charAt(0)
                        .toUpperCase()}

                    </div>


                    <div className="min-w-0 flex-1">

                      <p className="truncate text-sm font-medium text-slate-700">
                        {share.email}
                      </p>

                    </div>


                    <select
                      value={share.role}
                      onChange={(e) =>
                        handleRoleChange(
                          share,
                          e.target.value
                        )
                      }
                      className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs"
                    >

                      <option value="viewer">
                        Viewer
                      </option>

                      <option value="editor">
                        Editor
                      </option>

                    </select>


                    <button
                      type="button"
                      disabled={
                        removingId ===
                        share.id
                      }
                      onClick={() =>
                        handleRemove(
                          share
                        )
                      }
                      className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-500"
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


          {/* ==================================================
              PUBLIC LINK
          ================================================== */}

          <div className="border-t border-slate-200 pt-6">

            <div className="mb-4 flex items-center gap-3">

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Globe size={20} />
              </div>

              <div>

                <h3 className="font-semibold text-slate-800">
                  Public access
                </h3>

                <p className="text-xs text-slate-400">
                  Anyone with the link can access
                </p>

              </div>

            </div>


            {!publicLink ? (

              <div className="space-y-4">

                {/* PASSWORD */}

                <div>

                  <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">

                    <Lock size={15} />

                    Password (optional)

                  </label>

                  <input
                    type="password"
                    value={password}
                    onChange={(e) =>
                      setPassword(
                        e.target.value
                      )
                    }
                    placeholder="Protect with password"
                    className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-slate-400"
                  />

                </div>


                {/* EXPIRY */}

                <div>

                  <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">

                    <Calendar size={15} />

                    Expiry (optional)

                  </label>

                  <input
                    type="datetime-local"
                    value={expiry}
                    onChange={(e) =>
                      setExpiry(
                        e.target.value
                      )
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-slate-400"
                  />

                </div>


                {/* PUBLIC PERMISSION */}

                <div>

                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Link permission
                  </label>

                  <div className="relative">

                    <select
                      value={publicPermission}
                      onChange={(e) =>
                        setPublicPermission(
                          e.target.value
                        )
                      }
                      className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-3 py-3 pr-10 text-sm outline-none focus:border-slate-400"
                    >

                      <option value="viewer">
                        Viewer — View only
                      </option>

                      <option value="editor">
                        Editor — Can edit
                      </option>

                    </select>

                    <ChevronDown
                      size={17}
                      className="pointer-events-none absolute right-3 top-3.5 text-slate-400"
                    />

                  </div>

                </div>


                <button
                  type="button"
                  onClick={handleCreateLink}
                  disabled={linkLoading}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-900 bg-slate-900 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
                >

                  {linkLoading ? (

                    <>
                      <Loader2
                        size={17}
                        className="animate-spin"
                      />

                      Creating...

                    </>

                  ) : (

                    <>
                      <Link size={17} />

                      Create public link

                    </>

                  )}

                </button>

              </div>

            ) : (

              <div className="space-y-3">

                {/* ACTIVE LINK */}

                <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">

                  <div className="flex items-center gap-2 text-sm font-semibold text-emerald-700">

                    <CheckCircle2
                      size={17}
                    />

                    Public link active

                  </div>


                  <p className="mt-2 break-all text-xs text-emerald-600">

                    {`${window.location.origin}/public/${publicLink.token}`}

                  </p>

                </div>


                {/* PUBLIC PERMISSION */}

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">

                  <div className="mb-3 flex items-center gap-2">

                    {publicPermission ===
                    "editor" ? (

                      <Pencil
                        size={16}
                        className="text-slate-600"
                      />

                    ) : (

                      <Eye
                        size={16}
                        className="text-slate-600"
                      />

                    )}

                    <div>

                      <p className="text-sm font-semibold text-slate-700">
                        Link permission
                      </p>

                      <p className="text-xs text-slate-400">
                        Control what anyone with this link can do
                      </p>

                    </div>

                  </div>


                  <div className="relative">

                    <select
                      value={publicPermission}
                      onChange={
                        handlePublicPermissionChange
                      }
                      disabled={linkLoading}
                      className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-3 py-3 pr-10 text-sm outline-none disabled:opacity-60"
                    >

                      <option value="viewer">
                        Viewer — View only
                      </option>

                      <option value="editor">
                        Editor — Can edit
                      </option>

                    </select>


                    <ChevronDown
                      size={17}
                      className="pointer-events-none absolute right-3 top-3.5 text-slate-400"
                    />

                  </div>

                </div>


                {/* COPY + REVOKE */}

                <div className="flex gap-3">

                  <button
                    type="button"
                    onClick={handleCopy}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-slate-900 py-3 text-sm font-semibold text-white hover:bg-slate-800"
                  >

                    {copied ? (

                      <>
                        <CheckCircle2
                          size={17}
                        />

                        Copied

                      </>

                    ) : (

                      <>
                        <Copy size={17} />

                        Copy link

                      </>

                    )}

                  </button>


                  <button
                    type="button"
                    onClick={handleRevoke}
                    disabled={linkLoading}
                    className="rounded-xl border border-red-200 px-4 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                  >
                    Revoke
                  </button>

                </div>

              </div>

            )}

          </div>

        </div>

      </div>

    </div>
  );
};


export default ShareModal;