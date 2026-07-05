# CALMER — Full Step-by-Step Deployment & Hosting Guide

This guide takes you from a fresh clone of the GitHub repo all the way to a **live, working**
CALMER System App. Follow it **top to bottom** — every command is copy-paste ready.

The CALMER app has **3 parts** that must all be online:

| Part      | What it is                          | Where we host it (recommended)       |
|-----------|-------------------------------------|--------------------------------------|
| Database  | MongoDB                             | **MongoDB Atlas** (free tier)        |
| Backend   | Express + Socket.io API (`server/`) | **Render** (free) / Pandastack / VPS |
| Frontend  | React app (`client/`)               | **Netlify** (free)                   |

> ⚠️ **Important:** The backend uses **Socket.io (WebSockets)** and must run as a
> **long-running Node process**. Netlify only hosts the **frontend**. The backend must go on a
> host that keeps a server alive (Render, Pandastack, Railway, Fly.io, a VPS, etc.).

---

## STEP 0 — Get the code

```bash
git clone https://github.com/<YOUR_GITHUB_USERNAME>/<YOUR_REPO_NAME>.git calmer
cd calmer
```

---

## STEP 1 — Create the Database (MongoDB Atlas)

1. Go to **https://www.mongodb.com/cloud/atlas/register** and create a free account.
2. Click **Build a Database** → choose the **FREE / M0** tier → pick a cloud region near you →
   **Create**.
3. **Create a database user**: Security → **Database Access** → **Add New Database User**
   - Username: `calmer`  ·  Password: *(choose a strong one — save it!)*
   - Role: **Read and write to any database** → **Add User**
4. **Allow network access**: Security → **Network Access** → **Add IP Address** →
   **Allow Access from Anywhere** (`0.0.0.0/0`) → **Confirm**.
   *(This lets your backend host connect. You can tighten it later.)*
5. **Get your connection string**: Deployment → **Database** → **Connect** →
   **Drivers** → copy the string. It looks like:
   ```
   mongodb+srv://calmer:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
6. Replace `<password>` with your real password and add a database name (`/calmer`):
   ```
   mongodb+srv://calmer:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/calmer?retryWrites=true&w=majority
   ```
   **Save this — it is your `MONGO_URI`.**

---

## STEP 2 — Deploy the Backend (Render — recommended free option)

### 2A. Create the service
1. Go to **https://render.com** → sign up (log in with GitHub is easiest).
2. Click **New +** → **Web Service** → **Connect** your GitHub repo.
3. Fill in the settings **exactly**:

   | Field              | Value                          |
   |--------------------|--------------------------------|
   | **Name**           | `calmer-api`                   |
   | **Root Directory** | `server`                       |
   | **Runtime**        | `Node`                         |
   | **Build Command**  | `npm install`                  |
   | **Start Command**  | `node server.js`               |
   | **Instance Type**  | `Free`                         |

### 2B. Add Environment Variables
Scroll to **Environment** → **Add Environment Variable** and add these:

| Key             | Value                                                        |
|-----------------|-------------------------------------------------------------|
| `MONGO_URI`     | *(the connection string from Step 1)*                       |
| `JWT_SECRET`    | *(any long random string — see command below)*              |
| `JWT_EXPIRES`   | `30d`                                                        |
| `PORT`          | `5000`                                                       |
| `CLIENT_ORIGIN` | `*`  *(tighten to your Netlify URL after Step 3)*           |

Generate a strong `JWT_SECRET` locally:
```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

4. Click **Create Web Service**. Wait for the build to finish (2–4 min).
5. When it says **Live**, copy your backend URL, e.g.:
   ```
   https://calmer-api.onrender.com
   ```
6. **Test it** — open in a browser or run:
   ```bash
   curl https://calmer-api.onrender.com/api/health
   # Expected: {"status":"ok","store":"mongo",...}
   ```
   `"store":"mongo"` confirms it connected to Atlas. On first boot it auto-seeds 8 products +
   the two demo accounts.

> **Pandastack / VPS alternative:** upload the `server/` folder, run `npm install`, set the same
> env vars, and start with `pm2 start server.js --name calmer-api` (install PM2 via
> `npm i -g pm2`). Make sure the port is publicly reachable and WebSockets are allowed.

---

## STEP 3 — Deploy the Frontend (Netlify)

### 3A. Point the frontend at your backend
The frontend must know your backend URL. Create the file **`client/.env.production`**:

