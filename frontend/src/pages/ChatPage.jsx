/*
  ChatPage -- the actual chat room

  this page does two things:
  1. loads message history via REST API (HTTP)
  2. connects to WebSocket for real-time messages

  the tricky part is combining both -- old messages come from
  the API, new messages come from the WebSocket. we merge them
  into one list.
*/

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getRoom } from '../api/chat';
import './ChatPage.css';

export default function ChatPage() {
  const { slug } = useParams(); // room slug from the url
  const { user, accessToken } = useAuth();
  const navigate = useNavigate();

  const [room, setRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [connected, setConnected] = useState(false);
  const [statusText, setStatusText] = useState('connecting...');

  const wsRef = useRef(null);         // holds the WebSocket instance
  const bottomRef = useRef(null);     // dummy div at bottom for auto scroll
  const inputRef = useRef(null);

  // load room info and initial messages
  useEffect(() => {
    const loadRoom = async () => {
      try {
        const res = await getRoom(slug);
        setRoom(res.data);
        setMessages(res.data.recent_messages || []);
      } catch (err) {
        if (err.response?.status === 404) {
          navigate('/rooms');
        }
      }
    };
    loadRoom();
  }, [slug, navigate]);

  // websocket connection
  // runs when the component mounts (and if slug changes)
  useEffect(() => {
    if (!accessToken) return;

    // we pass the token as a query param because websockets
    // dont support custom headers like HTTP does
    const wsUrl = `ws://localhost:8000/ws/chat/${slug}/?token=${accessToken}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      setStatusText('connected');
      inputRef.current?.focus();
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === 'message') {
        // new chat message, add to list
        setMessages(prev => [...prev, {
          id: data.message_id,
          content: data.message,
          sender_username: data.username,
          timestamp: data.timestamp,
        }]);
      }
      // could handle user_join and user_leave here too if we wanted
    };

    ws.onclose = () => {
      setConnected(false);
      setStatusText('disconnected');
    };

    ws.onerror = () => {
      setStatusText('connection error');
    };

    // cleanup: close websocket when leaving the page
    return () => {
      ws.close();
    };
  }, [slug, accessToken]);

  // scroll to bottom whenever messages update
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = () => {
    const text = inputText.trim();
    if (!text || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

    // send to backend via websocket
    wsRef.current.send(JSON.stringify({ message: text }));
    setInputText('');
  };

  const handleKeyDown = (e) => {
    // send on Enter, new line on Shift+Enter
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // group consecutive messages from the same user together
  // so we dont repeat the username on every single line
  const groupedMessages = groupMessages(messages);

  return (
    <div className="chat-page">

      {/* top bar */}
      <header className="chat-header">
        <div className="chat-header-left">
          <button className="back-btn" onClick={() => navigate('/rooms')}>←</button>
          <div>
            <span className="chat-room-name"># {room?.name || slug}</span>
          </div>
        </div>
        <div className="chat-status">
          <span className={`status-dot ${connected ? 'online' : 'offline'}`}></span>
          <span className="status-text">{statusText}</span>
        </div>
      </header>

      {/* messages area */}
      <div className="chat-messages">
        {messages.length === 0 && (
          <div className="chat-empty">
            <p>no messages yet.</p>
            <p>say something.</p>
          </div>
        )}

        {groupedMessages.map((group, i) => (
          <div key={i} className="msg-group">
            <div className="msg-meta">
              <span className={`msg-username ${group.isOwn ? 'own' : ''}`}>
                {group.isOwn ? 'you' : group.username}
              </span>
              <span className="msg-time">
                {formatTime(group.messages[0].timestamp)}
              </span>
            </div>
            {group.messages.map((msg) => (
              <div key={msg.id} className={`msg-bubble ${group.isOwn ? 'own' : ''}`}>
                {msg.content}
              </div>
            ))}
          </div>
        ))}

        {/* invisible div we scroll to */}
        <div ref={bottomRef} />
      </div>

      {/* input bar */}
      <div className="chat-input-area">
        <div className="chat-input-wrap">
          <textarea
            ref={inputRef}
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={connected ? `message #${room?.name || slug}` : 'waiting for connection...'}
            disabled={!connected}
            rows={1}
            className="chat-input"
          />
          <button
            className="send-btn"
            onClick={sendMessage}
            disabled={!connected || !inputText.trim()}
          >
            send
          </button>
        </div>
        <p className="input-hint">enter to send · shift+enter for new line</p>
      </div>

    </div>
  );
}

// groups consecutive messages from the same sender together
function groupMessages(messages) {
  if (!messages.length) return [];

  const groups = [];
  let currentGroup = null;

  // we need the logged in user to know which messages are "own"
  // get it from localStorage since we're outside the component
  const savedUser = localStorage.getItem('user');
  const currentUsername = savedUser ? JSON.parse(savedUser).username : null;

  for (const msg of messages) {
    const isOwn = msg.sender_username === currentUsername;

    if (currentGroup && currentGroup.username === msg.sender_username) {
      // same sender as last message, add to current group
      currentGroup.messages.push(msg);
    } else {
      // new sender, start a new group
      currentGroup = {
        username: msg.sender_username,
        isOwn,
        messages: [msg],
      };
      groups.push(currentGroup);
    }
  }

  return groups;
}

// format timestamp to something readable like "2:34 PM"
function formatTime(timestamp) {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
