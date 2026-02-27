import React, { createContext, useState, useEffect, useContext, useMemo, useCallback } from 'react';
import axios from 'axios';
import API_BASE_URL from '../config/apiConfig';

const PermissionContext = createContext();

export const PermissionProvider = ({ children }) => {
    const [permissions, setPermissions] = useState({});
    const [company, setCompany] = useState(null);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [appLoading, setAppLoading] = useState(false);

    const fetchMyPermissions = async () => {
        try {
            const userStr = sessionStorage.getItem('user');
            const token = sessionStorage.getItem('token');

            if (!userStr || !token) {
                setPermissions({});
                setCompany(null);
                setLoading(false);
                return;
            }

            const user = JSON.parse(userStr);
            if (!user.userId) {
                setPermissions({});
                setCompany(null);
                setLoading(false);
                return;
            }

            // Fetch Company Details if companyId exists
            if (user.companyId) {
                try {
                    const companyRes = await axios.get(`${API_BASE_URL}/company/${user.companyId}`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    if (companyRes.data) {
                        setCompany(companyRes.data);
                    }
                } catch (err) {
                    console.error("Error fetching company details:", err);
                }
            }

            // Only SUPER_ADMIN has hardcoded full access
            if (user.role === 'SUPER_ADMIN') {
                setPermissions({ isSuperAdmin: true });
                setLoading(false);
                return;
            }

            const response = await axios.get(`${API_BASE_URL}/user-permissions/${user.userId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data && response.data.permissions) {
                setPermissions(response.data.permissions);
            } else {
                setPermissions({});
            }
        } catch (error) {
            console.error("Error fetching permissions:", error);
            setPermissions({});
        } finally {
            setLoading(false);
        }
    };

    const fetchCategories = async () => {
        try {
            const token = sessionStorage.getItem('token');
            if (!token) return;
            const res = await axios.get(`${API_BASE_URL}/category`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data) setCategories(res.data);
        } catch (err) {
            console.error("Error fetching categories:", err);
        }
    };

    useEffect(() => {
        const init = async () => {
            await fetchMyPermissions();
            await fetchCategories();
        };
        init();
    }, []);

    // Function to check if a user has a specific permission
    const hasPermission = useCallback((moduleName, action) => {
        if (permissions.isSuperAdmin) return true;

        const modulePerms = permissions[moduleName];
        if (!modulePerms) return false;

        return modulePerms[action] === 1;
    }, [permissions]);

    const contextValue = useMemo(() => ({
        permissions,
        company,
        categories,
        hasPermission,
        fetchMyPermissions,
        fetchCategories,
        loading,
        appLoading,
        setAppLoading
    }), [permissions, company, categories, hasPermission, loading, appLoading]);

    return (
        <PermissionContext.Provider value={contextValue}>
            {(loading || appLoading) && (
                <div className="loading-overlay">
                    <div className="loading-spinner"></div>
                    <div className="loading-text">Please wait...</div>
                </div>
            )}
            {children}
        </PermissionContext.Provider>
    );
};

export const usePermissionContext = () => useContext(PermissionContext);
