import api from "./api";


const folderService = {
  // -----------------------------------------------
  // Root contents
  // One request gives:
  // folders + files + root breadcrumb
  // -----------------------------------------------

  getRootContents() {
    return api.get(
      "/folders/contents"
    );
  },


  // -----------------------------------------------
  // Folder contents
  // One request gives:
  // subfolders + files
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
  // Folder picker navigation
  //
  // null = root folders
  // UUID = direct children of that folder
  // -----------------------------------------------

  getFolders(
    parentId = null
  ) {
    if (!parentId) {
      return api.get(
        "/folders"
      );
    }

    return api.get(
      `/folders/${encodeURIComponent(
        parentId
      )}`
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
  //
  // Kept for compatibility.
  // Dashboard navigation should maintain
  // breadcrumbs locally instead.
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