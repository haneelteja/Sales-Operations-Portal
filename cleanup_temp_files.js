#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

// List of temporary files to remove
const tempFiles = [
  // Test HTML files
  'check_user.html',
  'check_user_management_schema.html',
  'confirm_email.html',
  'create_test_user.html',
  'debug_reset_flow.html',
  'disable_rls_completely.html',
  'final_rls_fix.html',
  'fix_all_user_management_constraints.html',
  'fix_orders_table_schema_and_sorting.html',
  'fix_rls_completely.html',
  'fix_supabase_redirect.html',
  'fix_user_management_adaptive.html',
  'fix_user_management_any_schema.html',
  'fix_user_management_comprehensive.html',
  'fix_user_management_correct.html',
  'fix_user_management_final.html',
  'fix_user_management_foreign_key.html',
  'fix_user_management_simple.html',
  'fix_user_management_simple_final.html',
  'fix_user_management_step2_adaptive.html',
  'setup_user_management.html',
  'setup_user_management_simple.html',
  'test_application_final.html',
  'test_database_final.html',
  'test_database_setup.html',
  'test_password_reset.html',
  'test_real_reset.html',
  'test_reset_flow.html',
  'test_supabase_reset.html',
  'test_user_insert.html',
  'ultimate_rls_fix.html',
  'ultimate_rls_fix_v2.html',
  
  // Temporary SQL files
  'check_factory_pricing_detailed.sql',
  'check_factory_pricing_schema.sql',
  'check_user_management_schema.sql',
  'complete_database_fix_final.sql',
  'complete_database_fix_simple.sql',
  'complete_database_setup_final.sql',
  'complete_database_setup_fixed.sql',
  'complete_database_setup_safe.sql',
  'create_and_populate_user_management.html',
  'create_and_populate_user_management.sql',
  'create_user_management_table.sql',
  'fix_all_tables_schema.sql',
  'fix_all_user_management_constraints.sql',
  'fix_factory_pricing_final.sql',
  'fix_factory_pricing_schema.sql',
  'fix_orders_table_schema_and_sorting.sql',
  'fix_user_management_adaptive.sql',
  'fix_user_management_comprehensive.sql',
  'fix_user_management_correct.sql',
  'fix_user_management_foreign_key.sql',
  'fix_user_management_simple.sql',
  'fix_user_management_step2_corrected.sql',
  'setup_new_database.sql',
  'test_user_management.sql',
  
  // Temporary JS files
  'force_config_update.js',
  'cleanup_unused_files.js',
  'cleanup_temp_files.js'
];

// Files to keep (important ones)
const keepFiles = [
  'index.html',
  'eslint.config.js',
  'postcss.config.js',
  'complete_database_setup_safe.sql', // Keep the working database setup
  'test_database_final.html' // Keep the working test file
];

console.log('🧹 Starting cleanup of temporary files...\n');

let deletedCount = 0;
let errorCount = 0;

tempFiles.forEach(file => {
  if (keepFiles.includes(file)) {
    console.log(`⏭️  Skipping ${file} (marked to keep)`);
    return;
  }
  
  try {
    if (fs.existsSync(file)) {
      fs.unlinkSync(file);
      console.log(`✅ Deleted ${file}`);
      deletedCount++;
    } else {
      console.log(`⚠️  File not found: ${file}`);
    }
  } catch (error) {
    console.error(`❌ Error deleting ${file}:`, error.message);
    errorCount++;
  }
});

console.log(`\n📊 Cleanup Summary:`);
console.log(`✅ Files deleted: ${deletedCount}`);
console.log(`❌ Errors: ${errorCount}`);
console.log(`⏭️  Files kept: ${keepFiles.length}`);

if (errorCount === 0) {
  console.log('\n🎉 Cleanup completed successfully!');
} else {
  console.log('\n⚠️  Cleanup completed with some errors.');
}






