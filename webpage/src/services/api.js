import axios from "axios";

// Create an Axios instance pointing to the existing POS backend
const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "http://43.229.149.151:5000/api",
    headers: {
        "Content-Type": "application/json",
    },
});

export const getSnakes = async (params = {}) => {
    try {
        const response = await api.get('/snakes', { params });
        return response.data;
    } catch (error) {
        console.error("Error fetching snakes:", error);
        throw error;
    }
};

export const getSnakeById = async (id) => {
    try {
        const response = await api.get(`/snakes/${id}`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching snake ${id}:`, error);
        throw error;
    }
};

export const getCategories = async () => {
    try {
        const response = await api.get('/categories');
        return response.data;
    } catch (error) {
        console.error("Error fetching categories:", error);
        throw error;
    }
};

export const createOrder = async (orderData) => {
    try {
        const token = localStorage.getItem('customerToken');
        const response = await api.post('/orders', orderData, {
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        return response.data;
    } catch (error) {
        console.error("Error creating order:", error);
        throw error;
    }
};

// Customer Auth API
export const customerLogin = async (email, password) => {
    try {
        const response = await api.post('/customer-auth/login', { email, password });
        if (response.data.token) {
            localStorage.setItem('customerToken', response.data.token);
        }
        return response.data;
    } catch (error) {
        console.error("Login error:", error);
        throw error;
    }
};

export const customerRegister = async (userData) => {
    try {
        const response = await api.post('/customer-auth/register', userData);
        if (response.data.token) {
            localStorage.setItem('customerToken', response.data.token);
        }
        return response.data;
    } catch (error) {
        console.error("Registration error:", error);
        throw error;
    }
};

export const getCustomerProfile = async () => {
    try {
        const token = localStorage.getItem('customerToken');
        const response = await api.get('/customer-auth/me', {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    } catch (error) {
        console.error("Profile fetch error:", error);
        throw error;
    }
};

export const getCustomerOrders = async () => {
    try {
        const token = localStorage.getItem('customerToken');
        const response = await api.get('/customer-auth/orders', {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    } catch (error) {
        console.error("Orders fetch error:", error);
        throw error;
    }
};

export const getSystemSettings = async () => {
    try {
        const response = await api.get('/settings');
        return response.data;
    } catch (error) {
        console.error("Error fetching settings:", error);
        throw error;
    }
};

export const logoutCustomer = () => {
    localStorage.removeItem('customerToken');
};

export default api;
