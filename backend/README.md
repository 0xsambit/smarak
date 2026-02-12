# Heritage Site Management Backend

Production-grade NestJS backend for Heritage Site Management SaaS used by national and state-level government authorities.

## 🏗️ Architecture

### Tech Stack

- **Framework**: NestJS 10.x (Node.js + TypeScript)
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: Clerk JWT verification
- **Documentation**: Swagger/OpenAPI
- **Security**: Helmet, CORS, Rate Limiting, Input Validation

### Key Features

- ✅ Role-based access control (RBAC)
- ✅ Clerk webhook integration for user sync
- ✅ Geospatial queries for site search
- ✅ MongoDB aggregation pipelines for analytics
- ✅ Production-ready error handling
- ✅ Comprehensive API documentation
- ✅ Audit-ready architecture

## 📁 Project Structure

```
backend/
├── src/
│   ├── config/               # Configuration modules
│   │   ├── database.config.ts
│   │   ├── clerk.config.ts
│   │   └── app.config.ts
│   ├── common/               # Shared utilities
│   │   ├── guards/           # Auth & RBAC guards
│   │   ├── decorators/       # Custom decorators
│   │   ├── filters/          # Exception filters
│   │   └── interceptors/     # Response transformers
│   ├── schemas/              # Mongoose schemas
│   │   ├── user.schema.ts
│   │   ├── site.schema.ts
│   │   ├── incident.schema.ts
│   │   ├── conservation.schema.ts
│   │   ├── approval.schema.ts
│   │   └── footfall.schema.ts
│   ├── modules/              # Feature modules
│   │   ├── users/
│   │   ├── sites/
│   │   ├── incidents/
│   │   ├── conservation/
│   │   ├── approvals/
│   │   └── dashboard/
│   ├── scripts/
│   │   └── seed.ts           # Database seeding
│   ├── main.ts               # Application bootstrap
│   └── app.module.ts         # Root module
├── .env                      # Environment variables
├── package.json
└── tsconfig.json
```

## 🚀 Getting Started

### Prerequisites

- Node.js >= 18.0.0
- MongoDB running on localhost:27017 or MongoDB Atlas
- Clerk account with Secret Key

### Installation

1. **Install dependencies**

   ```bash
   cd backend
   npm install
   ```

2. **Configure environment variables**

   Copy `.env.example` to `.env` and update:

   ```env
   NODE_ENV=development
   PORT=8080

   # Database
   MONGODB_URI=mongodb://localhost:27017/heritage-db

   # Clerk Authentication
   CLERK_SECRET_KEY=sk_test_your_secret_key_here
   CLERK_WEBHOOK_SECRET=whsec_your_webhook_secret_here

   # CORS
   CORS_ORIGIN=http://localhost:5173

   # Security
   RATE_LIMIT_TTL=900000
   RATE_LIMIT_MAX=100
   ```

3. **Start MongoDB**

   ```bash
   # If using local MongoDB
   mongod --dbpath /path/to/db

   # Or use MongoDB Compass to connect to your instance
   ```

4. **Seed the database**

   ```bash
   npm run seed
   ```

5. **Start the server**

   ```bash
   # Development mode with hot-reload
   npm run start:dev

   # Production mode
   npm run build
   npm run start:prod
   ```

The API will be available at:

- API: http://localhost:8080/api
- Swagger Documentation: http://localhost:8080/docs

## 🔐 Authentication & Authorization

### Clerk Integration

The backend verifies Clerk JWT tokens sent in the Authorization header:

```
Authorization: Bearer <clerk_jwt_token>
```

**How it works:**

1. Frontend obtains JWT from Clerk using `getToken()`
2. JWT is sent in Authorization header
3. `ClerkAuthGuard` verifies token and fetches user from MongoDB
4. `RolesGuard` checks user role against required permissions
5. User object is attached to request and available via `@CurrentUser()` decorator

### User Roles

- **NATIONAL_ADMIN**: Full system access, can manage all sites and users
- **STATE_ADMIN**: Manage sites within assigned state
- **SITE_OFFICER**: Manage assigned site, report incidents

### Clerk Webhook Setup

To sync users from Clerk to MongoDB:

1. In Clerk Dashboard, go to **Webhooks**
2. Add endpoint: `http://localhost:8080/api/users/webhook`
3. Select events: `user.created`, `user.updated`, `user.deleted`
4. Copy the webhook secret and add to `.env` as `CLERK_WEBHOOK_SECRET`

## 📚 API Endpoints

### Users Module

