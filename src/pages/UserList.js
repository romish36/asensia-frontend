import React, { useState, useMemo, useEffect } from 'react';
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx';
import { toast } from 'react-toastify';
import UserForm from './UserForm';
import API_BASE_URL from '../config/apiConfig.js';
import fetchApi from '../utils/api.js';
import { usePermissionContext } from '../contexts/PermissionContext.js';
import SearchBar from '../components/ui/SearchBar';
import PageSkeleton from '../components/ui/PageSkeleton';



function UserList({ onAddUser, onEditUser, onPermissions, onChat }) {
    const { hasPermission } = usePermissionContext();
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [totalEntries, setTotalEntries] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [currentUserRole, setCurrentUserRole] = useState('USER');
    const [currentUserId, setCurrentUserId] = useState(null);
    const token = sessionStorage.getItem('token');

    // Fetch Users and Role
    const fetchUsers = async (search = '', page = 1, limit = 10) => {
        try {
            setLoading(true);
            const storedUser = JSON.parse(sessionStorage.getItem('user'));

            if (storedUser) {
                setCurrentUserRole(storedUser.role || 'USER');
                setCurrentUserId(storedUser._id || storedUser.id || null);
            }

            if (!token) {
                setLoading(false);
                return;
            }

            const queryParams = new URLSearchParams();
            if (search) queryParams.append('search', search);
            queryParams.append('page', page);
            queryParams.append('limit', limit);

            const data = await fetchApi(`/users?${queryParams.toString()}`);

            // Handle both paginated and non-paginated responses for safety
            if (data.users && Array.isArray(data.users)) {
                setRows(data.users);
                setTotalEntries(data.total || data.users.length);
                setTotalPages(data.pages || Math.ceil((data.total || data.users.length) / limit));
            } else if (Array.isArray(data)) {
                setRows(data);
                setTotalEntries(data.length);
                setTotalPages(Math.ceil(data.length / limit));
            }
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            fetchUsers(searchQuery, currentPage, itemsPerPage);
        }, 200);

        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery, currentPage, itemsPerPage]);

    const handleEdit = (user) => {
        if (onEditUser) {
            onEditUser(user);
        }
    };

    const handleDelete = (id) => {
        Swal.fire({
            title: 'Are you sure?',
            text: 'Do you want to delete this user?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, delete it!',
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await fetchApi(`/users/${id}`, { method: 'DELETE' });
                    Swal.fire('Deleted!', 'User has been deleted.', 'success');
                    fetchUsers(searchQuery, currentPage, itemsPerPage); // Refresh
                } catch (error) {
                    console.error(error);
                }
            }
        });
    };

    const handleAdd = () => {
        if (onAddUser) {
            onAddUser();
        }
    };

    const handlePermissions = (user) => {
        if (onPermissions) {
            onPermissions(user);
        }
    };

    // Pagination Display Logic
    const pages = useMemo(() => {
        const out = [];
        const maxButtons = 5;
        let start = Math.max(1, currentPage - Math.floor(maxButtons / 2));
        let end = Math.min(totalPages, start + maxButtons - 1);
        start = Math.max(1, end - maxButtons + 1);
        for (let i = start; i <= end; i += 1) out.push(i);
        return out;
    }, [currentPage, totalPages]);

    const canManage = currentUserRole === 'SUPER_ADMIN' || currentUserRole === 'ADMIN';

    if (loading) {
        return <PageSkeleton />;
    }

    return (
        <div className="list-page-container">
            {/* Header: Title and Action Buttons */}
            <div className="list-page-header">
                <h1 className="list-page-title">User List</h1>
                <div className="list-page-action-buttons">
                    {canManage && hasPermission('User', 'add') && (
                        <button className="list-page-btn list-page-btn-add" onClick={handleAdd}>
                            ADD USER
                        </button>
                    )}
                </div>
            </div>

            {/* Toolbar: Search */}
            <div className="list-page-toolbar">
                <SearchBar
                    value={searchQuery}
                    onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setCurrentPage(1);
                    }}
                    placeholder="Search users..."
                />

                <div className="list-page-filter-box">
                    {/* No filter for user */}
                </div>
            </div>

            {/* Table */}
            <div className="list-page-table-wrapper">
                <table className="list-page-table">
                    <thead>
                        <tr>
                            <th>NAME</th>
                            {currentUserRole === 'SUPER_ADMIN' && <th>COMPANY NAME</th>}
                            <th>MOBILE NUMBER</th>
                            <th>EMAIL</th>
                            <th>STATUS</th>
                            <th>PERMISSIONS</th>
                            <th>BIRTHDAY DATE</th>
                            <th>PROFILE</th>
                            {(canManage || onChat) && <th>ACTIONS</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {rows.length > 0 ? (
                            rows.map((item) => (
                                <tr key={item._id}>
                                    <td>{item.userName}</td>
                                    {currentUserRole === 'SUPER_ADMIN' && (
                                        <td>{item.companyId?.companyName || <span style={{ color: '#94a3b8' }}>N/A</span>}</td>
                                    )}
                                    <td>{item.userMobileNumber}</td>
                                    <td>{item.userEmail}</td>
                                    <td>
                                        <span className={`status-indicator ${item.userStatus === 1 ? 'active' : 'inactive'}`}>
                                            {item.userStatus === 1 ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td>
                                        <span
                                            onClick={() => handlePermissions(item)}
                                            style={{ color: '#2563eb', cursor: 'pointer', textDecoration: 'underline' }}
                                        >
                                            Permissions
                                        </span>
                                    </td>
                                    <td>{item.userBirthdayDate || 'N/A'}</td>
                                    <td>
                                        {item.userProfile ? (
                                            <img
                                                src={item.userProfile}
                                                alt="Profile"
                                                style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }}
                                            />
                                        ) : (
                                            <div style={{
                                                width: '32px',
                                                height: '32px',
                                                borderRadius: '50%',
                                                backgroundColor: '#333',
                                                color: '#fff',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: '10px'
                                            }}>
                                                IMG
                                            </div>
                                        )}
                                    </td>
                                    {(canManage || onChat) && (
                                        <td>
                                            <div className="list-page-action-icons">
                                                {onChat && (currentUserRole === 'SUPER_ADMIN' ? item.role === 'ADMIN' : (item._id || item.id) !== currentUserId) && (
                                                    <button
                                                        type="button"
                                                        className="list-page-icon-btn"
                                                        title="Chat"
                                                        onClick={() => onChat(item)}
                                                    >
                                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                                                        </svg>
                                                    </button>
                                                )}
                                                {canManage && hasPermission('User', 'update') && (
                                                    <button
                                                        type="button"
                                                        className="list-page-icon-btn"
                                                        title="Edit"
                                                        onClick={() => handleEdit(item)}
                                                    >
                                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                                        </svg>
                                                    </button>
                                                )}
                                                {canManage && hasPermission('User', 'delete') && (
                                                    <button
                                                        type="button"
                                                        className="list-page-icon-btn"
                                                        title="Delete"
                                                        onClick={() => handleDelete(item._id)}
                                                    >
                                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                            <polyline points="3 6 5 6 21 6"></polyline>
                                                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                                        </svg>
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td className="list-page-table-empty" colSpan={(canManage || onChat) ? (currentUserRole === 'SUPER_ADMIN' ? 9 : 8) : 7}>No records found</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Footer: Pagination */}
            <div className="list-page-footer">
                <div className="list-page-entries">
                    <span>Show</span>
                    <select
                        className="list-page-entries-select"
                        value={itemsPerPage}
                        onChange={(e) => {
                            setItemsPerPage(Number(e.target.value));
                            setCurrentPage(1);
                        }}
                    >
                        <option value={5}>5</option>
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                    </select>
                    <span>entries</span>
                </div>

                <div className="list-page-info">
                    Showing {totalEntries === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, totalEntries)} of {totalEntries} entries
                </div>

                <div className="list-page-pagination">
                    <button
                        type="button"
                        className="list-page-page-btn"
                        disabled={currentPage <= 1}
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    >
                        Previous
                    </button>

                    {pages.map((p) => (
                        <button
                            key={p}
                            type="button"
                            className={`list-page-page-num ${p === currentPage ? 'list-page-page-num-active' : ''}`}
                            onClick={() => setCurrentPage(p)}
                        >
                            {p}
                        </button>
                    ))}

                    <button
                        type="button"
                        className="list-page-page-btn"
                        disabled={currentPage >= totalPages}
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    >
                        Next
                    </button>
                </div>
            </div>
        </div>
    );
}

export default UserList;
