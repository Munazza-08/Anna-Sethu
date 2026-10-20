// Set VITE_API_URL in Vercel to the public backend URL.
export const BACKEND_URL = (import.meta.env.VITE_API_URL || 'https://anna-sethu.onrender.com')
  .replace(/\/$/, '');

export const backendAssetUrl = (path) => (
  path?.startsWith('http') ? path : `${BACKEND_URL}${path || ''}`
);
