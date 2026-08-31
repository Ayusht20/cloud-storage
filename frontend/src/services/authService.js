import api from "./api";


const authService = {
  register(data) {
    return api.post(
      "/auth/register",
      data
    );
  },


  login(data) {
    return api.post(
      "/auth/login",
      data
    );
  },


  refresh() {
    return api.post(
      "/auth/refresh"
    );
  },


  getCurrentUser() {
    return api.get(
      "/users/me"
    );
  },
};


export default authService;