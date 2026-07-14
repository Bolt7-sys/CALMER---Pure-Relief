# CALMER — Cannabis Wellness Delivery System

> **Breathe, Unwind, Elevate.**
> A powerful, production-ready full-stack **MERN** application: a 2-in-1 platform combining a
> premium **Client Web App** and a real-time **Admin Dashboard** for a luxury cannabis wellness
> delivery service.

---

## 1. Project Overview

- **Name**: CALMER System App
- **Stack**: **MERN** — MongoDB · Express · React · Node.js + **Socket.io** (real-time)
- **Goal**: Deliver a beautiful, dark-luxury cannabis wellness storefront with live delivery
  tracking, built-in chat + voice/video calls, real-time notifications, product management,
  cart/checkout/payment, order tracking, and an analytics dashboard.
- **Design language**: Dark luxury aesthetic · golden accents · glassmorphism · Playfair /
  Cormorant serif headings + Inter body · GSAP animations · mobile-first responsive.
- **Signature feature**: A **cinematic, scroll-driven landing page** where the golden ganja leaf
  **explodes into smoke** as you scroll down and **re-assembles** as you scroll up.

---

## 2. Architecture

```
webapp/
├── server/                 # Express + Socket.io API (ESM, "type":"module")
│   ├── server.js           # Entry: CORS, routes, http server, socket init, DB connect + seed
│   ├── socket.js           # Socket.io: JWT handshake, rooms, chat/call/location events
│   ├── seed.js             # Seeds 8 products + demo accounts (idempotent)
│   ├── config/db.js        # connectDB() — MongoDB when MONGO_URI set, else in-memory fallback
│   ├── models/index.js     # Mongoose schemas: User, Product, Order, Notification, Message
│   ├── data/store.js       # Dual-mode data store (Mongo OR in-memory) — identical async API
│   ├── utils/auth.js       # CALMER passkey gen/validate, bcrypt hashing, JWT sign/verify
│   ├── middleware/auth.js  # requireAuth, requireAdmin
│   ├── controllers/        # auth, product, order, notification, chat, analytics
│   ├── routes/             # auth, products, orders, notifications, chat, analytics
│   └── .env.example        # Copy to .env and fill in
│
├── client/                 # React 18 + Vite 5 + Tailwind 3
│   ├── index.html          # Fonts + FontAwesome CDN
│   ├── vite.config.js      # Proxy /api and /socket.io → :5000
│   ├── tailwind.config.js  # CALMER color/typography design tokens
│   └── src/
│       ├── main.jsx        # Router > Toast > Auth > Cart > App
│       ├── App.jsx         # Routes + protected redirects
│       ├── index.css       # Full design system (glass, gold-text, buttons, route-line…)
│       ├── lib/            # api.js (axios), socket.js, images.js (22 bundled images)
│       ├── context/       # AuthContext, CartContext
│       ├── components/    # Toast, Logo, MapView, CallOverlay
│       ├── layouts/       # ClientLayout (bottom nav), AdminLayout (sidebar)
│       ├── pages/         # Landing + AuthPage
│       ├── pages/client/  # Home, Shop, ProductDetail, CartPage, Checkout,
│       │                  #   OrderConfirmed, Orders, Tracking, Chat, Notifications, Profile
│       └── pages/admin/   # Dashboard, AdminOrders, AdminProducts,
│                          #   AdminTracking, AdminChat, Analytics
│
└── ecosystem.config.cjs    # PM2: calmer-server (:5000) + calmer-client (:3000)
```

### Data Models
- **User**: `{ username, role: 'client'|'admin', passkey (bcrypt hash), fullName, phone }`
- **Product**: `{ name, category, description, price, thc, cbd, imageUrl, stock, featured }`
- **Order**: `{ orderNumber (CLM-YYYY-XXXXXX), clientId, items[], totalAmount, paymentStatus,
  deliveryStatus, deliveryAddress, riderLocation, liveLocation, estimatedDeliveryTime, rating }`
- **Notification**: `{ recipientId, recipientRole, type, title, message, read }`
- **Message**: `{ orderId, senderId, senderRole, body, msgType }`

### Storage Services
- **MongoDB (via Mongoose)** when `MONGO_URI` is provided.
- **In-memory fallback** (identical async API) when no `MONGO_URI` — perfect for demos/preview.

---

## 3. Authentication — CALMER PASSKEY System

CALMER replaces passwords with a one-time, API-key-style **PASSKEY**:

- **Clients**  → username `@username`,        passkey `CALMER-XXXX-XXXX-XXXX`
- **Admins**   → username `@admin-username`,  passkey `CALMER-ADMIN-XXXX-XXXX-XXXX`

