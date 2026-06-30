import axios from 'axios';

const client = axios.create({ baseURL: '/api' });

client.interceptors.request.use(cfg => {
  const token = localStorage.getItem('token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

client.interceptors.response.use(
  r => r,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export const authApi = {
  login: (data) => client.post('/auth/login', data),
  logout: () => client.post('/auth/logout'),
  me: () => client.get('/auth/me'),
  changePassword: (data) => client.post('/auth/change-password', data),
  getPreferences: () => client.get('/auth/preferences'),
  updatePreferences: (data) => client.put('/auth/preferences', data),
};

export const venuesApi = {
  list: () => client.get('/venues'),
  get: (venueId) => client.get(`/venues/${venueId}`),
  refresh: () => client.post('/venues/refresh'),
};

export const favouritesApi = {
  get: () => client.get('/favourites'),
  set: (venue_id) => client.put('/favourites', { venue_id }),
  clear: () => client.delete('/favourites'),
};

export const usersApi = {
  list: () => client.get('/users'),
  create: (data) => client.post('/users', data),
  update: (id, data) => client.put(`/users/${id}`, data),
  resetPassword: (id) => client.put(`/users/${id}/reset-password`),
  delete: (id) => client.delete(`/users/${id}`),
};

export default client;