| Method | Endpoint             | Description                 | Auth     | Role                        |
| ------ | -------------------- | --------------------------- | -------- | --------------------------- |
| POST   | `/api/users/webhook` | Clerk webhook for user sync | None     | Public                      |
| GET    | `/api/users`         | List all users              | Required | NATIONAL_ADMIN, STATE_ADMIN |
| GET    | `/api/users/me`      | Get current user profile    | Required | All                         |
| GET    | `/api/users/:id`     | Get user by ID              | Required | All                         |
| PATCH  | `/api/users/:id`     | Update user                 | Required | NATIONAL_ADMIN              |
| DELETE | `/api/users/:id`     | Soft delete user            | Required | NATIONAL_ADMIN              |

### Sites Module

| Method | Endpoint                    | Description                 | Auth     | Role                        |
| ------ | --------------------------- | --------------------------- | -------- | --------------------------- |
| POST   | `/api/sites`                | Create new site             | Required | NATIONAL_ADMIN, STATE_ADMIN |
| GET    | `/api/sites`                | List sites with filters     | Required | All                         |
| GET    | `/api/sites/nearby`         | Find sites near coordinates | Required | All                         |
| GET    | `/api/sites/:id`            | Get site details            | Required | All                         |
| GET    | `/api/sites/:id/statistics` | Get site statistics         | Required | All                         |
| PATCH  | `/api/sites/:id`            | Update site                 | Required | NATIONAL_ADMIN, STATE_ADMIN |
| DELETE | `/api/sites/:id`            | Delete site                 | Required | NATIONAL_ADMIN              |

**Geospatial Query Example:**

```
GET /api/sites/nearby?latitude=28.6139&longitude=77.2167&maxDistance=50000
```

### Incidents Module

| Method | Endpoint             | Description                 | Auth     | Role                        |
| ------ | -------------------- | --------------------------- | -------- | --------------------------- |
| POST   | `/api/incidents`     | Report new incident         | Required | All                         |
| GET    | `/api/incidents`     | List incidents with filters | Required | All                         |
| GET    | `/api/incidents/:id` | Get incident details        | Required | All                         |
| PATCH  | `/api/incidents/:id` | Update incident status      | Required | All                         |
| DELETE | `/api/incidents/:id` | Delete incident             | Required | NATIONAL_ADMIN, STATE_ADMIN |

### Conservation Module

| Method | Endpoint                | Description                 | Auth     | Role                        |
| ------ | ----------------------- | --------------------------- | -------- | --------------------------- |
| POST   | `/api/conservation`     | Create conservation project | Required | NATIONAL_ADMIN, STATE_ADMIN |
| GET    | `/api/conservation`     | List projects with filters  | Required | All                         |
| GET    | `/api/conservation/:id` | Get project details         | Required | All                         |
| PATCH  | `/api/conservation/:id` | Update project              | Required | NATIONAL_ADMIN, STATE_ADMIN |
| DELETE | `/api/conservation/:id` | Delete project              | Required | NATIONAL_ADMIN              |

### Approvals Module

| Method | Endpoint                    | Description            | Auth     | Role                        |
| ------ | --------------------------- | ---------------------- | -------- | --------------------------- |
| POST   | `/api/approvals`            | Submit for approval    | Required | All                         |
| GET    | `/api/approvals`            | List approval requests | Required | All                         |
| GET    | `/api/approvals/:id`        | Get approval details   | Required | All                         |
| PATCH  | `/api/approvals/:id/review` | Approve/reject         | Required | NATIONAL_ADMIN, STATE_ADMIN |
| DELETE | `/api/approvals/:id`        | Delete approval        | Required | NATIONAL_ADMIN              |

### Dashboard Module

| Method | Endpoint                  | Description                      | Auth     | Role |
| ------ | ------------------------- | -------------------------------- | -------- | ---- |
| GET    | `/api/dashboard/overview` | Get dashboard KPIs and analytics | Required | All  |

**Query Parameters:**

- `scope`: `national` | `state` | `site`
- `state`: Filter by state name (required if scope=state)
- `siteId`: Filter by site ID (required if scope=site)

**Response Structure:**

```json
{
  "kpis": {
    "totalSites": 150,
    "highRiskSites": 12,
    "activeIncidents": 8,
    "pendingApprovals": 5,
    "conservationOngoing": 3,
    "visitorCapacity": 500000
  },
  "incidentsBySeverity": {
    "LOW": 2,
    "MEDIUM": 4,
    "HIGH": 2
  },
  "footfallTrend": [
    { "day": "2026-02-05", "visitors": 12500 },
    { "day": "2026-02-06", "visitors": 15200 }
  ],
  "recentActivity": [
    {
      "id": "...",
      "type": "incident",
      "text": "STRUCTURAL incident reported",
      "site": "Taj Mahal",
      "time": "2h ago",
      "user": "Amit Verma"
    }
  ],
  "regionSummary": [
    {
      "name": "Uttar Pradesh",
      "sites": 45,
      "alerts": 3,
      "status": "Stable"
    }
  ]
}
```

