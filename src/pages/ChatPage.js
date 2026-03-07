import React, { Component } from 'react';
import Skeleton, { SkeletonTheme } from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import axios from 'axios';
import { io } from 'socket.io-client';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import Swal from 'sweetalert2';
import API_BASE_URL from '../config/apiConfig';
import '../styles/ChatPage.css';

const SOCKET_URL = API_BASE_URL.replace('/api', '');

// withRouter HOC for Class Components in React Router v6
function withRouter(Component) {
    function ComponentWithRouterProp(props) {
        let location = useLocation();
        let navigate = useNavigate();
        let params = useParams();
        return (
            <Component
                {...props}
                router={{ location, navigate, params }}
                // Compatibility with older withRouter pattern if needed
                location={location}
                navigate={navigate}
                params={params}
            />
        );
    }
    return ComponentWithRouterProp;
}

class ChatPage extends Component {
    constructor(props) {
        super(props);
        const initialPartner = props.router?.location?.state?.partner || props.location?.state?.partner;
        this.state = {
            partners: initialPartner ? [initialPartner] : [],
            selectedPartner: initialPartner || null,
            messages: [],
            newMessage: '',
            user: JSON.parse(sessionStorage.getItem('user')),
            token: sessionStorage.getItem('token'),
            socket: null,
            isUploading: false,
            typingUser: null,
            isEditing: false,
            editingMessageId: null,
            activeDropdownId: null,
            filePreview: null,
            loadingPartners: !initialPartner,
            loadingMessages: false
        };
        this.messagesEndRef = React.createRef();
        this.fileInputRef = React.createRef();
        this.typingTimeout = null;
    }

    componentDidMount() {
        if (!this.state.token) {
            this.props.navigate('/login');
            return;
        }
        this.initSocket();
        this.fetchPartners();
        if (this.state.selectedPartner) {
            window.history.replaceState(null, '');
        }
        document.addEventListener('mousedown', this.handleClickOutside);
    }

    componentDidUpdate(prevProps, prevState) {
        if (prevState.selectedPartner?._id !== this.state.selectedPartner?._id) {
            if (this.state.selectedPartner) {
                const roomId = this.getRoomId(this.state.user, this.state.selectedPartner);
                this.joinRoom(roomId);
                this.fetchHistory(roomId);
                this.markAsRead(roomId);
                // Reset editing state when switching partners
                this.setState({ isEditing: false, editingMessageId: null, newMessage: '', activeDropdownId: null });
            }
        }

        // Only scroll to bottom if message count changed (new message sent or received)
        // or if switching to a new partner (history fetched)
        if (prevState.messages.length !== this.state.messages.length) {
            this.scrollToBottom('smooth');
        } else if (prevState.selectedPartner?._id !== this.state.selectedPartner?._id) {
            this.scrollToBottom('auto');
        }
    }

    componentWillUnmount() {
        if (this.state.socket) {
            this.state.socket.close();
        }
        if (this.typingTimeout) clearTimeout(this.typingTimeout);
        document.removeEventListener('mousedown', this.handleClickOutside);
    }

    handleClickOutside = (event) => {
        if (this.state.activeDropdownId && !event.target.closest('.message-actions-dropdown') && !event.target.closest('.whatsapp-dropdown-container')) {
            this.setState({ activeDropdownId: null });
        }
    }

