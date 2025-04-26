export const BASE_URL = import.meta.env.VITE_API_BASE_URL;
export const TOKEN_KEY = import.meta.env.VITE_TOKEN_KEY;
export const USER_KEY = import.meta.env.VITE_USER_KEY;

export const setToken = (token: string) =>
    localStorage.setItem(TOKEN_KEY, token);
export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const removeToken = () => localStorage.removeItem(TOKEN_KEY);
