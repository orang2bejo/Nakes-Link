import axios from 'axios';
import { getIdToken } from './firebase';
import toast from 'react-hot-toast';

// Create axios instance
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await getIdToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.warn('Failed to get auth token:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    const { response } = error;
    
    if (response) {
      const { status, data } = response;
      
      switch (status) {
        case 401:
          // Unauthorized - redirect to login
          if (window.location.pathname !== '/login') {
            toast.error('Sesi telah berakhir. Silakan login kembali.');
            window.location.href = '/login';
          }
          break;
        case 403:
          toast.error('Anda tidak memiliki akses untuk melakukan tindakan ini.');
          break;
        case 404:
          toast.error('Data tidak ditemukan.');
          break;
        case 422:
          // Validation errors
          if (data.errors) {
            const errorMessages = Object.values(data.errors).flat();
            errorMessages.forEach(msg => toast.error(msg));
          } else {
            toast.error(data.message || 'Data tidak valid.');
          }
          break;
        case 429:
          toast.error('Terlalu banyak permintaan. Coba lagi nanti.');
          break;
        case 500:
          toast.error('Terjadi kesalahan server. Coba lagi nanti.');
          break;
        default:
          toast.error(data.message || 'Terjadi kesalahan.');
      }
    } else if (error.code === 'NETWORK_ERROR') {
      toast.error('Koneksi internet bermasalah.');
    } else {
      toast.error('Terjadi kesalahan yang tidak diketahui.');
    }
    
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  logout: () => api.post('/auth/logout'),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.put('/auth/change-password', data),
  verifyEmail: (token) => api.post('/auth/verify-email', { token }),
  resendVerification: () => api.post('/auth/resend-verification'),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (data) => api.post('/auth/reset-password', data),
};

