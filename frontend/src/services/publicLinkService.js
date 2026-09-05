import api from "./api";


const publicLinkService = {

  // ==========================================================
  // CREATE FILE LINK
  // ==========================================================

  createFileLink(
    fileId,
    data = {}
  ) {
    return api.post(
      `/public-links?file_id=${encodeURIComponent(
        fileId
      )}`,
      data
    );
  },


  // ==========================================================
  // CREATE FOLDER LINK
  // ==========================================================

  createFolderLink(
    folderId,
    data = {}
  ) {
    return api.post(
      `/public-links?folder_id=${encodeURIComponent(
        folderId
      )}`,
      data
    );
  },


  // ==========================================================
  // GET ALL MY LINKS
  // ==========================================================

  getPublicLinks() {
    return api.get(
      "/public-links"
    );
  },


  // ==========================================================
  // UPDATE PUBLIC LINK PERMISSION
  // ==========================================================

  updatePermission(
    linkId,
    permission
  ) {
    return api.patch(
      `/public-links/${encodeURIComponent(
        linkId
      )}/permission`,
      {
        permission,
      }
    );
  },


  // ==========================================================
  // REVOKE LINK
  // ==========================================================

  revokeLink(linkId) {
    return api.delete(
      `/public-links/${encodeURIComponent(
        linkId
      )}`
    );
  },


  // ==========================================================
  // ACCESS PUBLIC LINK
  // ==========================================================

  accessLink(
    token,
    password = null
  ) {
    return api.post(
      `/public/${encodeURIComponent(
        token
      )}`,
      {
        password,
      }
    );
  },


  // ==========================================================
  // GET PUBLIC FILE CONTENT
  // ==========================================================

  getPublicFileContent(
    token,
    fileId,
    password = null
  ) {
    return api.get(
      `/public/${encodeURIComponent(
        token
      )}/file/${encodeURIComponent(
        fileId
      )}/content`,
      {
        params: {
          password,
        },
      }
    );
  },


  // ==========================================================
  // UPDATE PUBLIC FILE CONTENT
  // ==========================================================

  updatePublicFileContent(
    token,
    fileId,
    content,
    password = null
  ) {
    return api.patch(
      `/public/${encodeURIComponent(
        token
      )}/file/${encodeURIComponent(
        fileId
      )}/content`,
      {
        content,
        password,
      }
    );
  },


  // ==========================================================
  // RENAME PUBLIC FILE
  // ==========================================================

  renamePublicFile(
    token,
    fileId,
    name,
    password = null
  ) {
    return api.patch(
      `/public/${encodeURIComponent(
        token
      )}/file/${encodeURIComponent(
        fileId
      )}`,
      {
        name,
        password,
      }
    );
  },


  // ==========================================================
  // MOVE PUBLIC FILE
  // ==========================================================

  movePublicFile(
    token,
    fileId,
    folderId,
    password = null
  ) {
    return api.patch(
      `/public/${encodeURIComponent(
        token
      )}/file/${encodeURIComponent(
        fileId
      )}/move`,
      {
        folder_id: folderId,
        password,
      }
    );
  },


  // ==========================================================
  // DELETE PUBLIC FILE
  // ==========================================================

  deletePublicFile(
    token,
    fileId,
    password = null
  ) {
    return api.delete(
      `/public/${encodeURIComponent(
        token
      )}/file/${encodeURIComponent(
        fileId
      )}`,
      {
        data: {
          password,
        },
      }
    );
  },


  // ==========================================================
  // GET PUBLIC FOLDER CONTENTS
  // ==========================================================

  getFolderContents(
    token,
    password = null
  ) {
    return api.post(
      `/public/${encodeURIComponent(
        token
      )}/contents`,
      {
        password,
      }
    );
  },

};


export default publicLinkService;