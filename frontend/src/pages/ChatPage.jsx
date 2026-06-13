import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getRoom } from '../api/chat';
import './ChatPage.css';

const EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🔥'];

export default function ChatPage() {
  const { slug } = useParams();
  const { user, accessToken } = useAuth();
  const navigate = useNavigate();

  const [room, setRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [connected, setConnected] = useState(false);
  const [statusText, setStatusText] = useState('connecting...');
  const [activeReactionMenu, setActiveReactionMenu] = useState(null);

  const wsRef = useRef(null);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const loadRoom = async () => {
      try {
        const res = await getRoom(slug);
        setRoom(res.data);
        setMessages(res.data.recent_messages || []);
      } catch (err) {
        if (err.response?.status === 404) navigate('/rooms');
      }
    };
    loadRoom();
  }, [slug, navigate]);

  useEffect(() => {
    if (!accessToken) return;
    const wsUrl = process.env.REACT_APP_WS_URL || 'ws://localhost:8000';
    const ws = new WebSocket(`${wsUrl}/ws/chat/${slug}/?token=${accessToken}`);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      setStatusText('connected');
      inputRef.current?.focus();
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === 'message') {
        setMessages(prev => [...prev, {
          id: data.message_id,
          content: data.message,
          sender_username: data.username,
          timestamp: data.timestamp,
          reactions: [],
        }]);
      } else if (data.type === 'reaction') {
        setMessages(prev => prev.map(msg => {
          if (msg.id !== data.message_id) return msg;
          const reactions = msg.reactions || [];
          if (data.action === 'added') {
            const exists = reactions.find(r => r.username === data.username && r.emoji === data.emoji);
            if (exists) return msg;
            return { ...msg, reactions: [...reactions, { emoji: data.emoji, username: data.username }] };
          } else {
            return { ...msg, reactions: reactions.filter(r => !(r.username === data.username && r.emoji === data.emoji)) };
          }
        }));
      }
    };

    ws.onclose = () => { setConnected(false); setStatusText('disconnected'); };
    ws.onerror = () => setStatusText('connection error');
    return () => ws.close();
  }, [slug, accessToken]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // close emoji picker when clicking outside
  useEffect(() => {
    const handler = () => setActiveReactionMenu(null);
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  const sendMessage = () => {
    const text = inputText.trim();
    if (!text || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(JSON.stringify({ type: 'message', message: text }));
    setInputText('');
  };

  const sendReaction = (messageId, emoji) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(JSON.stringify({ type: 'reaction', message_id: messageId, emoji }));
    setActiveReactionMenu(null);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const groupedMessages = groupMessages(messages);
  const currentUsername = user?.username;

  return (
    <div className="chat-page">
      <header className="chat-header">
        <div className="chat-header-left">
          <button className="back-btn" onClick={() => navigate('/rooms')}>←</button>
          <span className="chat-room-name"># {room?.name || slug}</span>
        </div>
        <a className={styles.gitbtn} href="https://github.com/Qasim-Akram" target="_blank" rel="noopener noreferrer">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="white" aria-hidden="true">
            <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
          </svg>
        </a>
        <div className="chat-status">
          <span className={`status-dot ${connected ? 'online' : 'offline'}`}></span>
          <span className="status-text">{statusText}</span>
        </div>
      </header>

      <div className="chat-messages">
        {messages.length === 0 && (
          <div className="chat-empty"><p>no messages yet.</p><p>say something.</p></div>
        )}

        {groupedMessages.map((group, i) => (
          <div key={i} className={`msg-group ${group.isOwn ? 'own-group' : ''}`}>
            <div className="msg-meta">
              <span className={`msg-username ${group.isOwn ? 'own' : ''}`}>
                {group.isOwn ? 'you' : group.username}
              </span>
              <span className="msg-time">{formatTime(group.messages[0].timestamp)}</span>
            </div>

            {group.messages.map((msg) => (
              <div key={msg.id} className="msg-row">
                <div className="msg-bubble-wrap">
                  <div className={`msg-bubble ${group.isOwn ? 'own' : ''}`}>
                    {msg.content}
                  </div>

                  {/* always visible emoji button */}
                  <button
                    className="react-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveReactionMenu(activeReactionMenu === msg.id ? null : msg.id);
                    }}
                    title="react"
                  >
                    😊
                  </button>
                </div>

                {/* emoji picker */}
                {activeReactionMenu === msg.id && (
                  <div
                    className={`emoji-picker ${group.isOwn ? 'own-picker' : ''}`}
                    onClick={e => e.stopPropagation()}
                  >
                    {EMOJIS.map(emoji => (
                      <button key={emoji} className="emoji-btn" onClick={() => sendReaction(msg.id, emoji)}>
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}

                {/* reactions display */}
                {msg.reactions && msg.reactions.length > 0 && (
                  <div className="msg-reactions">
                    {groupReactions(msg.reactions).map(({ emoji, users, count }) => (
                      <button
                        key={emoji}
                        className={`reaction-chip ${users.includes(currentUsername) ? 'own-reaction' : ''}`}
                        onClick={() => sendReaction(msg.id, emoji)}
                        title={users.join(', ')}
                      >
                        {emoji} {count}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}

        <div ref={bottomRef} />
      </div>

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
          <button className="send-btn" onClick={sendMessage} disabled={!connected || !inputText.trim()}>
            send
          </button>
        </div>
        <p className="input-hint">enter to send · shift+enter for new line</p>
      </div>
    </div>
  );
}

function groupMessages(messages) {
  if (!messages.length) return [];
  const savedUser = localStorage.getItem('user');
  const currentUsername = savedUser ? JSON.parse(savedUser).username : null;
  const groups = [];
  let currentGroup = null;
  for (const msg of messages) {
    const isOwn = msg.sender_username === currentUsername;
    if (currentGroup && currentGroup.username === msg.sender_username) {
      currentGroup.messages.push(msg);
    } else {
      currentGroup = { username: msg.sender_username, isOwn, messages: [msg] };
      groups.push(currentGroup);
    }
  }
  return groups;
}

function groupReactions(reactions) {
  const map = {};
  for (const r of reactions) {
    if (!map[r.emoji]) map[r.emoji] = { emoji: r.emoji, users: [], count: 0 };
    map[r.emoji].users.push(r.username);
    map[r.emoji].count++;
  }
  return Object.values(map);
}

function formatTime(timestamp) {
  if (!timestamp) return '';
  return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}