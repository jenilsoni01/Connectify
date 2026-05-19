# Connectify

Connectify is a modern real-time messaging and social communication app built with a React frontend and Express/MongoDB backend. It supports secure chat, group messaging, broadcasts, stories, notifications, and user management in a single platform.

## Features

- **User Authentication**: Register, login, logout, refresh tokens, and manage active device sessions.
- **Real-Time Chat**: Create one-to-one conversations with real-time messaging, typing indicators, read receipts, and message delivery events.
- **Group Messaging**: Create groups, add/remove members, assign admins, and enforce admin-only permissions for messaging and management.
- **Broadcast Lists**: Send broadcast messages to multiple recipients as individual direct messages.
- **Stories / Status Updates**: Share ephemeral content with feed view, story viewers, likes, and delete functionality.
- **Notifications**: View personal notifications for incoming messages and other activity, and mark them read individually or all at once.
- **Friend Management**: Search users, send/accept/reject friend requests, and view friend lists.
- **User Profiles**: Update profile information, upload profile pictures, and manage status/privacy settings.
- **File Uploads**: Upload chat attachments, story media, and profile images using multipart form data.
- **End-to-End Encryption Support**: Encrypt message content using public keys before sending to peers.
- **Public Key Management**: Store and retrieve user public keys to support secure message exchange.
- **Message Controls**: Edit messages, delete messages, react to messages, forward messages, pin messages, and star important chats.
- **Conversation Management**: Create conversations, view pinned messages, enable disappearing messages, clear chat history, and delete conversations.

## Architecture

- **Frontend**: React with Vite, React Router, Axios, Tailwind CSS, and Socket.io client.
- **Backend**: Express.js with route controllers, middleware, and MongoDB models.
- **Realtime**: Socket.io for live messaging events and status updates.
- **Data storage**: MongoDB for users, messages, conversations, stories, notifications, and more.

## Project Structure

- `backend/`: server-side code, API routes, controllers, services, models, middlewares, sockets, and utilities.
- `frontend/`: client-side React app, API wrappers, components, pages, context, hooks, and styles.

## Tech Stack

- **Frontend**:
  - React 19 with Vite for fast development and production builds
  - React Router for client-side navigation
  - Axios for REST API requests
  - Tailwind CSS for utility-first styling
  - Socket.io client for real-time events
- **Backend**:
  - Node.js + Express 4 for REST API and middleware composition
  - MongoDB with Mongoose for document storage and schema modeling
  - Socket.io server for real-time socket communication
  - Redis adapter for Socket.io scaling when `REDIS_URL` is provided
  - Zod for request validation and schema parsing
  - JWT for authentication and token management
  - Multer for multipart file upload handling
  - Helmet, CORS, and rate limiting for security and abuse protection
- **Data & persistence**:
  - MongoDB collections for users, messages, conversations, stories, notifications, refresh tokens, reports, and groups
  - Redis as an optional messaging adapter for socket clustering

## High-Level Design

Connectify is built as a two-tier application with a single-page frontend and a REST + real-time backend.

- The frontend is a React SPA that renders chat, story, profile, notifications, friends, groups, and broadcasts pages.
- The backend exposes REST endpoints for CRUD operations and uses Socket.io to push live updates for messages, read receipts, typing indicators, and user presence.
- Authentication is handled with JWTs stored client-side, while protected API routes are guarded by middleware.
- Public keys are stored for E2EE-style content encryption, allowing the client to encrypt text before submission and keep plaintext out of the channel when supported.
- File uploads are handled through multipart endpoints and stored in the backend `uploads/` folder, then referenced by chat/story payloads.

The data flow is:
1. Client sends REST request or emits socket event.
2. Backend middleware validates auth and request payloads.
3. Controllers call services to run business logic.
4. Services update MongoDB and emit socket events to affected users.
5. Client listens for socket updates and refreshes UI state.

## Low-Level Design

### Frontend

