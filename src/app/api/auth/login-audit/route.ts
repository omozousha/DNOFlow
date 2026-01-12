// API route for login audit log
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Simple API key validation (untuk internal use saja)
const AUDIT_API_KEY = process.env.AUDIT_API_KEY || 'default-audit-key-change-me';

export async function POST(request: Request) {
  try {
    // Validate API key from header
    const apiKey = request.headers.get('x-audit-api-key');
    if (apiKey !== AUDIT_API_KEY) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { userId, email, success, message } = await request.json();

    // Email is required even if userId is null (for failed logins)
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Only log if userId exists (successful login)
    if (userId) {
      const { error } = await supabase
        .from('profiles_audit_log')
        .insert({
          profile_id: userId,
          action: success ? 'login_success' : 'login_failed',
          new_data: { email, message },
          changed_at: new Date().toISOString(),
        });

      if (error) {
        // Log error but don't fail the request
        console.error('[Audit API] Error logging to database:', error);
      }
    }

    return NextResponse.json({ status: 'ok' });
  } catch (err) {
    console.error('[Audit API] Unexpected error:', err);
    return NextResponse.json(
      { error: 'Unexpected error' },
      { status: 500 }
    );
  }
}
