import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './Modal.css';

interface AddContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddContact: (user: any) => void;
  currentUserId: string;
}

export default function AddContactModal({ isOpen, onClose, onAddContact, currentUserId }: AddContactModalProps) {
  const [searchType, setSearchType] = useState<'email' | 'nearby'>('email');
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [followingMap, setFollowingMap] = useState<Record<string, boolean>>({});

  const handleSearch = async () => {
    if (!query.trim()) return;
    setIsSearching(true);
    try {
      const res = await fetch(`http://localhost:8080/api/users/search?query=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json();
        // Filter out the current user
        const filtered = data.filter((u: any) => u.id !== currentUserId);
        setResults(filtered);
      } else {
        setResults([]);
      }
    } catch (e) {
      console.error(e);
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleFollowToggle = async (user: any, isFollowing: boolean) => {
    try {
      const endpoint = isFollowing ? 'unfollow' : 'follow';
      const res = await fetch(`http://localhost:8080/api/users/${currentUserId}/${endpoint}/${user.id}`, {
        method: 'POST'
      });
      if (res.ok) {
        setFollowingMap(prev => ({ ...prev, [user.id]: !isFollowing }));
        if (!isFollowing) {
          onAddContact(user); // Auto-add to carousel when followed!
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleFindNearby = () => {
    setIsSearching(true);
    setTimeout(() => {
      setResults([
        { id: '3', username: 'local_friend', email: 'local@example.com', avatarUrl: 'https://i.pravatar.cc/150?u=local' }
      ]);
      setIsSearching(false);
    }, 1500);
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
              <h2>Add Contact</h2>
              <button onClick={onClose} className="btn-close-modal">
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="modal-tabs">
              <button
                className={`modal-tab ${searchType === 'email' ? 'active' : ''}`}
                onClick={() => { setSearchType('email'); setResults([]); }}
              >
                Global Search
              </button>
              <button
                className={`modal-tab ${searchType === 'nearby' ? 'active' : ''}`}
                onClick={() => { setSearchType('nearby'); setResults([]); }}
              >
                Find Nearby
              </button>
            </div>

            {searchType === 'email' ? (
              <div className="search-input-group">
                <input
                  type="text"
                  placeholder="Email or Username..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="search-input-modal"
                />
                <button onClick={handleSearch} className="btn-search">
                  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </div>
            ) : (
              <div className="nearby-box">
                <div className="nearby-icon">
                  <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <p style={{ color: '#a0a0a0', fontSize: 13, marginBottom: 15 }}>
                  Discover people within a 10km radius using your device's location.
                </p>
                <button onClick={handleFindNearby} className="btn-primary">
                  Enable Location & Search
                </button>
              </div>
            )}

            <div className="results-list">
              {isSearching ? (
                <div style={{ textAlign: 'center', padding: '20px', color: '#a0a0a0' }}>Searching...</div>
              ) : results.length > 0 ? (
                results.map((user) => (
                  <div key={user.id} className="result-item">
                    <div className="result-user">
                      <img src={user.avatarUrl || 'https://via.placeholder.com/150'} alt={user.username} className="result-avatar" />
                      <div>
                        <p className="result-name">{user.username}</p>
                        <p className="result-email">{user.email}</p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button 
                        onClick={() => handleFollowToggle(user, followingMap[user.id] || false)} 
                        className="btn-primary"
                        style={{ padding: '6px 12px', fontSize: '12px', background: followingMap[user.id] ? 'rgba(255,255,255,0.1)' : 'var(--accent)' }}
                      >
                        {followingMap[user.id] ? 'Unfollow' : 'Follow'}
                      </button>
                      <button onClick={() => onAddContact(user)} className="btn-add" title="Chat">
                        <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ textAlign: 'center', padding: '20px', color: '#555', fontSize: 14 }}>
                  {searchType === 'email' ? 'No results found' : 'Ready to search nearby'}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