- `src/App.jsx`: defines protected routes and page routing for authenticated users.
- `src/api/*.js`: provides typed wrappers over backend endpoints so components remain focused on UI logic.
- `src/context/AuthContext.jsx`: centralizes login, registration, token refresh, current user state, and E2EE key initialization.
- `src/hooks/useSocket.js`: manages Socket.io connection lifecycles and supplies real-time events.
- `src/pages/Chat.jsx`: orchestrates chat state, conversation selection, message encryption/decryption, and chat workflows.
- `src/components/chat/ChatList.jsx` and `ChatWindow.jsx`: render chat UI and message threads.
- `src/pages/Profile.jsx`: manages profile editing, linked device lists, starred messages, status privacy, and public key updates.
- `src/pages/Stories.jsx`: loads story feed, uploads new stories, and displays story viewers.

### Backend

- `src/routes/*.js`: maps REST endpoints to controllers for auth, users, messages, conversations, friends, groups, stories, broadcasts, uploads, and notifications.
- `src/controllers/*`: validate requests and convert them into service calls.
- `src/services/*`: implement business rules such as conversation creation, message persistence, group membership, and notification creation.
- `src/models/*`: define Mongoose schemas for data entities such as `User`, `Message`, `Conversation`, `Story`, `Notification`, `Group`, and `RefreshToken`.
- `src/middlewares/auth.middleware.js`: enforces JWT validation and user identity on protected routes.
- `src/middlewares/rateLimit.middleware.js`: applies request rate limiting to sensitive endpoints.
- `src/sockets/index.js`: initializes Socket.io and optionally configures a Redis adapter for horizontal scaling.
- `src/utils/crypto.js`: handles browser-side encryption and decryption of message payloads.

## Load Handling and Design Rationale

### Current load handling

- **REST API performance**: Express routes are lightweight and stateless, which makes horizontal scaling simple.
- **Websocket scaling**: Socket.io is used to keep connections open for real-time updates. The backend can optionally use Redis as a Socket.io adapter so multiple server instances can coordinate events across clusters.
- **Rate limiting**: Express rate limiting is applied to protect authentication and message endpoints from brute force or abusive traffic.
- **Database throughput**: MongoDB and Mongoose handle read/write traffic for chats, stories, and notifications. Pagination is used for message retrieval to avoid large payloads.
- **Static asset speed**: Vite builds optimized frontend bundles so the app can load quickly in browsers.

### Why these technologies were chosen

- **React + Vite**: for fast dev feedback, minimal build configuration, and modern SPA performance.
- **Express**: simple, battle-tested web server with mature middleware and routing support.
- **Socket.io**: supports bidirectional realtime communication and automatic reconnects across browsers.
- **MongoDB**: document data model fits chat messages, conversation threads, and social metadata well.
- **Redis Socket.io adapter**: allows scaling beyond a single instance when many users need realtime events.
- **JWT**: stateless authentication that integrates cleanly with SPAs.
- **Multer**: easiest way to accept file uploads with multipart forms in Express.

## Improvements and Future Considerations

### Performance improvements

- Add MongoDB indexes on fields like `conversationId`, `senderId`, `createdAt`, and `userId` to speed queries.
- Use cursor-based pagination for message timelines instead of page-based offsets when chats grow large.
- Move uploaded media to cloud storage or CDN instead of local disk to support scale and global distribution.
- Add HTTP caching headers on static assets and non-sensitive resources.
- Introduce server-side caching for user profiles or conversation metadata where appropriate.

### Scalability improvements

- Deploy backend behind a load balancer with multiple Node.js instances.
- Enable Redis and the Socket.io adapter for clustered realtime connections.
- Consider separating chat, notifications, and media upload services into microservices once traffic grows.
- Use MongoDB sharding or a replica set for higher write throughput and failover.

### Reliability and security improvements

- Rotate refresh tokens and use secure refresh storage to reduce token replay risk.
- Add stricter validation and sanitization for uploaded files and message content.
- Add stronger authorization checks around group administration and broadcast membership.
- Monitor backend metrics and socket event patterns to detect overloaded routes or slow queries.

### UX and data design improvements

- Add optimistic UI updates for faster feeling chat interactions.
- Improve offline handling and reconnection behavior on the client.
- Add more explicit conversation and broadcast list management screens.
- Expand story privacy controls and story expiration handling.

## Quick Start

1. Install backend dependencies in `backend/`.
2. Install frontend dependencies in `frontend/`.
3. Start the backend and frontend servers.
4. Register a user and begin chatting.

---

This README includes the tech stack, high-level design, low-level design, load handling rationale, and improvement notes for Connectify.
