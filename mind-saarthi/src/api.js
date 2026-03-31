// src/api.js
import axios from 'axios';

// Dynamically uses the .env variable, fallback to localhost for safety

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const api = axios.create({
    baseURL: BASE_URL,
    headers: { 'Content-Type': 'application/json' }
});

// Helper to attach authorization token to requests automatically
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('mindsaarthi_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

export default api;
