# 🍱 Anna Sethu — Food Donation & Redistribution Platform

> *"Small acts of kindness create a big change."*

Anna Sethu connects food donors, NGOs, and volunteers to ensure surplus food reaches people in need, reducing food waste and fighting hunger.

---

## 🏗️ Project Structure

```
AnnaSethu/
├── client/                  ← React + Vite Frontend
│   ├── src/
│   │   ├── components/      ← Reusable UI components
│   │   ├── pages/           ← Page-level components
│   │   ├── assets/          ← Images, icons, fonts
│   │   ├── App.jsx          ← Root app with routing
│   │   ├── App.css          ← Global app styles
│   │   └── main.jsx         ← React entry point
│   ├── public/              ← Static files
│   ├── index.html           ← HTML template
│   └── vite.config.js       ← Vite configuration
│
├── server/                  ← Node.js + Express Backend
│   ├── config/
│   │   └── db.js            ← MongoDB connection
│   ├── routes/
│   │   └── health.js        ← Health check route
│   ├── index.js             ← Express server entry
│   ├── .env                 ← Environment variables (git-ignored)
│   └── .env.example         ← Env template for teammates
│
├── .gitignore               ← Root gitignore
├── package.json             ← Root scripts (run both client + server)
└── README.md                ← This file
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js v18+ installed
- MongoDB (local or Atlas account)

### 1. Clone & Install All Dependencies
```bash
git clone <your-repo-url>
cd AnnaSethu
npm run install-all
```

### 2. Configure Environment Variables
```bash
# Copy the example file and fill in your values
cd server
copy .env.example .env
```

Edit `server/.env`:
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/anna-sethu   # or your Atlas URI
JWT_SECRET=your_secret_key_here
CLIENT_URL=http://localhost:5173
```

### 3. Run Development Servers
```bash
# From the root folder — runs both client AND server simultaneously
npm run dev
```

Or run them separately:
```bash
# Terminal 1 — Backend
npm run server     # → http://localhost:5000

# Terminal 2 — Frontend  
npm run client     # → http://localhost:5173
```

---

## ✅ Verification Steps

| Check | URL | Expected |
|-------|-----|----------|
| Frontend | http://localhost:5173 | Anna Sethu homepage |
| API Health | http://localhost:5000/api/health | JSON `{ success: true }` |
| MongoDB | Server console | ✅ MongoDB Connected |

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite |
| Backend | Node.js + Express.js |
| Database | MongoDB + Mongoose |
| Styling | CSS (custom dark theme) |
| Auth (Phase 2) | JWT + bcrypt |

---

## 📦 Phase Roadmap

- [x] **Phase 1** — Project setup, homepage, health API
- [ ] **Phase 2** — Authentication (Donor / NGO / Volunteer / Admin roles)
- [ ] **Phase 3** — Donation posting and listing
- [ ] **Phase 4** — NGO dashboard & request system
- [ ] **Phase 5** — Volunteer delivery tracking
- [ ] **Phase 6** — Admin panel & analytics

---

## 🔒 Security Notes

- Never commit `.env` files
- All credentials are stored in environment variables
- JWT tokens used for stateless authentication (Phase 2)
