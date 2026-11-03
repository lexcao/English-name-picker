import { readFile, mkdir, writeFile, readdir, unlink } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { inflateRawSync } from 'node:zlib';

// Read the ZIP central directory, including archives with data descriptors.
function nationalFiles(zip) {
  let end = zip.length - 22;
  while (end >= Math.max(0, zip.length - 65557) && zip.readUInt32LE(end) !== 0x06054b50) end--;
  if (end < 0 || zip.readUInt32LE(end) !== 0x06054b50) throw new Error('Invalid ZIP directory');
  const files = {};
  let offset = zip.readUInt32LE(end + 16);
  const count = zip.readUInt16LE(end + 10);
  for (let i = 0; i < count; i++) {
    if (zip.readUInt32LE(offset) !== 0x02014b50) throw new Error('Invalid ZIP entry');
    const flags = zip.readUInt16LE(offset + 8);
    const method = zip.readUInt16LE(offset + 10);
    const size = zip.readUInt32LE(offset + 20);
    const unpacked = zip.readUInt32LE(offset + 24);
    const length = zip.readUInt16LE(offset + 28);
    const name = zip.toString('utf8', offset + 46, offset + 46 + length);
    if (/(?:^|\/)yob\d{4}\.txt$/.test(name)) {
      if (flags & 1) throw new Error('Encrypted ZIP entries are unsupported');
      const local = zip.readUInt32LE(offset + 42);
      if (zip.readUInt32LE(local) !== 0x04034b50) throw new Error('Invalid local ZIP entry');
      const start = local + 30 + zip.readUInt16LE(local + 26) + zip.readUInt16LE(local + 28);
      const compressed = zip.subarray(start, start + size);
      const data = method === 0 ? compressed : method === 8 ? inflateRawSync(compressed) : null;
      if (!data || data.length !== unpacked) throw new Error('Unsupported or truncated ZIP entry');
      files[name] = data.toString('utf8');
    }
    offset += 46 + length + zip.readUInt16LE(offset + 30) + zip.readUInt16LE(offset + 32);
  }
  return files;
}
const archive = resolve(process.argv[2] ?? 'data/raw/names.zip');
const output = fileURLToPath(new URL('../public/data/', import.meta.url));
const files = nationalFiles(await readFile(archive));
const datasets = [];
for (const [path, bytes] of Object.entries(files)) {
  const year = Number(path.match(/yob(\d{4})\.txt$/)[1]);
  const groups = { male: [], female: [] };
  for (const line of bytes.trim().split(/\r?\n/)) {
    const [name, sex, count] = line.split(',');
    const gender = sex === 'M' ? 'male' : sex === 'F' ? 'female' : null;
    const occurrences = Number(count);
    if (!name || !gender || !Number.isSafeInteger(occurrences) || occurrences <= 0) throw new Error(`Invalid SSA row: ${line}`);
    groups[gender].push({ name, gender, occurrences });
  }
  for (const [gender, rows] of Object.entries(groups)) {
    if (!rows.length) throw new Error(`Missing ${gender} for ${year}`);
    rows.sort((a, b) => b.occurrences - a.occurrences);
    datasets.push({ year, gender, rows: rows.slice(0, 1000).map((row, i) => ({ ...row, rank: i + 1 })) });
  }
}
if (!datasets.length) throw new Error('No national SSA yobYYYY.txt files found');
const years = [...new Set(datasets.map(d => d.year))].sort((a, b) => a - b);
for (let y = years[0]; y <= years.at(-1); y++) if (!years.includes(y)) throw new Error(`Missing year ${y}`);
await mkdir(output, { recursive: true });
for (const file of await readdir(output)) if (/^\d{4}-(male|female)\.json$/.test(file)) await unlink(resolve(output, file));
for (const { year, gender, rows } of datasets) await writeFile(resolve(output, `${year}-${gender}.json`), JSON.stringify(rows) + '\n');
await writeFile(resolve(output, 'meta.json'), JSON.stringify({ source: 'U.S. Social Security Administration, national baby names (names.zip)', url: 'https://www.ssa.gov/oact/babynames/limits.html', years: [years[0], years.at(-1)], generatedAt: new Date().toISOString() }, null, 2) + '\n');
console.log(`Generated ${datasets.length} datasets (${years[0]}–${years.at(-1)})`);