```bash
cd client
echo "VITE_API_URL=https://calmer-api.onrender.com" > .env.production
```
*(Replace with YOUR Render URL from Step 2. No trailing slash.)*

Commit and push this change:
```bash
cd ..
git add client/.env.production
git commit -m "Configure production API URL"
git push
```

### 3B. Deploy on Netlify
1. Go to **https://app.netlify.com** → sign up / log in.
2. **Add new site** → **Import an existing project** → **GitHub** → pick your repo.
3. Configure the build settings **exactly**:

   | Field                 | Value              |
   |-----------------------|--------------------|
   | **Base directory**    | `client`           |
   | **Build command**     | `npm run build`    |
   | **Publish directory** | `client/dist`      |

4. Click **Add environment variables** and add:

   | Key            | Value                              |
   |----------------|------------------------------------|
   | `VITE_API_URL` | `https://calmer-api.onrender.com`  |

5. Click **Deploy site**. Wait 1–3 min. You'll get a URL like:
   ```
   https://calmer-wellness.netlify.app
   ```

### 3C. Add SPA redirect (so page refreshes don't 404)
Create **`client/public/_redirects`** with this single line:
```
/*    /index.html   200
```
Then push:
```bash
git add client/public/_redirects
git commit -m "Add Netlify SPA redirect"
git push
```
Netlify auto-redeploys on push.

---

## STEP 4 — Connect Backend ↔ Frontend (CORS)

Now that you know your Netlify URL, lock CORS down (optional but recommended):

1. In **Render** → your `calmer-api` service → **Environment** → edit `CLIENT_ORIGIN`:
   ```
   https://calmer-wellness.netlify.app
   ```
2. Save → Render redeploys automatically.

---

## STEP 5 — Test the Live App 🎉

Open your Netlify URL: `https://calmer-wellness.netlify.app`

1. You should see the **cinematic landing page** — scroll down: the golden leaf explodes into
   smoke; scroll up: it re-assembles.
2. Click **Enter / Get Started** → **Login** with a demo account:

   | Role   | Username         | Passkey                        |
   |--------|------------------|--------------------------------|
   | Admin  | `@admin-calmer`  | `CALMER-ADMIN-ADMN-CALM-GOLD`  |
   | Client | `@wellness`      | `CALMER-USER-CALM-GOLD`        |

3. **As a client**: browse the shop → add to cart → checkout → track your order → open chat.
4. **As admin**: log out, log back in as `@admin-calmer` → view the dashboard, update an order
   status, watch analytics update.

> **First request may be slow** on Render's free tier — it "sleeps" after inactivity and takes
> ~30–50s to wake up. Upgrade to a paid instance for always-on.

---

## STEP 6 — (Optional) Create your own accounts

On the login screen click **Register**:
- **Client**: username must be `@something` (lowercase, 3–20 chars).
- **Admin**: username must start with `@admin-` (e.g. `@admin-jane`).

Your one-time **passkey** is shown **once** on the confirmation screen — **copy and save it**,
it cannot be recovered (only reset by an admin/DB edit).

---

## Troubleshooting

| Symptom                                   | Fix                                                                 |
|-------------------------------------------|---------------------------------------------------------------------|
| `curl /api/health` shows `"in-memory"`    | `MONGO_URI` not set/incorrect on the backend host. Re-check Step 1. |
| Login says "Invalid username or passkey"  | Use the exact demo passkeys above (they contain no `0` or `1`).     |
| Frontend loads but API calls fail (CORS)  | Set `VITE_API_URL` on Netlify + `CLIENT_ORIGIN` on Render, redeploy.|
| Chat / live tracking not real-time        | Backend host must allow WebSockets (Render/Railway/Fly.io all do).  |
| Page refresh shows 404 on Netlify         | Add `client/public/_redirects` (Step 3C).                           |
| Render app very slow on first hit         | Free tier sleeps; wait ~40s or upgrade to a paid instance.          |

---

## Environment Variables Reference

**Backend (`server/.env` or host dashboard):**
```env
MONGO_URI=mongodb+srv://calmer:PASSWORD@cluster0.xxxxx.mongodb.net/calmer?retryWrites=true&w=majority
JWT_SECRET=your-long-random-secret
JWT_EXPIRES=30d
PORT=5000
CLIENT_ORIGIN=https://your-site.netlify.app
```

**Frontend (`client/.env.production` or Netlify dashboard):**
```env
VITE_API_URL=https://your-backend.onrender.com
```

---

### That's it — your Powerful Full-Stack CALMER System App is live. 🌿✨
**Breathe, Unwind, Elevate.**
