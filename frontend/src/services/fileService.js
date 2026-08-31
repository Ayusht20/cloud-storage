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

    formData.append("uploaded_file", file);

    const endpoint = folderId
      ? `/files/upload?folder_id=${encodeURIComponent(folderId)}`
      : "/files/upload";

    return api.post(endpoint, formData);
  },

  getFile(fileId) {
    return api.get(`/files/${fileId}`);
  },

  deleteFile(fileId) {
    return api.delete(`/files/${fileId}`);
  },
};

export default fileService;