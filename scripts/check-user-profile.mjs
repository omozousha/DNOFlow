#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env.local from root
config({ path: join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing environment variables!');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseKey ? '✅' : '❌');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkProfiles() {
  console.log('🔍 Checking all auth users and their profiles...\n');

  // Get all auth users
  const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();
  
  if (authError) {
    console.error('❌ Error fetching users:', authError);
    return;
  }

  console.log(`Found ${users.length} auth users:\n`);

  for (const user of users) {
    console.log(`👤 User: ${user.email}`);
    console.log(`   ID: ${user.id}`);
    console.log(`   Created: ${new Date(user.created_at).toLocaleString()}`);
    console.log(`   Last Sign In: ${user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : 'Never'}`);

    // Check if profile exists
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError) {
      if (profileError.code === 'PGRST116') {
        console.log(`   ⚠️  NO PROFILE FOUND - User cannot login!`);
      } else {
        console.log(`   ❌ Error: ${profileError.message}`);
      }
    } else {
      console.log(`   ✅ Profile exists:`);
      console.log(`      Role: ${profile.role}`);
      console.log(`      Full Name: ${profile.full_name || '(not set)'}`);
      console.log(`      Division: ${profile.division || '(not set)'}`);
      console.log(`      Active: ${profile.is_active ? 'Yes' : 'No'}`);
    }
    console.log('');
  }
}

checkProfiles().catch(console.error);
