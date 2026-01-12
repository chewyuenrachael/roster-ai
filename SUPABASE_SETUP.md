# Supabase Setup Guide for RosterAI

Follow these steps to connect RosterAI to your Supabase database.

## Step 1: Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com) and sign up/log in
2. Click **"New Project"**
3. Choose your organization
4. Enter project details:
   - **Name**: `roster-ai`
   - **Database Password**: Create a strong password (save it!)
   - **Region**: Choose closest to your users
5. Click **"Create new project"** and wait for setup (~2 minutes)

## Step 2: Set Up the Database

1. In your Supabase dashboard, go to **SQL Editor** (left sidebar)
2. Click **"New query"**
3. Copy the entire contents of `supabase/schema.sql` and paste it
4. Click **"Run"** to execute the SQL
5. You should see success messages for all tables created

## Step 3: Get Your API Keys

1. Go to **Project Settings** → **API** (in the left sidebar)
2. Copy these values:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon public** key (under "Project API keys")

## Step 4: Configure Environment Variables

1. Create a `.env` file in the project root:

```bash
# In your terminal
touch .env
```

2. Add your Supabase credentials:

```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

3. **Important**: Make sure `.env` is in your `.gitignore` (it should be by default)

## Step 5: Enable Authentication

1. Go to **Authentication** → **Providers** in Supabase dashboard
2. Enable **Email** provider (should be enabled by default)
3. (Optional) Configure email templates under **Email Templates**

## Step 6: Test the Connection

1. Start your development server:
```bash
npm run dev
```

2. Open the browser console (F12) - you should see:
   - ✅ No warnings if connected successfully
   - ⚠️ Warning message if credentials are missing (demo mode)

## Database Schema Overview

### Tables Created

| Table | Description |
|-------|-------------|
| `doctors` | Doctor profiles (name, team, role, points) |
| `requests` | Leave/call requests (AL, CB, CR) |
| `rosters` | Generated monthly rosters |
| `teams` | Team configurations |
| `ho_tiers` | HO tier configurations (HO1-HO11) |
| `public_holidays` | Public holiday calendar |
| `audit_log` | Change tracking |

### User Roles

| Role | Permissions |
|------|-------------|
| `doctor` | View rosters, manage own requests |
| `roster_admin` | Generate/publish rosters, manage all requests |
| `admin` | Full access including team/tier configuration |

## Troubleshooting

### "Supabase not configured" warning
- Check that your `.env` file exists and has the correct values
- Make sure variable names start with `VITE_` (required for Vite)
- Restart the dev server after changing `.env`

### RLS (Row Level Security) errors
- Check that you've run the full `schema.sql` including RLS policies
- Make sure the user is authenticated for protected operations

### Data not showing
- Check browser console for API errors
- Verify tables have data in Supabase Table Editor
- Check RLS policies allow the operation

## Next Steps

Once connected:
1. Create an admin account (first user)
2. Add doctors to the system
3. Configure HO tiers for your hospital
4. Set up teams and minimum staffing
5. Start generating rosters!

---

Need help? Check the [Supabase Docs](https://supabase.com/docs) or open an issue.
