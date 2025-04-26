import axios from "axios";
import { TOKEN_KEY } from "../utils";
import { Project, Skill } from "../types";

const baseURL = "";

const api = axios.create({
    baseURL,
    headers: {
        "Content-Type": "application/json",
    },
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    if (config.data instanceof FormData) {
        delete config.headers["Content-Type"];
    }

    const requestId = `${config.method}-${config.url}-${Date.now()}`;
    config.headers["X-Request-ID"] = requestId;

    return config;
});

export const endpoints = {
    // Auth
    auth: {
        login: (credentials: { email: string; password: string }) =>
            api.post("/api/auth/login", credentials),
        logout: () => api.post("/api/auth/logout"),
        profile: () => api.get("/api/auth/profile"),
        updateProfile: (userData: any) =>
            api.put("/api/auth/profile", userData),
    },

    // CV
    cv: {
        // For file uploads, we need to use the right configuration
        // The server is likely expecting a specific field name
        upload: (formData: FormData) => {
            // Make sure we're not overriding the Content-Type header
            // Let axios set it automatically with the correct boundary
            return api.post("/api/cv/upload", formData, {
                headers: {
                    // Override any default content-type to let the browser set it
                    'Content-Type': undefined
                }
            });
        },
        get: () => api.get("/api/cv", { responseType: 'blob' }),
        check: () => api.get("/api/cv/status"),
        delete: () => api.delete("/api/cv"),
    },

    // Skills
    skills: {
        get: () => api.get("/api/skills"),
        add: (skill: Skill) => api.post("/api/skills", skill),
        update: (id: number, skill: Skill) =>
            api.put(`/api/skills/${id}`, skill),
        delete: (id: number) => api.delete(`/api/skills/${id}`),
    },

    // Projects
    projects: {
        get: () => api.get("/api/projects"),
        add: (project: Project) => api.post("/api/projects", project),
        update: (id: number, project: Project) =>
            api.put(`/api/projects/${id}`, project),
        delete: (id: number) => api.delete(`/api/projects/${id}`),
    },
};
