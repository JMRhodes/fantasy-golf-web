import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.join(__dirname, '../public/images/players');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// GraphQL endpoint
const GRAPHQL_ENDPOINT = process.env.PUBLIC_GRAPHQL_ENDPOINT || 'http://localhost:3000/graphql';

// Fetch all unique player IDs from your API
async function fetchAllPlayerIds() {
  const query = `
    query {
      getAllPlayers {
        pgaId
      }
    }
  `;

  const response = await fetch(GRAPHQL_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  });

  const data = await response.json();

  // Get unique pgaIds (filter out nulls and duplicates)
  const pgaIds = [...new Set(
    data.data.getAllPlayers
      .map(p => p.pgaId)
      .filter(id => id != null)
  )];

  return pgaIds;
}

// Download a single image
async function downloadImage(pgaId) {
  const filename = `${pgaId}.webp`;
  const filepath = path.join(OUTPUT_DIR, filename);

  // Skip if already exists
  if (fs.existsSync(filepath)) {
    console.log(`⏭️  Skipping ${pgaId} (already exists)`);
    return;
  }

  const url = `https://pga-tour-res.cloudinary.com/image/upload/c_thumb,g_face,z_0.7,q_auto,f_auto,dpr_2.0,w_80,h_80,b_rgb:F2F2F2,d_stub:default_avatar_light.webp/headshots_${pgaId}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.log(`❌ Failed to download ${pgaId}: ${response.status}`);
      return;
    }

    const buffer = await response.arrayBuffer();
    fs.writeFileSync(filepath, Buffer.from(buffer));
    console.log(`✅ Downloaded ${pgaId}`);
  } catch (error) {
    console.error(`❌ Error downloading ${pgaId}:`, error.message);
  }
}

// Main function
async function main() {
  console.log('🏌️  Fetching player list...');
  const playerIds = await fetchAllPlayerIds();
  console.log(`Found ${playerIds.length} unique players\n`);

  console.log('⬇️  Downloading images...');

  // Download with concurrency limit to avoid overwhelming the server
  const concurrency = 5;
  for (let i = 0; i < playerIds.length; i += concurrency) {
    const batch = playerIds.slice(i, i + concurrency);
    await Promise.all(batch.map(id => downloadImage(id)));
  }

  console.log('\n✨ Done!');
}

main().catch(console.error);
