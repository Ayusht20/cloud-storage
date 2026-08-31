import api from "./api";


const folderService = {
  // -----------------------------------------------
  // Root contents
  // -----------------------------------------------

  getRootContents() {
    return api.get(
      "/folders/contents"
    );
  },


  // -----------------------------------------------
  // Folder contents
  //
  // Returns:
  // - child folders
  // - files
  // -----------------------------------------------

  getFolderContents(
    folderId
  ) {
    return api.get(
      `/folders/${encodeURIComponent(
        folderId
      )}/contents`
    );
  },


  // -----------------------------------------------
  // Root folders
  //
  // IMPORTANT:
  // /folders/{id} returns the folder itself,
  // NOT its children.
  // -----------------------------------------------

  getFolders() {
    return api.get(
      "/folders"
    );
  },


  // -----------------------------------------------
  // Get single folder
  // -----------------------------------------------

  getFolder(folderId) {
    return api.get(
      `/folders/${encodeURIComponent(
        folderId
      )}`
    );
  },


  // -----------------------------------------------
  // Breadcrumbs
  // -----------------------------------------------

  getBreadcrumbs(folderId) {
    return api.get(
      `/folders/${encodeURIComponent(
        folderId
      )}/breadcrumbs`
    );
  },


  // -----------------------------------------------
  // Create folder
  // -----------------------------------------------

  createFolder(
    name,
    parentId = null
  ) {
    return api.post(
      "/folders",
      {
        name,
        parent_id: parentId,
      }
    );
  },


  // -----------------------------------------------
  // Rename folder
  // -----------------------------------------------

  updateFolder(
    folderId,
    name
  ) {
    return api.patch(
      `/folders/${encodeURIComponent(
        folderId
      )}`,
      {
        name,
      }
    );
  },


  // -----------------------------------------------
  // Move folder
  // -----------------------------------------------

  moveFolder(
    folderId,
    parentId = null
  ) {
    return api.patch(
      `/folders/${encodeURIComponent(
        folderId
      )}/move`,
      {
        parent_id: parentId,
      }
    );
  },


  // -----------------------------------------------
  // Delete folder
  // -----------------------------------------------

  deleteFolder(folderId) {
    return api.delete(
      `/folders/${encodeURIComponent(
        folderId
      )}`
    );
  },
};


export default folderService;