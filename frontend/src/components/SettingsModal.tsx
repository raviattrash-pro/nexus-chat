import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './Modal.css';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
  userAvatar?: string;
  onAvatarChange?: (newAvatar: string) => void;
}

export default function SettingsModal({ isOpen, onClose, onLogout, userAvatar, onAvatarChange }: SettingsModalProps) {
  const [darkTheme, setDarkTheme] = useState(() => !document.body.classList.contains('light-theme'));
  const [notifications, setNotifications] = useState(true);

  const toggleTheme = () => {
    setDarkTheme(!darkTheme);
    document.body.classList.toggle('light-theme');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onAvatarChange) {
      const reader = new FileReader();
      reader.onload = (upload) => {
        if (upload.target?.result) {
          onAvatarChange(upload.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="modal-overlay" onClick={onClose}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>Settings</h2>
              <button onClick={onClose} className="btn-close-modal">
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div>
              {/* Profile Image Section */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '24px' }}>
                <img 
                  src={userAvatar} 
                  alt="Profile" 
                  style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', marginBottom: '12px', border: '2px solid rgba(255,255,255,0.1)' }} 
                />
                <label style={{ 
                  background: 'rgba(255,255,255,0.1)', 
                  padding: '8px 16px', 
                  borderRadius: '20px', 
                  fontSize: '14px', 
                  cursor: 'pointer',
                  transition: 'background 0.2s'
                }}>
                  Change Image
                  <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />
                </label>
              </div>

              <div className="setting-item">
                <div>
                  <h3 className="setting-title">Dark Theme</h3>
                  <p className="setting-desc">OLED optimized dark mode</p>
                </div>
                <div 
                  className={`toggle-switch ${darkTheme ? 'on' : ''}`}
                  onClick={toggleTheme}
                >
                  <div className="toggle-knob" />
                </div>
              </div>

              <div className="setting-item">
                <div>
                  <h3 className="setting-title">Notifications</h3>
                  <p className="setting-desc">Push alerts for new messages</p>
                </div>
                <div 
                  className={`toggle-switch ${notifications ? 'on' : ''}`}
                  onClick={() => setNotifications(!notifications)}
                >
                  <div className="toggle-knob" />
                </div>
              </div>

              <button onClick={onLogout} className="btn-danger">
                Log Out
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
