# InspectAI

A premier inspection intelligence platform designed for property management, restoration, and real estate professionals. InspectAI leverages cutting-edge Gemini vision models to automatically analyze walkthrough videos, map property defects, identify structural anomalies, and calculate localized cost estimations in real time.

---

## 🏗️ Architecture

InspectAI is built using a modern **Decoupled Architecture** to optimize performance, cost, and user experience:

*   **Frontend (Vercel)**: A fast, React 19 SPA. It loads instantly and remains always-awake.
*   **Backend (Render)**: An Express-based monolithic Node.js API container designed to handle heavy multi-modal AI processing tasks and secure uploads.
*   **Storage (Cloudflare R2)**: Large videos are uploaded directly from the browser using AWS S3-compatible presigned URLs, bypassing the server to maximize bandwidth.
*   **Database & Auth (Firebase)**: Google OAuth authentication and Firestore database storing user preferences and inspections.

---

## 🛠️ Step-by-Step Deployment Guide

Deploying InspectAI involves configuring four key components: Firebase, Cloudflare R2, the Render Backend, and the Vercel Frontend.

### 1. Firebase Configuration (Auth & Database)
1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Create a new Firebase project.
3. **Enable Authentication**:
    *   Navigate to **Authentication** > **Sign-in method**.
    *   Enable the **Google** provider.
4. **Create a Firestore Database**:
    *   Navigate to **Firestore Database** > **Create database**.
    *   Set up rules inside `firestore.rules` (provided in the repository) to restrict read/write access to authenticated owners.
5. **Whitelist Frontend Domain** (*Crucial for Mobile/Desktop OAuth*):
    *   Navigate to **Authentication** > **Settings** > **Authorized domains**.
    *   Add your local domain: `localhost`
    *   Add your deployed Vercel domain: `inspect-ai-ruddy.vercel.app` (replace with your production URL).

---

### 2. Cloudflare R2 Setup (Video Storage)
Cloudflare R2 acts as the high-capacity, low-latency video vault.
1. Create a bucket in your Cloudflare R2 dashboard (e.g., `inspect-ai`).
2. Generate an API token with **Edit** permissions. Save the **Access Key ID** and **Secret Access Key**.
3. Enable **Public R2.dev URL** (or bind a custom domain) in the bucket settings.
4. **CORS Policy Setup**:
    *   Go to **Bucket Settings** > **CORS Policy** > **Edit**.
    *   Paste the following JSON to whitelist your development, Render, and Vercel domains:
    ```json
    [
      {
        "AllowedOrigins": [
          "http://localhost:5173",
          "https://inspectai-e49p.onrender.com",
          "https://inspect-ai-ruddy.vercel.app"
        ],
        "AllowedMethods": [
          "GET",
          "PUT",
          "POST",
          "HEAD"
        ],
        "AllowedHeaders": [
          "*"
        ]
      }
    ]
    ```

---

### 3. Backend Deployment (Render.com)
The backend container spins down on Render's free tier, but the frontend features an automatic background warm-up loading bar to manage the transition smoothly.
1. Create a **Web Service** on [Render](https://render.com/).
2. Connect your GitHub repository.
3. Configure the build parameters:
    *   **Build Command**: `npm install && npm run build`
    *   **Start Command**: `npm start`
4. Add the following **Environment Variables**:
    *   `GEMINI_API_KEY`: Your primary Gemini API key (acts as the server fallback).
    *   `R2_ENDPOINT`: Your Cloudflare S3 endpoint (`https://<account_id>.r2.cloudflarestorage.com`).
    *   `R2_ACCESS_KEY_ID`: Your Cloudflare Access Key.
    *   `R2_SECRET_ACCESS_KEY`: Your Cloudflare Secret Key.
    *   `R2_BUCKET_NAME`: The name of your R2 bucket.
    *   `R2_PUBLIC_URL`: Your bucket's public domain URL.

---

### 4. Frontend Deployment (Vercel)
The frontend is completely serverless, ensuring 100% uptime with zero sleep timeouts.
1. Link your GitHub repository in the **Vercel Dashboard**.
2. Vercel automatically detects the Vite configuration.
3. Set the following **Environment Variables**:
    *   `VITE_API_URL`: Your Render backend URL (`https://inspectai-e49p.onrender.com`).
    *   `VITE_FIREBASE_API_KEY`: Firebase API Key.
    *   `VITE_FIREBASE_AUTH_DOMAIN`: Firebase Auth Domain.
    *   `VITE_FIREBASE_PROJECT_ID`: Firebase Project ID.
    *   `VITE_FIREBASE_STORAGE_BUCKET`: Firebase Storage Bucket.
    *   `VITE_FIREBASE_MESSAGING_SENDER_ID`: Firebase Sender ID.
    *   `VITE_FIREBASE_APP_ID`: Firebase App ID.
4. Deploy!

---

## 🚀 How to Run Locally

1.  **Clone the Repository**:
    ```bash
    git clone https://github.com/lead-with-data/InspectAI.git
    cd InspectAI
    ```
2.  **Install Dependencies**:
    ```bash
    npm install
    ```
3.  **Setup Environment**:
    Create a `.env` file in the root directory and populate it with the variables from `.env.example`.
4.  **Run Development Servers**:
    *   Start the API backend: `npm run server` (runs on `http://localhost:3000`)
    *   Start the React frontend: `npm run dev` (runs on `http://localhost:5173`)
5.  Open `http://localhost:5173` to explore.
