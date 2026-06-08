# Society Parking Management System (SPMS)

A full-stack capacity-based parking tracker for residential societies. Developed using Node.js/Express backend, Mongoose/MongoDB storage, and React/Tailwind frontend, featuring real-time Socket.io dashboards and automatic overstay/overflow alerts.

---

## 🛠️ Tech Stack
- **Frontend:** React.js, Tailwind CSS, Lucide Icons, Socket.io-client
- **Backend:** Node.js, Express.js, Socket.io, Nodemailer, Node-cron
- **Database:** MongoDB, Mongoose
- **Auth:** JWT (JSON Web Tokens), bcryptjs

---

## 📦 Project Directory Structure
```
[Root Directory]
├── backend/            # Express REST API & Socket.io server
└── frontend/           # Vite React Single Page Application
```

---

## 🚀 Getting Started

### 📋 Prerequisites
Ensure you have the following installed on your machine:
- **Node.js** (v16+ recommended)
- **NPM** (v8+ recommended)
- **MongoDB** (local database running on port `27017` or a MongoDB Atlas URI)

---

### 📥 Installation & Setup

#### 1. Setup the Backend
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` configuration file (copy template from `.env.example`):
   ```bash
   cp .env.example .env
   ```
4. Verify/update `.env` configurations:
   - `PORT`: Server port (default: `5000`)
   - `MONGO_URI`: MongoDB connection string (default: `mongodb://127.0.0.1:27017/spms_db`)
   - `JWT_SECRET`: JWT encryption key
   - `ANPR_API_KEY`: API token for ANPR camera lookups
   - `SMTP_*`: Credentials for mail alerts (Gmail SMTP, Mailtrap, etc.)

5. Start the backend server in development mode:
   ```bash
   npm run dev
   ```
   *Note: Upon first start, the system will automatically seed a default admin account and configuration values if your database is empty.*

#### 2. Setup the Frontend
1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite React development server:
   ```bash
   npm run dev
   ```
4. Open your browser and navigate to the listed local server URL (typically `http://localhost:5173`).

---

## 🔑 Default Credentials
Use the following seed credentials to log in for the first time:
- **Email:** `admin@society.com`
- **Password:** `adminpassword123`

*Note: You can (and should) change these login credentials on the **System Settings** page immediately after logging in.*

---

## 📡 ANPR Integration Endpoint

To trigger camera detections, send a secured request to the ANPR endpoint:
- **Endpoint:** `POST /api/anpr/plate-detected`
- **Headers:**
  - `x-api-key`: `[Your ANPR API Key from .env]`
  - `Content-Type`: `application/json`
- **Payload Schema:**
  ```json
  {
    "plate": "MH12AB1234",
    "cameraId": "CAM-MAIN-ENTRANCE"
  }
  ```

#### Example cURL Request:
```bash
curl -X POST http://localhost:5000/api/anpr/plate-detected \
  -H "x-api-key: anpr_secret_api_key_123456" \
  -H "Content-Type: application/json" \
  -d '{"plate": "MH12AB1234", "cameraId": "CAM-01"}'
```
- If the plate belongs to a registered resident, it returns details.
- Unregistered plates are flagged as visitors and appended to `backend/logs/unrecognized_plates.log`.
