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