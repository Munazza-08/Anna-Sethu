# Anna Sethu — Node/Express Server

## Folder Structure
```
server/
├── config/
│   └── db.js          ← MongoDB connection via Mongoose
├── routes/
│   └── health.js      ← GET /api/health endpoint
├── index.js           ← Express app entry point
├── .env               ← Environment variables (git-ignored)
├── .env.example       ← Template for teammates
└── package.json       ← Dependencies & scripts
```

## Quick Start
```bash
cd server
npm install
npm run dev    # uses nodemon for hot-reload
```

## Environment Variables
Copy `.env.example` → `.env` and fill in your values.
Never commit `.env` to git.
