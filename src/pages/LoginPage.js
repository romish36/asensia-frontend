import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePermissionContext } from '../contexts/PermissionContext';
import { toast } from 'react-toastify'; // Assuming react-toastify is installed
import '../styles/login.css';
import API_BASE_URL from '../config/apiConfig';

function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { fetchMyPermissions, fetchCategories, setAppLoading } = usePermissionContext();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setAppLoading(true);

        const endpoint = `${API_BASE_URL}/auth/login`;
        const payload = { email: email.trim(), password };

        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (response.ok) {
                sessionStorage.setItem('isAuthenticated', 'true');
                sessionStorage.setItem('token', data.token);
                sessionStorage.setItem('user', JSON.stringify(data));

                // Fetch data immediately
                await Promise.all([
                    fetchMyPermissions(),
                    fetchCategories()
                ]);

                toast.success('Login successful!');

                // Show plan warning toast if plan is expiring soon (≤ 10 days)
                if (data.planWarning) {
                    const { daysRemaining, planName } = data.planWarning;
                    toast.warn(
                        `⏳ Warning: Your plan "${planName || 'subscription'}" will expire in ${daysRemaining} day${daysRemaining === 1 ? '' : 's'}. Please renew soon!`,
                        { autoClose: 12000, position: 'top-center' }
                    );
                }

                // Navigate based on role
                const role = data.role?.toUpperCase();
                if (role === 'SUPER_ADMIN') {
                    navigate('/super-admin/dashboard');
                } else if (role === 'ADMIN') {
                    navigate('/admin/dashboard');
                } else {
                    navigate('/user/dashboard');
                }
            } else {
                toast.error(data.message || 'Login failed');
                setLoading(false);
                setAppLoading(false);
            }
        } catch (error) {
            console.error('Auth error:', error);
            toast.error('Something went wrong. Please try again.');
            setLoading(false);
            setAppLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <div className="login-header">
                    <h1>Welcome to Asensia World</h1>
                    <p>Please sign in to your account</p>
                </div>

                <form className="login-form" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="email">Email</label>
                        <div className="input-wrapper">
                            <input
                                id="email"
                                type="email"
                                placeholder="Enter your email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <div className="input-wrapper">
                            <input
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                placeholder="............"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                            <button
                                type="button"
                                className="password-toggle"
                                onClick={() => setShowPassword(!showPassword)}
                                aria-label={showPassword ? 'Hide password' : 'Show password'}
                            >
                                {showPassword ? (
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                        <circle cx="12" cy="12" r="3"></circle>
                                    </svg>
                                ) : (
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                                        <line x1="1" y1="1" x2="23" y2="23"></line>
                                    </svg>
                                )}
                            </button>
                        </div>
                        <div style={{ textAlign: 'right', marginTop: '8px' }}>
                            <span
                                className="toggle-link"
                                onClick={() => navigate('/change-password')}
                                style={{ fontSize: '14px', color: '#0c3447', cursor: 'pointer', fontWeight: '500' }}
                            >
                                Forgot Password?
                            </span>
                        </div>
                    </div>

                    <button type="submit" className="login-btn" disabled={loading}>
                        {loading ? 'Logging in...' : 'Login'}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default LoginPage;
