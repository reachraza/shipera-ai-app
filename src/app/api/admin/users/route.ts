import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const { email, password, role, orgId } = await request.json();

        if (!email || !password || !role || !orgId) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Must use Service Role key to bypass RLS and create users on behalf of others
        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // 1. Create the user in Supabase Auth
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true, // Auto confirm so they can login immediately
            user_metadata: {
                // Skip the normal trigger creation logic by passing a flag
                created_by_admin: true,
            }
        });

        if (authError) {
            return NextResponse.json({ error: authError.message }, { status: 400 });
        }

        const newUserId = authData.user.id;

        // 2. Insert into our public.users table linking them to the active orgId
        const { error: insertError } = await supabaseAdmin
            .from('users')
            .insert({
                id: newUserId,
                org_id: orgId,
                role: role,
                email: email,
            });

        if (insertError) {
            // Rollback auth user creation if public profile fails
            await supabaseAdmin.auth.admin.deleteUser(newUserId);
            return NextResponse.json({ error: insertError.message }, { status: 500 });
        }

        return NextResponse.json({ message: 'User created successfully' });

    } catch (error: any) {
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
}
