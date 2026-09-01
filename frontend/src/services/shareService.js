import api from "./api";


const shareService = {

  // ==================================================
  // CREATE FILE SHARE
  // ==================================================

  createFileShare(
    fileId,
    email,
    role = "viewer"
  ) {
    return api.post(
      `/shares?file_id=${encodeURIComponent(fileId)}`,
      {
        email,
        role,
      }
    );
  },


  // ==================================================
  // GET SHARES FOR A FILE
  // ==================================================

  getFileShares(fileId) {
    return api.get(
      `/shares/file/${encodeURIComponent(fileId)}`
    );
  },


  // ==================================================
  // GET FILES SHARED WITH CURRENT USER
  // ==================================================

  getSharedFiles() {
    return api.get("/shares");
  },


  // ==================================================
  // GET FOLDERS SHARED WITH CURRENT USER
  // ==================================================

  getSharedFolders() {
    return api.get("/shares/folders");
  },


  // ==================================================
  // UPDATE SHARE PERMISSION
  // ==================================================

  updateShare(
    shareId,
    role
  ) {
    return api.patch(
      `/shares/${encodeURIComponent(shareId)}`,
      {
        role,
      }
    );
  },


  // ==================================================
  // REMOVE SHARE
  // ==================================================

  deleteShare(shareId) {
    return api.delete(
      `/shares/${encodeURIComponent(shareId)}`
    );
  },

};


export default shareService;