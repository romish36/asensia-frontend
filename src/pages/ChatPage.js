import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useLocation } from 'react-router-dom';
import API_BASE_URL from '../config/apiConfig';
import '../styles/ChatPage.css';

const SOCKET_URL = API_BASE_URL.replace('/api', '');

const ChatPage = () => {
    const [socket, setSocket] = useState(null);
    const [partners, setPartners] = useState([]);
    const [selectedPartner, setSelectedPartner] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [user, setUser] = useState(null);
    const messagesEndRef = useRef(null);
    const location = useLocation();

    const getRoomId = (me, partner) => {
        if (!me || !partner) return '';
        if (me.role === 'SUPER_ADMIN') {
            return `superadmin_companyadmin_${partner._id}`;
        }
        if (partner.role === 'SUPER_ADMIN') {
            return `superadmin_companyadmin_${me._id}`;
        }

        // If both are users in the same company
        if (me.role === 'USER' && partner.role === 'USER') {
            const ids = [me._id, partner._id].sort();
            return `company_${me.companyId}_user_${ids[0]}_user_${ids[1]}`;
        }

        // Company Admin <-> User
        const userId = me.role === 'USER' ? me._id : partner._id;
        const companyId = me.companyId || (partner.companyId?._id || partner.companyId);
        return `company_${companyId}_admin_user_${userId}`;
    };

    useEffect(() => {
        const storedUser = JSON.parse(sessionStorage.getItem('user'));
        setUser(storedUser);

        const newSocket = io(SOCKET_URL);
        setSocket(newSocket);

        const token = sessionStorage.getItem('token');
        newSocket.emit('identify', token);

        fetchPartners();

        return () => newSocket.close();
    }, []);

    const markAsRead = async (roomId) => {
        try {
            const token = sessionStorage.getItem('token');
            await fetch(`${API_BASE_URL}/chat/read/${roomId}`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            // Update local state to clear unread count for this partner
            setPartners(prev => prev.map(p => {
                const currentRoomId = getRoomId(user, p);
                if (currentRoomId === roomId) {
                    return { ...p, unreadCount: 0 };
                }
                return p;
            }));

            // Notify sidebar via socket
            socket?.emit('markRead', token);
        } catch (error) {
            console.error('Error marking as read:', error);
        }
    };

    // Track if we've processed the initialization from location state
    const [initialPartnerProcessed, setInitialPartnerProcessed] = useState(false);

    useEffect(() => {
        if (location.state?.partner && !initialPartnerProcessed) {
            const partnerFromState = location.state.partner;
            const pid = partnerFromState._id || partnerFromState.id;

            setSelectedPartner(partnerFromState);

            setPartners(prev => {
                if (prev.find(p => (p._id || p.id) === pid)) {
                    return prev;
                }
                return [partnerFromState, ...prev];
            });

            setInitialPartnerProcessed(true);

            // Clear history state gracefully so refreshes don't re-trigger it
            window.history.replaceState(null, '');
        }
    }, [location.state, initialPartnerProcessed]);

    useEffect(() => {
        if (!socket || !selectedPartner) return;

        const roomId = getRoomId(user, selectedPartner);

        socket.emit('joinRoom', {
            token: sessionStorage.getItem('token'),
            roomId
        });

        fetchHistory(roomId);

        const messageHandler = (message) => {
            if (message.roomId === roomId) {
                setMessages(prev => [...prev, message]);
                // If message received while chat is open, mark as read
                if (user && (typeof message.senderId === 'string' ? message.senderId : message.senderId._id) !== user._id) {
                    markAsRead(roomId);
                }
            }
        };

        socket.on('receiveMessage', messageHandler);

        return () => {
            socket.off('receiveMessage', messageHandler);
        };
    }, [socket, selectedPartner, user]);

    useEffect(() => {
        if (!socket) return;

        const unreadUpdateHandler = (data) => {
            // If the message is for the currently selected partner's room, we handle it via receiveMessage/markAsRead
            // But we still need to update the partners list counts for other rooms
            setPartners(prev => prev.map(p => {
                const pRoomId = getRoomId(user, p);
                if (pRoomId === data.roomId) {
                    // Only increment if it's not the currently open chat
                    const isCurrentChat = selectedPartner && p._id === selectedPartner._id;
                    return { ...p, unreadCount: isCurrentChat ? 0 : (p.unreadCount || 0) + 1 };
                }
                return p;
            }));
        };

        socket.on('unreadUpdate', unreadUpdateHandler);
        return () => socket.off('unreadUpdate', unreadUpdateHandler);
    }, [socket, selectedPartner, user]);

    useEffect(() => {
        if (selectedPartner) {
            const roomId = getRoomId(user, selectedPartner);
            markAsRead(roomId);
        }
    }, [selectedPartner]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const fetchPartners = async () => {
        try {
            const token = sessionStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/chat/partners`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            setPartners(prev => {
                // If there's a selected partner that's not in the newly fetched data, keep them at the top
                if (location.state?.partner) {
                    const pid = location.state.partner._id || location.state.partner.id;
                    if (!data.find(p => (p._id || p.id) === pid)) {
                        return [location.state.partner, ...data];
                    }
                }
                return data;
            });
        } catch (error) {
            console.error('Error fetching partners:', error);
        }
    };

    const fetchHistory = async (roomId) => {
        try {
            const token = sessionStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/chat/history/${roomId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            setMessages(data);
        } catch (error) {
            console.error('Error fetching history:', error);
        }
    };



    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedPartner || !socket) return;

        const roomId = getRoomId(user, selectedPartner);

        socket.emit('sendMessage', {
            token: sessionStorage.getItem('token'),
            roomId,
            message: newMessage,
            receiverId: selectedPartner._id,
            receiverRole: selectedPartner.role === 'SUPER_ADMIN' ? 'superAdmin' : (selectedPartner.role === 'ADMIN' ? 'companyAdmin' : 'user')
        });

        setNewMessage('');
    };

    return (
        <div className="chat-container">
            <div className="chat-sidebar">
                <h3>Messages</h3>
                <div className="partners-list">
                    {partners.map(partner => (
                        <div
                            key={partner._id}
                            className={`partner-item ${selectedPartner?._id === partner._id ? 'active' : ''}`}
                            onClick={() => setSelectedPartner(partner)}
                        >
                            <div className="partner-info">
                                <span className="partner-name">{partner.userName}</span>
                                <span className="partner-role">
                                    {partner.role === 'ADMIN' ? 'Company Admin' : (partner.role === 'SUPER_ADMIN' ? 'Super Admin' : 'User')}
                                    {partner.companyId?.companyName ? ` (${partner.companyId.companyName})` : ''}
                                </span>
                            </div>
                            {partner.unreadCount > 0 && (
                                <div className="unread-badge">{partner.unreadCount}</div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            <div className="chat-main">
                {selectedPartner ? (
                    <>
                        <div className="chat-header">
                            <h4>{selectedPartner.userName}</h4>
                            <span>{selectedPartner.role}</span>
                        </div>
                        <div className="chat-messages">
                            {messages.map((msg, index) => {
                                const isSentByMe = user && (typeof msg.senderId === 'string' ? msg.senderId : msg.senderId._id) === user._id;
                                return (
                                    <div key={index} className={`message-wrapper ${isSentByMe ? 'sent' : 'received'}`}>
                                        <div className="message-content">
                                            <div className="message-text">{msg.message}</div>
                                            <div className="message-time">
                                                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>
                        <form className="chat-input" onSubmit={handleSendMessage}>
                            <input
                                type="text"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder="Type a message..."
                            />
                            <button type="submit">Send</button>
                        </form>
                    </>
                ) : (
                    <div className="no-chat">
                        <p>Select a contact to start chatting</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChatPage;
