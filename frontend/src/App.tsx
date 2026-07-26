import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import KlarnaCarousel, { type CarouselItem, DEFAULT_ITEMS } from './components/KlarnaCarousel';
import LoginScreen from './components/LoginScreen';
import AddContactModal from './components/AddContactModal';
import SettingsModal from './components/SettingsModal';
import CreateGroupModal from './components/CreateGroupModal';
import { googleLogout } from '@react-oauth/google';

import { WebSocketProvider, useWebSocket } from './contexts/WebSocketContext';
import VideoCallOverlay from './components/VideoCallOverlay';

interface Message {
  id: string;
  senderId: string;
  receiverId?: string;
  text: string;
  image?: string;
  timestamp: Date | string;
  status?: 'sent' | 'delivered' | 'read';
  edited?: boolean;
}

// Base64 short chime sound
const CHIME_URL = "data:audio/mp3;base64,//NExAAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq//NExAAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq";
const notificationSound = new Audio(CHIME_URL);

interface SavedItem {
  id: string;
  type: string;
  content: string;
}

function AppContent() {
  const { sendMessage } = useWebSocket();
  const [currentUserData, setCurrentUserData] = useState<any>(() => {
    const saved = localStorage.getItem('nexus_user');
    return saved ? JSON.parse(saved) : null;
  });
  const currentUserId = currentUserData?.id || "me_123";

  const defaultAvatar = "https://api.dicebear.com/7.x/bottts/svg?seed=NexusUser&backgroundColor=b6e3f4";

  const handleLoginSuccess = async (cred: any) => {
    console.log("Logged in with Google token");
    
    // Decode Google JWT to get email, name, picture
    const token = cred.credential;
    const payload = JSON.parse(atob(token.split('.')[1]));
    
    const avatarToSet = payload.picture || defaultAvatar;
    
    try {
      const response = await fetch('http://localhost:8080/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: payload.email,
          username: payload.name,
          avatarUrl: avatarToSet
        })
      });
      const userData = await response.json();
      localStorage.setItem('nexus_user', JSON.stringify(userData));
      setCurrentUserData(userData);
      
      // Also update the avatar state with the real Google picture
      localStorage.setItem('nexus_avatar', avatarToSet);
      setUserAvatar(avatarToSet);
      
    } catch (e) {
      console.error("Failed to sync user with backend (running offline mode)", e);
      const fallbackUser = {
        id: "google_" + (payload.sub || Date.now()),
        email: payload.email,
        username: payload.name || "Google User",
        avatarUrl: avatarToSet,
        savedItems: []
      };
      localStorage.setItem('nexus_user', JSON.stringify(fallbackUser));
      setCurrentUserData(fallbackUser);
      localStorage.setItem('nexus_avatar', avatarToSet);
      setUserAvatar(avatarToSet);
    }

    localStorage.setItem('nexus_auth', 'true');
    setIsAuthenticated(true);
  };

  const handleGuestLogin = () => {
    const guestUser = {
      id: "guest_" + Date.now().toString().slice(-4),
      email: "guest@nexuschat.dev",
      username: "Demo Guest User",
      avatarUrl: defaultAvatar,
      savedItems: []
    };
    localStorage.setItem('nexus_user', JSON.stringify(guestUser));
    setCurrentUserData(guestUser);
    localStorage.setItem('nexus_avatar', defaultAvatar);
    setUserAvatar(defaultAvatar);
    localStorage.setItem('nexus_auth', 'true');
    setIsAuthenticated(true);
  };

  const [isAuthenticated, setIsAuthenticated] = useState(() => localStorage.getItem('nexus_auth') === 'true');
  const [activeContact, setActiveContact] = useState<CarouselItem | null>(null);
  const [contactList, setContactList] = useState<CarouselItem[]>(DEFAULT_ITEMS);

  // Fetch Followed Contacts
  useEffect(() => {
    if (currentUserId && currentUserId !== "me_123") {
      fetch(`http://localhost:8080/api/users/${currentUserId}/following`)
        .then(res => res.json())
        .then(followedUsers => {
          if (Array.isArray(followedUsers)) {
            setContactList(prev => {
              const newContacts = [...prev];
              followedUsers.forEach((user: any) => {
                if (!newContacts.find(c => c.id === user.id)) {
                  newContacts.push({
                    id: user.id,
                    label: user.username,
                    image: { src: user.avatarUrl || 'https://via.placeholder.com/150' },
                    buttonImage: { src: user.avatarUrl || 'https://via.placeholder.com/150' }
                  });
                }
              });
              return newContacts;
            });
          }
        })
        .catch(err => console.error("Failed to load followed contacts", err));
    }
  }, [currentUserId]);

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Modals & Panels
  const [isAddContactOpen, setIsAddContactOpen] = useState(false);
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSavedSpaceOpen, setIsSavedSpaceOpen] = useState(false);
  const [savedNoteText, setSavedNoteText] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [installPrompt, setInstallPrompt] = useState<any>(null);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = () => {
    if (installPrompt) {
      installPrompt.prompt();
      installPrompt.userChoice.then(() => setInstallPrompt(null));
    }
  };

  const handleSaveItem = async (content: string, type: string = 'TEXT') => {
    try {
      const payload = { type, content };
      const res = await fetch(`http://localhost:8080/api/users/${currentUserId}/saved-items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const updatedUser = await res.json();
        setCurrentUserData(updatedUser);
        localStorage.setItem('nexus_user', JSON.stringify(updatedUser));
        setSavedNoteText("");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteSavedItem = async (itemId: string) => {
    try {
      const res = await fetch(`http://localhost:8080/api/users/${currentUserId}/saved-items/${itemId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        const updatedUser = await res.json();
        setCurrentUserData(updatedUser);
        localStorage.setItem('nexus_user', JSON.stringify(updatedUser));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSavedSpaceImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (upload) => {
        if (upload.target?.result) {
          handleSaveItem(upload.target.result as string, 'IMAGE');
        }
      };
      reader.readAsDataURL(file);
    }
  };
  
  // Call State
  const [callState, setCallState] = useState({ isActive: false, isIncoming: false, callType: null as 'audio' | 'video' | null });

  // User Avatar State
  const [userAvatar, setUserAvatar] = useState(() => localStorage.getItem('nexus_avatar') || defaultAvatar);

  const handleAvatarChange = (newAvatar: string) => {
    localStorage.setItem('nexus_avatar', newAvatar);
    setUserAvatar(newAvatar);
  };

  const filteredContacts = contactList.map(contact => {
    if (contact.label === "My Account") {
      return { 
        ...contact, 
        image: { src: userAvatar },
        buttonImage: { src: userAvatar } 
      };
    }
    return contact;
  }).filter(contact => 
    contact.label?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Real Message History Fetching
  const fetchChatHistory = async (targetId: string) => {
    try {
      const res = await fetch(`http://localhost:8080/api/messages/${currentUserId}/${targetId}`);
      if (res.ok) {
        const data = await res.json();
        const formatted = data.map((m: any) => ({
          id: m.id,
          senderId: m.senderId,
          receiverId: m.receiverId,
          text: m.content,
          image: m.mediaType === 'IMAGE' ? m.mediaData : undefined,
          timestamp: new Date(m.timestamp),
          status: m.status?.toLowerCase() || 'sent',
          edited: m.edited
        }));
        setMessages(formatted);
      }
    } catch (e) {
      console.error("Failed to fetch chat history", e);
    }
  };

  useEffect(() => {
    if (activeContact && activeContact.id) {
      fetchChatHistory(activeContact.id);
    }
  }, [activeContact]);

  // Listen for incoming STOMP messages
  useEffect(() => {
    const handleIncomingMessage = (e: any) => {
      const msg = e.detail;
      const formatted: Message = {
        id: msg.id,
        senderId: msg.senderId,
        receiverId: msg.receiverId,
        text: msg.content,
        image: msg.mediaType === 'IMAGE' ? msg.mediaData : undefined,
        timestamp: new Date(msg.timestamp),
        status: msg.status?.toLowerCase() || 'sent',
        edited: msg.edited
      };

      // Only add to current chat if it belongs to the active contact
      const isActiveChat = activeContact && (msg.senderId === activeContact.id || msg.receiverId === activeContact.id);
      
      if (isActiveChat) {
        setMessages(prev => {
          // If it's an edit, replace it
          if (msg.edited) {
            return prev.map(m => m.id === formatted.id ? formatted : m);
          }
          // Prevent duplicates
          if (prev.find(m => m.id === formatted.id)) return prev;
          return [...prev, formatted];
        });
      } else if (msg.senderId !== currentUserId && !msg.edited) {
        // Not active chat, and not from us, play sound and increment badge!
        notificationSound.play().catch(e => console.log("Audio play blocked", e));
        setToastMessage(`New message from ${msg.senderId}`);
        setTimeout(() => setToastMessage(null), 3000);
      }

      // WhatsApp Style: Bubble the sender up to the top of contactList!
      const contactId = msg.senderId === currentUserId ? msg.receiverId : msg.senderId;
      setContactList(prev => {
        const contactIndex = prev.findIndex(c => c.id === contactId);
        if (contactIndex > -1) {
          const newArr = [...prev];
          const [moved] = newArr.splice(contactIndex, 1);
          if (!isActiveChat && msg.senderId !== currentUserId && !msg.edited) {
            moved.unreadCount = (moved.unreadCount || 0) + 1;
          }
          return [moved, ...newArr]; // Push to front
        }
        return prev;
      });
    };

    window.addEventListener('chat-message', handleIncomingMessage);
    return () => window.removeEventListener('chat-message', handleIncomingMessage);
  }, [activeContact, currentUserId]);

  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !activeContact?.id) return;

    if (editingMessageId) {
      // Edit existing message
      const payload = {
        messageId: editingMessageId,
        content: inputText
      };
      sendMessage('/app/chat.editMessage', payload);
      setEditingMessageId(null);
    } else {
      // Send new message
      const payload = {
        senderId: currentUserId,
        receiverId: activeContact.id,
        content: inputText,
        mediaType: 'TEXT',
        isGroupMessage: false,
        status: 'SENT'
      };
      sendMessage('/app/chat.sendMessage', payload);
    }

    setInputText("");
    
    // Bubble up active contact to top (WhatsApp style)
    setContactList(prev => {
      const contactIndex = prev.findIndex(c => c.id === activeContact.id);
      if (contactIndex > -1) {
        const newArr = [...prev];
        const [moved] = newArr.splice(contactIndex, 1);
        return [moved, ...newArr];
      }
      return prev;
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && activeContact?.id) {
      const reader = new FileReader();
      reader.onload = (upload) => {
        if (upload.target?.result) {
          const payload = {
            senderId: currentUserId,
            receiverId: activeContact.id,
            content: "",
            mediaData: upload.target.result as string,
            mediaType: 'IMAGE',
            isGroupMessage: false,
            status: 'SENT'
          };
          
          sendMessage('/app/chat.sendMessage', payload);
          
          // Bubble up active contact to top
          setContactList(prev => {
            const contactIndex = prev.findIndex(c => c.id === activeContact.id);
            if (contactIndex > -1) {
              const newArr = [...prev];
              const [moved] = newArr.splice(contactIndex, 1);
              return [moved, ...newArr];
            }
            return prev;
          });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogout = () => {
    googleLogout();
    localStorage.removeItem('nexus_auth');
    localStorage.removeItem('nexus_user');
    localStorage.removeItem('nexus_avatar');
    setUserAvatar(defaultAvatar);
    setCurrentUserData(null);
    setIsAuthenticated(false);
    setIsSettingsOpen(false);
  };

  const formatTime = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (!isAuthenticated) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} onGuestLogin={handleGuestLogin} />;
  }

  return (
    <>
      <header className="header">
        <div className="logo">NexusChat</div>
        
        <div className="search-container">
          <svg className="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input 
            type="text" 
            className="search-input" 
            placeholder="Search contacts, messages..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        {/* Header Actions */}
        <div className="actions">
          {installPrompt && (
            <button className="btn-icon" onClick={handleInstallClick} title="Download App" style={{ background: 'var(--accent)', color: 'white', border: 'none' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
            </button>
          )}
          <button className="btn-icon" onClick={() => setIsCreateGroupOpen(true)} title="Create Group" style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#10b981' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
          </button>
          <button className="btn-icon" onClick={() => setIsAddContactOpen(true)} title="Add Contact" style={{ background: 'rgba(59, 130, 246, 0.2)', color: '#3b82f6' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="8.5" cy="7" r="4"></circle>
              <line x1="20" y1="8" x2="20" y2="14"></line>
              <line x1="23" y1="11" x2="17" y2="11"></line>
            </svg>
          </button>
          <button className="btn-icon" onClick={() => setIsSavedSpaceOpen(!isSavedSpaceOpen)} title="Saved Items">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
            </svg>
          </button>
          <button className="btn-icon" onClick={() => setIsSettingsOpen(true)} title="Settings">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
            </svg>
          </button>
        </div>
      </header>

      <main className="main-content">
        <AnimatePresence mode="wait">
          {!activeContact ? (
            <motion.div 
              key="carousel"
              className="view-container"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1 }}
              transition={{ duration: 0.4 }}
            >
              <KlarnaCarousel 
                items={filteredContacts}
                onSelect={(item) => {
                  // Clear unread count on select
                  setContactList(prev => prev.map(c => c.id === item.id ? { ...c, unreadCount: 0 } : c));
                  setActiveContact(item);
                }} 
              />
            </motion.div>
          ) : (
            <motion.div 
              key="chat"
              className="view-container"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              transition={{ duration: 0.4 }}
            >
              <div className="chat-window">
                {/* Chat Header */}
                <div className="chat-header">
                  <button className="btn-back" onClick={() => setActiveContact(null)}>
                    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Back
                  </button>
                  <div className="chat-user-info">
                    <img src={typeof activeContact.image === 'string' ? activeContact.image : activeContact.image?.src} alt="" className="chat-avatar" />
                    <div className="chat-user-details">
                      <h2>{activeContact.label}</h2>
                      <div className="chat-user-status">
                        <span className="status-dot"></span>
                        Online
                      </div>
                    </div>
                  </div>
                  
                  {/* WebRTC Video Call Buttons & Remove Option */}
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <button 
                      className="btn-icon" 
                      onClick={() => setCallState({ isActive: true, isIncoming: false, callType: 'audio' })} 
                      title="Audio Call"
                    >
                      <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </button>
                    <button 
                      className="btn-icon" 
                      onClick={() => setCallState({ isActive: true, isIncoming: false, callType: 'video' })} 
                      title="Video Call"
                    >
                      <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                    <button 
                      className="btn-icon" 
                      style={{ color: '#ef4444' }}
                      onClick={() => {
                        // Remove from dynamic contacts list
                        if (activeContact) {
                          setContactList(prev => prev.filter(c => c.id !== activeContact.id));
                        }
                        setActiveContact(null);
                      }} 
                      title="Remove Contact"
                    >
                      <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
                
                {/* Chat Messages */}
                <div className="chat-messages">
                  {messages.map(msg => (
                    <div key={msg.id} className={`message ${msg.senderId === currentUserId ? 'sent' : 'received'}`}>
                      <div className="message-content-wrapper" style={{ position: 'relative' }}>
                        {msg.text}
                        {msg.image && <img src={msg.image} alt="Upload" />}
                        
                        <button 
                          className="btn-save-message" 
                          onClick={() => handleSaveItem(msg.text || "Saved Image")}
                          title="Save to Workspace"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                          </svg>
                        </button>
                        
                        {msg.senderId === currentUserId && (
                          <button 
                            className="btn-edit-message" 
                            onClick={() => {
                              setEditingMessageId(msg.id);
                              setInputText(msg.text);
                            }}
                            title="Edit Message"
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                            </svg>
                          </button>
                        )}
                      </div>
                      
                      <div className="message-meta">
                        {msg.edited && <span style={{ fontStyle: 'italic', marginRight: '4px' }}>(edited)</span>}
                        <span>{formatTime(msg.timestamp)}</span>
                        {msg.senderId === currentUserId && (
                          <span className={`ticks ${msg.status === 'read' ? 'read' : ''}`}>
                            {msg.status === 'sent' ? '✓' : '✓✓'}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <form className="chat-input-area" onSubmit={handleSendMessage}>
                  <label className="btn-attach" title="Attach file">
                    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                    </svg>
                    <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
                  </label>
                  <input 
                    type="text" 
                    className="chat-input"
                    placeholder={editingMessageId ? "Edit message..." : `Message ${activeContact.label}...`}
                    value={inputText}
                    onChange={e => setInputText(e.target.value)}
                  />
                  <button type="submit" className="btn-send">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="22" y1="2" x2="11" y2="13"></line>
                      <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                    </svg>
                  </button>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <VideoCallOverlay 
        currentUserId={currentUserId}
        targetUserId={activeContact ? activeContact.id || "target_user_123" : null}
        targetUserName={activeContact?.label || "User"}
        isActive={callState.isActive}
        isIncoming={callState.isIncoming}
        callType={callState.callType as 'audio' | 'video' | null}
        onEndCall={() => setCallState({ isActive: false, isIncoming: false, callType: null })}
      />

      {toastMessage && (
        <div className="toast-notification">
          {toastMessage}
        </div>
      )}

      {/* Saved Items Panel */}
      <div className={`saved-items-panel ${isSavedSpaceOpen ? 'open' : ''}`}>
        <div className="saved-header">
          <h3>Saved Space</h3>
          <button className="btn-close" onClick={() => setIsSavedSpaceOpen(false)}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        <div className="saved-list">
          {currentUserData?.savedItems?.map((item: SavedItem, index: number) => (
            <div key={item.id || index} className="saved-item">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  {item.type === 'IMAGE' ? (
                    <img src={item.content} alt="Saved" style={{ maxWidth: '100%', borderRadius: '8px' }} />
                  ) : (
                    <p>{item.content}</p>
                  )}
                </div>
                <button 
                  className="btn-delete-saved" 
                  onClick={() => handleDeleteSavedItem(item.id)}
                  title="Delete"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                  </svg>
                </button>
              </div>
            </div>
          ))}
          {(!currentUserData?.savedItems || currentUserData.savedItems.length === 0) && (
            <p style={{ color: 'var(--text-secondary)', textAlign: 'center', marginTop: '20px' }}>
              Save messages or images here to keep them handy!
            </p>
          )}
        </div>
        
        <div style={{ marginTop: '20px', display: 'flex', gap: '8px' }}>
          <label className="btn-attach" style={{ cursor: 'pointer', background: 'var(--bg-glass)', borderRadius: '12px' }}>
            <input type="file" accept="image/*" hidden onChange={handleSavedSpaceImageUpload} />
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
          </label>
          <input 
            type="text" 
            className="chat-input" 
            style={{ borderRadius: '12px' }}
            placeholder="Add a quick note..."
            value={savedNoteText}
            onChange={(e) => setSavedNoteText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && savedNoteText.trim()) handleSaveItem(savedNoteText, 'TEXT');
            }}
          />
          <button 
            className="btn-primary" 
            style={{ borderRadius: '12px', padding: '0 16px' }}
            onClick={() => { if(savedNoteText.trim()) handleSaveItem(savedNoteText, 'TEXT'); }}
          >
            Save
          </button>
        </div>
      </div>

      <CreateGroupModal
        isOpen={isCreateGroupOpen}
        onClose={() => setIsCreateGroupOpen(false)}
        currentUserId={currentUserId}
        onCreateGroup={(group) => {
          // Add group to Carousel
          const newItem: CarouselItem = {
            id: group.id,
            label: group.name,
            image: { src: 'https://api.dicebear.com/7.x/initials/svg?seed=' + group.name },
            buttonImage: { src: 'https://api.dicebear.com/7.x/initials/svg?seed=' + group.name }
          };
          setContactList(prev => [...prev, newItem]);
          setIsCreateGroupOpen(false);
        }}
      />

      <AddContactModal 
        isOpen={isAddContactOpen} 
        onClose={() => setIsAddContactOpen(false)}
        currentUserId={currentUserId}
        onAddContact={(user) => {
          // Check if already in contact list
          if (!contactList.find(c => c.id === user.id)) {
            const newItem: CarouselItem = {
              id: user.id,
              label: user.username,
              image: { src: user.avatarUrl || 'https://via.placeholder.com/150' },
              buttonImage: { src: user.avatarUrl || 'https://via.placeholder.com/150' }
            };
            setContactList(prev => [...prev, newItem]);
          }
          setIsAddContactOpen(false);
        }}
      />

      <SettingsModal 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onLogout={handleLogout}
        userAvatar={userAvatar}
        onAvatarChange={handleAvatarChange}
      />
    </>
  );
}

export default function App() {
  const saved = localStorage.getItem('nexus_user');
  const initialUserId = saved ? JSON.parse(saved).id : "me_123";

  return (
    <WebSocketProvider userId={initialUserId}>
      <AppContent />
    </WebSocketProvider>
  );
}
