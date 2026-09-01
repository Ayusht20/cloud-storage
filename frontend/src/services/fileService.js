import api from "./api";


const fileService = {

  // ==========================================================
  // GET FILES
  // ==========================================================

  getFiles(
    folderId = null
  ) {
    if (!folderId) {
      return api.get(
        "/files"
      );
    }

    return api.get(
      `/files?folder_id=${encodeURIComponent(
        folderId
      )}`
    );
  },


  // ==========================================================
  // UPLOAD
  // ==========================================================

  uploadFile(
    file,
    folderId = null
  ) {
    const formData =
      new FormData();

    formData.append(
      "uploaded_file",
      file
    );


    const endpoint =
      folderId
        ? `/files/upload?folder_id=${encodeURIComponent(
            folderId
          )}`
        : "/files/upload";


    return api.post(
      endpoint,
      formData
    );
  },


  // ==========================================================
  // GET SINGLE FILE METADATA
  // ==========================================================

  getFile(fileId) {
    return api.get(
      `/files/${encodeURIComponent(
        fileId
      )}`
    );
  },


  // ==========================================================
  // GET ACTUAL FILE CONTENT
  // ==========================================================

  getFileContent(fileId) {
    return api.getBlob(
      `/files/${encodeURIComponent(
        fileId
      )}/content`
    );
  },


  // ==========================================================
  // DOWNLOAD ACTUAL FILE
  // ==========================================================

  async downloadFile(
    file
  ) {
    const blob =
      await this.getFileContent(
        file.id
      );


    const blobUrl =
      window.URL.createObjectURL(
        blob
      );


    const link =
      document.createElement(
        "a"
      );

    link.href =
      blobUrl;

    link.download =
      file.name ||
      file.original_name ||
      "download";


    document.body.appendChild(
      link
    );

    link.click();

    link.remove();


    window.URL.revokeObjectURL(
      blobUrl
    );
  },


  // ==========================================================
  // RENAME
  // ==========================================================

  renameFile(
    fileId,
    name
  ) {
    return api.patch(
      `/files/${encodeURIComponent(
        fileId
      )}`,
      {
        name,
      }
    );
  },


  // ==========================================================
  // MOVE
  // ==========================================================

  moveFile(
    fileId,
    folderId = null
  ) {
    return api.patch(
      `/files/${encodeURIComponent(
        fileId
      )}/move`,
      {
        folder_id:
          folderId,
      }
    );
  },


  // ==========================================================
  // MOVE TO TRASH
  // ==========================================================

  deleteFile(fileId) {
    return api.delete(
      `/files/${encodeURIComponent(
        fileId
      )}`
    );
  },

};


export default fileService;