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

## Volunteer coupons
Volunteers earn 5 points for each completed delivery. They can claim one coupon from the active catalog for 10 points; the selected coupon code appears in their claimed coupons, and the remaining balance starts the next cycle. Operators add and publish coupons at `/operator-dashboard`. Each coupon can optionally have an expiry date and a maximum number of claims; blank limits mean unlimited claims. The claim count increases when a volunteer claims the coupon.

Operator accounts are provisioned by an administrator rather than through public registration. To promote an existing account in MongoDB, run:
```js
db.users.updateOne({ email: "operator@example.com" }, { $set: { role: "operator" } })
```
The operator can then sign in with that account and manage the coupon catalog.

The operator dashboard includes recent delivery records, donor/volunteer accounts, coupon claims, and issue reports. Donors and volunteers can report an issue from a request or delivery card; operators can review it and mark it resolved. Dashboard record lists show the most recent 200 entries, while the summary counts cover all records.

