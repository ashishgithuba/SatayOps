import api from '../api/axios';

export const authService = {
  login: (credentials) => api.post('/auth/login', credentials),
  registerOwner: (data) => api.post('/auth/register/owner', data),
  getMe: () => api.get('/auth/me'),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, newPassword) => api.post('/auth/reset-password', { token, newPassword }),
};

export const pgService = {
  createPg: (data) => api.post('/pg', data),
  getAllPgs: (params) => api.get('/pg', { params }),
  getMyPgs: (params) => api.get('/pg/my-pgs', { params }),
  getPgById: (id) => api.get(`/pg/${id}`),
};

export const floorService = {
  createFloor: (data) => api.post('/floors', data),
  getFloors: (params) => api.get('/floors', { params }),
  getFloorsByPg: (pgId) => api.get(`/pg/${pgId}/floors`),
  getFloorById: (id) => api.get(`/floors/${id}`),
  updateFloor: (id, data) => api.patch(`/floors/${id}`, data),
  deleteFloor: (id) => api.delete(`/floors/${id}`),
};

export const roomService = {
  createRoom: (data) => api.post('/rooms', data),
  getRooms: (params) => api.get('/rooms', { params }),
  getRoomsByPg: (pgId, params) => api.get(pgId ? `/pg/${pgId}/rooms` : '/rooms', { params }),
  getRoomsByFloor: (floorId, params) => api.get(`/floors/${floorId}/rooms`, { params }),
  getRoomById: (id) => api.get(`/rooms/${id}`),
  updateRoom: (id, data) => api.patch(`/rooms/${id}`, data),
  deleteRoom: (id) => api.delete(`/rooms/${id}`),
};

export const bedService = {
  createBed: (data) => api.post('/beds', data),
  getBeds: (params) => api.get('/beds', { params }),
  getBedsByRoom: (roomId) => api.get(`/rooms/${roomId}/beds`),
  getBedById: (id) => api.get(`/beds/${id}`),
  updateBed: (id, data) => api.patch(`/beds/${id}`, data),
  deleteBed: (id) => api.delete(`/beds/${id}`),
};

export const residentService = {
  getResidents: (params) => api.get('/residents', { params }),
  getResidentById: (id) => api.get(`/residents/${id}`),
  createResident: (formData) =>
    api.post('/residents', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  updateResident: (id, formData) =>
    api.patch(`/residents/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  deleteResident: (id) => api.delete(`/residents/${id}`),
  uploadDocument: (formData) =>
    api.post('/resident-documents', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  verifyDocument: (docId, verified) =>
    api.patch(`/resident-documents/${docId}/verify`, { verified }),
};

export const allocationService = {
  allocateBed: (data) => api.post('/allocations', data),
  getAllocations: (params) => api.get('/allocations', { params }),
  getAllocationById: (id) => api.get(`/allocations/${id}`),
  checkout: (id, data) => api.post(`/allocations/${id}/checkout`, data),
  transfer: (id, data) => api.post(`/allocations/${id}/transfer`, data),
  getResidentAllocations: (residentId) => api.get(`/residents/${residentId}/allocations`),
  getResidentCurrentAllocation: (residentId) => api.get(`/residents/${residentId}/current-allocation`),
  getMyAllocation: () => api.get('/allocations/my'),
};

export const invoiceService = {
  generateInvoices: (data) => api.post('/invoices/generate', data),
  getInvoices: (params) => api.get('/invoices', { params }),
  getInvoiceById: (id) => api.get(`/invoices/${id}`),
  createInvoice: (data) => api.post('/invoices', data),
};

export const paymentService = {
  recordPayment: (data) => api.post('/payments', data),
  createPaymentRequest: (data) => api.post('/payments/request', data),
  approvePayment: (id) => api.patch(`/payments/${id}/approve`),
  rejectPayment: (id, reason) => api.patch(`/payments/${id}/reject`, { rejection_reason: reason }),
  getPayments: (params) => api.get('/payments', { params }),
  getPendingRequests: () => api.get('/payments/pending'),
};

export const maintenanceService = {
  createRequest: (data) => api.post('/maintenance', data),
  getRequests: (params) => api.get('/maintenance', { params }),
  getRequestById: (id) => api.get(`/maintenance/${id}`),
  updateStatus: (id, data) => api.patch(`/maintenance/${id}/status`, data),
  deleteRequest: (id) => api.delete(`/maintenance/${id}`),
};

export const noticeService = {
  createNotice: (data) => api.post('/notices', data),
  getNotices: (params) => api.get('/notices', { params }),
  updateNoticeStatus: (id, data) => api.patch(`/notices/${id}/status`, data),
  deleteNotice: (id) => api.delete(`/notices/${id}`),
};
