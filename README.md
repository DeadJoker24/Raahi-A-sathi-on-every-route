# Raahi - A Saathi on Every Route 🚗

> **Concept**: A route-based commute-sharing platform (not an on-demand cab clone). Drivers who are **already** travelling from A to B share empty seats with passengers travelling along a compatible route, contributing towards travel costs.

---

## 🛠️ Sprint 1: Architecture & Foundation

Sprint 1 establishes the core application foundation:
- User Registration & Login with Role Selection (`DRIVER` / `PASSENGER`)
- Password Hashing using `bcryptjs`
- Stateless Authentication using `jsonwebtoken` (JWT)
- PostgreSQL Database on Neon (relational schema, constraints, indexes)
- Role-Based Protected Dashboards
- Driver Vehicle Management

---

## 📁 Project Structure

```text
Raahi/
├── backend/               # Node.js + Express REST API Server
│   ├── src/
│   │   ├── config/        # Neon PostgreSQL Pool & Env Config
│   │   ├── controllers/   # Auth, User, Vehicle business logic
│   │   ├── middleware/    # JWT Auth & Role Authorization
│   │   ├── models/        # Database migrations & schemas
│   │   ├── routes/        # API route handlers
│   │   └── server.js      # App entry point
│   ├── .env.example       # Template for environment variables
│   └── package.json
│
├── frontend/              # React (Vite) Single Page Application
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── context/       # AuthContext for session management
│   │   ├── pages/         # Landing, Login, Register, Dashboards
│   │   ├── services/      # API communication layer
│   │   ├── App.jsx        # Routing configuration
│   │   └── main.jsx       # App entry point
│   └── package.json
│
├── README.md
└── .gitignore
```

---

## 🚀 Getting Started

### 1. Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Fill in your Neon DATABASE_URL and JWT_SECRET in .env
npm run dev
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
