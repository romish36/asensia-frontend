import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import '../styles/UserPermissions.css';
import API_BASE_URL from '../config/apiConfig.js';


const MODULES = [
    "Purchase Order", "Invoice", "InStock", "OutStock", "Seller", "Customer", "Transporter", "Product", "Category",
    "Expense", "User", "Grade", "CustomerType", "InvoiceName", "PaymentMode", "SaleType",
    "Color", "ExpensePurpose", "Company", "Plan", "Coupon"
];

const ACTIONS = []; // Replaced by dynamic dbActions from database

const UserPermissions = ({ user, onClose }) => {
    const [permissions, setPermissions] = useState({});
    const [dbActions, setDbActions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Load available permissions from DB and existing user permissions
    const fetchPermissionsData = useCallback(async () => {
        const idToUse = user?.userId || user?._id;
        if (!user || !idToUse) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const token = sessionStorage.getItem('token');

            // 1. Fetch all available permission names for table headers
            const actionsRes = await axios.get(`${API_BASE_URL}/permissions`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const actionNames = actionsRes.data.map(p => p.permissionsName.toLowerCase());
            setDbActions(actionNames);

            // 2. Fetch user's specific permissions
            const response = await axios.get(`${API_BASE_URL}/user-permissions/${idToUse}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data && response.data.permissions) {
                setPermissions(response.data.permissions);
            } else {
                setPermissions({});
            }
        } catch (error) {
            console.error("Fetch permissions error:", error);
            toast.error("Failed to load permissions");
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchPermissionsData();
    }, [fetchPermissionsData]);

    // UI Helper: Is a specific checkbox checked?
    const isChecked = (module, action) => {
        return permissions[module]?.[action] === 1;
    };

    // Toggle a single permission
    // Special rule: clicking "add" when turning it ON selects the entire row
    const handleToggle = (module, action) => {
        setPermissions(prev => {
            const moduleData = prev[module] || {};
            const newValue = moduleData[action] === 1 ? 0 : 1;

            // If "add" is being checked ON, select all actions for this module
            if (action === 'add' && newValue === 1) {
                const allChecked = {};
                dbActions.forEach(a => { allChecked[a] = 1; });
                return {
                    ...prev,
                    [module]: allChecked
                };
            }

            return {
                ...prev,
                [module]: {
                    ...moduleData,
                    [action]: newValue
                }
            };
        });
    };

    // Toggle entire module (Select All Row)
    const handleRowToggle = (module, checked) => {
        setPermissions(prev => {
            const newModuleData = {};
            dbActions.forEach(action => {
                newModuleData[action] = checked ? 1 : 0;
            });
            return {
                ...prev,
                [module]: newModuleData
            };
        });
    };

    // Toggle entire column (all modules for one action)
    const handleColumnToggle = (action, checked) => {
        setPermissions(prev => {
            const updated = { ...prev };
            MODULES.forEach(module => {
                updated[module] = {
                    ...(updated[module] || {}),
                    [action]: checked ? 1 : 0
                };
            });
            return updated;
        });
    };

    // Check if entire column is selected
    const isColumnSelected = (action) => {
        return MODULES.every(module => permissions[module]?.[action] === 1);
    };

    // Toggle entire system (Select All Modules)
    const handleGlobalToggle = (checked) => {
        const newPermissions = {};
        MODULES.forEach(module => {
            newPermissions[module] = {};
            dbActions.forEach(action => {
                newPermissions[module][action] = checked ? 1 : 0;
            });
        });
        setPermissions(newPermissions);
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            const token = sessionStorage.getItem('token');
            if (!token) {
                toast.error("Authentication session expired.");
                setSaving(false);
                return;
            }

            const response = await axios.post(`${API_BASE_URL}/user-permissions/save`, {
                userId: user.userId || user._id,
                permissions: permissions
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.status === 200 || response.status === 201) {
                toast.success("Permissions updated successfully!");
                if (onClose) onClose();
            }
        } catch (error) {
            console.error("Save error:", error);
            toast.error(error.response?.data?.message || "Failed to save permissions");
        } finally {
            setSaving(false);
        }
    };

    if (!user) return <div className="up-message">Please select a user first.</div>;

    // Check if a row is fully selected
    const isRowSelected = (module) => {
        return dbActions.every(action => isChecked(module, action));
    };

    // Check if all modules are fully selected
    const isGlobalSelected = MODULES.every(module => isRowSelected(module));

    return (
        <div className="up-page">
            <div className="up-top-bar">
                <div className="up-user-info">
                    <h1>Manage Role Permissions</h1>
                    <p>Setting access for: <strong>{user.userName}</strong> ({user.role})</p>
                </div>
                <div className="up-actions">
                    <button className="up-btn-cancel" onClick={onClose}>Cancel</button>
                    <button className="up-btn-save" onClick={handleSave} disabled={saving}>
                        {saving ? "Saving..." : "Save Changes"}
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="up-loading">
                    <div className="up-spinner"></div>
                    <p>Loading permissions data...</p>
                </div>
            ) : (
                <div className="up-table-container">
                    <table className="up-main-table">
                        <thead>
                            <tr>
                                <th className="up-col-sticky">
                                    <div className="up-header-cell">
                                        <input
                                            type="checkbox"
                                            checked={isGlobalSelected}
                                            onChange={(e) => handleGlobalToggle(e.target.checked)}
                                        />
                                        <span>Modules / Actions</span>
                                    </div>
                                </th>
                                {dbActions.map(action => (
                                    <th key={action} className="up-action-header">
                                        <div className="up-col-header-cell">
                                            <span>{action.toUpperCase()}</span>
                                            <input
                                                type="checkbox"
                                                title={`Select all ${action}`}
                                                checked={isColumnSelected(action)}
                                                onChange={(e) => handleColumnToggle(action, e.target.checked)}
                                                className="up-col-checkbox"
                                            />
                                        </div>
                                    </th>
                                ))}
                                <th className="up-select-all-header">Select All</th>
                            </tr>
                        </thead>
                        <tbody>
                            {MODULES.map(module => (
                                <tr key={module}>
                                    <td className="up-module-name up-col-sticky">{module}</td>
                                    {dbActions.map(action => (
                                        <td key={`${module}-${action}`} className="up-checkbox-cell">
                                            <label className="up-check-label">
                                                <input
                                                    type="checkbox"
                                                    checked={isChecked(module, action)}
                                                    onChange={() => handleToggle(module, action)}
                                                />
                                                <span className="up-custom-checkbox"></span>
                                            </label>
                                        </td>
                                    ))}
                                    <td className="up-row-select-all">
                                        <input
                                            type="checkbox"
                                            checked={isRowSelected(module)}
                                            onChange={(e) => handleRowToggle(module, e.target.checked)}
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default UserPermissions;
