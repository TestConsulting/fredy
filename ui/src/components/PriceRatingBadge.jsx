/*
 * Copyright (c) 2026 by Christian Kellner.
 * Licensed under Apache-2.0 with Commons Clause and Attribution/Naming Clause
 */

const DEFAULT_LOW_MAX = 1499;
const DEFAULT_MEDIUM_MAX = 2499;

function getRating(pricePerSqm, lowMax, mediumMax) {
  if (pricePerSqm == null || pricePerSqm <= 0) return null;
  if (pricePerSqm > mediumMax) return 'high';
  if (pricePerSqm > lowMax) return 'medium';
  return 'low';
}

const STYLES = {
  high: {
    background: 'rgba(255,77,79,0.15)',
    color: '#ff4d4f',
    border: '1px solid #ff4d4f',
  },
  medium: {
    background: 'rgba(250,140,22,0.15)',
    color: '#fa8c16',
    border: '1px solid #fa8c16',
  },
  low: {
    background: 'rgba(82,196,26,0.15)',
    color: '#52c41a',
    border: '1px solid #52c41a',
  },
};

export default function PriceRatingBadge({ pricePerSqm, specFilter }) {
  const lowMax = specFilter?.sqmLowMax ?? DEFAULT_LOW_MAX;
  const mediumMax = specFilter?.sqmMediumMax ?? DEFAULT_MEDIUM_MAX;

  const LABELS = {
    high: specFilter?.sqmHighLabel || 'HIGH',
    medium: specFilter?.sqmMediumLabel || 'MEDIUM',
    low: `🌶️ ${specFilter?.sqmLowLabel || 'LOW'}`,
  };

  const rating = getRating(pricePerSqm, lowMax, mediumMax);
  if (!rating) return null;

  return (
    <span
      style={{
        ...STYLES[rating],
        borderRadius: '4px',
        padding: '1px 7px',
        fontSize: '11px',
        fontWeight: 700,
        letterSpacing: '0.04em',
        whiteSpace: 'nowrap',
        lineHeight: '20px',
      }}
    >
      {LABELS[rating]}
    </span>
  );
}
