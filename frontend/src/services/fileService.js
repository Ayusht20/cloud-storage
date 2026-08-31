import api from "./api";


const fileService = {
  getFiles(folderId = null) {
    const endpoint = folderId
      ? `/files?folder_id=${encodeURIComponent(folderId)}`
      : "/files";

    return api.get(endpoint);
  },


  uploadFile(file, folderId = null) {
    const formData = new FormData();

    formData.append(
      "uploaded_file",
      file
    );

    const endpoint = folderId
      ? `/files/upload?folder_id=${encodeURIComponent(folderId)}`
      : "/files/upload";

    return api.post(
      endpoint,
      formData
    );
  },


  getFile(fileId) {
    return api.get(
      `/files/${encodeURIComponent(fileId)}`
    );
  },


  downloadFile(fileId) {
    return api.get(
      `/files/${encodeURIComponent(fileId)}/download`
    );
  },


  renameFile(
    fileId,
    name
  ) {
    return api.patch(
      `/files/${encodeURIComponent(fileId)}`,
      {
        name,
      }
    );
  },


  moveFile(
    fileId,
    folderId = null
  ) {
    return api.patch(
      `/files/${encodeURIComponent(fileId)}/move`,
      {
        folder_id: folderId,
      }
    );
  },


  deleteFile(fileId) {
    return api.delete(
      `/files/${encodeURIComponent(fileId)}`
    );
  },
};


export default fileService;