Passkey alphabet excludes ambiguous characters (`0/O`, `1/I`) → `ABCDEFGHJKLMNPQRSTUVWXYZ23456789`.
On **register**, the plaintext passkey is shown **exactly once** and stored only as a bcrypt hash.
On **login**, role is inferred from the username prefix.

### Demo Accounts (seeded automatically)
| Role   | Username         | Passkey                        |
|--------|------------------|--------------------------------|
| Admin  | `@admin-calmer`  | `CALMER-ADMIN-ADMN-CALM-GOLD`  |
| Client | `@wellness`      | `CALMER-USER-CALM-GOLD`        |

---

## 4. API Endpoints

Base URL: `/api`  · Auth: `Authorization: Bearer <JWT>`

| Method | Path                          | Auth   | Description                          |
|--------|-------------------------------|--------|--------------------------------------|
| GET    | `/health`                     | –      | Health check + store mode            |
| POST   | `/auth/register`              | –      | Create account, returns passkey once |
| POST   | `/auth/login`                 | –      | Login with username + passkey        |
| GET    | `/auth/me`                    | user   | Current user                         |
| PATCH  | `/auth/profile`               | user   | Update own name/email/phone          |
| GET    | `/auth/favorites`             | user   | List favorite product ids            |
| POST   | `/auth/favorites/:productId`  | user   | Toggle a favorite                    |
| GET    | `/products`                   | user   | List products                        |
| GET    | `/products/:id`               | user   | Product detail                       |
| POST   | `/products`                   | admin  | Create product                       |
| PATCH  | `/products/:id`               | admin  | Update product                       |
| DELETE | `/products/:id`               | admin  | Delete product                       |
| POST   | `/orders/quote`               | client | Server-priced quote + promo validation |
| POST   | `/orders`                     | client | Create order (server-priced, atomic stock) |
| GET    | `/orders`                     | user   | List orders (own / all for admin)    |
| GET    | `/orders/:id`                 | user   | Order detail                         |
| PATCH  | `/orders/:id/status`          | admin  | Update delivery status (state machine) |
| PATCH  | `/orders/:id/cancel`          | client | Cancel own order while `processing` (restocks) |
| PATCH  | `/orders/:id/location`        | user   | Update rider / client pin location   |
| PATCH  | `/orders/:id/rate`            | client | Rate a delivered order (1–5)         |
| GET    | `/notifications`              | user   | List notifications                   |
| PATCH  | `/notifications/:id/read`     | user   | Mark one read                        |
| PATCH  | `/notifications/read-all`     | user   | Mark all read                        |
| POST   | `/notifications/broadcast`    | admin  | Broadcast to all clients             |
| GET    | `/chat/:orderId`              | user   | Message thread                       |
| POST   | `/chat/:orderId`              | user   | Send message                         |
| GET    | `/analytics/overview`         | admin  | KPIs, revenue-by-day, top products   |

**Valid delivery statuses**: `processing` → `on_the_way` → `near` → `delivered`, with
`cancelled` reachable from any non-final state. Illegal jumps are rejected server-side.

**Promo codes** (validated server-side only): `CALM10` (10% off), `ELEVATE20` (20% off, min $100),
`GOLDENLEAF` ($15 off, min $60), `FREESHIP` (free delivery).

### Socket.io Events (real-time)
- Rooms: `user:<id>`, `admins`, `clients`, `order:<id>`
- Events: `notification`, `order:new`, `order:status`, `order:location`,
  `chat:message`, `call:invite`, `call:accept`, `call:end`

---

## 5. Features

**📲 PWA — Install CALMER App on your phone (clients AND admins)**
- ✅ `manifest.webmanifest` (maskable icons, shortcuts to Shop / Orders / Admin)
- ✅ Service worker: offline fallback page, network-first HTML, cache-first hashed assets — never caches `/api` or `/socket.io`
- ✅ **“Install CALMER App — In your phone” gold button** on: Landing page CTA, client header, client Profile menu, admin sidebar + admin mobile topbar
- ✅ Native install prompt on Chrome/Android/desktop; step-by-step guide modal for iOS Safari (Share → Add to Home Screen)
- ✅ Button auto-hides once the app is installed (standalone display-mode detection)

