import api from "./api";


const folderService = {
  getFolders(parentId = null) {
    const endpoint = parentId
      ? `/folders?parent_id=${encodeURIComponent(parentId)}`
      : "/folders";

    return api.get(endpoint);
  },


  getFolder(folderId) {
    return api.get(`/folders/${folderId}`);
  },


  getContents(folderId) {
    return api.get(
      `/folders/${folderId}/contents`
    );
  },


  createFolder(name, parentId = null) {
    return api.post("/folders", {
      name,
      parent_id: parentId,
    });
  },


  updateFolder(folderId, name) {
    return api.patch(
      `/folders/${folderId}`,
      {
        name,
      }
    );
  },


  deleteFolder(folderId) {
    return api.delete(
      `/folders/${folderId}`
    );
  },
};


export default folderService;