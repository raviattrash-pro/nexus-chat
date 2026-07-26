# 🌐 NexusChat — Next-Generation Real-Time Full-Stack Messaging & PWA Platform

<div align="center">
  <h3>A modern, real-time collaboration & messaging platform featuring an interactive 3D Circular Carousel UI, live STOMP WebSockets, rich media Saved Space, and voice/video WebRTC signaling.</h3>
  
  [![React](https://img.shields.io/badge/React-18.x-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
  [![Vite](https://img.shields.io/badge/Vite-5.x-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
  [![Spring Boot](https://img.shields.io/badge/Spring_Boot-3.x-6DB33F?style=for-the-badge&logo=spring-boot&logoColor=white)](https://spring.io/projects/spring-boot)
  [![MongoDB](https://img.shields.io/badge/MongoDB-6.x-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
  [![PWA](https://img.shields.io/badge/PWA-Ready-5A0FC8?style=for-the-badge&logo=pwa&logoColor=white)](https://web.dev/progressive-web-apps/)
</div>

---

<div align="center">
  <img src="./docs/hero_preview.jpg" alt="NexusChat UI Mockup" width="850" style="border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.5);" />
  <p><i>NexusChat — Featuring 3D Orbital Contact Carousel, Glassmorphic Live Chat, and WebRTC Call Signaling</i></p>
</div>

### 🎯 Quick Feature Jump (Click to Explore)
<div align="center">
  <a href="#1--3d-klarna-circular-carousel-workspace"><b>🌀 3D Carousel UI</b></a> •
  <a href="#2--real-time-stomp--websockets-messaging"><b>⚡ Live STOMP WebSockets</b></a> •
  <a href="#3--google-oauth-20--smart-account-management"><b>🔐 Google Auth 2.0</b></a> •
  <a href="#4--advanced-saved-space-personal-workspace"><b>💾 Saved Space (Attachments)</b></a> •
  <a href="#5--webrtc-call-signaling--presence"><b>📞 WebRTC Signaling</b></a> •
  <a href="#6--progressive-web-app-pwa--responsive-design"><b>📱 PWA Ready</b></a>
</div>

---

## ✨ Comprehensive Features List

### 1. 🌀 **3D Klarna Circular Carousel Workspace**
- **Spatial UI**: Built with Framer Motion and 3D trigonometry transformations to render contacts and groups as interactive rotating orbital nodes.
- **Dynamic WhatsApp-Style Sorting**: Whenever a new message is sent or received, the active contact automatically bubbles to the top/front of the carousel.
- **Unread Notification Badges**: Distinct red numerical badges dynamically overlay contact avatars when unread messages arrive from background conversations.
- **Instant Follow Integration**: Searching and following contacts immediately injects them into the active Carousel.

### 2. ⚡ **Real-Time STOMP & WebSockets Messaging**
- **Instant Delivery**: Full bidirectional messaging over Spring Boot STOMP/SockJS WebSockets without polling.
- **Live Read Receipts**: Interactive message ticks (`✓` Sent, `✓✓` Delivered, and **Blue Tick** Read statuses).
- **Microsoft Teams-Style Message Editing**: Inline message editing with live WebSocket re-broadcasting and a subtle `(edited)` tag on updated messages.
- **Unsend / Deletion**: Delete messages in real time for both sender and receiver.

### 3. 🔐 **Google OAuth 2.0 & Smart Account Management**
- **One-Click Authentication**: Integrated `@react-oauth/google` for seamless Google OAuth 2.0 social sign-in.
- **Duplicate Prevention Engine**: Automatically detects existing users by email/username on login, preventing redundant database records and synchronizing avatar updates.
- **Session & Avatar Persistence**: Maintains custom avatars and authentication state securely in `localStorage` across reloads.

### 4. 💾 **Advanced "Saved Space" Personal Workspace**
- **Multi-Modal Storage**: Bookmark important messages, write custom text reminders, or upload **Images and Documents** directly into your personal repository.
- **In-Memory & Persistent Storage**: Stored as structured `SavedItem` MongoDB objects with unique UUIDs, timestamps, and media type tags (`TEXT`, `IMAGE`, `PDF`).
- **One-Click Deletion**: Dedicated trash controls for purging obsolete items.

### 5. 📞 **WebRTC Call Signaling & Presence**
- **Voice & Video Signaling**: Integrated calling overlay capable of transmitting call invites and answering signals over dedicated STOMP user channels (`/topic/call.{userId}`).
- **Live Presence Indicators**: Real-time "Online" status dots and activity headers.

### 6. 📱 **Progressive Web App (PWA) & Responsive Design**
- **Native Installability**: Features an interactive **"Download App"** header button utilizing the browser's native `beforeinstallprompt` API to install NexusChat to desktop or mobile home screens.
- **Mobile-First Layout**: Adaptive CSS breakpoints that smoothly transform the 3D Carousel and Saved Space into full-screen mobile drawers (`max-width: 768px`).
- **Visual Toast Notifications**: Slide-in toast alerts to notify users of incoming messages when browser autoplay audio policies block audio chimes.

---

## 🏛️ High-Level Design (HLD)

The High-Level Architecture separates the client-side presentation layer from the Spring Boot service layer, communicating via REST over HTTP and bidirectional STOMP WebSockets over SockJS.

```mermaid
flowchart TB
    subgraph Client ["Client Layer"]
        UI["React 18 Single Page App"]
        KC["3D Klarna Carousel UI"]
        VC["Video/Audio Call Overlay"]
        SS["Saved Space Drawer"]
    end

    subgraph Gateways ["Gateway & Network Layer"]
        REST["REST API (HTTP/HTTPS)"]
        WS["STOMP / SockJS WebSockets"]
        OAUTH["Google OAuth 2.0 Provider"]
    end

    subgraph Backend ["Spring Boot 3.x Service Layer"]
        AC["ApiController (REST API)"]
        CC["ChatController (STOMP Broker)"]
        WSC["WebSocketConfig"]
    end

    subgraph Data ["Database Layer"]
        DB[(MongoDB Database)]
        GEO["2dsphere Geospatial Index"]
    end

    UI --> REST
    UI <--> WS
    UI -.-> OAUTH

    REST --> AC
    WS <--> CC
    CC --> WSC

    AC --> DB
    CC --> DB
    DB --- GEO
```

---

## 🔬 Low-Level Design (LLD)

### 1. **Entity Relationship & Domain Schema**
Below is the MongoDB data model showing the relationship between `User`, `Message`, and `SavedItem`.

```mermaid
classDiagram
    class User {
        +String id
        +String email
        +String username
        +String avatarUrl
        +String status
        +List followingIds
        +List savedItems
        +GeoJsonPoint location
    }

    class SavedItem {
        +String id
        +String type
        +String content
    }

    class Message {
        +String id
        +String senderId
        +String receiverId
        +String content
        +String mediaData
        +String mediaType
        +boolean isGroupMessage
        +boolean deleted
        +boolean edited
        +Date timestamp
        +String status
    }

    User "1" *-- "0..*" SavedItem : contains
    User "1" --> "0..*" User : followingIds
    Message "0..*" --> "1" User : senderId
    Message "0..*" --> "1" User : receiverId
```

---

### 2. **Real-Time STOMP & Notification Sequence Flow**
This sequence diagram illustrates how a message is sent, edited, and broadcasted, triggering unread badges and audio/toast notifications on the recipient's UI.

```mermaid
sequenceDiagram
    autonumber
    actor Alice as Alice (Sender)
    participant UI_A as Alice UI (React)
    participant STOMP as STOMP Broker
    participant SB as Spring Boot Backend
    participant DB as MongoDB
    participant UI_B as Bob UI (React)
    actor Bob as Bob (Receiver)

    Alice->>UI_A: Type Message & Hit Send
    UI_A->>STOMP: sendMessage(/app/chat.sendMessage)
    STOMP->>SB: ChatController.sendMessage()
    SB->>DB: messageRepository.save(message)
    DB-->>SB: savedMessage

    SB->>UI_A: /topic/user.Alice (confirm sent)
    UI_A->>UI_A: Move Bob to top of Carousel
    
    SB->>UI_B: /topic/user.Bob (incoming message)
    UI_B->>UI_B: Increment unreadCount badge
    UI_B->>UI_B: Play Sound & Show Toast Alert
    UI_B->>UI_B: Bubble Alice to top of Carousel

    Note over Alice,Bob: Live Message Editing Flow
    Alice->>UI_A: Edit Text -> Send
    UI_A->>STOMP: sendMessage(/app/chat.editMessage)
    STOMP->>SB: ChatController.editMessage()
    SB->>DB: Update content & set edited = true
    SB->>UI_A: /topic/user.Alice (broadcast edit)
    SB->>UI_B: /topic/user.Bob (broadcast edit)
    UI_A->>UI_A: Show (edited) tag
    UI_B->>UI_B: Show (edited) tag
```

---

## 🚀 Getting Started & Setup Instructions

### Prerequisites
- **Java 17+** and **Maven 3.8+**
- **Node.js 18+** and **npm / pnpm**
- **MongoDB 6.0+** running locally on default port `27017`

### 1. Start the Spring Boot Backend
```bash
cd backend
# Build and run the backend server (runs on http://localhost:8080)
mvn spring-boot:run
```
*Note: The backend automatically initializes and seeds default mock contacts on startup if the database is empty.*

### 2. Start the Frontend React (Vite) App
```bash
cd frontend
# Install dependencies
npm install

# Start the Vite development server (runs on http://localhost:5173)
npm run dev
```

### 3. Build for Production / PWA
```bash
cd frontend
npm run build
```

---

## 🔒 Security & Privacy Notice
- No hardcoded OAuth client secrets or database credentials are stored in public files.
- Ensure your production Google OAuth Client IDs are configured via environment variables (`VITE_GOOGLE_CLIENT_ID`).

---

<div align="center">
  <p>Built with ❤️ using Spring Boot, React, and MongoDB.</p>
</div>
