import axios from 'axios';

// The base URL for your Python Flask backend
const BASE_URL = 'http://localhost:5000';

const api = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json'
    }
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