## 🗄️ Database Schemas

### User Schema

```typescript
{
  clerkId: string (unique, indexed),
  name: string,
  email: string (unique, indexed),
  role: enum (NATIONAL_ADMIN | STATE_ADMIN | SITE_OFFICER),
  stateId?: ObjectId,
  siteId?: ObjectId,
  isActive: boolean,
  timestamps
}
```

### Site Schema

```typescript
{
  name: string,
  state: string,
  district: string,
  coordinates: {
    type: "Point",
    coordinates: [longitude, latitude]  // 2dsphere index
  },
  protectionStatus: enum (PROTECTED | RESTRICTED | OPEN),
  riskLevel: enum (LOW | MEDIUM | HIGH),
  lastInspectionDate: Date,
  visitorCapacity: number,
  description?: string,
  timestamps
}
```

### Incident Schema

```typescript
{
  siteId: ObjectId (indexed),
  type: enum (STRUCTURAL | VANDALISM | OVERCROWDING | ENVIRONMENTAL | SECURITY),
  severity: enum (LOW | MEDIUM | HIGH),
  description: string,
  status: enum (OPEN | IN_PROGRESS | RESOLVED),
  reportedBy: ObjectId,
  resolvedAt?: Date,
  resolutionNotes?: string,
  images?: string[],
  timestamps
}
```

### Conservation Schema

```typescript
{
  siteId: ObjectId (indexed),
  issueType: string,
  title: string,
  description: string,
  beforeImages: string[],
  afterImages: string[],
  contractor: string,
  budget: number,
  status: enum (PLANNED | ONGOING | COMPLETED | CANCELLED),
  startDate: Date,
  endDate?: Date,
  completionNotes?: string,
  createdBy: ObjectId,
  timestamps
}
```

### Approval Schema

```typescript
{
  type: enum (CONSERVATION | INCIDENT | REPORT | BUDGET),
  referenceId: ObjectId,
  title: string,
  description?: string,
  submittedBy: ObjectId,
  status: enum (PENDING | APPROVED | REJECTED),
  reviewedBy?: ObjectId,
  reviewedAt?: Date,
  reviewNotes?: string,
  isPriority: boolean,
  timestamps
}
```

### Footfall Schema

```typescript
{
  siteId: ObjectId (indexed),
  date: Date (indexed),
  visitors: number,
  revenue?: number,
  peakHour?: string,
  timestamps
}
```

## 🧪 Testing the API

### Using Swagger UI

1. Open http://localhost:8080/docs
2. Click "Authorize" button
3. Enter your Clerk JWT token (get it from frontend Network tab)
4. Test endpoints directly from the UI

### Using curl

```bash
# Get dashboard overview
curl -X GET "http://localhost:8080/api/dashboard/overview?scope=national" \
  -H "Authorization: Bearer YOUR_CLERK_JWT_TOKEN"

# Create a new incident
curl -X POST "http://localhost:8080/api/incidents" \
  -H "Authorization: Bearer YOUR_CLERK_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "siteId": "SITE_ID_HERE",
    "type": "STRUCTURAL",
    "severity": "HIGH",
    "description": "Cracks in foundation"
  }'
```

## 🔒 Security Features

- **Helmet**: Sets secure HTTP headers
- **CORS**: Configured for specific origin
- **Rate Limiting**: 100 requests per 15 minutes per IP
- **Input Validation**: class-validator on all DTOs
- **JWT Verification**: Clerk token verification on protected routes
- **RBAC**: Role-based access control at controller level
- **Soft Delete**: User deactivation instead of hard delete

## 📊 Performance Optimizations

- **Aggregation Pipelines**: All dashboard counts use MongoDB aggregations (no in-memory counting)
- **Indexes**: Strategic indexes on frequently queried fields
- **Lean Queries**: Using `.lean()` for read-only operations
- **Pagination**: All list endpoints support pagination
- **Geospatial Index**: 2dsphere index for fast location-based queries

## 🐛 Troubleshooting

### MongoDB Connection Issues

```bash
# Check if MongoDB is running
mongosh

# Or check connection string
echo $MONGODB_URI
```

### Clerk JWT Verification Fails

- Ensure `CLERK_SECRET_KEY` in `.env` matches your Clerk dashboard
- Check token is sent as `Bearer <token>` in Authorization header
- Verify user exists in MongoDB (synced via webhook)

### Port Already in Use

```bash
# Change PORT in .env or kill process using port 8080
netstat -ano | findstr :8080
taskkill /PID <PID> /F
```

## 📄 License

Proprietary - Government Use Only

## 👥 Support

For issues or questions, contact the ASI Digital Infrastructure Team.
