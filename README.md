# 🏦 Enterprise Digital Banking Governance Platform (Meridian)

A comprehensive, modular, enterprise-grade governance platform for financial institutions. Acts as the centralized operational backbone, enabling enterprise-wide decision-making, standardized governance, and risk compliance across all departments and banking functions.

## 🎯 Overview

**Meridian** is a bank-wide governance system supporting:

- **Document Management** - Centralized storage, versioning, and approval workflows
- **Workflow & Approvals** - Configurable multi-step approval processes
- **Project Management** - Cross-department initiative tracking
- **Vendor Management** - Vendor onboarding, due diligence, and performance
- **Contract Lifecycle** - Contract management with expiry alerts
- **Risk & Compliance** - Risk register, compliance tracking, framework mapping
- **Audit & Analytics** - Immutable audit trails and executive dashboards
- **Role-Based Access Control** - Fine-grained permissions across all modules

## 🏗️ Architecture

```
Frontend (React 19 + TypeScript)
    ↓
Next.js API Layer (REST endpoints)
    ↓
Service Layer (Business Logic)
    ↓
Repository Layer (Drizzle ORM)
    ↓
PostgreSQL Database
```

### Technology Stack

**Frontend:**
- React 19 with Server Components
- TypeScript (strict mode)
- Tailwind CSS v4
- Shadcn/UI Components
- Next.js 16 App Router

**Backend:**
- Node.js with Next.js
- TypeScript
- Drizzle ORM
- PostgreSQL

**Authentication:**
- Better Auth (email/password)
- Session management with IP tracking
- JWT-based token authentication

**Infrastructure:**
- Vercel-ready deployment
- PostgreSQL database
- Environment-based configuration

## 📋 Core Modules

### 1. Document Management
- Multi-version document support
- Access control (internal, restricted, public)
- Tag-based categorization
- Expiry tracking
- Approval workflow integration
- Full audit history

### 2. Workflow & Approvals
- Configurable multi-step workflows
- Priority-based routing
- SLA tracking
- Escalation support
- Delegation capabilities
- Status tracking (pending, approved, rejected)

### 3. Project Management
- Status tracking (planning, active, on_hold, completed, cancelled)
- Progress monitoring
- Budget tracking
- Risk assessment
- Department assignment
- Timeline management

### 4. Vendor Management
- Vendor onboarding
- Risk scoring and rating
- Due diligence tracking
- Contract value management
- Renewal date tracking
- Performance metrics

### 5. Contract Management
- Contract lifecycle (draft, active, expired, terminated)
- Auto-renewal tracking
- Counterparty management
- Contract value tracking
- Type classification
- Expiry alerts

### 6. Risk Management
- Risk registration and tracking
- Likelihood & Impact assessment
- Severity calculation
- Control mapping
- Department assignment
- Status tracking (open, mitigated, resolved, monitored)

### 7. Compliance
- Framework mapping (SOC 2, ISO 27001, etc.)
- Control reference tracking
- Status tracking (compliant, non-compliant, partial)
- Owner assignment
- Review scheduling
- Audit readiness

### 8. Audit & Activity Logging
- Immutable audit trail
- IP address tracking
- Action logging (CRUD operations)
- Module tracking
- Entity-level tracking
- User attribution

## 🔐 Role-Based Access Control (RBAC)

**6 Role Levels:**

| Role | Level | Access |
|------|-------|--------|
| **Super Admin** | 100 | Full unrestricted access |
| **Executive** | 90 | Read-heavy oversight + approvals |
| **Compliance Officer** | 70 | Risk, compliance, policy management |
| **Auditor** | 60 | Read-only + full audit trail visibility |
| **Department Head** | 50 | Department documents, projects, approvals |
| **Staff** | 10 | Basic document access, submissions |

**Permission System:** `<module>:<action>`
- Actions: `view`, `create`, `edit`, `delete`, `approve`, `admin`
- Modules: 12 core modules with fine-grained control

## 📁 Project Structure