    initSocket = () => {
        const socket = io(SOCKET_URL, {
            transports: ["polling", "websocket"]
        });

        socket.on('connect', () => {
            socket.emit('identify', this.state.token);
        });

        socket.on('receiveMessage', (message) => {
            const roomId = this.getRoomId(this.state.user, this.state.selectedPartner);
            if (message.roomId === roomId) {
                this.setState(prevState => ({
                    messages: [...prevState.messages, message]
                }));
                // Mark as read if received while chat is open
                const senderId = typeof message.senderId === 'string' ? message.senderId : message.senderId?._id;
                if (this.state.user && senderId !== this.state.user._id) {
                    this.markAsRead(roomId);
                }
            }
        });

        socket.on('messagesRead', (data) => {
            const currentRoomId = this.getRoomId(this.state.user, this.state.selectedPartner);
            if (data.roomId === currentRoomId) {
                this.setState(prevState => ({
                    messages: prevState.messages.map(msg => {
                        const senderIdStr = typeof msg.senderId === 'string' ? msg.senderId : msg.senderId?._id;
                        if (senderIdStr === this.state.user?._id) {
                            return { ...msg, isRead: true };
                        }
                        return msg;
                    })
                }));
            }
        });

        socket.on('userTyping', ({ roomId, userName }) => {
            const currentRoomId = this.getRoomId(this.state.user, this.state.selectedPartner);
            if (roomId === currentRoomId) {
                this.setState({ typingUser: userName });
            }
        });

        socket.on('userStoppedTyping', ({ roomId }) => {
            const currentRoomId = this.getRoomId(this.state.user, this.state.selectedPartner);
            if (roomId === currentRoomId) {
                this.setState({ typingUser: null });
            }
        });

        socket.on('unreadUpdate', (data) => {
            // Defensive: ensure we don't count messages sent by ourselves
            if (String(data.senderId) === String(this.state.user?._id)) return;

            this.setState(prevState => ({
                partners: prevState.partners.map(p => {
                    const pRoomId = this.getRoomId(this.state.user, p);
                    if (pRoomId === data.roomId) {
                        const partnerId = String(p._id || p.id);
                        const isCurrentChat = prevState.selectedPartner && String(prevState.selectedPartner._id || prevState.selectedPartner.id) === partnerId;

                        // Increment ONLY if not the currently open chat
                        return { ...p, unreadCount: isCurrentChat ? 0 : (p.unreadCount || 0) + 1 };
                    }
                    return p;
                })
            }));
        });

        socket.on('unreadCleared', () => {
            // Re-fetch partners to get synchronized state
            this.fetchPartners();
        });

        socket.on('messageDeleted', ({ messageId, deleteType }) => {
            if (deleteType === 'everyone') {
                this.setState(prevState => ({
                    messages: prevState.messages.filter(m => (String(m._id || m.id)) !== String(messageId))
                }));
            }
        });

        socket.on('messageEdited', ({ messageId, newMessage }) => {
            this.setState(prevState => ({
                messages: prevState.messages.map(m => {
                    if (String(m._id || m.id) === String(messageId)) {
                        return { ...m, message: newMessage, isEdited: true };
                    }
                    return m;
                })
            }));
        });

        this.setState({ socket });
    }

    getRoomId = (me, partner) => {
        if (!me || !partner) return '';
        if (me.role === 'SUPER_ADMIN') {
            return `superadmin_companyadmin_${partner._id}`;
        }
        if (partner.role === 'SUPER_ADMIN') {
            return `superadmin_companyadmin_${me._id}`;
        }
        if (me.role === 'USER' && partner.role === 'USER') {
            const ids = [me._id, partner._id].sort();
            return `company_${me.companyId}_user_${ids[0]}_user_${ids[1]}`;
        }
        const userId = me.role === 'USER' ? me._id : partner._id;
        const companyId = me.companyId || (partner.companyId?._id || partner.companyId);
        return `company_${companyId}_admin_user_${userId}`;
    }

    // handleInitialPartner logic moved to constructor for faster load without skeleton
    // keeping handleInitialPartner as an empty shell if it's called anywhere else by mistake
    handleInitialPartner = () => { }

    joinRoom = (roomId) => {
        if (this.state.socket) {
            this.state.socket.emit('joinRoom', {
                token: this.state.token,
                roomId
            });
        }
    }

    fetchPartners = async () => {
        if (this.state.partners.length === 0) {
            this.setState({ loadingPartners: true });
        }
        try {
            const res = await axios.get(`${API_BASE_URL}/chat/partners`, {
                headers: { 'Authorization': `Bearer ${this.state.token}` }
            });
            this.setState({ partners: res.data });
        } catch (error) {
            console.error('Error fetching partners:', error);
        } finally {
            this.setState({ loadingPartners: false });
        }
    }

    fetchHistory = async (roomId) => {
        this.setState({ loadingMessages: true, messages: [] });
        try {
            const res = await axios.get(`${API_BASE_URL}/chat/history/${roomId}`, {
                headers: { 'Authorization': `Bearer ${this.state.token}` }
            });
            this.setState({ messages: res.data }, () => {
                this.scrollToBottom('auto');
            });
        } catch (error) {
            console.error('Error fetching history:', error);
        } finally {
            this.setState({ loadingMessages: false });
        }
    }

