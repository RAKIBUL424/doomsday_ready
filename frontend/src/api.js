export async function apiRequest(endpoint, options = {}) {
  const url = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  if (config.body && typeof config.body === 'object' && !(config.body instanceof FormData)) {
    config.body = JSON.stringify(config.body);
  }

  const res = await fetch(url, config);

  let data = null;
  const contentType = res.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    try {
      data = await res.json();
    } catch {
      data = null;
    }
  }

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    let code = undefined;

    if (data && data.detail) {
      if (Array.isArray(data.detail)) {
        // 422 Validation errors
        message = data.detail.map((err) => err.msg || JSON.stringify(err)).join(', ');
      } else if (typeof data.detail === 'object') {
        // Custom error: { detail: { code: "...", message: "..." } }
        code = data.detail.code;
        message = data.detail.message || message;
      } else if (typeof data.detail === 'string') {
        message = data.detail;
      }
    } else if (data && data.message) {
      message = data.message;
      code = data.code;
    }

    const error = new Error(message);
    error.status = res.status;
    if (code) {
      error.code = code;
    }
    error.data = data;
    throw error;
  }

  return data;
}

export const api = {
  getMovies: async () => {
    try {
      return await apiRequest('/api/movies', { method: 'GET' });
    } catch (err) {
      if (err.status === 405 || err.status === 404) {
        return await apiRequest('/api/movies/list', { method: 'GET' });
      }
      throw err;
    }
  },

  createMovie: (body) => apiRequest('/api/movies', { method: 'POST', body }),

  patchMovie: (id, body) => apiRequest(`/api/movies/${id}`, { method: 'PATCH', body }),

  getRewatchOrder: (id) => apiRequest(`/api/movies/${id}/rewatch-order`, { method: 'GET' }),

  getCinemas: () => apiRequest('/api/cinemas', { method: 'GET' }),

  createCinema: (body) => apiRequest('/api/cinemas', { method: 'POST', body }),

  getBookingQuote: (id, groupSize) =>
    apiRequest(`/api/cinemas/${id}/booking?groupSize=${encodeURIComponent(groupSize)}`, { method: 'GET' }),
};
