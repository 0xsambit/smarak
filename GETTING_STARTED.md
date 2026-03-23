# 📖 Quick Start Guide - Heritage Site Management Backend

## ✅ Implementation Complete

The production-grade NestJS backend has been successfully created with all modules, authentication, RBAC, and MongoDB integration.

## 📦 What Was Built

### Core Infrastructure (60+ Files Created)

- ✅ **6 Feature Modules**: Users, Sites, Incidents, Conservation, Approvals, Dashboard
- ✅ **6 Mongoose Schemas** with indexes and virtual fields
- ✅ **Clerk JWT Authentication** with webhook integration
- ✅ **RBAC System** with 3 roles (NATIONAL_ADMIN, STATE_ADMIN, SITE_OFFICER)
- ✅ **Swagger Documentation** at /docs endpoint
- ✅ **MongoDB Aggregation Pipelines** for dashboard analytics
- ✅ **Geospatial Queries** with 2dsphere indexes
- ✅ **Security**: Helmet, CORS, Rate Limiting, Input Validation
- ✅ **Database Seed Script** with realistic sample data

## 🚀 How to Run

### Step 1: Start MongoDB

**Option A: Local MongoDB**

```bash
# Start MongoDB service
mongod --dbpath C:\data\db

# Or if MongoDB is installed as a service
net start MongoDB
```

**Option B: MongoDB Compass**

1. Open MongoDB Compass
2. Connect to `mongodb://localhost:27017`
3. Database will be created automatically when you run the seed script

### Step 2: Seed the Database

```bash
cd backend
npm run seed
```

**Expected Output:**

```
🌱 Starting database seeding...
✅ Connected to MongoDB
🗑️  Cleared existing data
👥 Creating users...
✅ Created 4 users
🏛️  Creating heritage sites...
✅ Created 8 heritage sites
⚠️  Creating incidents...
✅ Created 6 incidents
🔧 Creating conservation projects...
✅ Created 4 conservation projects
📋 Creating approval requests...
✅ Created 4 approval requests
📊 Creating footfall data...
✅ Created 240 footfall records
✨ Database seeding completed successfully!
```

### Step 3: Start the Backend Server

```bash
cd backend
npm run start:dev
```

**Expected Output:**

```
🚀 Heritage Site Management Backend
📝 API running on: http://localhost:8080/api
📚 Swagger docs: http://localhost:8080/docs
🔒 CORS enabled for: http://localhost:5173
🌍 Environment: development
```

### Step 4: Test the API

#### Option 1: Using Swagger UI

1. Open http://localhost:8080/docs
2. You'll see all API endpoints organized by modules
3. **Testing without auth:** Try `GET /api/sites` - should return 401 Unauthorized

#### Option 2: Using Browser

- Visit http://localhost:8080/api/sites - Should see `{"statusCode":401,"message":"Missing or invalid authorization header"}`

## 🔑 Setting Up Clerk Webhook (IMPORTANT)

To enable automatic user sync from Clerk to MongoDB:

