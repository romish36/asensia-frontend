import API_BASE_URL from '../config/apiConfig';
import { toast } from 'react-toastify';

/**
 * Enhanced fetch wrapper with better error handling and automatic token inclusion
 */
export const fetchApi = async (endpoint, options = {}) => {
    const token = sessionStorage.getItem('token');
    const headers = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...options.headers,
    };

    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;

    try {
        const response = await fetch(url, { ...options, headers });

        if (!response.ok) {
            const errorBody = await response.json().catch(() => ({}));

            // Handle Permission Denied Globally
            if (response.status === 403) {
                toast.warn("You do not have access to this page. Please contact admin.");
            }

            const error = new Error(errorBody.message || `Server responded with ${response.status}`);
            error.status = response.status;
            error.code = errorBody.code;
            throw error;
        }

        return await response.json();
    } catch (error) {
        if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
            console.error("Network Error: Could not connect to the API at", url);
            toast.error("Could not connect to the server. Please check if the backend is running on port 8080.");
        }
        throw error;
    }
};

export default fetchApi;
