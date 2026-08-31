const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "http://127.0.0.1:8000";


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


  let data = null;

  try {
    data = await response.json();
  } catch {
    data = null;
  }


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
      body: JSON.stringify(body),
    });
  },


  delete(endpoint) {
    return request(endpoint, {
      method: "DELETE",
    });
  },
};


export default api;