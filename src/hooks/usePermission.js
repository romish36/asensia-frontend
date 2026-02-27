import { usePermissionContext } from '../contexts/PermissionContext';

/**
 * Reusable hook to check permissions for a specific module and action.
 * @param {string} moduleName - The module name (matching the backend keys)
 * @param {string} action - The action (view, add, update, delete, status, report, etc.)
 * @returns {boolean} - True if permitted
 */
const usePermission = (moduleName, action) => {
    const { hasPermission, loading } = usePermissionContext();

    if (loading) return false; // Or return true if you want to fail-open, usually fail-closed is safer

    return hasPermission(moduleName, action);
};

export default usePermission;
