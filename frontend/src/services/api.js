const API_BASE_URL = 'http://localhost:5000/api';

/**
 * Generic HTTP request helper with automatic JWT injection and JSON parsing
 */
async function request(endpoint, options = {}) {
  const token = localStorage.getItem('raahi_token');

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers
    });

    const data = await response.json();

    if (!response.ok) {
      // Throw error containing backend error message
      const error = new Error(data.message || 'Something went wrong');
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (err) {
    if (!err.status) {
      // Network error or backend offline
      const networkError = new Error('Cannot connect to Raahi backend server. Make sure it is running on port 5000.');
      networkError.status = 503;
      throw networkError;
    }
    throw err;
  }
}

// Authentication API calls
export const authService = {
  register: (name, email, password, role) => {
    return request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, role })
    });
  },

  login: (email, password) => {
    return request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
  }
};

// User Profile API calls
export const userService = {
  getCurrentUser: () => {
    return request('/users/me', {
      method: 'GET'
    });
  }
};

// Vehicle API calls (Driver Only)
export const vehicleService = {
  getMyVehicle: () => {
    return request('/vehicles/me', {
      method: 'GET'
    });
  },

  addVehicle: (vehicleData) => {
    return request('/vehicles', {
      method: 'POST',
      body: JSON.stringify(vehicleData)
    });
  },

  updateVehicle: (vehicleData) => {
    return request('/vehicles/me', {
      method: 'PUT',
      body: JSON.stringify(vehicleData)
    });
  }
};
