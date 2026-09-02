const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "http://127.0.0.1:8000";


// ============================================================
// REDIRECT TO LOGIN
// ============================================================

const redirectToLogin = () => {
  if (
    window.location.pathname !==
    "/login"
  ) {
    window.location.href =
      "/login";
  }
};


// ============================================================
// CHECK PUBLIC ENDPOINT
// ============================================================

const isPublicEndpoint = (
  endpoint
) => {

  return (
    endpoint.startsWith("/public/")
  );

};


// ============================================================
// JSON REQUEST
// ============================================================

const request = async (
  endpoint,
  options = {}
) => {

  const isFormData =
    options.body instanceof FormData;


  const response = await fetch(
    `${API_BASE_URL}${endpoint}`,
    {
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
    }
  );


  // ----------------------------------------------------------
  // AUTOMATIC UNAUTHORIZED HANDLING
  //
  // IMPORTANT:
  // Public links can intentionally return 401 when a password
  // is required or when the supplied password is incorrect.
  // Therefore public endpoints must NOT redirect to login.
  // ----------------------------------------------------------

  if (
    response.status === 401 &&
    !isPublicEndpoint(endpoint)
  ) {

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
  options = {}
) => {

  const response = await fetch(
    `${API_BASE_URL}${endpoint}`,
    {
      credentials: "include",
      ...options,

      headers: {
        ...(options.headers || {}),
      },
    }
  );


  // ----------------------------------------------------------
  // AUTOMATIC UNAUTHORIZED HANDLING
  //
  // Public endpoints must be allowed to return 401 without
  // redirecting the visitor to the login page.
  // ----------------------------------------------------------

  if (
    response.status === 401 &&
    !isPublicEndpoint(endpoint)
  ) {

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