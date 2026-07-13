import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import DashboardLayout from '../../layouts/DashboardLayout';
import chatService from '../../services/chat.service';
import socketService from '../../services/socket.service';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import { Send, MapPin } from 'lucide-react';

export default function Chat() {
  const { id: activeChatId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [chats, setChats] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loadingChats, setLoadingChats] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [error, setError] = useState(null);
  
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('Connecting...');

  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);

  // 1. Fetch Chat List
  useEffect(() => {
    const fetchChats = async () => {
      try {
        setLoadingChats(true);
        const res = await chatService.getMyChats();
        if (res.success) setChats(res.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoadingChats(false);
      }
    };
    fetchChats();
  }, []);

  // 2. Initialize Socket & Load Messages when activeChatId changes
  useEffect(() => {
    if (!activeChatId) return;

    const loadMessages = async () => {
      try {
        setLoadingMessages(true);
        const res = await chatService.getChatMessages(activeChatId);
        if (res.success) setMessages(res.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoadingMessages(false);
      }
    };

    loadMessages();

    // Connect socket
    const socket = socketService.connect();
    socketRef.current = socket;

    if (socket) {
      socket.emit('join_chat', { chatId: activeChatId });

      const handleConnect = () => setConnectionStatus('Connected');
      const handleDisconnect = () => setConnectionStatus('Disconnected');
      const handleReconnect = () => setConnectionStatus('Reconnecting...');
      
      if (socket.connected) {
        setConnectionStatus('Connected');
      }

      socket.on('connect', handleConnect);
      socket.on('disconnect', handleDisconnect);
      socket.io.on('reconnect_attempt', handleReconnect);

      const handleNewMessage = ({ message }) => {
        setMessages((prev) => [...prev, message]);
        // Also update chat list timestamp/order optimistically
        setChats(prev => {
          const updated = [...prev];
          const chatIdx = updated.findIndex(c => c._id === activeChatId);
          if (chatIdx > -1) {
            const [chat] = updated.splice(chatIdx, 1);
            chat.updatedAt = new Date().toISOString();
            updated.unshift(chat);
          }
          return updated;
        });
      };

      const handleError = ({ message }) => {
        alert(`Chat Error: ${message}`);
        setSending(false);
      };

      socket.on('new_message', handleNewMessage);
      socket.on('chat_error', handleError);

      return () => {
        socket.off('connect', handleConnect);
        socket.off('disconnect', handleDisconnect);
        socket.io.off('reconnect_attempt', handleReconnect);
        socket.off('new_message', handleNewMessage);
        socket.off('chat_error', handleError);
      };
    }
  }, [activeChatId]);

  // Clean up socket on completely unmounting chat page
  useEffect(() => {
    return () => {
      socketService.disconnect();
    };
  }, []);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e) => {
    e?.preventDefault();
    if (!newMessage.trim() || !activeChatId || !socketRef.current) return;

    setSending(true);
    socketRef.current.emit('send_message', { chatId: activeChatId, content: newMessage.trim() });
    setNewMessage('');
    // Note: the socket 'new_message' event will append it and reset sending
    // but to be safe, we reset sending after a tiny timeout
    setTimeout(() => setSending(false), 500); 
  };

  const activeChat = chats.find(c => c._id === activeChatId);
  const getOtherParticipant = (chat) => {
    if (!chat || !user) return null;
    return chat.tenant._id === user._id ? chat.owner : chat.tenant;
  };

  if (loadingChats) return <DashboardLayout><LoadingSpinner /></DashboardLayout>;
  if (error && !chats.length) return <DashboardLayout><ErrorMessage message={error} /></DashboardLayout>;

  return (
    <DashboardLayout>
      <div style={{ display: 'flex', height: 'calc(100vh - 140px)', background: '#fff', border: '1px solid var(--border)', borderRadius: 24, overflow: 'hidden', boxShadow: 'var(--shadow-card)' }}>
        
        {/* Sidebar: Chat List */}
        <div className={`chat-sidebar ${activeChatId ? 'hidden-mobile' : ''}`} style={{ width: 320, borderRight: '1px solid var(--divider)', display: 'flex', flexDirection: 'column', background: '#fafafa' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--divider)', background: '#fff' }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Messages</h2>
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {chats.length === 0 ? (
              <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>No conversations yet.</div>
            ) : (
              chats.map(chat => {
                const other = getOtherParticipant(chat);
                const isActive = chat._id === activeChatId;
                return (
                  <div
                    key={chat._id}
                    onClick={() => navigate(`/chats/${chat._id}`)}
                    style={{
                      padding: '16px 20px', cursor: 'pointer', borderBottom: '1px solid var(--divider)',
                      background: isActive ? '#fff' : 'transparent',
                      borderLeft: isActive ? '3px solid var(--brand)' : '3px solid transparent',
                      transition: 'background .2s'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--bg-section)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, color: 'var(--text-secondary)' }}>
                        {other?.name?.charAt(0) || '?'}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{other?.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          <MapPin size={10} /> {chat.listing?.location}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Main: Chat Window */}
        <div className={`chat-main ${!activeChatId ? 'hidden-mobile' : ''}`} style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative' }}>
          {!activeChatId ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', flexDirection: 'column', gap: 12 }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--bg-section)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Send size={24} color="var(--text-secondary)" />
              </div>
              <p>Select a conversation to start chatting</p>
            </div>
          ) : loadingMessages ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><LoadingSpinner /></div>
          ) : (
            <>
              {/* Header */}
              <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--divider)', display: 'flex', alignItems: 'center', gap: 12, background: '#fff', zIndex: 10 }}>
                <button className="chat-back-btn" onClick={() => navigate('/chats')}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
                </button>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--bg-section)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  {getOtherParticipant(activeChat)?.name?.charAt(0)}
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700 }}>{getOtherParticipant(activeChat)?.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    {activeChat?.listing?.location} • {activeChat?.listing?.roomType}
                    <span style={{ 
                      fontSize: 10, 
                      fontWeight: 600, 
                      padding: '2px 6px', 
                      borderRadius: 10, 
                      background: connectionStatus === 'Connected' ? 'rgba(34,197,94,0.1)' : 'rgba(245,158,11,0.1)',
                      color: connectionStatus === 'Connected' ? '#22c55e' : '#f59e0b'
                    }}>
                      {connectionStatus}
                    </span>
                  </div>
                </div>
              </div>

              {/* Messages Area */}
              <div style={{ flex: 1, padding: 24, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16, background: 'var(--bg-body)' }}>
                {messages.length === 0 ? (
                  <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, marginTop: 'auto', marginBottom: 'auto' }}>
                    No messages yet. Say hi!
                  </div>
                ) : (
                  messages.map((msg, idx) => {
                    const isMe = msg.sender._id === user._id;
                    const showAvatar = !isMe && (idx === messages.length - 1 || messages[idx + 1]?.sender._id !== msg.sender._id);
                    
                    return (
                      <div key={msg._id} style={{ display: 'flex', alignItems: 'flex-end', justifyContent: isMe ? 'flex-end' : 'flex-start', gap: 8 }}>
                        {!isMe && (
                          <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--bg-section)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', visibility: showAvatar ? 'visible' : 'hidden' }}>
                            {msg.sender.name.charAt(0)}
                          </div>
                        )}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
                          <div style={{
                            background: isMe ? 'var(--brand)' : '#fff',
                            color: isMe ? '#fff' : 'var(--text)',
                            padding: '10px 14px',
                            borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                            fontSize: 14, lineHeight: 1.5,
                            boxShadow: isMe ? 'none' : '0 1px 2px rgba(0,0,0,0.05)',
                            border: isMe ? 'none' : '1px solid var(--border)',
                            maxWidth: 400, wordBreak: 'break-word'
                          }}>
                            {msg.content}
                          </div>
                          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4, padding: '0 4px' }}>
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div style={{ padding: '16px 24px', background: '#fff', borderTop: '1px solid var(--divider)' }}>
                <form onSubmit={handleSend} style={{ display: 'flex', gap: 12 }}>
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    style={{ flex: 1, padding: '12px 16px', border: '1.5px solid var(--border)', borderRadius: 24, fontSize: 14, outline: 'none' }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                  />
                  <button type="submit" disabled={!newMessage.trim() || sending} className="btn btn-primary" style={{ width: 48, height: 48, borderRadius: '50%', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Send size={18} />
                  </button>
                </form>
              </div>
            </>
          )}
        </div>

      </div>
    </DashboardLayout>
  );
}
