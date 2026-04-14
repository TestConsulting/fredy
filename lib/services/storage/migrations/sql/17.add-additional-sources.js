/*
 * Copyright (c) 2026 by Christian Kellner.
 * Licensed under Apache-2.0 with Commons Clause and Attribution/Naming Clause
 */

// Migration: Add additional_sources column to listings to store
// links found on multiple providers for the same property.

export function up(db) {
  db.exec(`
    ALTER TABLE listings ADD COLUMN additional_sources TEXT DEFAULT NULL;
  `);
}
