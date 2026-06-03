import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getRooms, createRoom, joinRoom } from '../api/chat';
import './RoomsPage.css';

export default function RoomsPage() {
  const [rooms, setRooms] = useState([]);
  const [newRoomName, setNewRoomName] = useState('');
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');

  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      const res = await getRooms();
      setRooms(res.data);
    } catch (err) {
      console.log('couldnt fetch rooms', err);
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
      if (data?.name) {
        setError(data.name[0]);
      } else {
        setError('couldnt create room');
      }
    } finally {
      setCreating(false);
    }
  };

  const handleJoinRoom = async (slug) => {
    try {
      await joinRoom(slug);
      navigate(`/rooms/${slug}`);
    } catch (err) {
      navigate(`/rooms/${slug}`);
    }
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
          <button
            className="new-room-btn"
            onClick={() => { setShowForm(!showForm); setError(''); }}
          >
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
              <div
                key={room.id}
                className="room-item"
                onClick={() => handleJoinRoom(room.slug)}
              >
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
