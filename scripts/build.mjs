import { mkdir, readFile, writeFile, copyFile, cp } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const dist = path.join(root, 'dist');
const assetsDir = path.join(dist, 'assets');
await mkdir(assetsDir, { recursive: true });
await mkdir(path.join(dist, 'legal'), { recursive: true });

const manifest = JSON.parse(await readFile(path.join(root, 'assets-manifest.json'), 'utf8'));
for (const [name, url] of Object.entries(manifest)) {
  const response = await fetch(url, { redirect: 'follow' });
  if (!response.ok) throw new Error(`Не удалось загрузить ${name}: ${response.status} ${response.statusText}`);
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.startsWith('image/')) throw new Error(`Вместо изображения ${name} получен ${contentType || 'неизвестный тип'}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  await writeFile(path.join(assetsDir, name), bytes);
  console.log(`asset ${name}: ${(bytes.length / 1024).toFixed(0)} KB`);
}

await copyFile(path.join(root, 'index.html'), path.join(dist, 'index.html'));
await copyFile(path.join(root, 'robots.txt'), path.join(dist, 'robots.txt'));
await cp(path.join(root, 'legal'), path.join(dist, 'legal'), { recursive: true });
console.log('Static site assembled in dist/');
