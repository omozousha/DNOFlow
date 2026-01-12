#!/usr/bin/env node

/**
 * Backend Migration Runner
 * Applies progress numbering removal migration to Supabase database
 */

import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing Supabase environment variables!');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function runMigration() {
  console.log('🚀 Starting Progress Numbering Removal Migration...\n');

  try {
    // Step 1: Check current state
    console.log('📊 Step 1: Checking current database state...');
    const { data: oldFormatProjects, error: checkError } = await supabase
      .from('projects')
      .select('progress')
      .or('progress.like.0%.%,progress.like.1%.%');

    if (checkError) {
      throw new Error(`Failed to check database: ${checkError.message}`);
    }

    const oldFormatCount = oldFormatProjects?.length || 0;
    console.log(`   Found ${oldFormatCount} projects with old numbering format`);

    if (oldFormatCount === 0) {
      console.log('✅ No migration needed - all projects already using new format!\n');
      return;
    }

    // Step 2: Show what will be updated
    console.log('\n📝 Step 2: Migration plan:');
    const uniqueOldValues = [...new Set(oldFormatProjects.map(p => p.progress))];
    uniqueOldValues.forEach(val => {
      const newVal = val.replace(/^\d{2}\.\s/, '');
      console.log(`   "${val}" → "${newVal}"`);
    });

    // Step 3: Apply migration
    console.log('\n🔧 Step 3: Applying migration...');
    
    const migrationMapping = {
      '00. PENDING / HOLD': 'PENDING / HOLD',
      '01. CREATED BOQ': 'CREATED BOQ',
      '02. CHECKED BOQ': 'CHECKED BOQ',
      '03. BEP': 'BEP',
      '04. APPROVED': 'APPROVED',
      '05. SPK SURVEY': 'SPK SURVEY',
      '06. SURVEY': 'SURVEY',
      '07. DRM': 'DRM',
      '08. APPROVED BOQ DRM': 'APPROVED BOQ DRM',
      '09. SPK': 'SPK',
      '10. MOS': 'MOS',
      '11. PERIZINAN': 'PERIZINAN',
      '12. CONST': 'CONST',
      '13. COMMTEST': 'COMMTEST',
      '14. UT': 'UT',
      '15. REKON': 'REKON',
      '16. BAST': 'BAST',
      '17. BALOP': 'BALOP',
      '18. DONE': 'DONE',
    };

    let updatedCount = 0;
    let errorCount = 0;

    for (const [oldValue, newValue] of Object.entries(migrationMapping)) {
      const { data: projectsToUpdate, error: selectError } = await supabase
        .from('projects')
        .select('id')
        .eq('progress', oldValue);

      if (selectError) {
        console.error(`   ❌ Error selecting "${oldValue}": ${selectError.message}`);
        errorCount++;
        continue;
      }

      if (projectsToUpdate && projectsToUpdate.length > 0) {
        const { error: updateError } = await supabase
          .from('projects')
          .update({ progress: newValue })
          .eq('progress', oldValue);

        if (updateError) {
          console.error(`   ❌ Error updating "${oldValue}": ${updateError.message}`);
          errorCount++;
        } else {
          updatedCount += projectsToUpdate.length;
          console.log(`   ✅ Updated ${projectsToUpdate.length} projects: "${oldValue}" → "${newValue}"`);
        }
      }
    }

    // Step 4: Verify migration
    console.log('\n🔍 Step 4: Verifying migration...');
    const { data: remainingOldFormat, error: verifyError } = await supabase
      .from('projects')
      .select('progress')
      .or('progress.like.0%.%,progress.like.1%.%');

    if (verifyError) {
      throw new Error(`Failed to verify migration: ${verifyError.message}`);
    }

    const remainingCount = remainingOldFormat?.length || 0;

    if (remainingCount === 0) {
      console.log('   ✅ All projects successfully migrated!\n');
    } else {
      console.log(`   ⚠️  Warning: ${remainingCount} projects still have old format\n`);
    }

    // Step 5: Summary
    console.log('📋 Migration Summary:');
    console.log(`   • Total updated: ${updatedCount} projects`);
    console.log(`   • Errors: ${errorCount}`);
    console.log(`   • Remaining old format: ${remainingCount}`);

    if (errorCount === 0 && remainingCount === 0) {
      console.log('\n✅ Migration completed successfully!\n');
    } else if (errorCount > 0) {
      console.log('\n⚠️  Migration completed with errors. Please check logs above.\n');
      process.exit(1);
    } else {
      console.log('\n⚠️  Migration incomplete. Some projects still use old format.\n');
      process.exit(1);
    }

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    process.exit(1);
  }
}

// Run migration
runMigration();
