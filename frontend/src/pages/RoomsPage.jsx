import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getRooms, createRoom, joinRoom, getUnreadCount, markNotificationsRead, getNotifications } from '../api/chat';
import './RoomsPage.css';

export default function RoomsPage() {
  const [rooms, setRooms] = useState([]);
  const [newRoomName, setNewRoomName] = useState('');
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [showNotifs, setShowNotifs] = useState(false);

  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchRooms();
    fetchUnreadCount();
  }, []);

  const fetchRooms = async () => {
    try {
      const res = await getRooms();
      setRooms(res.data);
    } catch (err) {
      console.log('couldnt fetch rooms', err);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const res = await getUnreadCount();
      setUnreadCount(res.data.count);
    } catch (err) {
      console.log('couldnt get notif count');
    }
  };

  const handleBellClick = async () => {
    if (showNotifs) {
        setShowNotifs(false);
        return;
    }
    setShowNotifs(true);
    try {
        const res = await getNotifications();
        setNotifications(res.data);
        await markNotificationsRead();
        setUnreadCount(0);
    } catch (err) {
        console.log('couldnt fetch notifications');
    }
};

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    if (!newRoomName.trim()) return;
    setCreating(true);
    setError('');
    try {
      const res = await createRoom(newRoomName.trim());
      setRooms(prev => [...prev, res.data]);
      setNewRoomName('');
      setShowForm(false);
      navigate(`/rooms/${res.data.slug}`);
    } catch (err) {
      const data = err.response?.data;
      setError(data?.name?.[0] || 'couldnt create room');
    } finally {
      setCreating(false);
    }
  };

  const handleJoinRoom = async (slug) => {
    try { await joinRoom(slug); } catch (err) {}
    navigate(`/rooms/${slug}`);
  };
  

  const handleLogout = () => {
    logout();
    navigate('/');
  };


  return (
    <div className="rooms-page">
      <header className="rooms-header">
        <div className="rooms-header-left">
          <span className="rooms-logo">CR</span>
          <span className="rooms-title">ChatRoom</span>
        </div>
        <div className="rooms-header-right">
          <div className="notif-wrap">
            <button className="notif-btn" onClick={handleBellClick}>
              <span>🔔</span>
              {unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}
            </button>
            {showNotifs && (
              <div className="notif-dropdown">
                <p className="notif-title">notifications</p>
                {notifications.length === 0 ? (
                  <p className="notif-empty">no notifications</p>
                ) : (
                  notifications.slice(0, 10).map(n => (
                    <div key={n.id} className="notif-item" onClick={() => { navigate(`/rooms/${n.room_slug}`); setShowNotifs(false); }}>
                      <p className="notif-preview">{n.preview}</p>
                      <p className="notif-room">#{n.room_slug}</p>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
          <a className="gitbtn" href="https://github.com/Qasim-Akram" target="_blank" rel="noopener noreferrer">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="white" aria-hidden="true">
                <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
              </svg>
            </a>
          <span className="rooms-username">{user?.username}</span>
          <button className="logout-btn" onClick={handleLogout}>sign out</button>
        </div>
      </header>

      <main className="rooms-main">
        <div className="rooms-top">
          <div>
            <h2>rooms</h2>
            <p className="rooms-count">{rooms.length} available</p>
          </div>
          <button className="new-room-btn" onClick={() => { setShowForm(!showForm); setError(''); }}>
            {showForm ? 'cancel' : '+ new room'}
          </button>
        </div>

        {showForm && (
          <form className="new-room-form" onSubmit={handleCreateRoom}>
            <input
              type="text"
              value={newRoomName}
              onChange={e => setNewRoomName(e.target.value)}
              placeholder="room name"
              autoFocus
              maxLength={50}
            />
            <button type="submit" disabled={creating}>
              {creating ? '...' : 'create'}
            </button>
            {error && <p className="form-error">{error}</p>}
          </form>
        )}

        <div className="rooms-list">
          {rooms.length === 0 ? (
            <div className="rooms-empty">
              <p>no rooms yet.</p>
              <p>create one to get started.</p>
            </div>
          ) : (
            rooms.map(room => (
              <div key={room.id} className="room-item" onClick={() => handleJoinRoom(room.slug)}>
                <div className="room-item-left">
                  <span className="room-hash">#</span>
                  <div>
                    <p className="room-name">{room.name}</p>
                    <p className="room-meta">{room.message_count} messages · {room.members_count} members</p>
                  </div>
                </div>
                <span className="room-arrow">→</span>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}