import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

Deno.serve(async (req: Request) => {
  try {
    // Create Supabase client with service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase credentials');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Calculate date 3 days ago
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    const threeDaysAgoISO = threeDaysAgo.toISOString();

    console.log(`[Deactivate Users] Starting at ${new Date().toISOString()}`);
    console.log(`[Deactivate Users] Threshold: ${threeDaysAgoISO}`);

    // Deactivate users who haven't logged in for 3+ days
    // EXCLUDE admin role - admins always stay active
    const { data: deactivated, error } = await supabase
      .from('profiles')
      .update({ is_active: false })
      .lt('last_login', threeDaysAgoISO)
      .eq('is_active', true)
      .neq('role', 'admin')  // Exception: Never deactivate admin users
      .select('id, email, full_name, last_login, role');

    if (error) {
      console.error('[Deactivate Users] Error:', error);
      throw error;
    }

    const deactivatedCount = deactivated?.length || 0;
    console.log(`[Deactivate Users] Deactivated ${deactivatedCount} users`);
    
    if (deactivatedCount > 0) {
      console.log('[Deactivate Users] Deactivated users:', deactivated);
    }

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully deactivated ${deactivatedCount} inactive users`,
        deactivatedCount,
        deactivatedUsers: deactivated?.map(u => ({
          email: u.email,
          name: u.full_name || u.email,
          lastLogin: u.last_login,
          role: u.role
        })),
        timestamp: new Date().toISOString(),
        threshold: threeDaysAgoISO
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Connection': 'keep-alive'
        },
        status: 200
      }
    );

  } catch (error) {
    console.error('[Deactivate Users] Fatal error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Unknown error occurred',
        timestamp: new Date().toISOString()
      }),
      {
        headers: {
          'Content-Type': 'application/json'
        },
        status: 500
      }
    );
  }
});
