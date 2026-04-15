/*
 * Copyright (c) 2026 by Christian Kellner.
 * Licensed under Apache-2.0 with Commons Clause and Attribution/Naming Clause
 */

import nodemailer from 'nodemailer';
import path from 'path';
import fs from 'fs';
import Handlebars from 'handlebars';
import { markdown2Html } from '../../services/markdown.js';
import { getDirName, normalizeImageUrl } from '../../utils.js';
import { getJob } from '../../services/storage/jobStorage.js';

const __dirname = getDirName();
const template = fs.readFileSync(path.resolve(__dirname + '/notification/emailTemplate/template.hbs'), 'utf8');
const emailTemplate = Handlebars.compile(template);

const mapListings = (serviceName, jobKey, listings, specFilter) =>
  listings.map((l) => {
    const image = normalizeImageUrl(l.image);

    // Parse raw numbers from formatted strings ("1250000 €" → 1250000, "120 m²" → 120)
    const rawPrice = l.price != null ? parseFloat(String(l.price).replace(/[^\d.]/g, '')) : null;
    const rawSize = l.size != null ? parseFloat(String(l.size).replace(/[^\d.]/g, '')) : null;

    // Price per m²
    const pricePerSqm = rawPrice != null && rawSize != null && rawSize > 0 ? Math.round(rawPrice / rawSize) : null;

    // Price rating
    const lowMax = specFilter?.sqmLowMax ?? 1499;
    const mediumMax = specFilter?.sqmMediumMax ?? 2499;
    let rating = null;
    let ratingColor = null;
    if (pricePerSqm != null) {
      if (pricePerSqm <= lowMax) {
        rating = `🌶️ ${specFilter?.sqmLowLabel || 'LOW'}`;
        ratingColor = '#52c41a';
      } else if (pricePerSqm <= mediumMax) {
        rating = specFilter?.sqmMediumLabel || 'MEDIUM';
        ratingColor = '#fa8c16';
      } else {
        rating = specFilter?.sqmHighLabel || 'HIGH';
        ratingColor = '#ff4d4f';
      }
    }

    // Rental / financing calculations
    const rentalPricePerSqm = specFilter?.rentalPricePerSqm;
    const finanzierungsquotient = specFilter?.finanzierungsquotient;
    let mieteinnahmen = null;
    let roi = null;
    let rate = null;
    let uberschuss = null;
    let uberschussColor = '#52c41a';
    if (rentalPricePerSqm && rawSize) {
      mieteinnahmen = Math.round(rentalPricePerSqm * rawSize);
      if (rawPrice) {
        roi = (rawPrice / (mieteinnahmen * 12)).toFixed(1);
        if (finanzierungsquotient) {
          rate = Math.round((rawPrice * (finanzierungsquotient / 100)) / 12);
          uberschuss = mieteinnahmen - rate;
          uberschussColor = uberschuss >= 0 ? '#52c41a' : '#ff4d4f';
        }
      }
    }

    return {
      title: l.title || '',
      link: l.link || '',
      address: l.address || '',
      size: l.size || '',
      price: l.price || '',
      image,
      hasImage: Boolean(image),
      serviceName,
      jobKey,
      pricePerSqm: pricePerSqm != null ? pricePerSqm.toLocaleString('de-DE') : null,
      rating,
      ratingColor,
      hasRating: pricePerSqm != null,
      mieteinnahmen: mieteinnahmen != null ? mieteinnahmen.toLocaleString('de-DE') : null,
      roi,
      rate: rate != null ? rate.toLocaleString('de-DE') : null,
      uberschuss: uberschuss != null ? Math.abs(uberschuss).toLocaleString('de-DE') : null,
      uberschussColor,
      uberschussSign: uberschuss != null ? (uberschuss >= 0 ? '+' : '-') : null,
      hasRendite: mieteinnahmen != null,
    };
  });

export const send = async ({ serviceName, newListings, notificationConfig, jobKey }) => {
  const job = getJob(jobKey);
  const specFilter = job?.specFilter ?? null;
  const { host, port, secure, username, password, receiver, from } = notificationConfig.find(
    (adapter) => adapter.id === config.id,
  ).fields;

  const to = receiver
    .trim()
    .split(',')
    .map((r) => r.trim())
    .filter(Boolean);

  const transporter = nodemailer.createTransport({
    host,
    port: Number(port),
    secure: secure === 'true',
    auth: {
      user: username,
      pass: password,
    },
  });

  const listings = mapListings(serviceName, jobKey, newListings, specFilter);

  const html = emailTemplate({
    serviceName: `Job: (${jobKey}) | Service: ${serviceName}`,
    numberOfListings: listings.length,
    listings,
  });

  return transporter.sendMail({
    from,
    to: to.join(','),
    subject: `Fredy found ${listings.length} new listing(s) for ${serviceName}`,
    html,
  });
};

export const config = {
  id: 'smtp',
  name: 'SMTP',
  description: 'Send notifications via any SMTP server using Nodemailer.',
  readme: markdown2Html('lib/notification/adapter/smtp.md'),
  fields: {
    host: {
      type: 'text',
      label: 'SMTP Host',
      description: 'The hostname of the SMTP server (e.g., smtp.gmail.com).',
    },
    port: {
      type: 'text',
      label: 'SMTP Port',
      description: 'The port of the SMTP server (e.g., 587 for STARTTLS, 465 for SSL).',
    },
    secure: {
      type: 'text',
      label: 'Secure (SSL/TLS)',
      description: 'Set to "true" for port 465 (SSL). Leave empty or "false" for STARTTLS on port 587.',
    },
    username: {
      type: 'text',
      label: 'Username',
      description: 'The username for SMTP authentication.',
    },
    password: {
      type: 'text',
      label: 'Password',
      description: 'The password (or app password) for SMTP authentication.',
    },
    receiver: {
      type: 'text',
      label: 'Receiver Email(s)',
      description: 'Comma-separated email addresses Fredy will send notifications to.',
    },
    from: {
      type: 'email',
      label: 'Sender Email',
      description: 'The email address Fredy sends from.',
    },
  },
};
