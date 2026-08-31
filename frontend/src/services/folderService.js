import api from "./api";


const folderService = {
  getRootContents() {
    return api.get("/folders/contents");
  },


  getFolderContents(folderId) {
    return api.get(
      `/folders/${encodeURIComponent(folderId)}/contents`
    );
  },


  getFolders(parentId = null) {
    if (!parentId) {
      return api.get("/folders");
    }

    return api.get(
      `/folders/${encodeURIComponent(parentId)}`
    );
  },


  getFolder(folderId) {
    return api.get(
      `/folders/${encodeURIComponent(folderId)}`
    );
  },


  getBreadcrumbs(folderId) {
    return api.get(
      `/folders/${encodeURIComponent(folderId)}/breadcrumbs`
    );
  },


  createFolder(
    name,
    parentId = null
  ) {
    return api.post("/folders", {
      name,
      parent_id: parentId,
    });
  },


  updateFolder(
    folderId,
    name
  ) {
    return api.patch(
      `/folders/${encodeURIComponent(folderId)}`,
      {
        name,
      }
    );
  },


  moveFolder(
    folderId,
    parentId = null
  ) {
    return api.patch(
      `/folders/${encodeURIComponent(folderId)}/move`,
      {
        parent_id: parentId,
      }
    );
  },


  deleteFolder(folderId) {
    return api.delete(
      `/folders/${encodeURIComponent(folderId)}`
    );
  },
};


export default folderService;