    markAsRead = async (roomId) => {
        try {
            await axios.put(`${API_BASE_URL}/chat/read/${roomId}`, {}, {
                headers: { 'Authorization': `Bearer ${this.state.token}` }
            });
            this.setState(prevState => ({
                partners: prevState.partners.map(p => {
                    if (this.getRoomId(this.state.user, p) === roomId) {
                        return { ...p, unreadCount: 0 };
                    }
                    return p;
                })
            }));
            this.state.socket?.emit('markRead', { token: this.state.token, roomId });
        } catch (error) {
            console.error('Error marking as read:', error);
        }
    }

    handleSendMessage = (e) => {
        if (e) e.preventDefault();
        const { newMessage, selectedPartner, socket, user, token, isEditing, editingMessageId } = this.state;
        if (!newMessage.trim() || !selectedPartner || !socket) return;

        const roomId = this.getRoomId(user, selectedPartner);

        if (isEditing) {
            this.performEdit(editingMessageId, newMessage);
        } else {
            socket.emit('sendMessage', {
                token,
                roomId,
                message: newMessage,
                receiverId: selectedPartner._id,
                receiverRole: this.getPartnerRoleEnum(selectedPartner.role)
            });
        }

        this.setState({ newMessage: '', isEditing: false, editingMessageId: null });
        if (user) {
            socket.emit('stopTyping', { roomId, userName: user.userName });
        }
    }

    performEdit = async (messageId, newMessage) => {
        const { token, socket, user, selectedPartner } = this.state;
        try {
            await axios.put(`${API_BASE_URL}/chat/edit/${messageId}`, { newMessage }, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            this.setState(prevState => ({
                messages: prevState.messages.map(m => {
                    if ((m._id || m.id) === messageId) {
                        return { ...m, message: newMessage, isEdited: true };
                    }
                    return m;
                })
            }));

            const roomId = this.getRoomId(user, selectedPartner);
            socket?.emit('editMessage', { token, roomId, messageId, newMessage });

        } catch (error) {
            console.error('Edit failed:', error);
            Swal.fire('Error', error.response?.data?.message || 'Failed to edit message', 'error');
        }
    }

    getPartnerRoleEnum = (role) => {
        if (role === 'SUPER_ADMIN') return 'superAdmin';
        if (role === 'ADMIN') return 'companyAdmin';
        return 'user';
    }

    handleTyping = (e) => {
        this.setState({ newMessage: e.target.value });
        const { socket, user, selectedPartner } = this.state;
        if (!socket || !selectedPartner) return;

        const roomId = this.getRoomId(user, selectedPartner);
        socket.emit('typing', { roomId, userName: user.userName });

        if (this.typingTimeout) clearTimeout(this.typingTimeout);
        this.typingTimeout = setTimeout(() => {
            if (this.state.socket && this.state.user && this.state.selectedPartner) {
                this.state.socket.emit('stopTyping', { roomId, userName: user.userName });
            }
        }, 2000);
    }

    handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file || !this.state.selectedPartner) return;

        if (file.size > 50 * 1024 * 1024) {
            Swal.fire('Error', 'File size exceeds 50MB limit.', 'error');
            return;
        }

        const url = URL.createObjectURL(file);
        let type = 'document';
        if (file.type.startsWith('image/')) type = 'image';
        else if (file.type.startsWith('video/')) type = 'video';

        this.setState({
            filePreview: { file, url, type, caption: '' }
        });

