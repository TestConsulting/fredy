/*
 * Copyright (c) 2026 by Christian Kellner.
 * Licensed under Apache-2.0 with Commons Clause and Attribution/Naming Clause
 */

import logoIcon from '../../assets/Logo_Variationen_Grün_beige_Kopie-removebg-preview.png';

import './Logo.less';

export default function Logo({ width = 180 } = {}) {
  return <img src={logoIcon} width={width} className="logo" alt="AC Immo Invest" />;
}
