#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

config({ path: join(__dirname, '..', '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixMissingProfile() {
  console.log('🔧 Auto-fixing missing profile for opan.mozousha02@gmail.com\n');

  const userId = '72ec2e55-66dd-4334-bb87-cb6c09baacd7';
  const email = 'opan.mozousha02@gmail.com';

  const { data, error } = await supabase
    .from('profiles')
    .insert({
      id: userId,
      email,
      role: 'controller',
      full_name: 'Opan Mozousha',
      division: 'DEPLOYMENT',
      position: 'Staff',
      is_active: true,
      access: 'full'
    })
    .select()
    .single();

  if (error) {
    console.error('❌ Error:', error);
  } else {
    console.log('✅ Profile created!');
    console.log(JSON.stringify(data, null, 2));
  }
}

fixMissingProfile().catch(console.error);
