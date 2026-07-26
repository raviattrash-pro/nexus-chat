import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './Modal.css';

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserId: string;
  onCreateGroup: (group: any) => void;
}

export default function CreateGroupModal({ isOpen, onClose, currentUserId, onCreateGroup }: CreateGroupModalProps) {
  const [groupName, setGroupName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim()) return;
    
    setIsSubmitting(true);
    try {
      const res = await fetch('http://localhost:8080/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: groupName,
          memberIds: [currentUserId], // The creator is automatically a member
          // In a full implementation, you'd have a UI to select friends here
        })
      });
      
      if (res.ok) {
        const newGroup = await res.json();
        onCreateGroup(newGroup);
        setGroupName('');
      }
    } catch (e) {
      console.error("Failed to create group", e);
    } finally {
      setIsSubmitting(false);
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
              <h2>Create Group Chat</h2>
              <button onClick={onClose} className="btn-close-modal">
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleSubmit} style={{ padding: '20px' }}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                  Group Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Project Alpha Team"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  className="search-input-modal"
                  style={{ width: '100%', marginBottom: '0' }}
                  required
                />
              </div>
              <button 
                type="submit" 
                className="btn-primary" 
                disabled={isSubmitting || !groupName.trim()}
                style={{ width: '100%', opacity: (!groupName.trim() || isSubmitting) ? 0.5 : 1 }}
              >
                {isSubmitting ? 'Creating...' : 'Create Group'}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
