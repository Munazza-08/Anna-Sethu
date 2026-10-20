import { BACKEND_URL } from './backend';

const API_BASE = `${BACKEND_URL}/api`;

async function request(path, { method = 'GET', body, auth = true } = {}) {
  const headers = {};
  const token = localStorage.getItem('annasethu_token');

  if (auth && token) headers.Authorization = `Bearer ${token}`;
  if (body && !(body instanceof FormData)) headers['Content-Type'] = 'application/json';

  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
  });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.message || `Request failed (${response.status})`);
    error.response = { status: response.status, data };
    throw error;
  }

  return { data };
}

export const register = (details) => request('/auth/register', {
  method: 'POST', body: details, auth: false,
});

export const login = (credentials) => request('/auth/login', {
  method: 'POST', body: credentials, auth: false,
});

export const getMe = () => request('/auth/me');

export const updateProfile = (profile) => request('/auth/profile', {
  method: 'PUT', body: profile,
});

export const createFoodRequest = (formData) => request('/food-requests', {
  method: 'POST', body: formData,
});

export const getNearbyRequests = (lat, lng, radius = 10000) => {
  const params = new URLSearchParams({ lat: String(lat), lng: String(lng), radius: String(radius) });
  return request(`/food-requests/nearby?${params}`);
};

export const getMyRequests = () => request('/food-requests/mine');
export const getMyDeliveries = () => request('/food-requests/my-deliveries');

export const acceptRequest = (id) => request(`/food-requests/${encodeURIComponent(id)}/accept`, {
  method: 'PATCH',
});

export const markInTransit = (id) => request(`/food-requests/${encodeURIComponent(id)}/transit`, {
  method: 'PATCH',
});

export const completeDelivery = (id, formData) => request(
  `/food-requests/${encodeURIComponent(id)}/complete`,
  { method: 'PATCH', body: formData },
);

export const getRequest = (id) => request(`/food-requests/${encodeURIComponent(id)}`);
export const getCertificates = () => request('/users/certificates');
export const getDeliveryHistory = () => request('/users/deliveries');
export const getCoupons = () => request('/users/coupons');
export const redeemCoupon = (couponId) => request(`/users/coupons/${encodeURIComponent(couponId)}/redeem`, { method: 'POST' });
export const addCoupon = (coupon) => request('/users/coupons', { method: 'POST', body: coupon });
export const getCouponCatalog = () => request('/users/coupon-catalog');
export const toggleCoupon = (couponId) => request(`/users/coupons/${encodeURIComponent(couponId)}/toggle`, { method: 'PATCH' });
export const getOperatorOverview = () => request('/users/operator/overview');
export const resolveIssueReport = (reportId, resolutionNote = '') => request(`/users/operator/reports/${encodeURIComponent(reportId)}/resolve`, { method: 'PATCH', body: { resolutionNote } });
export const createIssueReport = (report) => request('/users/reports', { method: 'POST', body: report });
export const getStats = () => request('/users/stats');

export default {
  register, login, getMe, updateProfile, createFoodRequest, getNearbyRequests,
  getMyRequests, getMyDeliveries, acceptRequest, markInTransit,
  completeDelivery, getRequest, getCertificates, getDeliveryHistory,
  getCoupons, redeemCoupon, addCoupon, getCouponCatalog, toggleCoupon,
  getOperatorOverview, resolveIssueReport, createIssueReport, getStats,
};
