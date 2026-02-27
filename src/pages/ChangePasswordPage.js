import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import fetchApi from '../utils/api.js';
import '../styles/ChangePasswordPage.css';

function ChangePasswordPage() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [step, setStep] = useState(1); // 1: Email, 2: OTP & New Password
    const [loading, setLoading] = useState(false);

    const [showPasswords, setShowPasswords] = useState({
        new: false,
        confirm: false
    });

    const togglePasswordVisibility = (field) => {
        setShowPasswords(prev => ({
            ...prev,
            [field]: !prev[field]
        }));
    };

    const handleSendOtp = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            await fetchApi('/auth/forgot-password', {
                method: 'POST',
                body: JSON.stringify({ email: email.trim() })
            });
            toast.success('OTP sent to your email!');
            setStep(2);
        } catch (error) {
            toast.error(error.message || 'Failed to send OTP');
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();

        if (newPassword !== confirmPassword) {
            toast.error('Passwords do not match!');
            return;
        }

        if (newPassword.length < 6) {
            toast.error('Password must be at least 6 characters long!');
            return;
        }

        try {
            setLoading(true);
            await fetchApi('/auth/reset-password', {
                method: 'POST',
                body: JSON.stringify({
                    email: email.trim(),
                    otp: otp.trim(),
                    newPassword
                })
            });
            toast.success('Password reset successfully!');
            navigate('/login');
        } catch (error) {
            toast.error(error.message || 'Failed to reset password');
        } finally {
            setLoading(false);
        }
    };

    const EyeIcon = () => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
            <circle cx="12" cy="12" r="3"></circle>
        </svg>
    );

    const EyeOffIcon = () => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
            <line x1="1" y1="1" x2="23" y2="23"></line>
        </svg>
    );

    return (
        <div className="change-password-container">
            <div className="change-password-header">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <h1 className="change-password-title">Reset Password</h1>
                    <button
                        onClick={() => navigate(-1)}
                        style={{
                            padding: '8px 16px',
                            backgroundColor: '#f1f5f9',
                            border: '1px solid #e2e8f0',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            color: '#475569',
                            fontWeight: '600',
                            fontSize: '14px'
                        }}
                    >
                        Back
                    </button>
                </div>
                <p className="change-password-subtitle">
                    {step === 1 ? 'Enter your email to receive an OTP' : 'Enter the OTP sent to your email and your new password'}
                </p>
            </div>

            <div className="change-password-content">
                <div className="change-password-card">
                    {step === 1 ? (
                        <form onSubmit={handleSendOtp}>
                            <div className="password-form-group">
                                <label className="password-form-label">
                                    Email Address <span style={{ color: 'red' }}>*</span>
                                </label>
                                <input
                                    type="email"
                                    className="password-form-input"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Enter your registered email"
                                    required
                                />
                            </div>
                            <div className="password-form-actions">
                                <button type="submit" className="btn-change-password" disabled={loading}>
                                    {loading ? 'Sending...' : 'Send OTP'}
                                </button>
                            </div>
                        </form>
                    ) : (
                        <form onSubmit={handleResetPassword}>
                            <div className="password-form-group">
                                <label className="password-form-label">
                                    Email Address
                                </label>
                                <input
                                    type="email"
                                    className="password-form-input"
                                    value={email}
                                    disabled
                                    style={{ backgroundColor: '#f1f5f9' }}
                                />
                            </div>

                            <div className="password-form-group">
                                <label className="password-form-label">
                                    OTP <span style={{ color: 'red' }}>*</span>
                                </label>
                                <input
                                    type="text"
                                    className="password-form-input"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                    placeholder="Enter 6-digit OTP"
                                    required
                                    maxLength={6}
                                />
                            </div>

                            <div className="password-form-group">
                                <label className="password-form-label">
                                    New Password <span style={{ color: 'red' }}>*</span>
                                </label>
                                <div className="password-input-wrapper">
                                    <input
                                        type={showPasswords.new ? "text" : "password"}
                                        className="password-form-input"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        placeholder="Enter new password"
                                        required
                                        minLength={6}
                                    />
                                    <button
                                        type="button"
                                        className="password-toggle-btn"
                                        onClick={() => togglePasswordVisibility('new')}
                                    >
                                        {showPasswords.new ? <EyeOffIcon /> : <EyeIcon />}
                                    </button>
                                </div>
                            </div>

                            <div className="password-form-group">
                                <label className="password-form-label">
                                    Confirm New Password <span style={{ color: 'red' }}>*</span>
                                </label>
                                <div className="password-input-wrapper">
                                    <input
                                        type={showPasswords.confirm ? "text" : "password"}
                                        className="password-form-input"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="Confirm new password"
                                        required
                                        minLength={6}
                                    />
                                    <button
                                        type="button"
                                        className="password-toggle-btn"
                                        onClick={() => togglePasswordVisibility('confirm')}
                                    >
                                        {showPasswords.confirm ? <EyeOffIcon /> : <EyeIcon />}
                                    </button>
                                </div>
                            </div>

                            <div className="password-form-actions" style={{ display: 'flex', gap: '10px' }}>
                                <button
                                    type="button"
                                    className="btn-change-password"
                                    style={{ backgroundColor: '#64748b' }}
                                    onClick={() => setStep(1)}
                                >
                                    Resend OTP
                                </button>
                                <button type="submit" className="btn-change-password" disabled={loading}>
                                    {loading ? 'Resetting...' : 'Reset Password'}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}

export default ChangePasswordPage;
