# Shipera AI

Shipera AI is an intelligent fright sourcing and Carrier RFP management platform built with Next.js, Supabase, and the Vercel AI SDK. It streamlines the process of procuring freight rates by automating carrier outreach and intelligently parsing inbound bids from emails using cutting-edge Generative AI.

---

## 🚀 Key Features

### 1. **AI-Powered Automated Bid Extraction**
The core innovation of Shipera AI is its ability to bypass manual data entry for incoming freight bids.
- **Gmail Integration:** Connects securely directly into a centralized Gmail inbox to monitor carrier replies.
- **Multi-Format Parsing:** An intelligent `attachmentService` automatically downloads and reads text from PDFs, Word Documents (DOCX), Excel Spreadsheets (XLSX, XLS), and CSVs.
- **Vercel AI SDK + OpenAI GPT-4o:** The agent reads the complex, unstructured bodies of carrier emails and their attachments, identifying key freight data (Origin, Destination, Rate, Transit Time).
- **Zero-Touch Conversion:** Once the AI structuring extracts the bid with high confidence, it uses Supabase to automatically link the bid to the correct RFP Lane and Carrier, creating it instantly on the dashboard without human intervention.
- **Manual AI Fallback:** For complex or low-confidence emails, the system highlights them as "Carrier Replies". Users can open a modal and click **"Auto-Fill with AI"** to have the AI take its best guess, allowing minor human tweaks before submission. 

### 2. **RFP & Carrier Management**
- **Robust RFP Creation:** Build detailed Requests for Proposals with multiple freight lanes (origin/destination pairs) and requirements.
- **Carrier Database:** Manage a directory of carriers, tracking their equipment types, contact info, and statuses.
- **FMCSA Integration:** Carrier DOT and MC numbers are cross-referenced directly with the FMCSA APIs to ensure carrier safety statuses, insurance validity, and out-of-service rates are acceptable before awarding bids.

### 3. **Realtime Dashboard & Tracking**
- **Live Bid Board:** Built with Supabase Realtime Channels, the dashboard updates instantly the second an AI-extracted bid hits the database.
- **Invitation Tracking:** Monitor which carriers have been invited, who has opened the access link, and who has submitted a bid.
- **One-Click Awarding:** Instantly analyze all bids across a lane and click to Accept/Award the winning carrier, which triggers a notification.

---

## 🛠 Tech Stack

**Frontend Framework:** Next.js 16 (App Router)  
**Styling & UI:** Tailwind CSS, Radix UI Primitives, Lucide Icons  
**Backend / Database:** Supabase (PostgreSQL, Row Level Security, Realtime)  
**Authentication:** Supabase Auth (Magic Links, OAuth)  
**AI Capabilities:** Vercel AI SDK, OpenAI API (GPT-4o)  
**Document Parsing:** `pdf-parse`, `mammoth` (Word), `xlsx` (Excel/CSV)  
**Email Integrations:** Nodemailer (Outbound), Googleapis (Inbound Gmail Webhook)  

---

## 💻 Local Development Setup

### Prerequisites
- Node.js 18+
- npm or pnpm
- Supabase CLI (Optional, for local DB development)

### 1. Clone & Install
```bash
git clone https://github.com/reachraza/shipera-ai-app.git
cd shipera-ai-app
npm install
```

### 2. Environment Variables
Create a `.env.local` file in the root directory. You will need keys for Supabase, Google (Gmail API), and OpenAI.

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key

# Google / Gmail API Configuration (For AI Email Parsing)
GOOGLE_CLIENT_ID=your_google_oauth_client_id
GOOGLE_CLIENT_SECRET=your_google_oauth_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/callback/google
GOOGLE_REFRESH_TOKEN=your_persistent_refresh_token

# Application Config
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Database Setup (Supabase)
Ensure your Supabase PostgreSQL database contains the schemas defined in `src/config/00_master_schema.sql`.

Key Tables:
- `users`, `organizations` (Roles & Multi-tenant isolation)
- `carriers`, `carrier_fmcsa` (Carrier lifecycle)
- `rfps`, `rfp_lanes`, `rfp_invites` (Sourcing)
- `bids` (Carrier responses)
- `inbound_emails` (Raw monitored replies for the AI to parse)

### 4. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

---

## ⚙️ How the AI Email Webhook Works
Because carriers do not always log into portals to submit bids, Shipera allows them to simply reply to the RFP invitation email.

1. A **self-hosted `node-cron` scheduler** (inside `src/instrumentation.ts`) triggers the `/api/email/fetch-gmail` route every 5 minutes automatically when the server starts. No external cron service (like Vercel Cron) is required.
2. The route uses a persistent Google OAuth Refresh token to securely check the designated inbox.
3. Every unread email with attachments is fully downloaded.
4. The `attachmentService` converts all PDFs, Word Docs, and Excel files into a normalized raw string.
5. The `aiService` passes the email Body + Attachment text into an OpenAI prompt instructed to find Bids.
6. The AI returns a strict JSON structured `Bid` matching a known Carrier and RFP Lane entirely in the background.

---

*This project is built and maintained by Shipera.*
