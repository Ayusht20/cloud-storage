const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "http://127.0.0.1:8000";


// ============================================================
// REDIRECT TO LOGIN
// ============================================================

const redirectToLogin = () => {
  if (
    window.location.pathname !== "/login"
  ) {
    window.location.href = "/login";
  }
};


// ============================================================
// CHECK PUBLIC ENDPOINT
// ============================================================

const isPublicEndpoint = (
  endpoint
) => {
  return endpoint.startsWith("/public/");
};


// ============================================================
// CHECK AUTH ENDPOINT
// ============================================================

const isAuthEndpoint = (
  endpoint
) => {
  return (
    endpoint.startsWith("/auth/login") ||
    endpoint.startsWith("/auth/register") ||
    endpoint.startsWith("/auth/refresh") ||
    endpoint.startsWith("/auth/logout")
  );
};


// ============================================================
// REFRESH ACCESS TOKEN
// ============================================================

const refreshAccessToken = async () => {
  const response = await fetch(
    `${API_BASE_URL}/auth/refresh`,
    {
      method: "POST",
      credentials: "include",
    }
  );

  return response.ok;
};


// ============================================================
// BUILD REQUEST OPTIONS
// ============================================================

const buildRequestOptions = (
  options = {}
) => {

  const isFormData =
    options.body instanceof FormData;

  return {
    credentials: "include",
    ...options,

    headers: {
      ...(isFormData
        ? {}
        : options.body
          ? {
              "Content-Type":
                "application/json",
            }
          : {}),

      ...(options.headers || {}),
    },
  };
};


// ============================================================
// JSON REQUEST
// ============================================================

const request = async (
  endpoint,
  options = {},
  isRetry = false
) => {

  const response = await fetch(
    `${API_BASE_URL}${endpoint}`,
    buildRequestOptions(options)
  );


  // ----------------------------------------------------------
  // PUBLIC ENDPOINTS
  //
  // Public links may legitimately return 401 because:
  // - password is required
  // - password is incorrect
  //
  // Therefore NEVER redirect public-link visitors.
  // ----------------------------------------------------------

  if (
    response.status === 401 &&
    isPublicEndpoint(endpoint)
  ) {
    let data = null;

    try {
      data = await response.json();
    } catch {
      data = null;
    }

    const error = new Error(
      data?.detail ||
        "Unauthorized"
    );

    error.status = 401;
    error.data = data;

    throw error;
  }


  // ----------------------------------------------------------
  // AUTH ENDPOINTS
  //
  // Login/register/refresh/logout must handle their own
  // authentication errors.
  //
  // Especially important:
  // /auth/refresh returning 401 must NOT recursively call
  // /auth/refresh again.
  // ----------------------------------------------------------

  if (
    response.status === 401 &&
    isAuthEndpoint(endpoint)
  ) {

    let data = null;

    try {
      data = await response.json();
    } catch {
      data = null;
    }

    const error = new Error(
      data?.detail ||
        "Authentication failed"
    );

    error.status = 401;
    error.data = data;

    throw error;
  }


  // ----------------------------------------------------------
  // ACCESS TOKEN EXPIRED
  //
  // For normal authenticated endpoints:
  //
  // 401
  // ↓
  // /auth/refresh
  // ↓
  // retry original request
  //
  // Only attempt this once.
  // ----------------------------------------------------------

  if (
    response.status === 401 &&
    !isRetry
  ) {

    try {

      const refreshed =
        await refreshAccessToken();

      if (refreshed) {

        return request(
          endpoint,
          options,
          true
        );

      }

    } catch {
      // Refresh failed.
    }


    // --------------------------------------------------------
    // Refresh failed → actual session expiration
    // --------------------------------------------------------

    redirectToLogin();

    const error =
      new Error(
        "Your session has expired. Please login again."
      );

    error.status = 401;

    throw error;
  }


  // ----------------------------------------------------------
  // READ RESPONSE
  // ----------------------------------------------------------

  let data = null;

  try {

    data =
      await response.json();

  } catch {

    data = null;

  }


  // ----------------------------------------------------------
  // ERROR HANDLING
  // ----------------------------------------------------------

  if (!response.ok) {

    const error =
      new Error(
        data?.detail ||
          "Something went wrong"
      );

    error.status =
      response.status;

    error.data =
      data;

    throw error;
  }


  return data;
};


// ============================================================
// BLOB REQUEST
// ============================================================

const requestBlob = async (
  endpoint,
  options = {},
  isRetry = false
) => {

  const response = await fetch(
    `${API_BASE_URL}${endpoint}`,
    buildRequestOptions(options)
  );


  // ----------------------------------------------------------
  // PUBLIC ENDPOINT
  // ----------------------------------------------------------

  if (
    response.status === 401 &&
    isPublicEndpoint(endpoint)
  ) {

    let data = null;

    try {

      data =
        await response.json();

    } catch {

      data = null;

    }

    const error =
      new Error(
        data?.detail ||
          "Unauthorized"
      );

    error.status = 401;
    error.data = data;

    throw error;
  }


  // ----------------------------------------------------------
  // AUTH ENDPOINT
  // ----------------------------------------------------------

  if (
    response.status === 401 &&
    isAuthEndpoint(endpoint)
  ) {

    const error =
      new Error(
        "Authentication failed"
      );

    error.status = 401;

    throw error;
  }


  // ----------------------------------------------------------
  // ACCESS TOKEN EXPIRED
  // ----------------------------------------------------------

  if (
    response.status === 401 &&
    !isRetry
  ) {

    try {

      const refreshed =
        await refreshAccessToken();

      if (refreshed) {

        return requestBlob(
          endpoint,
          options,
          true
        );

      }

    } catch {
      // Refresh failed.
    }


    redirectToLogin();

    const error =
      new Error(
        "Your session has expired. Please login again."
      );

    error.status = 401;

    throw error;
  }


  // ----------------------------------------------------------
  // ERROR HANDLING
  // ----------------------------------------------------------

  if (!response.ok) {

    let message =
      "Something went wrong";

    try {

      const data =
        await response.json();

      message =
        data?.detail ||
          message;

    } catch {
      // Ignore JSON parsing errors
    }


    const error =
      new Error(message);

    error.status =
      response.status;

    throw error;
  }


  return response.blob();
};


// ============================================================
// API
// ============================================================

const api = {

  // ----------------------------------------------------------
  // GET JSON
  // ----------------------------------------------------------

  get(endpoint) {

    return request(
      endpoint,
      {
        method: "GET",
      }
    );

  },


  // ----------------------------------------------------------
  // GET BLOB
  // ----------------------------------------------------------

  getBlob(endpoint) {

    return requestBlob(
      endpoint,
      {
        method: "GET",
      }
    );

  },


  // ----------------------------------------------------------
  // POST
  // ----------------------------------------------------------

  post(
    endpoint,
    body
  ) {

    return request(
      endpoint,
      {
        method: "POST",

        body:
          body instanceof FormData
            ? body
            : JSON.stringify(body),
      }
    );

  },


  // ----------------------------------------------------------
  // PATCH
  // ----------------------------------------------------------

  patch(
    endpoint,
    body
  ) {

    return request(
      endpoint,
      {
        method: "PATCH",

        body:
          JSON.stringify(body),
      }
    );

  },


  // ----------------------------------------------------------
  // DELETE
  // ----------------------------------------------------------

  delete(endpoint) {

    return request(
      endpoint,
      {
        method: "DELETE",
      }
    );

  },

};


export default api;