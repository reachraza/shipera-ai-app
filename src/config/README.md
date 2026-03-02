# Database Configurations

This folder contains the SQL scripting required to set up the Supabase database. 

Over time as new features (like Role Based Access Control, Magic Invite Links, RFP Bidding, and Status Management) were added, multiple migration scripts were created. 

**These have now all been consolidated for your convenience.** 

## Execution Instructions
If you are setting up a brand new Supabase project, or completely resetting your current database workspace, you only need to run **one** script in the Supabase SQL Editor:

1. **`00_master_schema.sql`**: This includes the entire base structure (all tables including `users`, `organizations`, `carriers`, `rfps`, `bids`, etc.), comprehensive Row Level Security (RLS) policies, Custom Auth Triggers for automatic matching to organizations, and Role-Based Access controls.

If you make a mistake and need to wipe your database clean to start over, you can drop all tables and then run `00_master_schema.sql` again!
