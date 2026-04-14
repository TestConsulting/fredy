/*
 * Copyright (c) 2026 by Christian Kellner.
 * Licensed under Apache-2.0 with Commons Clause and Attribution/Naming Clause
 */

/**
 * Seed script: Inserts a test job and sample listings into the local DB.
 * Usage: node tools/seed-testdata.js
 */

import { nanoid } from 'nanoid';
import SqliteConnection from '../lib/services/storage/SqliteConnection.js';

await SqliteConnection.init();
const db = SqliteConnection.getConnection();

// Echte User-ID aus der DB lesen
const adminUser = db.prepare('SELECT id FROM users WHERE username = @u LIMIT 1').get({ u: 'admin' });
if (!adminUser) {
  console.error('Kein Admin-User gefunden. Starte zuerst das Backend damit der User angelegt wird.');
  process.exit(1);
}
const userId = adminUser.id;

// --- Job einfügen ---
const jobId = nanoid();

db.prepare(
  `INSERT INTO jobs (id, user_id, enabled, name, blacklist, provider, notification_adapter, shared_with_user, spatial_filter, spec_filter)
   VALUES (@id, @user_id, 1, @name, @blacklist, @provider, @notification_adapter, @shared_with_user, NULL, NULL)`,
).run({
  id: jobId,
  user_id: userId,
  name: 'Test-Kauf Immobilien',
  blacklist: JSON.stringify([]),
  provider: JSON.stringify([
    {
      name: 'immoscout',
      url: 'https://www.immobilienscout24.de/Suche/de/berlin/berlin/haus-kaufen',
    },
  ]),
  notification_adapter: JSON.stringify([]),
  shared_with_user: JSON.stringify([]),
});

console.warn(`Job erstellt: ${jobId} ("Test-Kauf Immobilien")`);

// --- Test-Listings einfügen ---
const listings = [
  {
    hash: nanoid(),
    title: 'Freistehendes Einfamilienhaus in Zehlendorf',
    price: 1250000,
    size: 220,
    rooms: 6,
    address: 'Clayallee 55, 14195 Berlin',
    link: 'https://example.com/listing/haus-1',
    image_url: null,
    description:
      'Gepflegtes Einfamilienhaus auf großem Grundstück (800 m²). Baujahr 1968, vollständig saniert 2019. Doppelgarage, Garten, Keller.',
    latitude: 52.4567,
    longitude: 13.2603,
  },
  {
    hash: nanoid(),
    title: 'Mehrfamilienhaus als Anlageobjekt in Wedding',
    price: 2100000,
    size: 680,
    rooms: 18,
    address: 'Müllerstraße 120, 13353 Berlin',
    link: 'https://example.com/listing/anlage-1',
    image_url: null,
    description:
      'Vollvermietetes Mehrfamilienhaus mit 8 Wohneinheiten und 2 Gewerbeeinheiten. Nettokaltmiete 95.000 €/Jahr. Faktor 22. Solide Kapitalanlage im aufstrebenden Kiez.',
    latitude: 52.5512,
    longitude: 13.3601,
  },
];

const stmt = db.prepare(
  `INSERT INTO listings (id, hash, provider, job_id, price, size, rooms, title, image_url, description, address, link, created_at, is_active, latitude, longitude)
   VALUES (@id, @hash, @provider, @job_id, @price, @size, @rooms, @title, @image_url, @description, @address, @link, @created_at, 1, @latitude, @longitude)
   ON CONFLICT(job_id, hash) DO NOTHING`,
);

for (const l of listings) {
  stmt.run({
    id: nanoid(),
    hash: l.hash,
    provider: 'immoscout',
    job_id: jobId,
    price: l.price,
    size: l.size,
    rooms: l.rooms,
    title: l.title,
    image_url: l.image_url,
    description: l.description,
    address: l.address,
    link: l.link,
    created_at: Date.now(),
    latitude: l.latitude,
    longitude: l.longitude,
  });
  console.warn(`  Listing eingefügt: "${l.title}" (${l.price.toLocaleString('de-DE')}€)`);
}

console.warn('\nFertig! Öffne http://localhost:9998');
