# BiteRush — Full-Stack Food Delivery App

A premium glassmorphism food-delivery web app with a real backend, database, and
authentication. Browse a menu served from a database, register/log in (JWT), add
items to a cart, check out, and view your order history.

## What's inside
```
biterush-fullstack/
├── backend/            Express + SQLite (sql.js) REST API
│   ├── server.js       App entry, route wiring, CORS
│   ├── db.js           Database init, schema + seed data
│   ├── auth.js         JWT signing + auth middleware
│   └── routes/         auth.js, foods.js, orders.js
└── frontend/           React (Vite) app — the BiteRush UI
    └── src/
        ├── api.js          Fetch wrapper for the backend
        ├── context/        AuthContext + CartContext
        ├── components.jsx  Reusable UI (cards, nav, hero, backdrop)
        ├── screens.jsx     Auth, Home, Detail, Cart, Checkout, Orders, Profile
        └── App.jsx         Routing + data loading
```

## Prerequisites
- **Node.js 18 or newer** (works on 18, 20, 22). Check with `node -v`.

The database is **SQLite via sql.js** (WebAssembly) — there is **no database server
to install** and **no native build step**. A `biterush.db` file is created and
seeded automatically the first time the backend runs.

## 1. Start the backend
```bash
cd backend
npm install
npm start
```
The API runs on **http://localhost:4000**. You should see
`BiteRush API running on http://localhost:4000`.

## 2. Start the frontend (in a second terminal)
```bash
cd frontend
npm install
npm run dev
```
Open the URL Vite prints (usually **http://localhost:5173**).

That's it. Register an account, browse the menu, add to cart, and place an order —
everything is saved in the backend database.

## How they connect
The frontend calls the API at `http://localhost:4000/api` by default. To point it
elsewhere, copy `frontend/.env.example` to `frontend/.env` and set `VITE_API_URL`.
If the backend is offline, the UI falls back to bundled sample data so it still renders.

## API endpoints
| Method | Route                | Auth | Description                    |
|--------|----------------------|------|--------------------------------|
| GET    | /api/health          | —    | Health check                   |
| GET    | /api/categories      | —    | List categories                |
| GET    | /api/foods           | —    | List foods (`?category=`,`?q=`)|
| GET    | /api/foods/:id       | —    | Single food                    |
| POST   | /api/auth/register   | —    | Create account → returns JWT   |
| POST   | /api/auth/login      | —    | Log in → returns JWT           |
| GET    | /api/auth/me         | JWT  | Current user                   |
| POST   | /api/orders          | JWT  | Place an order                 |
| GET    | /api/orders          | JWT  | Your order history             |

Authenticated requests send `Authorization: Bearer <token>`.

## Tech stack
- **Backend:** Node.js, Express, sql.js (SQLite/WASM), JWT (jsonwebtoken), bcryptjs
- **Frontend:** React 18, Vite, lucide-react icons, CSS variables (no UI framework)

## Notes & next steps
- Food photos use keyword placeholders. For production, replace the `img` URLs in
  `backend/db.js` (seed) and `frontend/src/data.js` (fallback) with your own hosted images.
- The JWT secret defaults to a dev value. Set a real one via `backend/.env`
  (copy `.env.example`) before deploying.
- To move to a client-server database later, the SQL is standard — you can port
  `db.js` to PostgreSQL/MySQL or a framework like NestJS with minimal route changes.