```
.
├── app/
│   ├── api/                    # REST API endpoints
│   │   ├── documents/
│   │   ├── approvals/
│   │   ├── projects/
│   │   ├── vendors/
│   │   ├── contracts/
│   │   ├── risks/
│   │   └── compliance/
│   ├── dashboard/              # Main dashboard
│   ├── documents/              # Document module UI
│   ├── approvals/              # Approval module UI
│   ├── projects/               # Project module UI
│   ├── vendors/                # Vendor module UI
│   ├── contracts/              # Contract module UI
│   ├── risks/                  # Risk module UI
│   ├── compliance/             # Compliance module UI
│   ├── analytics/              # Analytics dashboard
│   ├── sign-in/                # Authentication
│   ├── sign-up/
│   └── page.tsx                # Root redirector
│
├── lib/
│   ├── db/
│   │   ├── schema.ts          # Drizzle ORM schema (all tables)
│   │   └── index.ts           # Database utilities
│   ├── services/              # Business logic layer
│   │   ├── document.service.ts
│   │   ├── vendor.service.ts
│   │   ├── project.service.ts
│   │   ├── approval.service.ts
│   │   ├── compliance.service.ts
│   │   └── index.ts
│   ├── schemas.ts             # Zod validation schemas
│   ├── api-utils.ts           # API helpers
│   ├── auth.ts                # Better Auth config
│   ├── auth-client.ts         # Client-side auth
│   ├── session.ts             # Session management
│   ├── rbac.ts                # Permission definitions
│   ├── audit.ts               # Audit logging
│   └── utils.ts               # Utility functions
│
├── components/
│   ├── dashboard-layout.tsx   # Main dashboard layout
│   ├── auth-form.tsx          # Authentication form
│   └── ui/                    # Shadcn UI components
│
├── public/                    # Static assets
├── package.json               # Dependencies
├── tsconfig.json              # TypeScript config
└── README.md                  # This file
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 12+
- pnpm (recommended) or npm

### Installation

1. **Clone and install dependencies:**
```bash
cd enterprise-digital-banking-platform
pnpm install
```

2. **Set up environment variables:**
```bash
cp .env.example .env.local
```

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/meridian

# Authentication
BETTER_AUTH_SECRET=your-secret-key
BETTER_AUTH_URL=http://localhost:3000

# Optional
NODE_ENV=development
```

3. **Initialize the database:**
```bash
pnpm db:generate
pnpm db:migrate
```

4. **Seed initial data (optional):**
```bash
pnpm db:seed
```

5. **Start development server:**
```bash
pnpm dev
```

Navigate to `http://localhost:3000`

### First Time Setup

1. Sign up with your credentials
2. The first registered user automatically becomes Super Admin
3. Access the dashboard to begin

## 📊 API Endpoints

### Documents
```
GET    /api/documents               # List all documents
POST   /api/documents               # Create document
GET    /api/documents/[id]         # Get document details
PATCH  /api/documents/[id]         # Update document
DELETE /api/documents/[id]         # Archive document
```

### Approvals
```
GET    /api/approvals              # List approval requests
POST   /api/approvals              # Create approval
GET    /api/approvals/[id]        # Get approval details
POST   /api/approvals/[id]        # Approve/reject
```

### Projects
```
GET    /api/projects               # List projects
POST   /api/projects               # Create project
GET    /api/projects/[id]         # Get project
PATCH  /api/projects/[id]         # Update project
DELETE /api/projects/[id]         # Delete project
```

### Vendors
```
GET    /api/vendors                # List vendors
POST   /api/vendors                # Create vendor
GET    /api/vendors/[id]          # Get vendor
PATCH  /api/vendors/[id]          # Update vendor
DELETE /api/vendors/[id]          # Delete vendor
```

### Contracts
```
GET    /api/contracts              # List contracts
POST   /api/contracts              # Create contract
```

### Risks
```
GET    /api/risks                  # List risks
POST   /api/risks                  # Create risk
GET    /api/risks/[id]            # Get risk
PATCH  /api/risks/[id]            # Update risk
DELETE /api/risks/[id]            # Delete risk
```

### Compliance
```
GET    /api/compliance             # List compliance items
POST   /api/compliance             # Create compliance item
GET    /api/compliance/[id]       # Get item
PATCH  /api/compliance/[id]       # Update item
```

### Statistics
```
GET    /api/stats                  # Get dashboard statistics
```

## 🔑 Request/Response Examples

### Create a Document
```bash
curl -X POST http://localhost:3000/api/documents \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Information Security Policy",
    "description": "Corporate-wide security guidelines",
    "category": "policy",
    "accessLevel": "internal",
    "tags": ["security", "policy"],
    "expiryDate": "2025-12-31T23:59:59Z"
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "Information Security Policy",
    "status": "draft",
    "version": 1,
    ...
  }
}
```

### Create an Approval Request
```bash
curl -X POST http://localhost:3000/api/approvals \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Approve Q4 Budget",
    "entityType": "budget",
    "entityId": "project-123",
    "priority": "high",
    "dueDate": "2024-12-31T17:00:00Z"
  }'
```

