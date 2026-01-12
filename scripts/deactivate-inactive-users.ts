// Supabase scheduled function: Deactivate users not logged in for 3+ days
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function deactivateInactiveUsers() {
  const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
  // Set is_active = false for users not logged in for 3+ days
  const { error } = await supabase
    .from('profiles')
    .update({ is_active: false })
    .lt('last_login', threeDaysAgo)
    .eq('is_active', true);
  if (error) throw error;
}

// For local/manual run
if (require.main === module) {
  deactivateInactiveUsers().then(() => {
    console.log('Inactive users deactivated');
    process.exit(0);
  }).catch(e => {
    console.error(e);
    process.exit(1);
  });
}
