import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'docs/sites-source-manifest.json'), 'utf8'));
for (const file of manifest.files) {
  const target = path.join(root, manifest.target_directory, file.path);
  const bytes = fs.readFileSync(target);
  const digest = createHash('sha256').update(bytes).digest('hex');
  if (digest !== file.sha256 || bytes.length !== file.bytes) throw Error(`Sites source differs: ${file.path}`);
}
console.log(`${manifest.files.length} files match Sites version ${manifest.site_version} (${manifest.site_source_commit}).`);
