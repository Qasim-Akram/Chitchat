<div align="center">

# 💬 ChatRoom

### Real-time messaging, built from the socket up.

[![Live Demo](https://img.shields.io/badge/demo-live-success?style=for-the-badge&logo=vercel)](https://chat-room-two-pi.vercel.app/)
[![Django](https://img.shields.io/badge/Django-4.2-092E20?style=for-the-badge&logo=django&logoColor=white)](#)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](#)
[![WebSockets](https://img.shields.io/badge/WebSockets-Channels-FF4154?style=for-the-badge&logo=websocket&logoColor=white)](#)

</div>

---

## ✨ What is this?

ChatRoom is a full-stack messaging app where conversations actually feel *live*. Register, jump into a room, and watch messages, reactions, and notifications land on every screen instantly — no refresh, no delay.

Under the hood, it's a Django + Channels backend talking over WebSockets to a React frontend, with Redis handling the real-time fan-out and PostgreSQL keeping everything persistent.

<div align="center">

**[🚀 Try it live](https://chat-room-two-pi.vercel.app/)** — just sign up and start chatting.

</div>

---

## 🧩 Core Features

<div align="center">

| | |
|:---:|:---|
| 🔐 | **JWT Authentication** — secure login with access + refresh token rotation |
| ⚡ | **Real-Time Messaging** — WebSocket-powered chat with zero page reloads |
| 😄 | **Emoji Reactions** — react live, toggle on/off, see it ripple instantly |
| 🔔 | **Smart Notifications** — unread counts and alerts for every new message |
| 🏠 | **Multiple Chat Rooms** — create, join, and switch between rooms freely |
| 📜 | **Message History** — paginated history loads as you scroll back |

</div>

---

## 🛠️ Tech Stack

<div align="center">

### Backend
![Django](https://img.shields.io/badge/Django-4.2-092E20?style=flat-square&logo=django&logoColor=white)
![DRF](https://img.shields.io/badge/Django%20REST%20Framework-A30000?style=flat-square&logo=django&logoColor=white)
![Channels](https://img.shields.io/badge/Django%20Channels-async-44B78B?style=flat-square)
![Daphne](https://img.shields.io/badge/Daphne-ASGI-blue?style=flat-square)

### Database & Messaging
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-336791?style=flat-square&logo=postgresql&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-pub%2Fsub-DC382D?style=flat-square&logo=redis&logoColor=white)
![JWT](https://img.shields.io/badge/SimpleJWT-auth-black?style=flat-square&logo=jsonwebtokens)

### Frontend
![React](https://img.shields.io/badge/React.js-18-61DAFB?style=flat-square&logo=react&logoColor=black)
![Axios](https://img.shields.io/badge/Axios-HTTP-5A29E4?style=flat-square&logo=axios&logoColor=white)

### Hosting
![Vercel](https://img.shields.io/badge/Frontend-Vercel-black?style=flat-square&logo=vercel&logoColor=white)
![Railway](https://img.shields.io/badge/Backend-Railway-0B0D0E?style=flat-square&logo=railway&logoColor=white)

</div>

---

## 🏗️ How It's Built

<div align="center">

```
React (Vercel)  ⇄  REST API + WebSocket  ⇄  Django + Channels (Railway)
                                                      │
                                          ┌───────────┴───────────┐
                                          │                       │
                                     PostgreSQL                 Redis
                                  (rooms, messages)        (live broadcast)
```

</div>

**The flow when you hit send:**

1. Your message travels over an authenticated WebSocket connection
2. Django Channels saves it to PostgreSQL and creates notifications for everyone else in the room
3. Redis broadcasts it to every active connection in that room
4. Everyone sees it appear — instantly

---

## 📂 Project Structure

```
ChatRoom/
├── backend/                # Django + Channels + DRF
│   ├── config/             # settings, urls, ASGI entry point
│   ├── users/               # registration, auth, profiles
│   └── chat/                # models, consumers, REST + WebSocket logic
│
└── frontend/                # React SPA
    └── src/
        ├── api/             # axios calls (auth, chat)
        ├── context/         # global auth state
        └── pages/           # Login, Rooms, Chat
```

---

## 🧠 Database Models

<div align="center">

| Model | Purpose |
|:---|:---|
| `UserProfile` | Extends Django's User with bio, avatar, online status |
| `Room` | A chat room — name, slug, members |
| `Message` | A message sent in a room |
| `MessageReaction` | An emoji reaction on a message |
| `Notification` | Alerts for new activity in a room |

</div>

---

## 🚀 Getting Started Locally

### Prerequisites
- Python 3.10+
- Node.js 18+ (LTS)
- PostgreSQL
- [Memurai](https://www.memurai.com) (Redis for Windows)

### Backend

```bash
cd backend
"C:\Program Files\Python313\python.exe" -m venv venv
venv\Scripts\activate
venv\Scripts\pip.exe install setuptools
venv\Scripts\pip.exe install -r requirements.txt

copy .env.example .env
# fill in your DB credentials + a secret key

venv\Scripts\python.exe manage.py migrate
venv\Scripts\python.exe manage.py createsuperuser
venv\Scripts\python.exe -m daphne -p 8000 config.asgi:application
```

### Frontend

```bash
cd frontend
npm install
npm start
```

The app opens at `http://localhost:3000`. Make sure PostgreSQL and Memurai are running in the background.

---

## 🔌 API & WebSocket Reference

<div align="center">

| Method | Endpoint | Description |
|:---:|:---|:---|
| `POST` | `/api/auth/register/` | Create an account |
| `POST` | `/api/auth/login/` | Get JWT tokens |
| `GET` | `/api/chat/rooms/` | List rooms |
| `POST` | `/api/chat/rooms/<slug>/join/` | Join a room |
| `GET` | `/api/chat/rooms/<slug>/messages/` | Paginated message history |
| `POST` | `/api/chat/messages/<id>/react/` | Add/remove a reaction |
| `GET` | `/api/chat/notifications/` | Get notifications |

</div>

**WebSocket:**
```
wss://<railway-domain>/ws/chat/<room-slug>/?token=<access-token>
```

```jsonc
// send a message
{ "type": "message", "message": "hello" }

// send a reaction
{ "type": "reaction", "message_id": 5, "emoji": "👍" }
```

---

## 🎯 What This Project Demonstrates

<div align="center">

`REST API design` · `JWT authentication` · `WebSockets` · `Async Django (Channels)` · `Redis pub/sub` · `React state management` · `Protected routing` · `CI-style deployment (Vercel + Railway)`

</div>

---

<div align="center">

Built by **Muhammad Qasim Akram**
[GitHub](https://github.com/Qasim-Akram) · [Live Demo](https://chat-room-two-pi.vercel.app/)

</div>
