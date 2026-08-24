import fs from 'fs';
import path from 'path';
import archiver from 'archiver';

const outputZipPath = path.join(process.cwd(), 'unthinkable-healthcare-appointment-manager.zip');
const output = fs.createWriteStream(outputZipPath);
const archive = archiver('zip', { zlib: { level: 9 } });

output.on('close', function () {
  console.log(`✅ Deliverable Zip Archive created successfully!`);
  console.log(`📦 File: ${outputZipPath}`);
  console.log(`📊 Size: ${(archive.pointer() / 1024 / 1024).toFixed(2)} MB`);
});

archive.on('error', function (err) {
  throw err;
});

archive.pipe(output);

// Ignore heavy or temporary build artifacts
const ignoreList = [
  'node_modules',
  'dev.db',
  'dev.db-journal',
  'dist',
  '.git',
  '.DS_Store',
  'unthinkable-healthcare-appointment-manager.zip',
];

function addDirectoryToZip(dirPath, zipPath = '') {
  const items = fs.readdirSync(dirPath);

  for (const item of items) {
    if (ignoreList.includes(item)) continue;

    const fullPath = path.join(dirPath, item);
    const relativeZipPath = path.join(zipPath, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      addDirectoryToZip(fullPath, relativeZipPath);
    } else {
      archive.file(fullPath, { name: relativeZipPath });
    }
  }
}

console.log('📦 Packaging clean source code into deliverable zip archive...');
addDirectoryToZip(process.cwd());
archive.finalize();
