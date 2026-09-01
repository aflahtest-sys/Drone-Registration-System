import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

export const registerAPI = {
  submit: (formData) => api.post('/register/submit', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  }),
  getById: (id) => api.get(`/register/${id}`),
  update: (id, data) => api.put(`/register/${id}`, data)
};

export const searchAPI = {
  search: (query, type, page = 1, limit = 10) =>
    api.get('/search', { params: { query, type, page, limit } }),
  getAllRecords: (page = 1, limit = 20) =>
    api.get('/search/all/records', { params: { page, limit } })
};

export const adminAPI = {
  getStats: () => api.get('/admin/stats'),
  getRecords: (page = 1, limit = 20, status) =>
    api.get('/admin/records', { params: { page, limit, status } }),
  updateStatus: (id, status) =>
    api.put(`/admin/records/${id}/status`, { status }),
  deleteRecord: (id) =>
    api.delete(`/admin/records/${id}`),
  exportJSON: () => api.get('/admin/export/json')
};

export default api;
