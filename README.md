# Shipera.AI 🚚

Shipera.AI is a modern, AI-powered Logistics Operating System (Logistics OS) built to streamline carrier management and Request for Proposal (RFP) routing. 

This application features a robust Multi-Tenant architecture where users can seamlessly join their organization, manage their carrier network, upload CSV lane requirements, and dispatch RFPs natively.

## 🚀 Tech Stack

- **Frontend Framework:** [Next.js 14 App Router](https://nextjs.org/) (React)
- **Styling:** Vanilla CSS / Tailwind CSS with `lucide-react` for iconography
- **Database & Authentication:** [Supabase](https://supabase.com/) (PostgreSQL)
- **State Management:** React Context API (`AuthProvider`)
- **Data Parsing:** `papaparse` for CSV ingestion

## ✨ Core Features

1. **Multi-Tenant Organization Architecture**
   - Users are scoped strictly to an `org_id` using Postgres Row Level Security (RLS).
   - "Magic Link" instant onboarding flow (`/invite-accept`) allows users to automatically join an organization without needing complex backend service credentials.
   - Forced password-reset policies for securely invited members.

2. **Carrier CRM (`/carriers`)**
   - Create and manage a directory of carriers.
   - Track MC/DOT Numbers, contact information, and equipment types (Flatbed, Reefer, Dry Van, etc.).
   - Granular status tracking (Verified, Pending, Suspended).

3. **RFP & Lane Configuration (`/rfps`)**
   - Build complete truckload and LTL Requests for Proposals.
   - Drag-and-drop CSV upload for complex shipping lane data (Origin, Destination, Volume).
   - Dynamic carrier multi-selection to dispatch the RFP directly to preferred partners.

4. **Role-Based Access Control (RBAC)**
   - **Admin:** Full read/write access + User Management.
   - **Supervisor:** Can manage processes and carriers but cannot invite/remove org members.
   - **Coordinator:** Standard read/write access scoped to their organization.

## 🛠️ Getting Started

### 1. Database Setup (Supabase)
To set up or reset your database, you must run our schema and trigger scripts in your Supabase SQL Editor in the exact chronological order outlined in the `src/config` directory:

1. `01_schema.sql` - Core tables & Row Level Security.
2. `02_rbac_update.sql` - Route specific carrier RLS policies.
3. `03_teams_rbac_update.sql` - Role updates.
4. `04_setup_auth_trigger.sql` - Base trigger for Org allocation.
5. `05_trigger_update.sql` - Upgraded trigger to support Magic Invite Links.
6. `06_force_password_update.sql` - Required trigger for newly invited User Security flow.

(For more details, see [`src/config/README.md`](src/config/README.md)).

### 2. Environment Variables
Create a `.env.local` file in the root of the project with your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 3. Run the Development Server

Instal dependencies and start Next.js:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.
