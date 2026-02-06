import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PLAYERS_DIR = path.join(__dirname, '../public/images/players');
const TOURNAMENTS_DIR = path.join(__dirname, '../public/images/tournaments');

// Ensure output directories exist
if (!fs.existsSync(PLAYERS_DIR)) {
  fs.mkdirSync(PLAYERS_DIR, { recursive: true });
}
if (!fs.existsSync(TOURNAMENTS_DIR)) {
  fs.mkdirSync(TOURNAMENTS_DIR, { recursive: true });
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

// Fetch all tournaments with avatarUrls
async function fetchAllTournaments() {
  const query = `
    query {
      getAllTournaments {
        id
        avatarUrl
      }
    }
  `;

  const response = await fetch(GRAPHQL_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  });

  const data = await response.json();

  // Get tournaments with avatarUrls
  const tournaments = (data.data.getAllTournaments || [])
    .filter(t => t.avatarUrl)
    .map(t => ({ id: t.id, url: t.avatarUrl }));

  return tournaments;
}

// Download a single player image
async function downloadPlayerImage(pgaId) {
  const filename = `${pgaId}.webp`;
  const filepath = path.join(PLAYERS_DIR, filename);

  // Skip if already exists
  if (fs.existsSync(filepath)) {
    console.log(`⏭️  Skipping player ${pgaId} (already exists)`);
    return;
  }

  const url = `https://pga-tour-res.cloudinary.com/image/upload/c_thumb,g_face,z_0.7,q_auto,f_auto,dpr_2.0,w_80,h_80,b_rgb:F2F2F2,d_stub:default_avatar_light.webp/headshots_${pgaId}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.log(`❌ Failed to download player ${pgaId}: ${response.status}`);
      return;
    }

    const buffer = await response.arrayBuffer();
    fs.writeFileSync(filepath, Buffer.from(buffer));
    console.log(`✅ Downloaded player ${pgaId}`);
  } catch (error) {
    console.error(`❌ Error downloading player ${pgaId}:`, error.message);
  }
}

// Download a single tournament image
async function downloadTournamentImage(tournament) {
  // Extract file extension from URL
  const urlParts = tournament.url.split('.');
  const ext = urlParts[urlParts.length - 1].split('?')[0] || 'jpg';
  const filename = `${tournament.id}.${ext}`;
  const filepath = path.join(TOURNAMENTS_DIR, filename);

  // Skip if already exists
  if (fs.existsSync(filepath)) {
    console.log(`⏭️  Skipping tournament ${tournament.id} (already exists)`);
    return;
  }

  try {
    const response = await fetch(tournament.url);
    if (!response.ok) {
      console.log(`❌ Failed to download tournament ${tournament.id}: ${response.status}`);
      return;
    }

    const buffer = await response.arrayBuffer();
    fs.writeFileSync(filepath, Buffer.from(buffer));
    console.log(`✅ Downloaded tournament ${tournament.id}`);
  } catch (error) {
    console.error(`❌ Error downloading tournament ${tournament.id}:`, error.message);
  }
}

// Main function
async function main() {
  console.log('🏌️  Fetching players and tournaments...\n');

  // Fetch players
  console.log('📋 Fetching player list...');
  const playerIds = await fetchAllPlayerIds();
  console.log(`Found ${playerIds.length} unique players`);

  // Fetch tournaments
  console.log('📋 Fetching tournament list...');
  const tournaments = await fetchAllTournaments();
  console.log(`Found ${tournaments.length} tournaments with images\n`);

  // Download player images
  console.log('⬇️  Downloading player images...');
  const concurrency = 5;
  for (let i = 0; i < playerIds.length; i += concurrency) {
    const batch = playerIds.slice(i, i + concurrency);
    await Promise.all(batch.map(id => downloadPlayerImage(id)));
  }

  // Download tournament images
  console.log('\n⬇️  Downloading tournament images...');
  for (let i = 0; i < tournaments.length; i += concurrency) {
    const batch = tournaments.slice(i, i + concurrency);
    await Promise.all(batch.map(t => downloadTournamentImage(t)));
  }

  console.log('\n✨ Done!');
}

main().catch(console.error);
