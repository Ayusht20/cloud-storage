import api from "./api";


const notificationService = {

  // ==========================================================
  // GET NOTIFICATIONS
  // ==========================================================

  getNotifications() {
    return api.get(
      "/notifications"
    );
  },


  // ==========================================================
  // MARK ONE NOTIFICATION AS READ
  // ==========================================================

  markAsRead(
    notificationId
  ) {
    return api.patch(
      `/notifications/${encodeURIComponent(
        notificationId
      )}/read`
    );
  },


  // ==========================================================
  // MARK ALL NOTIFICATIONS AS READ
  // ==========================================================

  markAllAsRead() {
    return api.patch(
      "/notifications/read-all"
    );
  },

};


export default notificationService;