        if (this.fileInputRef.current) this.fileInputRef.current.value = '';
    }

    handleCancelFilePreview = () => {
        if (this.state.filePreview?.url) {
            URL.revokeObjectURL(this.state.filePreview.url);
        }
        this.setState({ filePreview: null });
    }

    handleSendFilePreview = async () => {
        const { filePreview, selectedPartner, token, socket, user } = this.state;
        if (!filePreview || !selectedPartner) return;

        this.setState({ isUploading: true });
        const formData = new FormData();
        formData.append('file', filePreview.file);

        try {
            const res = await axios.post(`${API_BASE_URL}/chat/upload`, formData, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });

            const { fileUrl, fileType, fileName, fileSize } = res.data;
            const roomId = this.getRoomId(user, selectedPartner);

            socket.emit('sendMessage', {
                token: token,
                roomId,
                message: filePreview.caption,
                receiverId: selectedPartner._id,
                receiverRole: this.getPartnerRoleEnum(selectedPartner.role),
                fileUrl,
                fileType,
                fileName,
                fileSize
            });
            this.handleCancelFilePreview();
        } catch (error) {
            console.error('File upload failed:', error);
            const errorMsg = error.response?.data?.message || 'Unknown error';
            Swal.fire('Error', 'File upload failed: ' + errorMsg, 'error');
        } finally {
            this.setState({ isUploading: false });
        }
    }

    scrollToBottom = (behavior = "smooth") => {
        if (this.messagesEndRef.current) {
            this.messagesEndRef.current.scrollIntoView({ behavior });
        }
    }

    getFileUrl = (path) => {
        if (!path || path === 'undefined' || path === 'null') return '';
        if (path.startsWith('http') || path.startsWith('data:')) return path;

        // Normalize slashes
        let normalizedPath = path.replace(/\\/g, '/');

        // Ensure it has the 'uploads/' prefix for the backend to serve it correctly
        if (normalizedPath.includes('uploads/')) {
            // Extract everything from 'uploads/' onwards
            normalizedPath = 'uploads/' + normalizedPath.split('uploads/')[1];
        } else {
            // Prepend 'uploads/' if it's a relative path without it
            normalizedPath = 'uploads/' + (normalizedPath.startsWith('/') ? normalizedPath.substring(1) : normalizedPath);
        }

        // Final URL construction
        const separator = normalizedPath.startsWith('/') ? '' : '/';
        return `${SOCKET_URL}${separator}${normalizedPath}`;
    }

    renderFileContent = (msg, isMe) => {
        if (!msg.fileUrl) return null;
        const fullUrl = this.getFileUrl(msg.fileUrl);

        switch (msg.fileType) {
            case 'image':
                return (
                    <div className="chat-file-preview">
                        <img src={fullUrl} alt={msg.fileName} className="img-thumbnail chat-img" onClick={() => window.open(fullUrl, '_blank')} />
                    </div>
                );
            case 'video':
                return (
                    <div className="chat-file-preview">
                        <video controls className="chat-video">
                            <source src={fullUrl} />
                            Your browser does not support the video tag.
                        </video>
                    </div>
                );
            case 'document':
            case 'other':
                return (
                    <div className="chat-file-preview">
                        <a
                            href={fullUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`btn btn-sm mt-1 ${isMe ? 'border rounded' : 'btn-outline-primary'}`}
                            style={isMe ? { color: 'white', borderColor: 'rgba(255,255,255,0.6)', backgroundColor: 'rgba(255,255,255,0.1)' } : {}}
                            download={msg.fileName}
                        >
                            <i className="fa fa-download me-1"></i> {msg.fileName || 'Download File'}
                        </a>
                    </div>
                );
            default:
                return null;
        }
    }

    renderFilePreviewModal = () => {
        const { filePreview, isUploading } = this.state;
        if (!filePreview) return null;

        return (
            <div className="file-preview-modal-overlay">
                <div className="file-preview-header px-4 py-3 d-flex align-items-center">
                    <button className="btn btn-link text-white text-decoration-none me-3 p-0" onClick={this.handleCancelFilePreview} disabled={isUploading}>
                        <i className="fa fa-times fa-2x"></i>
                    </button>
                    <div className="text-white flex-grow-1 text-center truncate">
                        <div className="fw-bold">{filePreview.file.name}</div>
                        <small className="opacity-75">{(filePreview.file.size / 1024 / 1024).toFixed(2)} MB</small>
                    </div>
                </div>

                <div className="file-preview-content flex-grow-1 d-flex align-items-center justify-content-center p-4 overflow-hidden">
                    {filePreview.type === 'image' && <img src={filePreview.url} alt="Preview" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />}
                    {filePreview.type === 'video' && <video src={filePreview.url} controls style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />}
                    {filePreview.type === 'document' && (
                        <div className="d-flex flex-column align-items-center text-white">
                            <i className="fa fa-file-alt fa-5x mb-3 text-muted"></i>
                            <h4>{filePreview.file.name}</h4>
                            <p className="text-muted">Document Preview not available</p>
                        </div>
                    )}
                </div>

                <div className="file-preview-footer p-4 d-flex justify-content-center align-items-center position-relative">
                    <div className="file-preview-input-wrapper position-relative w-100" style={{ maxWidth: '800px' }}>
                        <div className="d-flex align-items-center bg-white rounded-pill px-3 py-2">
                            <input
                                type="text"
                                className="form-control border-0 shadow-none bg-transparent"
                                placeholder="Type a message..."
                                value={filePreview.caption}
                                onChange={(e) => this.setState({ filePreview: { ...filePreview, caption: e.target.value } })}
                                disabled={isUploading}
                                onKeyPress={(e) => e.key === 'Enter' && !isUploading && this.handleSendFilePreview()}
                            />
                        </div>
                        <button
                            className="btn btn-success rounded-circle file-preview-send-btn position-absolute"
                            style={{ right: '-60px', bottom: '5px', width: '48px', height: '48px', backgroundColor: '#00a884', borderColor: '#00a884' }}
                            onClick={this.handleSendFilePreview}
                            disabled={isUploading}
                        >
                            {isUploading ? <span className="spinner-border spinner-border-sm text-white"></span> : <i className="fa fa-paper-plane text-white"></i>}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    formatDateSeparator = (date) => {
        const messageDate = new Date(date);
        const today = new Date();
        const yesterday = new Date();
        yesterday.setDate(today.getDate() - 1);

        if (messageDate.toDateString() === today.toDateString()) {
            return 'Today';
        } else if (messageDate.toDateString() === yesterday.toDateString()) {
            return 'Yesterday';
        } else {
            return messageDate.toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
        }
    }

    toggleDropdown = (msgId) => {
        this.setState(prevState => ({
            activeDropdownId: prevState.activeDropdownId === msgId ? null : msgId
        }));
    }

    handleEditClick = (msg) => {
        const now = new Date();
        const sentAt = new Date(msg.createdAt);
        const diffInMinutes = (now - sentAt) / (1000 * 60);

        if (diffInMinutes > 5) {
            Swal.fire({
                title: 'Cannot Edit',
                text: 'This message is not edited because it was sent more than 5 minutes ago.',
                icon: 'error',
                confirmButtonColor: '#3085d6',
            });
            this.setState({ activeDropdownId: null });
            return;
        }
        this.setState({ isEditing: true, editingMessageId: msg._id, newMessage: msg.message, activeDropdownId: null });
    }

    handleDeleteMessageClick = (msg) => {
        this.setState({ activeDropdownId: null });
        const { user } = this.state;
        const senderIdStr = (msg.senderId && typeof msg.senderId === 'object') ? msg.senderId._id : msg.senderId;
        const isMe = user && senderIdStr === user._id;

        const now = new Date();
        const sentAt = new Date(msg.createdAt);
        const diffInMinutes = (now - sentAt) / (1000 * 60);

        if (isMe && diffInMinutes <= 5) {
            Swal.fire({
                title: 'Delete Message?',
                text: 'Choose deletion method',
                icon: 'warning',
                showCancelButton: true,
                showDenyButton: true,
                confirmButtonText: 'Delete for Everyone',
                denyButtonText: 'Delete for Me',
                cancelButtonText: 'Cancel',
                confirmButtonColor: '#d33',
                denyButtonColor: '#3085d6',
            }).then(async (result) => {
                if (result.isConfirmed) {
                    this.performDelete(msg._id, 'everyone');
                } else if (result.isDenied) {
                    this.performDelete(msg._id, 'me');
                }
            });
        } else {
            Swal.fire({
                title: 'Delete Message?',
                text: isMe ? 'Delete message for yourself?' : 'Delete message for yourself?',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Delete for Me',
                cancelButtonText: 'Cancel',
                confirmButtonColor: '#3085d6',
            }).then(async (result) => {
                if (result.isConfirmed) {
                    this.performDelete(msg._id, 'me');
                }
            });
        }
    }

    performDelete = async (messageId, deleteType) => {
        const { token, socket, user, selectedPartner } = this.state;
        try {
            await axios.delete(`${API_BASE_URL}/chat/delete/${messageId}?deleteType=${deleteType}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            this.setState(prevState => ({
                messages: prevState.messages.filter(m => (m._id || m.id) !== messageId)
            }));

            const roomId = this.getRoomId(user, selectedPartner);
            socket?.emit('deleteMessage', { token, roomId, messageId, deleteType });

        } catch (error) {
            console.error('Delete failed:', error);
            Swal.fire('Error', 'Failed to delete message', 'error');
        }
    }

    render() {
        const { partners, selectedPartner, messages, newMessage, user, isUploading, typingUser, isEditing, activeDropdownId } = this.state;
        let lastDate = null;

        return (
            <div className="container-fluid p-0 chat-page-wrapper">
                <div className="row g-0 h-100">
                    <div className="col-md-3 border-end bg-light chat-sidebar-column">
                        <div className="p-3 bg-white border-bottom d-flex justify-content-between align-items-center flex-shrink-0">
                            <h5 className="mb-0 fw-bold text-primary">Messages</h5>
                            <button className="btn btn-sm btn-light" type="button" onClick={this.fetchPartners}><i className="fa fa-sync"></i></button>
                        </div>
                        <div className="list-group list-group-flush chat-partners-list overflow-auto flex-grow-1">
                            {this.state.loadingPartners ? (
                                <SkeletonTheme baseColor="#f3f4f6" highlightColor="#ffffff">
                                    <div className="p-3">
                                        {[...Array(6)].map((_, i) => (
                                            <div key={i} className="d-flex align-items-center mb-3">
                                                <Skeleton circle width={48} height={48} />
                                                <div className="ms-3 flex-grow-1">
                                                    <Skeleton width="70%" height={15} />
                                                    <Skeleton width="40%" height={10} className="mt-1" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </SkeletonTheme>
                            ) : partners.length > 0 ? partners.map(partner => (
                                <button
                                    key={partner._id}
                                    type="button"
                                    className={`list-group-item list-group-item-action border-0 mb-1 py-3 px-3 position-relative rounded-3 ${selectedPartner?._id === partner._id ? 'active bg-light text-dark border-start border-primary border-4 shadow-sm' : ''}`}
                                    style={{ transition: 'all 0.2s' }}
                                    onClick={() => this.setState({ selectedPartner: partner })}
                                >
                                    <div className="d-flex align-items-center">
                                        <div className="flex-shrink-0">
                                            <div className={`avatar-placeholder rounded-circle ${selectedPartner?._id === partner._id ? 'bg-primary' : 'bg-secondary'} text-white d-flex align-items-center justify-content-center fw-bold shadow-sm overflow-hidden`} style={{ width: '48px', height: '48px' }}>
                                                {partner.userProfile && this.getFileUrl(partner.userProfile) ? (
                                                    <img src={this.getFileUrl(partner.userProfile)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                ) : (
                                                    partner.role === 'SUPER_ADMIN' ? 'S' : (partner.userName ? partner.userName.substring(0, 1).toUpperCase() : '?')
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex-grow-1 ms-3 overflow-hidden">
                                            <div className="d-flex justify-content-between">
                                                <h6 className={`mb-0 text-truncate ${selectedPartner?._id === partner._id ? 'fw-bold text-primary' : 'fw-semibold'}`}>{partner.role === 'SUPER_ADMIN' ? 'Support' : partner.userName}</h6>
                                                {partner.unreadCount > 0 && <span className="badge rounded-pill bg-danger shadow-sm">{partner.unreadCount}</span>}
                                            </div>
                                            <small className="text-muted d-block text-truncate mt-1" style={{ fontSize: '11px' }}>
                                                {partner.role === 'ADMIN' ? (partner.companyId?.companyName || 'Company Admin') : (partner.role === 'SUPER_ADMIN' ? 'Super Admin' : 'User')}
                                            </small>
                                        </div>
                                    </div>
                                </button>
                            )) : (
                                <div className="p-4 text-center text-muted">No contacts found</div>
                            )}
                        </div>
                    </div>

                    <div className="col-md-9 d-flex flex-column chat-main-column bg-white position-relative">
                        {selectedPartner ? (
                            <>
                                <div className="p-3 border-bottom d-flex align-items-center justify-content-between bg-white flex-shrink-0 chat-header-fixed">
                                    <div className="d-flex align-items-center">
                                        <div className="avatar-placeholder rounded-circle bg-primary text-white d-flex align-items-center justify-content-center fw-bold overflow-hidden" style={{ width: '40px', height: '40px' }}>
                                            {selectedPartner.userProfile && this.getFileUrl(selectedPartner.userProfile) ? (
                                                <img src={this.getFileUrl(selectedPartner.userProfile)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            ) : (
                                                selectedPartner.role === 'SUPER_ADMIN' ? 'S' : selectedPartner.userName.substring(0, 1).toUpperCase()
                                            )}
                                        </div>
                                        <div className="ms-3">
                                            <h6 className="mb-0 fw-bold">{selectedPartner.role === 'SUPER_ADMIN' ? 'Support' : selectedPartner.userName}</h6>
                                            <small className="text-muted">
                                                {selectedPartner.role === 'ADMIN' ? (selectedPartner.companyId?.companyName || 'Company Admin') : (selectedPartner.role === 'SUPER_ADMIN' ? 'Super Admin' : 'User')}
                                            </small>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex-grow-1 d-flex flex-column overflow-hidden">
                                    <div className="flex-grow-1 p-4 overflow-auto bg-light chat-messages-container d-flex flex-column">
                                        {this.state.loadingMessages ? (
                                            <SkeletonTheme baseColor="#ffffff" highlightColor="#f3f4f6">
                                                {[...Array(5)].map((_, i) => (
                                                    <div key={i} className={`mb-4 d-flex ${i % 2 === 0 ? 'justify-content-start' : 'justify-content-end'}`}>
                                                        <div style={{ width: '40%', height: '60px' }}>
                                                            <Skeleton height={60} borderRadius={16} />
                                                        </div>
                                                    </div>
                                                ))}
                                            </SkeletonTheme>
                                        ) : messages.map((msg, idx) => {
                                            const senderIdStr = (msg.senderId && typeof msg.senderId === 'object') ? msg.senderId._id : msg.senderId;
                                            const isMe = user && senderIdStr === user._id;
                                            const msgDate = new Date(msg.createdAt).toDateString();
                                            const showDateSeparator = msgDate !== lastDate;
                                            lastDate = msgDate;
                                            const msgId = msg._id || msg.id;

                                            return (
                                                <React.Fragment key={idx}>
                                                    {showDateSeparator && (
                                                        <div className="d-flex justify-content-center my-4">
                                                            <div className="chat-date-separator">
                                                                {this.formatDateSeparator(msg.createdAt)}
                                                            </div>
                                                        </div>
                                                    )}
                                                    <div className={`d-flex mb-4 ${isMe ? 'justify-content-end' : 'justify-content-start'}`}>
                                                        {!isMe && (
                                                            <div className="avatar-sm rounded-circle bg-secondary text-white d-flex align-items-center justify-content-center me-2 mt-auto shadow-sm overflow-hidden" style={{ width: '32px', height: '32px', fontSize: '11px' }}>
                                                                {msg.senderId?.userProfile && this.getFileUrl(msg.senderId.userProfile) ? (
                                                                    <img src={this.getFileUrl(msg.senderId.userProfile)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                                ) : (
                                                                    msg.senderId?.role === 'SUPER_ADMIN' ? 'S' : (msg.senderId?.userName?.substring(0, 1).toUpperCase() || '?')
                                                                )}
                                                            </div>
                                                        )}
                                                        <div className={`message-container-inner ${isMe ? 'd-flex flex-column align-items-end' : 'd-flex flex-column'}`} style={{ maxWidth: '80%', position: 'relative' }}>
                                                            <div className={`message-bubble-whatsapp p-2 px-3 ${isMe ? 'bg-primary-whatsapp' : 'bg-white-whatsapp'}`}>
                                                                <div className="message-actions-dropdown" onClick={() => this.toggleDropdown(msgId)}>
                                                                    <i className="fa fa-chevron-down"></i>
                                                                </div>

                                                                {activeDropdownId === msgId && (
                                                                    <div className="whatsapp-dropdown-container">
                                                                        <div className="dropdown-menu-whatsapp">
                                                                            {isMe && !msg.fileUrl && (
                                                                                <button className="dropdown-item-whatsapp" onClick={() => this.handleEditClick(msg)}>
                                                                                    <i className="fa fa-edit"></i> Edit
                                                                                </button>
                                                                            )}
                                                                            <button className="dropdown-item-whatsapp text-danger" onClick={() => this.handleDeleteMessageClick(msg)}>
                                                                                <i className="fa fa-trash"></i> Delete
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                )}

                                                                {!isMe && <div className="fw-bold mb-1" style={{ fontSize: '11px', color: '#6366f1' }}>{msg.senderId?.role === 'SUPER_ADMIN' ? 'Support' : msg.senderId?.userName}</div>}
                                                                <div className="message-content-wrapper d-flex align-items-end flex-wrap">
                                                                    <div className="message-content flex-grow-1 me-2">
                                                                        {msg.message && <div className="message-text" style={{ wordBreak: 'break-word' }}>{msg.message}</div>}
                                                                        {this.renderFileContent(msg, isMe)}
                                                                    </div>
                                                                    <div className="message-metadata d-flex align-items-center ms-auto" style={{ fontSize: '10px', opacity: 0.8, alignSelf: 'flex-end', paddingBottom: '2px' }}>
                                                                        {msg.isEdited && <span className="me-1 italic" style={{ fontSize: '9px' }}>(edited)</span>}
                                                                        <span className="me-1" style={{ whiteSpace: 'nowrap' }}>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }).toLowerCase()}</span>
                                                                        {isMe && (
                                                                            <span className="whatsapp-status-ticks">
                                                                                {msg.isRead ? (
                                                                                    <i className="fa fa-check-double" style={{ color: '#34b7f1' }}></i>
                                                                                ) : msg.isDelivered ? (
                                                                                    <i className="fa fa-check-double text-muted"></i>
                                                                                ) : (
                                                                                    <i className="fa fa-check text-muted"></i>
                                                                                )}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        {isMe && (
                                                            <div className="avatar-sm rounded-circle bg-primary text-white d-flex align-items-center justify-content-center ms-2 mt-auto shadow-sm overflow-hidden" style={{ width: '32px', height: '32px', fontSize: '11px', background: '#4c1d95' }}>
                                                                {user?.userProfile && this.getFileUrl(user.userProfile) ? (
                                                                    <img src={this.getFileUrl(user.userProfile)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                                ) : (
                                                                    user?.userName?.substring(0, 1).toUpperCase() || 'Y'
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </React.Fragment>
                                            );
                                        })}
                                        {typingUser && (
                                            <div className="d-flex mb-3 justify-content-start">
                                                <div className="p-2 rounded-4 bg-white shadow-sm italic text-muted small">
                                                    <span className="dot-typing"></span> {typingUser} is typing...
                                                </div>
                                            </div>
                                        )}
                                        <div ref={this.messagesEndRef} />
                                    </div>

                                    <div className="p-3 border-top bg-white flex-shrink-0">
                                        {isEditing && (
                                            <div className="d-flex justify-content-between align-items-center px-3 py-1 mb-2 bg-light rounded-3 border-start border-primary border-4">
                                                <small className="text-primary fw-bold">Editing message...</small>
                                                <button className="btn btn-sm text-danger" onClick={() => this.setState({ isEditing: false, editingMessageId: null, newMessage: '' })}>
                                                    <i className="fa fa-times"></i>
                                                </button>
                                            </div>
                                        )}
                                        <form onSubmit={this.handleSendMessage} className="d-flex align-items-center">
                                            <button
                                                type="button"
                                                className="btn btn-light rounded-circle me-2"
                                                onClick={() => this.fileInputRef.current?.click()}
                                                disabled={isUploading || isEditing}
                                            >
                                                {isUploading ? <span className="spinner-border spinner-border-sm"></span> : <i className="fa fa-paperclip"></i>}
                                            </button>
                                            <input
                                                type="file"
                                                className="d-none"
                                                ref={this.fileInputRef}
                                                onChange={this.handleFileUpload}
                                            />
                                            <input
                                                type="text"
                                                className="form-control rounded-pill border-light bg-light py-2 px-3"
                                                placeholder={isEditing ? "Edit your message..." : "Type your message..."}
                                                value={newMessage}
                                                onChange={this.handleTyping}
                                            />
                                            <button type="submit" className="btn btn-primary rounded-circle ms-2" disabled={!newMessage.trim() && !isUploading}>
                                                <i className={`fa ${isEditing ? 'fa-check' : 'fa-paper-plane'}`}></i>
                                            </button>
                                        </form>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="h-100 d-flex flex-column align-items-center justify-content-center text-muted">
                                <div className="mb-3">
                                    <i className="fa fa-comments fa-4x opacity-25"></i>
                                </div>
                                <h4 className="fw-bold">Your Messages</h4>
                                <p>Select a contact from the list to start a conversation.</p>
                            </div>
                        )}
                        {this.renderFilePreviewModal()}
                    </div>
                </div>
            </div>
        );
    }
}

export default withRouter(ChatPage);
