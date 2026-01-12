import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// Service role client untuk admin operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Validate environment variables
if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables:', {
    url: !!supabaseUrl,
    serviceKey: !!supabaseServiceKey
  });
}

const supabaseAdmin = createClient(
  supabaseUrl!,
  supabaseServiceKey!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// DELETE user
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Check service role key
    if (!supabaseServiceKey) {
      console.error('SUPABASE_SERVICE_ROLE_KEY not set in environment');
      return NextResponse.json(
        { error: 'Server configuration error: Missing service role key' },
        { status: 500 }
      );
    }

    const { id } = await context.params;

    // Verify user is admin (check dari session)
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Delete user menggunakan admin API
    const { error } = await supabaseAdmin.auth.admin.deleteUser(id);

    if (error) {
      console.error('Error deleting user:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Server error in DELETE:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH user (update)
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Check service role key
    if (!supabaseServiceKey) {
      console.error('SUPABASE_SERVICE_ROLE_KEY not set in environment');
      return NextResponse.json(
        { error: 'Server configuration error: Missing service role key' },
        { status: 500 }
      );
    }

    const { id } = await context.params;
    const body = await request.json();

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      console.error('Invalid UUID format:', id);
      return NextResponse.json({ error: 'Invalid user ID format' }, { status: 400 });
    }

    // Verify user is admin
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user exists in auth.users first
    let userExistsInAuth = false;
    try {
      const { data: authUser, error: getUserError } = await supabaseAdmin.auth.admin.getUserById(id);
      if (!getUserError && authUser) {
        userExistsInAuth = true;
      }
    } catch (err) {
      // User not in auth.users, will only update profile
    }

    // 1. Update email di auth.users jika ada dan user exists
    if (body.email && userExistsInAuth) {
      try {
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.updateUserById(
          id,
          { email: body.email }
        );
        
        if (authError) {
          console.error('Error updating auth email:', authError);
          return NextResponse.json({ error: `Failed to update email: ${authError.message}` }, { status: 400 });
        }
      } catch (authUpdateError) {
        console.error('Exception updating auth email:', authUpdateError);
        return NextResponse.json({ error: 'Failed to update email in auth system' }, { status: 500 });
      }
    }

    // 2. Update profile data
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({
        full_name: body.full_name,
        role: body.role,
        division: body.division,
        position: body.position,
        is_active: body.is_active
      })
      .eq('id', id);

    if (profileError) {
      console.error('Error updating profile:', profileError);
      return NextResponse.json({ error: profileError.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Server error in PATCH:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
