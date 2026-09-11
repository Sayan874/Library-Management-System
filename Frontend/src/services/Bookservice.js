import api from './api';

// ── Books ─────────────────────────────────────────────────────────────────
export const bookService = {
    getAll: (params = {}) => api.get('/api/books/', { params }),
    getById: (id) => api.get(`/api/books/${id}`),
    create: (data) => api.post('/api/books/', data),
    update: (id, data) => api.put(`/api/books/${id}`, data),
    remove: (id) => api.delete(`/api/books/${id}`),
    searchGoogle: (query) => api.get('/api/books/search', { params: { query } }),
    autofillIsbn: (isbn) => api.get('/api/books/isbn-autofill', { params: { isbn } }),
};

// ── Members ───────────────────────────────────────────────────────────────
export const memberService = {
    getAll: (params = {}) => api.get('/api/members/', { params }),
    getById: (id) => api.get(`/api/members/${id}`),
    create: (data) => api.post('/api/members/', data),
    update: (id, data) => api.put(`/api/members/${id}`, data),
    remove: (id) => api.delete(`/api/members/${id}`),
};

// ── Issues ────────────────────────────────────────────────────────────────
export const issueService = {
    getAll: (params = {}) => api.get('/api/issues/', { params }),
    getById: (id) => api.get(`/api/issues/${id}`),
    issueBook: (data) => api.post('/api/issues/', data),
    returnBook: (issueId) => api.post(`/api/issues/${issueId}/return`),
};

// ── Stats ─────────────────────────────────────────────────────────────────
export const statsService = {
    get: () => api.get('/api/stats'),
};

// ── Staff ─────────────────────────────────────────────────────────────────
export const staffService = {
    getAll: (params = {}) => api.get('/api/staff/', { params }),
    getById: (id) => api.get(`/api/staff/${id}`),
    create: (data) => api.post('/api/staff/', data),
    update: (id, data) => api.put(`/api/staff/${id}`, data),
    remove: (id) => api.delete(`/api/staff/${id}`),
};
