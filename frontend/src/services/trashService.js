import api from "./api";

const trashService = {

  // ==========================================================
  // GET TRASH
  // ==========================================================

  getTrash() {
    return api.get("/trash");
  },


  // ==========================================================
  // RESTORE FILE
  // ==========================================================

  restoreFile(fileId) {
    return api.post(
      `/trash/files/${encodeURIComponent(fileId)}/restore`
    );
  },


  // ==========================================================
  // RESTORE FOLDER
  // ==========================================================

  restoreFolder(folderId) {
    return api.post(
      `/trash/folders/${encodeURIComponent(folderId)}/restore`
    );
  },


  // ==========================================================
  // PERMANENTLY DELETE FILE
  // ==========================================================

  permanentlyDeleteFile(fileId) {
    return api.delete(
      `/trash/files/${encodeURIComponent(fileId)}/permanent`
    );
  },


  // ==========================================================
  // PERMANENTLY DELETE FOLDER
  // ==========================================================

  permanentlyDeleteFolder(folderId) {
    return api.delete(
      `/trash/folders/${encodeURIComponent(folderId)}/permanent`
    );
  },


  // ==========================================================
  // EMPTY TRASH
  // ==========================================================

  emptyTrash() {
    return api.delete("/trash/empty");
  },

};

export default trashService;