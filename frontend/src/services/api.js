import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000",
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("sf_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const login = (payload) => api.post("/api/auth/login", payload);
export const register = (payload) => api.post("/api/auth/register", payload);
export const analyze = (payload) => api.post("/api/analyze", payload);
export const listProjects = () => api.get("/api/projects");
export const createProject = (payload) => api.post("/api/projects", payload);
export const updateProject = (id, payload) => api.put(`/api/projects/${id}`, payload);
export const getProject = (id) => api.get(`/api/projects/${id}`);
export const deleteProject = (id) => api.delete(`/api/projects/${id}`);
export const listTemplates = () => api.get("/api/templates");
export const getInsights = (payload) => api.post("/api/insights", payload);

export default api;
