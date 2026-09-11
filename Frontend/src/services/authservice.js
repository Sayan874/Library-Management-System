const ROLE_KEY = 'lms_role';

export const authService = {
    login(role) {
        localStorage.setItem(ROLE_KEY, role);
    },
    logout() {
        localStorage.removeItem(ROLE_KEY);
    },
    getRole() {
        return localStorage.getItem(ROLE_KEY); // 'admin' | 'user' | null
    },
    isLoggedIn() {
        return !!localStorage.getItem(ROLE_KEY);
    },
    isAdmin() {
        return localStorage.getItem(ROLE_KEY) === 'admin';
    },
};
