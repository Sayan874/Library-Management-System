import axios from 'axios';

// Empty baseURL = use Vite's built-in /api proxy (configured in vite.config.js).
// This eliminates IPv4/IPv6 and CORS issues entirely.
const api = axios.create({
    baseURL: '',
    headers: { 'Content-Type': 'application/json' },
});

export default api;
