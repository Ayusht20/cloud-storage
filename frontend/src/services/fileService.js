import api from "./api";


const fileService = {
  // -----------------------------------------------
  // Get files
  // -----------------------------------------------

  getFiles(folderId = null) {
    if (!folderId) {
      return api.get("/files");
    }

    return api.get(
      `/files?folder_id=${encodeURIComponent(
        folderId
      )}`
    );
  },


  // -----------------------------------------------
  // Upload
  // -----------------------------------------------

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


    const endpoint = folderId
      ? `/files/upload?folder_id=${encodeURIComponent(
          folderId
        )}`
      : "/files/upload";


    return api.post(
      endpoint,
      formData
    );
  },


  // -----------------------------------------------
  // Get single file
  // -----------------------------------------------

  getFile(fileId) {
    return api.get(
      `/files/${encodeURIComponent(
        fileId
      )}`
    );
  },


  // -----------------------------------------------
  // Download
  // -----------------------------------------------

  downloadFile(fileId) {
    return api.get(
      `/files/${encodeURIComponent(
        fileId
      )}/download`
    );
  },


  // -----------------------------------------------
  // Rename
  // -----------------------------------------------

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


  // -----------------------------------------------
  // Move
  // folderId MUST be the actual UUID.
  // null = My Drive / root.
  // -----------------------------------------------

  moveFile(
    fileId,
    folderId = null
  ) {
    return api.patch(
      `/files/${encodeURIComponent(
        fileId
      )}/move`,
      {
        folder_id: folderId,
      }
    );
  },


  // -----------------------------------------------
  // Move to trash
  // -----------------------------------------------

  deleteFile(fileId) {
    return api.delete(
      `/files/${encodeURIComponent(
        fileId
      )}`
    );
  },
};


export default fileService;