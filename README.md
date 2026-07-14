# HomeSync — Find a Home, Find your People 🏠🤝

HomeSync is a premium, AI-driven platform that connects verified property owners with compatible flatmates/tenants based on deep lifestyle matching. It replaces endless scrolling with an intelligent algorithm that calculates a "Fit Score" based on place, schedules, budget flexibility.
---

## 🚀 Live Links
- **Live Frontend**: [Vercel Deployment](https://homesync-rent.vercel.app/)
- **Live Backend API**: [Render Server](https://flatmate-finder-gvy7.onrender.com)

---

## 🔐 Default Admin Access
If you want to view the platform from an administrator's perspective (to view total metrics, user counts, and active listings):
- **Email**: `admin@homesync.app`
- **Password**: `admin123`
- **Portal Link**: `/admin/dashboard`

---

## 🛠️ Technology Stack
- **Frontend**: React (Vite), React Router v6, Vanilla CSS (Custom Design System, Glassmorphism UI)
- **Backend**: Node.js, Express.js
- **Database**: MongoDB (Atlas)
- **Authentication**: JWT (JSON Web Tokens) in HttpOnly cookies
- **AI Integration**: Google Gemini API (for advanced lifestyle parsing/matching)
- **Email Service**: Brevo API
- **File Uploads**: Cloudinary

---

## ✨ Core Features
1. **AI Fit Scoring**: The platform uses Gemini to analyze both the Owner's requirements and the Tenant's profile, generating a percentage-based "Fit Score".
2. **Three Distinct Portals**:
   - **Admin Dashboard**: See live metrics and manage platform health.
   - **Owner Portal**: Post listings, manage flatmate requests, and mark rooms as filled.
   - **Tenant Portal**: Browse AI-matched listings, send requests, and chat with owners.
3. **Real-time Chat**: Connects owners and tenants securely before finalizing a lease.
4. **Premium UI/UX**: Built with modern aesthetics, skeleton loaders, floating responsive grids, and strict responsive design rules.

---

## 🎯 How the "Fit Score" Works
The "Fit Score" is computed dynamically out of 100 points to ensure tenants only see rooms that truly make sense for them.

The weights are highly dynamic and biased toward practical lifestyle matching:
- **Location (30 Points):** If the tenant's preferred city matches or is included in the listing's location, they receive 30 points. 
- **Budget (35 Points):** If the listing's rent is strictly within the tenant's min/max budget, they receive 35 points. If the rent is outside the budget but within a 20% flexibility range, they receive 17 points.
- **Room & Lifestyle (20 Points):** The AI evaluates if the room type and furnishing status match the tenant's exact preferences. (10 points each).
- **Move-in Date (15 Points):** The closer the listing's availability date is to the tenant's preferred move-in date, the more points they receive (15 points for ≤ 7 days, 7 points for ≤ 30 days, 3 points for ≤ 60 days).

*Critical Rule - Location Mismatch:* If the property is in a completely different city than the tenant's preferred location (e.g. Pune vs Mumbai), the platform instantly assigns a 0% Fit Score and explains: "Location mismatch. This property is in [City]. Your preferred city is [City]." rather than showing a low percentage.

*Note: The platform uses the Gemini AI to assess this criteria, but smoothly falls back to a deterministic rule-engine parser if the AI is unavailable or rate-limited.*

---

## 💻 Local Setup Instructions

### 1. Prerequisites
- **Node.js** (v18+ recommended)
- **MongoDB** (Local instance or Atlas Cluster)
- A **Cloudinary** account (for image uploads)
- A **Google Gemini** API key

### 2. Backend Setup
1. Open a terminal and navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the `backend/` directory and populate it:
   ```env
   PORT=5000
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=super_secret_jwt_key
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   FRONTEND_URL=http://localhost:3000
   GEMINI_API_KEY=your_gemini_api_key
   BREVO_API_KEY=your_brevo_api_key
   BREVO_SENDER_EMAIL=your_email@domain.com
   BREVO_SENDER_NAME=HomeSync
   ```
4. Start the backend development server:
   ```bash
   npm run dev
   ```

### 3. Frontend Setup
1. Open a new terminal and navigate to the frontend folder:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the `frontend/` directory:
   ```env
   VITE_API_URL=http://localhost:5000/api
   ```
4. Start the frontend development server:
   ```bash
   npm run dev
   ```

### 4. Database Reset (Wiping Mock Data)
If you ever want to completely wipe all users, listings, and chats (while preserving the Admin account) to start fresh, run:
```bash
cd backend
npm run wipe-db
```

---

## 📂 Folder Structure Overview
```text
rent_flatmate_finder/
│
├── backend/
│   ├── scripts/        # Utility scripts (e.g., wipe_db.js)
│   ├── src/
│   │   ├── ai/         # Gemini parsing logic
│   │   ├── controllers/# Route logic
│   │   ├── middlewares/# Auth & Validation checks
│   │   ├── models/     # Mongoose Schemas
│   │   ├── routes/     # Express route definitions
│   │   └── utils/      # Helpers (Email, Uploads)
│   └── package.json
│
└── frontend/
    ├── public/         # Static assets (logo.png, favicon.png)
    ├── src/
    │   ├── assets/     # Global CSS and tokens
    │   ├── components/ # Reusable UI components
    │   ├── context/    # React Context (Auth)
    │   ├── layouts/    # MainLayout & DashboardLayout
    │   ├── pages/      # Route components (Admin, Owner, Tenant)
    │   └── services/   # Axios API calls
    └── package.json
```

---
**Enjoy building with HomeSync!**
