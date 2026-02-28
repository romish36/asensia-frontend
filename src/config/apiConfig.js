const API_BASE_URL = window.location.hostname === 'localhost'
    ? 'http://localhost:8080/api'
    : 'https://asensia-backend.onrender.com/api';

export default API_BASE_URL;
