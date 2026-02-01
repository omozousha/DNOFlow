#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

config({ path: join(__dirname, '..', '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function createProfile() {
  console.log('📝 Create Profile for User\n');

  const userId = await question('Enter User ID: ');
  
  // Verify user exists
  const { data: { user }, error: userError } = await supabase.auth.admin.getUserById(userId);
  
  if (userError || !user) {
    console.error('❌ User not found!');
    rl.close();
    return;
  }

  console.log(`\n✅ Found user: ${user.email}\n`);

  const email = user.email;
  const fullName = await question('Full Name: ');
  
  console.log('\nRole options:');
  console.log('1. admin');
  console.log('2. owner');
  console.log('3. controller');
  const roleChoice = await question('Choose role (1-3): ');
  const role = roleChoice === '1' ? 'admin' : roleChoice === '2' ? 'owner' : 'controller';

  console.log('\nDivision options:');
  console.log('1. PLANNING');
  console.log('2. DEPLOYMENT');
  console.log('3. OPERATIONS');
  const divChoice = await question('Choose division (1-3): ');
  const division = divChoice === '1' ? 'PLANNING' : divChoice === '2' ? 'DEPLOYMENT' : 'OPERATIONS';

  const position = await question('Position (e.g., Manager, Staff): ');

  console.log('\nAccess options:');
  console.log('1. full (can CRUD)');
  console.log('2. readonly (can only view)');
  const accessChoice = await question('Choose access (1-2): ');
  const access = accessChoice === '1' ? 'full' : 'readonly';

  // Create profile
  const { data, error } = await supabase
    .from('profiles')
    .insert({
      id: userId,
      email,
      role,
      full_name: fullName,
      division,
      position,
      is_active: true,
      access
    })
    .select()
    .single();

  if (error) {
    console.error('\n❌ Error creating profile:', error);
  } else {
    console.log('\n✅ Profile created successfully!');
    console.log(JSON.stringify(data, null, 2));
  }

  rl.close();
}

createProfile().catch(console.error);
