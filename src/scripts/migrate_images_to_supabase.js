require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

const LOCAL_IMAGES_ROOT = path.resolve(__dirname, '../../../innotek-backend-OLD/public/frontend/images');

const BUCKETS = [
  'banners',
  'categories',
  'products',
  'blogs',
  'brands',
  'services',
  'pages',
  'testimonials',
  'projects',
  'catalogues'
];

async function ensureBucketsExist() {
  console.log('--- 1. Provisioning Supabase Storage Public Buckets ---');
  const { data: existingBuckets, error: listErr } = await supabase.storage.listBuckets();
  if (listErr) {
    console.error('Failed to list buckets:', listErr.message);
    throw listErr;
  }

  const existingNames = (existingBuckets || []).map(b => b.name);

  for (const bucket of BUCKETS) {
    if (!existingNames.includes(bucket)) {
      const { data, error } = await supabase.storage.createBucket(bucket, {
        public: true,
        fileSizeLimit: 52428800 // 50MB limit
      });
      if (error) {
        console.log(`  - Bucket '${bucket}': Error creating (${error.message})`);
      } else {
        console.log(`  ✓ Bucket '${bucket}' created (public: true)`);
      }
    } else {
      console.log(`  ✓ Bucket '${bucket}' already exists (public: true)`);
    }
  }
}

function getContentType(filename) {
  const ext = path.extname(filename).toLowerCase();
  if (ext === '.webp') return 'image/webp';
  if (ext === '.png') return 'image/png';
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
  if (ext === '.svg') return 'image/svg+xml';
  if (ext === '.gif') return 'image/gif';
  if (ext === '.pdf') return 'application/pdf';
  return 'application/octet-stream';
}

async function uploadFolder(folderName) {
  const folderPath = path.join(LOCAL_IMAGES_ROOT, folderName);
  if (!fs.existsSync(folderPath)) {
    console.log(`  - Folder '${folderName}' not present locally (0 files).`);
    return { folder: folderName, localCount: 0, uploadedCount: 0, sampleFiles: [] };
  }

  const files = fs.readdirSync(folderPath);
  let uploadedCount = 0;
  const sampleFiles = [];

  for (const file of files) {
    const filePath = path.join(folderPath, file);
    const stat = fs.statSync(filePath);
    if (!stat.isFile()) continue;

    let fileBuffer = fs.readFileSync(filePath);
    let targetFilename = file;
    let contentType = getContentType(file);

    // If image is JPG/PNG and not WebP, convert to WebP for standard
    const ext = path.extname(file).toLowerCase();
    if (['.jpg', '.jpeg', '.png'].includes(ext)) {
      try {
        fileBuffer = await sharp(fileBuffer).webp({ quality: 85 }).toBuffer();
        targetFilename = `${path.parse(file).name}.webp`;
        contentType = 'image/webp';
      } catch (convErr) {
        console.warn(`    Warning: Could not convert ${file} to webp, uploading raw:`, convErr.message);
      }
    }

    const { data, error } = await supabase.storage
      .from(folderName)
      .upload(targetFilename, fileBuffer, {
        contentType,
        upsert: true
      });

    if (error) {
      console.error(`    [ERROR] Failed to upload ${targetFilename} to ${folderName}:`, error.message);
    } else {
      uploadedCount++;
      if (sampleFiles.length < 3) {
        sampleFiles.push(targetFilename);
      }
    }
  }

  return {
    folder: folderName,
    localCount: files.length,
    uploadedCount,
    sampleFiles
  };
}

async function runImageMigration() {
  console.log('================================================================');
  console.log('STARTING SUPABASE STORAGE IMAGE MIGRATION');
  console.log('================================================================\n');

  await ensureBucketsExist();

  console.log('\n--- 2. Uploading Assets Folder-by-Folder to Supabase Storage ---');
  const migrationResults = [];

  for (const bucket of BUCKETS) {
    console.log(`> Processing bucket '${bucket}'...`);
    const res = await uploadFolder(bucket);
    migrationResults.push(res);
    console.log(`  ✓ Bucket '${bucket}': Local Files=${res.localCount} | Uploaded=${res.uploadedCount}`);
  }

  // 3. Query sample bucket listings from Supabase to verify live access
  console.log('\n--- 3. Verifying Live Storage Bucket Listings from Supabase ---');
  for (const res of migrationResults) {
    const { data: remoteFiles, error } = await supabase.storage.from(res.folder).list('', { limit: 5 });
    if (error) {
      console.log(`  - Bucket '${res.folder}': Error listing (${error.message})`);
    } else {
      const fileNames = (remoteFiles || []).map(f => f.name).filter(n => n !== '.emptyFolderPlaceholder');
      res.supabaseRemoteCount = fileNames.length;
      res.liveSamples = fileNames.slice(0, 3);
      console.log(`  ✓ Bucket '${res.folder}' (${remoteFiles.length} remote files) | Sample items: ${fileNames.slice(0, 3).join(', ') || 'None (Empty)'}`);
    }
  }

  console.log('\n================================================================');
  console.log('IMAGE MIGRATION SUMMARY:');
  console.log('================================================================');
  console.log('| Bucket Name    | Local Files | Uploaded to Supabase | Sample Remote Filenames                           |');
  console.log('|----------------|-------------|----------------------|---------------------------------------------------|');
  let totalLocal = 0;
  let totalUploaded = 0;
  for (const r of migrationResults) {
    totalLocal += r.localCount;
    totalUploaded += r.uploadedCount;
    const bName = r.folder.padEnd(14, ' ');
    const lCount = r.localCount.toString().padEnd(11, ' ');
    const uCount = r.uploadedCount.toString().padEnd(20, ' ');
    const sampleStr = (r.liveSamples && r.liveSamples.length > 0 ? r.liveSamples.join(', ') : 'None').slice(0, 49).padEnd(49, ' ');
    console.log(`| ${bName} | ${lCount} | ${uCount} | ${sampleStr} |`);
  }
  console.log('|----------------|-------------|----------------------|---------------------------------------------------|');
  console.log(`| TOTAL          | ${totalLocal.toString().padEnd(11, ' ')} | ${totalUploaded.toString().padEnd(20, ' ')} | All assets stored in public CDN buckets           |`);
  console.log('================================================================');

  fs.writeFileSync(
    'C:/Users/Tusha/.gemini/antigravity-ide/brain/1d5efebe-de41-4904-bffa-fbaf34f956a4/scratch/image_migration_summary.json',
    JSON.stringify(migrationResults, null, 2)
  );
}

runImageMigration().catch(console.error);
