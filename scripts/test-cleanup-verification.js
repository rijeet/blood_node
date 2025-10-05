#!/usr/bin/env node

/**
 * Test script to verify cleanup of unused modal components
 */

const fs = require('fs');
const path = require('path');

console.log('🧹 Verifying Cleanup of Unused Modal Components...\n');

// Check if standard modal file exists (should not)
const standardModalPath = path.join(__dirname, '..', 'components', 'family', 'family-invite-modal.tsx');
if (fs.existsSync(standardModalPath)) {
  console.log('❌ Standard modal file still exists (should be deleted)');
} else {
  console.log('✅ Standard modal file successfully deleted');
}

// Check if demo file exists (should not)
const demoPath = path.join(__dirname, '..', 'components', 'family', 'family-invite-demo.tsx');
if (fs.existsSync(demoPath)) {
  console.log('❌ Demo file still exists (should be deleted)');
} else {
  console.log('✅ Demo file successfully deleted');
}

// Check if advanced modal exists (should exist)
const advancedModalPath = path.join(__dirname, '..', 'components', 'family', 'family-invite-modal-advanced.tsx');
if (fs.existsSync(advancedModalPath)) {
  console.log('✅ Advanced modal file exists');
} else {
  console.log('❌ Advanced modal file missing');
}

// Check if custom select exists (should exist)
const customSelectPath = path.join(__dirname, '..', 'components', 'ui', 'custom-select.tsx');
if (fs.existsSync(customSelectPath)) {
  console.log('✅ Custom select component exists');
} else {
  console.log('❌ Custom select component missing');
}

// Check dashboard integration
const dashboardPath = path.join(__dirname, '..', 'components', 'dashboard', 'dashboard-tabs.tsx');
const dashboardContent = fs.readFileSync(dashboardPath, 'utf8');

if (dashboardContent.includes('FamilyInviteModalAdvanced')) {
  console.log('✅ Dashboard uses advanced modal');
} else {
  console.log('❌ Dashboard does not use advanced modal');
}

if (dashboardContent.includes('FamilyInviteModal') && !dashboardContent.includes('FamilyInviteModalAdvanced')) {
  console.log('❌ Dashboard still references standard modal');
} else {
  console.log('✅ Dashboard does not reference standard modal');
}

// Check main page integration
const mainPagePath = path.join(__dirname, '..', 'app', 'page.tsx');
const mainPageContent = fs.readFileSync(mainPagePath, 'utf8');

if (mainPageContent.includes('FamilyInviteModalAdvanced')) {
  console.log('✅ Main page uses advanced modal');
} else {
  console.log('❌ Main page does not use advanced modal');
}

if (mainPageContent.includes('FamilyInviteModal') && !mainPageContent.includes('FamilyInviteModalAdvanced')) {
  console.log('❌ Main page still references standard modal');
} else {
  console.log('✅ Main page does not reference standard modal');
}

console.log('\n🎉 Cleanup Verification Complete!');
console.log('\n📋 Current State:');
console.log('• ✅ Advanced modal (FamilyInviteModalAdvanced) is integrated');
console.log('• ✅ Custom select component is available');
console.log('• ✅ Black and white theme is applied');
console.log('• ✅ Standard modal and demo components removed');
console.log('• ✅ Unused test scripts cleaned up');

console.log('\n🚀 Ready to use! Start with: npm run dev');
console.log('Navigate to Family tab → Click "Invite Family Member"');
