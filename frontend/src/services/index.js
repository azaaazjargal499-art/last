// smart-inventory/frontend/src/services/tradeService.js
import api from './api';

export const tradeService = {
  getAll:  (params) => api.get('/trades', { params }).then(r => r.data),
  getById: (id)     => api.get(`/trades/${id}`).then(r => r.data),
  create:  (data)   => api.post('/trades', data).then(r => r.data),
  update:  (id, data) => api.put(`/trades/${id}`, data).then(r => r.data),
  delete:  (id)     => api.delete(`/trades/${id}`).then(r => r.data),
};

// smart-inventory/frontend/src/services/analyticsService.js
export const analyticsService = {
  getDashboard:  () => api.get('/analytics/dashboard').then(r => r.data),
  getMonthly:    (year) => api.get('/analytics/monthly', { params: { year } }).then(r => r.data),
  getPairs:      () => api.get('/analytics/pairs').then(r => r.data),
  getHourly:     () => api.get('/analytics/hourly').then(r => r.data),
  getEquityCurve:() => api.get('/analytics/equity-curve').then(r => r.data),
};

// smart-inventory/frontend/src/services/alertService.js
export const alertService = {
  getAll:   () => api.get('/alerts').then(r => r.data),
  create:   (data) => api.post('/alerts', data).then(r => r.data),
  update:   (id, data) => api.put(`/alerts/${id}`, data).then(r => r.data),
  delete:   (id) => api.delete(`/alerts/${id}`).then(r => r.data),
};

// smart-inventory/frontend/src/services/strategyService.js
export const strategyService = {
  getAll:   () => api.get('/strategies').then(r => r.data),
  create:   (data) => api.post('/strategies', data).then(r => r.data),
  update:   (id, data) => api.put(`/strategies/${id}`, data).then(r => r.data),
  delete:   (id) => api.delete(`/strategies/${id}`).then(r => r.data),
};

// smart-inventory/frontend/src/services/riskService.js
export const riskService = {
  calculate: (data) => api.post('/risk/calculate', data).then(r => r.data),
  getExposure:()    => api.get('/risk/exposure').then(r => r.data),
  getPairs:()       => api.get('/risk/pairs').then(r => r.data),
};

// smart-inventory/frontend/src/services/authService.js
export const authService = {
  login:    (data) => api.post('/auth/login', data).then(r => r.data),
  register: (data) => api.post('/auth/register', data).then(r => r.data),
  requestResetCode: (data) => api.post('/auth/request-reset-code', data).then(r => r.data),
  resetPassword: (data) => api.post('/auth/reset-password', data).then(r => r.data),
  getMe:    ()     => api.get('/auth/me').then(r => r.data),
  update:   (data) => api.put('/auth/profile', data).then(r => r.data),
};

export const adminService = {
  getOverview: () => api.get('/admin/overview').then(r => r.data),
  getUsers: (params) => api.get('/admin/users', { params }).then(r => r.data),
  updateUser: (id, data) => api.patch(`/admin/users/${id}`, data).then(r => r.data),
  getLessons: () => api.get('/admin/lessons').then(r => r.data),
  createLesson: (data) => api.post('/admin/lessons', data).then(r => r.data),
  updateLesson: (id, data) => api.put(`/admin/lessons/${id}`, data).then(r => r.data),
  deleteLesson: (id) => api.delete(`/admin/lessons/${id}`).then(r => r.data),
};

export const lessonService = {
  getAll: (params) => api.get('/lessons', { params }).then(r => r.data),
};

export const brokerService = {
  status: () => api.get('/broker/status').then(r => r.data),
  connect: (data) => api.post('/broker/connect', data).then(r => r.data),
  sync: () => api.post('/broker/sync').then(r => r.data),
  createEaToken: () => api.post('/broker/ea-token').then(r => r.data),
  disconnect: () => api.post('/broker/disconnect').then(r => r.data),
};