**Client App**
- ✅ Cinematic scroll-driven landing (explode / re-assemble golden leaf)
- ✅ CALMER passkey register + login (dual-account)
- ✅ Home with hero, categories, new arrivals, featured (GSAP fade-up)
- ✅ Shop with category tabs + search + ❤️ favorites (optimistic toggle) + sold-out badges
- ✅ Product detail with THC/CBD chips, low-stock warning, qty capped at available stock
- ✅ Cart, 2-step checkout (address + geolocation pin, payment) with **promo codes** + order confirmation
- ✅ Live order tracking: status timeline, **live ETA countdown**, animated gold route map, cancelled-state UI
- ✅ Client can **cancel** a `processing` order (auto-restocks)
- ✅ Built-in chat + voice/video call overlay (race-free `onSocket` subscriptions)
- ✅ Real-time notifications with chime, rate order, editable profile (name + phone)

**Admin Dashboard**
- ✅ Overview KPIs (today's revenue, active orders, avg order value, avg rating) — live socket refresh
- ✅ **Low-stock alert strip** linking to product management
- ✅ Orders management with **state-machine status controls** (illegal jumps disabled), cancel-with-restock, status history + promo details in modal
- ✅ Product CRUD with image picker
- ✅ Live tracking of active deliveries (auto-excludes delivered/cancelled, live refresh)
- ✅ Communications (chat + calls + broadcast)
- ✅ Analytics (revenue area chart, today's revenue, AOV, cancelled count, category pie, top-products bar)

**Security hardening (server)**
- ✅ Server-side price recomputation — client-sent prices are ignored (anti-tamper)
- ✅ Atomic stock decrement with rollback — no overselling under concurrency
- ✅ Socket room ownership checks — clients can only join their own order rooms
- ✅ Rate limiting (auth brute-force + checkout spam), security headers, JWT sessions
- ✅ Status-transition state machine, collision-resistant order numbers
- ✅ Per-user notification read state (`readBy`), cancelled orders excluded from revenue

---

## 6. Local Development

```bash
# Install (once)
cd server && npm install
cd ../client && npm install

# Configure env (optional — omit MONGO_URI to use in-memory store)
cp server/.env.example server/.env

# Run backend (:5000) and frontend (:3000) with PM2
cd ..                       # project root
pm2 start ecosystem.config.cjs
pm2 logs --nostream         # view logs

# Or run separately:
cd server && npm start      # http://localhost:5000
cd client && npm run dev     # http://localhost:3000
```

Frontend proxies `/api` and `/socket.io` to the backend during dev (see `client/vite.config.js`).

### Test locally with NO database (in-memory mode)
The **same API works whether or not MongoDB is connected**. If `MONGO_URI` is unset (or the DB is
unreachable), the backend automatically uses a built-in **in-memory store** with an identical
async API — so you can run and fully test the whole app on any host with **zero DB setup**:

```bash
cd server && npm install && npm start   # no .env / no MONGO_URI needed → in-memory
# Health check will report:  {"status":"ok","store":"in-memory",...}
```

When you're ready to persist data, just set `MONGO_URI` (see DEPLOYMENT_GUIDE.md) and restart —
the health check will then report `"store":"mongodb"`. No code changes required.

### Production-style preview (matches Netlify)
To preview exactly what Netlify serves (no Vite dev client / HMR):
```bash
cd client && npm run build           # build dist/
cd .. && pm2 start ecosystem.config.cjs   # calmer-client serves dist/ via preview-server.cjs
```

---

## 7. Deployment

- **Frontend** → **Netlify** (static build of `client/dist`).
- **Backend** → any Node host (**Pandastack / Render / Railway / Fly.io / VPS**) that keeps a
  long-running process (required for Socket.io).
- **Database** → **MongoDB Atlas** (free tier) via `MONGO_URI`.

See **`DEPLOYMENT_GUIDE.md`** for a complete, copy-paste, step-by-step guide.

---

## 8. Status

- **Platform**: Self-hosted MERN (Netlify + Node host + MongoDB Atlas)
- **Store mode**: MongoDB when `MONGO_URI` set, else in-memory fallback
- **Build**: Client `npm run build` ✅ passes
- **API**: Full lifecycle verified (auth, products, orders, status, chat, rating, analytics) ✅
- **Browser**: Verified in real browser — **zero console errors** ✅
- **PWA**: Installable on phones (Android/Chrome native prompt + iOS guide), offline fallback,
  Install buttons for both clients and admins ✅
- **Security**: Price tamper test, illegal status transition test, non-cancellable-after-dispatch
  test, cancel-restock test, invalid promo test — all verified via curl ✅
- **Fonts & icons**: Self-hosted (bundled via `@fontsource` + `@fortawesome`) — no external CDN,
  works offline and on any host ✅
- **Dual-mode**: Same API works with **or without** MongoDB (in-memory fallback) — run locally
  with zero DB setup ✅
- **Last Updated**: 2026-07-14