### Approve a Request
```bash
curl -X POST http://localhost:3000/api/approvals/approval-123 \
  -H "Content-Type: application/json" \
  -d '{
    "approve": true,
    "comment": "Approved. Meets all requirements."
  }'
```

## 🔐 Security Features

- **JWT Authentication** - Secure token-based auth
- **Session Management** - IP tracking, user agent logging
- **RBAC** - Fine-grained role-based permissions
- **Audit Logging** - Immutable action trails
- **Input Validation** - Zod schema validation
- **Password Hashing** - Argon2/bcrypt support
- **SQL Injection Prevention** - Parameterized queries via ORM
- **CORS** - Configurable origin handling
- **Rate Limiting** - Ready for implementation

## 🎨 UI/UX Features

- **Dark Mode Support** - Via `next-themes`
- **Responsive Design** - Mobile-first approach
- **Accessible Components** - WCAG compliance ready
- **Intuitive Navigation** - Sidebar with module links
- **Real-time Feedback** - Toast notifications
- **Consistent Branding** - "Meridian" visual identity
- **Data Visualization** - Charts and progress bars

## 📈 Dashboard Metrics

The main dashboard displays:

- **Documents:** Total, approved, draft, archived counts
- **Projects:** Active, completed, on-hold status
- **Approvals:** Pending, approved, rejected metrics
- **Vendors:** Active count, high-risk indicators
- **Risks:** Critical, high, open, mitigated breakdown
- **Compliance:** Compliance percentage by framework

## 🔄 Workflow Examples

### Document Approval Workflow
```
1. User creates document (status: draft)
2. User submits for approval
3. Approval request created (status: pending)
4. Approver reviews and approves/rejects
5. Document status updated (approved/rejected)
6. Audit entry recorded
7. Notifications sent to stakeholders
```

### Risk Mitigation Workflow
```
1. Risk identified and registered
2. Likelihood & impact assessed
3. Severity calculated automatically
4. Control mapped
5. Mitigation plan created
6. Status tracked (open → mitigated → resolved)
7. Full audit trail maintained
```

## 📚 Service Layer Pattern

All business logic is encapsulated in service classes:

```typescript
// Example: Create a document
import { DocumentService } from "@/lib/services"

const doc = await DocumentService.createDocument(
  {
    title: "Policy",
    category: "policy",
    // ...
  },
  userId,
  userName
)
```

Benefits:
- **Testable** - Pure functions
- **Reusable** - Shared across endpoints
- **Maintainable** - Centralized logic
- **Observable** - Built-in audit logging

## 🧪 Testing

Test files follow naming convention: `*.spec.ts` or `*.test.ts`

```bash
# Run tests
pnpm test

# Run with coverage
pnpm test:coverage

# Watch mode
pnpm test:watch
```

## 📦 Deployment

### Vercel Deployment

1. Push code to Git
2. Connect to Vercel
3. Set environment variables
4. Deploy automatically

```bash
vercel env add DATABASE_URL
vercel env add BETTER_AUTH_SECRET
```

### Docker Deployment

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY . .
RUN pnpm install
RUN pnpm build
EXPOSE 3000
CMD ["pnpm", "start"]
```

## 🛠️ Available Scripts

```bash
# Development
pnpm dev              # Start dev server
pnpm build            # Build for production
pnpm start            # Start production server
pnpm lint             # Run ESLint

# Database
pnpm db:generate      # Generate migrations
pnpm db:migrate       # Run migrations
pnpm db:studio        # Open Drizzle Studio
pnpm db:seed          # Seed initial data
```

## 🚦 Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden (Permission denied) |
| 404 | Not Found |
| 500 | Server Error |

## 📝 Example Queries

### Filter Documents by Status
```bash
GET /api/documents?status=approved&category=policy
```

### Get Pending Approvals
```bash
GET /api/approvals?status=pending&priority=high
```

### List High-Risk Vendors
```bash
GET /api/vendors?riskRating=high&status=active
```

### Get Critical Risks
```bash
GET /api/risks?severity=critical&status=open
```

## 🤝 Contributing

1. Create a feature branch
2. Make changes following the established patterns
3. Test thoroughly
4. Submit pull request

## 📄 License

Proprietary - Enterprise Digital Banking Platform

## 🎓 Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Drizzle ORM Guide](https://orm.drizzle.team)
- [PostgreSQL Documentation](https://www.postgresql.org/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)

## 💬 Support

For issues, questions, or feature requests:
- Create an issue in the repository
- Contact the platform team
- Refer to documentation

---

**Meridian** - The Governance Backbone for Modern Banks 🏦
