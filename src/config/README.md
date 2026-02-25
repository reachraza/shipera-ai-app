# Database Configurations

This folder contains the SQL scripts required to set up the Supabase database. 

Because we added new features (like Role Based Access Control and Magic Invite Links) over time, the database scripts need to be run in the correct chronological order.

I have renamed the scripts so you know exactly which one to run first to last.

## Execution Order
If you are setting up a brand new Supabase project, or completely resetting your database, you must run these scripts in the Supabase SQL Editor in this exact order:

1. **`01_schema.sql`**: The base structure. Creates all tables (`users`, `organizations`, `carriers`, `rfps`, etc.) and basic RLS policies.
2. **`02_rbac_update.sql`**: Updates Row Level Security (RLS) to ensure only Admins can create or delete Carriers.
3. **`03_teams_rbac_update.sql`**: Adds the `supervisor` role and restricts User Management exclusively to Admins.
4. **`04_setup_auth_trigger.sql`**: The initial version of the trigger that automatically creates an organization when a user signs up.
5. **`05_trigger_update.sql`**: An upgrade to the trigger that adds support for Magic Invite Links (reading `invited_org_id`).
6. **`06_force_password_update.sql`**: The final upgrade that forces newly invited users to change their automatically generated temporary passwords immediately upon login.

> **Note**: If you already ran `trigger_update.sql` earlier, you only need to run the newest script: `06_force_password_update.sql`. 

If you make a mistake and need to wipe your database clean to start over, you can drop all tables and then run 1 through 6 in order!
