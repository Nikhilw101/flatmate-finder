# HomeSync

HomeSync is a premium flatmate-finding platform that connects tenants with property owners. It features an AI-powered compatibility engine, real-time chat, in-app notifications, and a modern, responsive UI.

## Features
- **Role-based Access**: Separate flows for Tenants, Owners, and Admins.
- **AI Compatibility Engine**: Analyzes tenant profiles against listing details using Google Gemini to compute a compatibility score and provide natural language explanations.
- **Real-time Chat**: WebSocket-powered live messaging between matched tenants and owners.
- **Real-time Notifications**: Instant alerts for interests, acceptances, and messages.
- **Email Integration**: Transactional emails powered by Brevo.
- **Image Management**: Secure image uploads, compression, and delivery via Cloudinary.
- **Admin Dashboard**: Live analytics and metrics tracking platform activity.

## Tech Stack
- **Frontend**: React (Vite), React Router, Lucide Icons, Pure CSS (custom design system)
- **Backend**: Node.js, Express, Socket.io, Google Generative AI (Gemini)
- **Database**: MongoDB (Mongoose)
- **Security**: JWT, bcrypt, Helmet, Express-Rate-Limit, Mongo-Sanitize, XSS-Clean
- **Integrations**: Cloudinary (images), Brevo (email)

## Getting Started

### Prerequisites
- Node.js (v18+)
- MongoDB cluster (Atlas recommended)
- Cloudinary account
- Brevo account
- Google Gemini API key

### Installation

1. **Clone the repository**
2. **Install Backend Dependencies**
   ```bash
   cd backend
   npm install
   ```
3. **Install Frontend Dependencies**
   ```bash
   cd frontend
   npm install
   ```

### Environment Variables
Create a `.env` file in the `backend` directory based on the provided `.env.example`.

### Running Locally
1. Start the backend: `cd backend && npm run dev` (Runs on port 5000)
2. Start the frontend: `cd frontend && npm run dev` (Runs on port 3000)

## Production Deployment

### Backend
The backend is ready to be deployed to Render, Railway, or Fly.io.
- Ensure all environment variables are securely set.
- A `render.yaml` template is provided for Render deployments.
- The server exposes a `/health` endpoint for uptime monitoring.

### Frontend
The frontend is optimized for deployment to Vercel or Netlify.
- Set `VITE_API_URL` to your production backend URL.
- A `vercel.json` file is provided to handle React Router client-side routing.
