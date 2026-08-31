import api from "./api";


const fileService = {
  getFiles(folderId = null) {
    const endpoint = folderId
      ? `/files?folder_id=${encodeURIComponent(folderId)}`
      : "/files";

    return api.get(endpoint);
  },


  getFile(fileId) {
    return api.get(`/files/${fileId}`);
  },


  deleteFile(fileId) {
    return api.delete(`/files/${fileId}`);
  },
};


export default fileService;