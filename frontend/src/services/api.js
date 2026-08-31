const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "http://127.0.0.1:8000";


// --------------------------------------------------
// Shared refresh promise
// Prevents multiple simultaneous refresh requests.
// --------------------------------------------------

let refreshPromise = null;


const refreshAccessToken = async () => {
  if (!refreshPromise) {
    refreshPromise = fetch(
      `${API_BASE_URL}/auth/refresh`,
      {
        method: "POST",
        credentials: "include",
      }
    )
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("Session refresh failed");
        }

        try {
          return await response.json();
        } catch {
          return null;
        }
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
};


// --------------------------------------------------
// Request helper
// --------------------------------------------------

const request = async (
  endpoint,
  options = {},
  retry = true
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


  // ------------------------------------------------
  // Handle expired authentication once
  // ------------------------------------------------

  if (
    response.status === 401 &&
    retry &&
    !endpoint.startsWith("/auth/")
  ) {
    try {
      await refreshAccessToken();

      return request(
        endpoint,
        options,
        false
      );
    } catch {
      // Continue to normal error handling below.
    }
  }


  // ------------------------------------------------
  // Parse response
  // ------------------------------------------------

  let data = null;

  try {
    data = await response.json();
  } catch {
    data = null;
  }


  // ------------------------------------------------
  // Handle errors
  // ------------------------------------------------

  if (!response.ok) {
    const error = new Error(
      data?.detail ||
        "Something went wrong"
    );

    error.status =
      response.status;

    error.data = data;

    throw error;
  }


  return data;
};


// --------------------------------------------------
// API methods
// --------------------------------------------------

const api = {
  get(endpoint) {
    return request(endpoint, {
      method: "GET",
    });
  },


  post(endpoint, body) {
    return request(endpoint, {
      method: "POST",

      body:
        body instanceof FormData
          ? body
          : JSON.stringify(body),
    });
  },


  patch(endpoint, body) {
    return request(endpoint, {
      method: "PATCH",

      body:
        body instanceof FormData
          ? body
          : JSON.stringify(body),
    });
  },


  delete(endpoint) {
    return request(endpoint, {
      method: "DELETE",
    });
  },
};


export default api;