require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function removeOrphanedBannerImage() {
  const orphanFile = 'f30a5b06-fbf8-4380-a37e-35a6ce878566.webp';
  console.log(`1. Deleting orphaned image '${orphanFile}' from 'banners' bucket...`);
  
  const { data, error } = await supabase.storage.from('banners').remove([orphanFile]);
  if (error) {
    console.error('Failed to remove:', error.message);
  } else {
    console.log('✓ Successfully removed orphaned file:', data);
  }

  console.log('\n2. Listing current files in Supabase Storage "banners" bucket:');
  const { data: files, error: listErr } = await supabase.storage.from('banners').list('', { limit: 100 });
  if (listErr) {
    console.error('List error:', listErr.message);
  } else {
    const validFiles = files.filter(f => f.name !== '.emptyFolderPlaceholder');
    console.log(`Total files in 'banners' bucket: ${validFiles.length} (Expected: 15)`);
    console.log('Files:');
    validFiles.forEach((f, i) => console.log(`  ${i + 1}. ${f.name}`));
  }
}

removeOrphanedBannerImage().catch(console.error);
