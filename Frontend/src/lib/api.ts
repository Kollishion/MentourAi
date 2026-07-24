export const API = {
  AUTH: {
    REGISTER: `${import.meta.env.VITE_API_BASE_URL}/auth/register`,
    VERIFY_EMAIL: `${import.meta.env.VITE_API_BASE_URL}/auth/verify-email`,
    LOGIN: `${import.meta.env.VITE_API_BASE_URL}/auth/login`,
    PROFILE: `${import.meta.env.VITE_API_BASE_URL}/auth/profile`,
    LOGOUT: `${import.meta.env.VITE_API_BASE_URL}/auth/logout`,
    FORGOT_PASSWORD: `${import.meta.env.VITE_API_BASE_URL}/auth/forgot-password`,
    RESET_PASSWORD: `${import.meta.env.VITE_API_BASE_URL}/auth/reset-password`,
  },

  ADMIN: {
    USERS: `${import.meta.env.VITE_API_BASE_URL}/admin/users`,
    UPDATE_ROLE: (id: string) =>
      `${import.meta.env.VITE_API_BASE_URL}/admin/users/${id}/role`,
    UPDATE_STATUS: (id: string) =>
      `${import.meta.env.VITE_API_BASE_URL}/admin/users/${id}/status`,
  },
};