// Users API
export const usersAPI = {
  getAll: (params) => api.get('/users', { params }),
  getById: (id) => api.get(`/users/${id}`),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
  uploadAvatar: (file) => {
    const formData = new FormData();
    formData.append('avatar', file);
    return api.post('/users/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  updateStatus: (id, status) => api.put(`/users/${id}/status`, { status }),
};

// Services API
export const servicesAPI = {
  getAll: (params) => api.get('/services', { params }),
  getById: (id) => api.get(`/services/${id}`),
  getByCategory: (category, params) => api.get(`/services/category/${category}`, { params }),
  getPopular: (params) => api.get('/services/popular', { params }),
  getByNakes: (nakesId, params) => api.get(`/services/nakes/${nakesId}`, { params }),
  create: (data) => api.post('/services', data),
  update: (id, data) => api.put(`/services/${id}`, data),
  delete: (id) => api.delete(`/services/${id}`),
  uploadImages: (id, files) => {
    const formData = new FormData();
    files.forEach(file => formData.append('images', file));
    return api.post(`/services/${id}/images`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  removeImage: (id, imageId) => api.delete(`/services/${id}/images/${imageId}`),
  toggleStatus: (id) => api.put(`/services/${id}/toggle-status`),
  search: (query, params) => api.get('/services/search', { params: { q: query, ...params } }),
};

// Appointments API
export const appointmentsAPI = {
  getAll: (params) => api.get('/appointments', { params }),
  getById: (id) => api.get(`/appointments/${id}`),
  getByPatient: (patientId, params) => api.get(`/appointments/patient/${patientId}`, { params }),
  getByNakes: (nakesId, params) => api.get(`/appointments/nakes/${nakesId}`, { params }),
  create: (data) => api.post('/appointments', data),
  update: (id, data) => api.put(`/appointments/${id}`, data),
  cancel: (id, reason) => api.put(`/appointments/${id}/cancel`, { reason }),
  reschedule: (id, data) => api.put(`/appointments/${id}/reschedule`, data),
  confirm: (id) => api.put(`/appointments/${id}/confirm`),
  complete: (id, data) => api.put(`/appointments/${id}/complete`, data),
  getAvailableSlots: (nakesId, date) => api.get(`/appointments/slots/${nakesId}`, { params: { date } }),
  getCalendar: (nakesId, month, year) => api.get(`/appointments/calendar/${nakesId}`, { params: { month, year } }),
  getStats: (params) => api.get('/appointments/stats', { params }),
};

// Payments API
export const paymentsAPI = {
  getAll: (params) => api.get('/payments', { params }),
  getById: (id) => api.get(`/payments/${id}`),
  getByUser: (userId, params) => api.get(`/payments/user/${userId}`, { params }),
  create: (data) => api.post('/payments', data),
  cancel: (id) => api.put(`/payments/${id}/cancel`),
  retry: (id) => api.post(`/payments/${id}/retry`),
  requestRefund: (id, data) => api.post(`/payments/${id}/refund`, data),
  getStatus: (id) => api.get(`/payments/${id}/status`),
  getStats: (params) => api.get('/payments/stats', { params }),
  webhook: (provider, data) => api.post(`/payments/webhook/${provider}`, data),
};

// Wallets API
export const walletsAPI = {
  getWallet: () => api.get('/wallets'),
  getBalance: () => api.get('/wallets/balance'),
  getTransactions: (params) => api.get('/wallets/transactions', { params }),
  topUp: (data) => api.post('/wallets/topup', data),
  withdraw: (data) => api.post('/wallets/withdraw', data),
  transfer: (data) => api.post('/wallets/transfer', data),
  setPin: (data) => api.post('/wallets/pin', data),
  changePin: (data) => api.put('/wallets/pin', data),
  verifyPin: (pin) => api.post('/wallets/verify-pin', { pin }),
  getStats: (params) => api.get('/wallets/stats', { params }),
};

// Medical Records API
export const medicalRecordsAPI = {
  getAll: (params) => api.get('/medical-records', { params }),
  getById: (id) => api.get(`/medical-records/${id}`),
  getByPatient: (patientId, params) => api.get(`/medical-records/patient/${patientId}`, { params }),
  getByNakes: (nakesId, params) => api.get(`/medical-records/nakes/${nakesId}`, { params }),
  create: (data) => api.post('/medical-records', data),
  update: (id, data) => api.put(`/medical-records/${id}`, data),
  delete: (id) => api.delete(`/medical-records/${id}`),
  uploadAttachments: (id, files) => {
    const formData = new FormData();
    files.forEach(file => formData.append('attachments', file));
    return api.post(`/medical-records/${id}/attachments`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  removeAttachment: (id, attachmentId) => api.delete(`/medical-records/${id}/attachments/${attachmentId}`),
  downloadAttachment: (id, attachmentId) => api.get(`/medical-records/${id}/attachments/${attachmentId}/download`, {
    responseType: 'blob'
  }),
  search: (query, params) => api.get('/medical-records/search', { params: { q: query, ...params } }),
  getStats: (params) => api.get('/medical-records/stats', { params }),
};

// Chat API
export const chatAPI = {
  getRooms: (params) => api.get('/chat/rooms', { params }),
  getRoom: (roomId) => api.get(`/chat/rooms/${roomId}`),
  createRoom: (data) => api.post('/chat/rooms', data),
  updateRoom: (roomId, data) => api.put(`/chat/rooms/${roomId}`, data),
  leaveRoom: (roomId) => api.delete(`/chat/rooms/${roomId}/leave`),
  getMessages: (roomId, params) => api.get(`/chat/rooms/${roomId}/messages`, { params }),
  sendMessage: (roomId, data) => api.post(`/chat/rooms/${roomId}/messages`, data),
  editMessage: (roomId, messageId, data) => api.put(`/chat/rooms/${roomId}/messages/${messageId}`, data),
  deleteMessage: (roomId, messageId) => api.delete(`/chat/rooms/${roomId}/messages/${messageId}`),
  markAsRead: (roomId, messageId) => api.put(`/chat/rooms/${roomId}/messages/${messageId}/read`),
  uploadMedia: (roomId, files) => {
    const formData = new FormData();
    files.forEach(file => formData.append('media', file));
    return api.post(`/chat/rooms/${roomId}/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  addReaction: (roomId, messageId, emoji) => api.post(`/chat/rooms/${roomId}/messages/${messageId}/reactions`, { emoji }),
  removeReaction: (roomId, messageId, emoji) => api.delete(`/chat/rooms/${roomId}/messages/${messageId}/reactions/${emoji}`),
  setTyping: (roomId, isTyping) => api.post(`/chat/rooms/${roomId}/typing`, { isTyping }),
  searchMessages: (query, params) => api.get('/chat/search', { params: { q: query, ...params } }),
  getUnreadCount: () => api.get('/chat/unread-count'),
  exportHistory: (roomId, params) => api.get(`/chat/rooms/${roomId}/export`, { params, responseType: 'blob' }),
};

// Notifications API
export const notificationsAPI = {
  getAll: (params) => api.get('/notifications', { params }),
  getById: (id) => api.get(`/notifications/${id}`),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAsClicked: (id) => api.put(`/notifications/${id}/clicked`),
  markAsDismissed: (id) => api.put(`/notifications/${id}/dismissed`),
  markAllAsRead: () => api.put('/notifications/mark-all-read'),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  getPreferences: () => api.get('/notifications/preferences'),
  updatePreferences: (data) => api.put('/notifications/preferences', data),
  delete: (id) => api.delete(`/notifications/${id}`),
  deleteAll: () => api.delete('/notifications'),
};

// Reviews API
export const reviewsAPI = {
  getAll: (params) => api.get('/reviews', { params }),
  getById: (id) => api.get(`/reviews/${id}`),
  getByService: (serviceId, params) => api.get(`/reviews/service/${serviceId}`, { params }),
  getByNakes: (nakesId, params) => api.get(`/reviews/nakes/${nakesId}`, { params }),
  getByUser: (userId, params) => api.get(`/reviews/user/${userId}`, { params }),
  create: (data) => api.post('/reviews', data),
  update: (id, data) => api.put(`/reviews/${id}`, data),
  delete: (id) => api.delete(`/reviews/${id}`),
  addResponse: (id, response) => api.post(`/reviews/${id}/response`, { response }),
  updateResponse: (id, response) => api.put(`/reviews/${id}/response`, { response }),
  deleteResponse: (id) => api.delete(`/reviews/${id}/response`),
  uploadImages: (id, files) => {
    const formData = new FormData();
    files.forEach(file => formData.append('images', file));
    return api.post(`/reviews/${id}/images`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  removeImage: (id, imageId) => api.delete(`/reviews/${id}/images/${imageId}`),
  markHelpful: (id) => api.post(`/reviews/${id}/helpful`),
  unmarkHelpful: (id) => api.delete(`/reviews/${id}/helpful`),
  report: (id, reason) => api.post(`/reviews/${id}/report`, { reason }),
  getFeatured: (params) => api.get('/reviews/featured', { params }),
  getStats: (params) => api.get('/reviews/stats', { params }),
};

// Admin API
export const adminAPI = {
  // Dashboard
  getDashboard: () => api.get('/admin/dashboard'),
  getDashboardStats: () => api.get('/admin/dashboard/stats'),
  getDashboardCharts: (params) => api.get('/admin/dashboard/charts', { params }),
  getRecentActivities: (params) => api.get('/admin/dashboard/activities', { params }),

  // User Management
  getUsers: (params) => api.get('/admin/users', { params }),
  getUserDetails: (userId) => api.get(`/admin/users/${userId}`),
  verifyUser: (userId, data) => api.put(`/admin/users/${userId}/verify`, data),
  suspendUser: (userId, data) => api.put(`/admin/users/${userId}/suspend`, data),
  updateUserStatus: (userId, status) => api.put(`/admin/users/${userId}/status`, { status }),

  // Nakes Verification
  getNakesVerifications: (params) => api.get('/admin/nakes/verifications', { params }),
  verifyNakes: (applicationId, data) => api.put(`/admin/nakes/verifications/${applicationId}`, data),
  getNakesDetails: (applicationId) => api.get(`/admin/nakes/verifications/${applicationId}`),

  // Payment Management
  getPayments: (params) => api.get('/admin/payments', { params }),
  getPaymentDetails: (paymentId) => api.get(`/admin/payments/${paymentId}`),
  getPaymentStats: () => api.get('/admin/payments/stats'),
  refundPayment: (paymentId, data) => api.post(`/admin/payments/${paymentId}/refund`, data),

  // Service Management
  getServices: (params) => api.get('/admin/services', { params }),
  getServiceDetails: (serviceId) => api.get(`/admin/services/${serviceId}`),
  updateServiceStatus: (serviceId, data) => api.put(`/admin/services/${serviceId}/status`, data),
  approveService: (serviceId, data) => api.put(`/admin/services/${serviceId}/approve`, data),
  rejectService: (serviceId, data) => api.put(`/admin/services/${serviceId}/reject`, data),

  // Appointment Management
  getAppointments: (params) => api.get('/admin/appointments', { params }),
  getAppointmentDetails: (appointmentId) => api.get(`/admin/appointments/${appointmentId}`),

  // Content Management
  getReviews: (params) => api.get('/admin/reviews', { params }),
  moderateReview: (reviewId, action, reason) => api.put(`/admin/reviews/${reviewId}/moderate`, { action, reason }),
  getReports: (params) => api.get('/admin/reports', { params }),
  moderateContent: (contentId, data) => api.put(`/admin/content/${contentId}/moderate`, data),

  // Reports & Analytics
  getAnalytics: (params) => api.get('/admin/analytics', { params }),
  getUserReports: (params) => api.get('/admin/reports/users', { params }),
  getRevenueReports: (params) => api.get('/admin/reports/revenue', { params }),
  getServiceReports: (params) => api.get('/admin/reports/services', { params }),
  exportReport: (type, params) => api.get(`/admin/reports/export/${type}`, { params, responseType: 'blob' }),

  // Security & Monitoring
  getSecurityLogs: (params) => api.get('/admin/security/logs', { params }),
  getAuditLogs: (params) => api.get('/admin/security/audit', { params }),
  getSecurityStats: () => api.get('/admin/security/stats'),
  blockIP: (ip, data) => api.post('/admin/security/block-ip', { ip, ...data }),
  unblockIP: (ip) => api.delete(`/admin/security/block-ip/${ip}`),

  // System Settings
  getSettings: () => api.get('/admin/settings'),
  updateSettings: (data) => api.put('/admin/settings', data),
  getSystemHealth: () => api.get('/admin/system/health'),
  getSystemLogs: (params) => api.get('/admin/system/logs', { params }),
  backupDatabase: () => api.post('/admin/system/backup'),
  getBackups: () => api.get('/admin/system/backups'),
  restoreBackup: (backupId) => api.post(`/admin/system/restore/${backupId}`),

  // Notifications
  getNotifications: (params) => api.get('/admin/notifications', { params }),
  sendNotification: (data) => api.post('/admin/notifications/send', data),
  markNotificationRead: (notificationId) => api.put(`/admin/notifications/${notificationId}/read`),
  deleteNotification: (notificationId) => api.delete(`/admin/notifications/${notificationId}`),

  // Bulk Operations
  bulkUserAction: (data) => api.post('/admin/users/bulk-action', data),
  bulkServiceAction: (data) => api.post('/admin/services/bulk-action', data),
  bulkPaymentAction: (data) => api.post('/admin/payments/bulk-action', data),
};

// Emergency API
export const emergencyAPI = {
  // Create emergency
  createEmergency: (data) => api.post('/emergency', data),
  
  // Get emergencies
  getEmergencies: (params) => api.get('/emergency', { params }),
  getEmergencyById: (id) => api.get(`/emergency/${id}`),
  getActiveEmergencies: (params) => api.get('/emergency/active', { params }),
  getAllEmergencies: (params) => api.get('/emergency/all', { params }),
  
  // Update emergency
  updateEmergency: (id, data) => api.put(`/emergency/${id}`, data),
  updateEmergencyStatus: (id, status, notes) => api.patch(`/emergency/${id}/status`, { status, notes }),
  
  // Emergency responses
  respondToEmergency: (id, data) => api.post(`/emergency/${id}/respond`, data),
  getEmergencyResponses: (id) => api.get(`/emergency/${id}/responses`),
  
  // Statistics and analytics
  getStatistics: (dateRange) => api.get('/emergency/statistics', { params: { dateRange } }),
  getResponseTimeAnalytics: (dateRange) => api.get('/emergency/analytics/response-time', { params: { dateRange } }),
  getEmergencyTrends: (dateRange) => api.get('/emergency/analytics/trends', { params: { dateRange } }),
  
  // PSC 119 integration
  syncWithPSC119: (id) => api.post(`/emergency/${id}/psc119/sync`),
  getPSC119Status: (ticketId) => api.get(`/emergency/psc119/${ticketId}/status`),
  
  // Location and mapping
  getNearbyProviders: (latitude, longitude, radius) => api.get('/emergency/nearby-providers', {
    params: { latitude, longitude, radius }
  }),
  
  // Emergency types and configuration
  getEmergencyTypes: () => api.get('/emergency/types'),
  updateEmergencyTypes: (data) => api.put('/emergency/types', data),
};

// File upload helper
export const uploadFile = async (file, endpoint, onProgress) => {
  const formData = new FormData();
  formData.append('file', file);
  
  return api.post(endpoint, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress: (progressEvent) => {
      if (onProgress) {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        onProgress(percentCompleted);
      }
    },
  });
};

// Download file helper
export const downloadFile = async (url, filename) => {
  try {
    const response = await api.get(url, {
      responseType: 'blob',
    });
    
    const blob = new Blob([response.data]);
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(downloadUrl);
  } catch (error) {
    console.error('Download failed:', error);
    throw error;
  }
};

export default api;