1. **In Clerk Dashboard** (https://dashboard.clerk.com)
     - Go to **Webhooks** section
     - Click **Add Endpoint**

2. **Configure Endpoint**
     - URL: `http://localhost:8080/api/users/webhook`
     - Events to listen: Select these 3:
          - ✅ `user.created`
          - ✅ `user.updated`
          - ✅ `user.deleted`
     - Click **Create**

3. **Copy Webhook Secret**
     - After creating, you'll see a `Signing Secret` (starts with `whsec_`)
     - Copy this value

4. **Update .env File**

     ```env
     CLERK_WEBHOOK_SECRET=whsec_your_copied_secret_here
     ```

5. **For Production:**
     - Use ngrok or deploy backend first
     - Update webhook URL to your production URL

## 🔗 Connecting Frontend to Backend

### Update Frontend Environment

In your frontend root (not backend folder), create/update `.env`:

```env
# Existing Clerk key
VITE_CLERK_PUBLISHABLE_KEY=pk_test_ZG9taW5hbnQtbWFjYXctMzguY2xlcmsuYWNjb3VudHMuZGV2JA

# Add backend API URL
VITE_API_BASE_URL=http://localhost:8080/api
```

### Create API Service in Frontend

**File: `src/services/api.ts`**

```typescript
import axios from "axios";
import { useAuth } from "@clerk/clerk-react";

const api = axios.create({
	baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api",
});

// Request interceptor to add auth token
api.interceptors.request.use(async (config) => {
	const { getToken } = useAuth();
	const token = await getToken();

	if (token) {
		config.headers.Authorization = `Bearer ${token}`;
	}

	return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
	(response) => response,
	(error) => {
		if (error.response?.status === 401) {
			console.error("Unauthorized - please sign in");
		}
		return Promise.reject(error);
	},
);

export default api;
```

### Update Dashboard Component

**File: `src/pages/Dashboard.tsx`**

```typescript
import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import api from '../services/api';

export default function Dashboard() {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { isLoaded } = useAuth();

  useEffect(() => {
    if (isLoaded) {
      fetchDashboardData();
    }
  }, [isLoaded]);

  const fetchDashboardData = async () => {
    try {
      const { data } = await api.get('/dashboard/overview', {
        params: { scope: 'national' }
      });
      setDashboardData(data);
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      {/* Pass real data to child components */}
      <KPIGrid kpis={dashboardData?.kpis} />
      <RiskAlertPanel alerts={dashboardData?.incidentsBySeverity} />
      {/* ... other components */}
    </div>
  );
}
```

## 🧪 Testing with Real Clerk User

### Step 1: Get Your Clerk JWT Token

1. Start your frontend: `npm run dev`
2. Go to http://localhost:5173
3. Sign in with Clerk
4. Open **Browser DevTools** → **Network** tab
5. Look for any API call
6. Copy the `Authorization` header value (the JWT token after "Bearer ")

### Step 2: Test API with Postman/Thunder Client

```bash
GET http://localhost:8080/api/dashboard/overview?scope=national
Headers:
  Authorization: Bearer eyJhbGciOiJSUzI1NiIsImtpZCI6Imluc... (your token)
```

## 📊 Database Schema Summary

View created data in MongoDB Compass:

**Database:** `heritage-db`

**Collections:**

- `users` (4 test users with different roles)
- `sites` (8 heritage sites: Taj Mahal, Red Fort, Qutub Minar, etc.)
- `incidents` (6 incidents with various severities)
- `conservations` (4 conservation projects)
- `approvals` (4 approval requests)
- `footfalls` (240 records spanning 30 days)

## 🔍 Key API Endpoints to Test

### Dashboard Analytics

```
GET /api/dashboard/overview?scope=national
GET /api/dashboard/overview?scope=state&state=Uttar Pradesh
```

### Sites Management

```
GET /api/sites
GET /api/sites/nearby?latitude=28.6139&longitude=77.2167&maxDistance=50000
```

### Incidents

```
GET /api/incidents
GET /api/incidents?status=OPEN&severity=HIGH
```

### Approvals

```
GET /api/approvals?status=PENDING
```

## 🐛 Common Issues & Solutions

### Issue: "Cannot find module '@config/database.config'"

**Solution:**

```bash
cd backend
npm run build
```

The path aliases are configured in `tsconfig.json`.

### Issue: MongoDB connection failed

**Solution:**

- Check MongoDB is running: `mongosh` or `mongo`
- Verify `MONGODB_URI` in `.env`
- Default: `mongodb://localhost:27017/heritage-db`

### Issue: 401 Unauthorized when calling API

**Solution:**

1. Ensure user exists in MongoDB (check `users` collection)
2. Verify JWT token is valid and not expired
3. Check `CLERK_SECRET_KEY` in `.env` matches Clerk dashboard

### Issue: Seed script fails

**Solution:**

- Ensure MongoDB is running
- Clear database: In MongoDB Compass, drop `heritage-db` database
- Run seed again: `npm run seed`

## 📁 Project Structure Overview

```
backend/
├── src/
│   ├── main.ts                 # App bootstrap with Swagger
│   ├── app.module.ts           # Root module
│   ├── config/                 # Configuration files
│   ├── common/
│   │   ├── guards/             # ClerkAuthGuard, RolesGuard
│   │   ├── decorators/         # @Roles(), @CurrentUser()
│   │   └── filters/            # Error handling
│   ├── schemas/                # 6 Mongoose schemas
│   ├── modules/
│   │   ├── users/              # User CRUD + Clerk webhook
│   │   ├── sites/              # Sites with geospatial
│   │   ├── incidents/          # Incident tracking
│   │   ├── conservation/       # Conservation projects
│   │   ├── approvals/          # Approval workflow
│   │   └── dashboard/          # Analytics aggregations
│   └── scripts/
│       └── seed.ts             # Database seeding
├── dist/                       # Compiled JavaScript
├── .env                        # Environment variables
└── README.md                   # Full documentation
```

## 🎯 Next Steps

1. ✅ Start MongoDB
2. ✅ Run seed script: `npm run seed`
3. ✅ Start backend: `npm run start:dev`
4. ✅ Test Swagger UI: http://localhost:8080/docs
5. ⏭️ Set up Clerk webhook
6. ⏭️ Update frontend to call backend APIs
7. ⏭️ Replace mock data with real API calls

## 📚 Additional Resources

- **Full API Documentation:** http://localhost:8080/docs (when server running)
- **Backend README:** `backend/README.md`
- **Clerk Docs:** https://clerk.com/docs
- **NestJS Docs:** https://docs.nestjs.com

## 🎉 Success Checklist

- ✅ Backend builds without errors (`npm run build`)
- ✅ Server starts successfully (`npm run start:dev`)
- ✅ Swagger UI loads at http://localhost:8080/docs
- ✅ MongoDB connection successful
- ✅ Database seeded with test data
- ⏳ Clerk webhook configured
- ⏳ Frontend connected to backend
- ⏳ User can login and see real data

**Your production-grade NestJS backend is ready! 🚀**
