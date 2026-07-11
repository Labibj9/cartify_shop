const mongoose = require('mongoose');
require('dotenv').config();

// predicate-based matches (avoid generic tokens like 'oled' alone)
const EXPLICIT_MATCHES = [
  { test: (t) => t.includes('1984'), file: '1984-1771918494375-845672985.webp' },
  { test: (t) => t.includes('lg') && t.includes('oled'), file: 'oled lg-1771927754205-75102863.jpg' },
  { test: (t) => t.includes('qled'), file: 'qled samsung-1771918340191-701856636.webp' },
  { test: (t) => t.includes('sapiens'), file: 'sapirens-1771918461135-257357834.webp' },
];

const explicitFiles = new Set(EXPLICIT_MATCHES.map((m) => m.file));
const usedFiles = new Set();

const sourceFallback = (title) =>
  `https://source.unsplash.com/400x400/?${encodeURIComponent(title)}`;

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/mern-ecommerce');
  const Product = require('../models/Product');
  const products = await Product.find({});

  let synced = 0;
  let assigned = 0;
  let corrected = 0;

  for (const p of products) {
    const img = p.image || '';

    // Undo any explicit file wrongly attached to a product that doesn't satisfy its predicate
    if (img.startsWith('/uploads/') && explicitFiles.has(img.replace('/uploads/', ''))) {
      const m = EXPLICIT_MATCHES.find((x) => x.file === img.replace('/uploads/', ''));
      if (m && !m.test((p.title || '').toLowerCase())) {
        p.image = '';
        p.images = [{ url: sourceFallback(p.title || ''), public_id: p.images?.[0]?.public_id || null }];
        await p.save();
        corrected++;
        console.log(`Corrected wrong match on ${p.title}`);
      }
    }

    const img2 = p.image || '';
    if (img2.startsWith('/uploads/')) {
      usedFiles.add(img2.replace('/uploads/', ''));
      if (!p.images || !p.images.length || p.images[0].url !== img2) {
        p.images = [{ url: img2, public_id: p.images?.[0]?.public_id || null }];
        await p.save();
        synced++;
      }
      continue;
    }

    const title = (p.title || '').toLowerCase();
    const match = EXPLICIT_MATCHES.find((m) => !usedFiles.has(m.file) && m.test(title));
    if (match) {
      usedFiles.add(match.file);
      const url = `/uploads/${match.file}`;
      p.image = url;
      p.images = [{ url, public_id: p.images?.[0]?.public_id || null }];
      await p.save();
      assigned++;
      console.log(`Assigned ${match.file} -> ${p.title}`);
    }
  }

  console.log(`\nDone. Corrected ${corrected}, synced ${synced}, assigned ${assigned}.`);
  process.exit(0);
};

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
