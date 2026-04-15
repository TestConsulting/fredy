/*
 * Copyright (c) 2026 by Christian Kellner.
 * Licensed under Apache-2.0 with Commons Clause and Attribution/Naming Clause
 */

import { useEffect, useState } from 'react';
import { Button, Nav } from '@douyinfe/semi-ui-19';
import { IconStar, IconSetting, IconTerminal, IconHistogram, IconSidebar, IconMenu } from '@douyinfe/semi-icons';
import logoFull from '../../assets/Logo_JPG-removebg-preview.png';
import logoIcon from '../../assets/Logo_Variationen_Grün_beige_Kopie-removebg-preview.png';
import Logout from '../logout/Logout.jsx';
import { useLocation, useNavigate } from 'react-router-dom';

import './Navigate.less';
import { useScreenWidth } from '../../hooks/screenWidth.js';

export default function Navigation({ isAdmin }) {
  const navigate = useNavigate();
  const location = useLocation();

  const width = useScreenWidth();
  const isMobile = width <= 640;
  const [collapsed, setCollapsed] = useState(width <= 850);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    if (width <= 850) setCollapsed(true);
  }, [width]);

  // Any page can open the drawer via: window.dispatchEvent(new CustomEvent('fredy:openNav'))
  useEffect(() => {
    const handler = () => setDrawerOpen(true);
    window.addEventListener('fredy:openNav', handler);
    return () => window.removeEventListener('fredy:openNav', handler);
  }, []);

  // Close drawer on route change
  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  const items = [
    { itemKey: '/dashboard', text: 'Dashboard', icon: <IconHistogram /> },
    { itemKey: '/jobs', text: 'Jobs', icon: <IconTerminal /> },
    {
      itemKey: 'listings',
      text: 'Listings',
      icon: <IconStar />,
      items: [
        { itemKey: '/listings', text: 'Overview' },
        { itemKey: '/map', text: 'Map View' },
      ],
    },
  ];

  if (isAdmin) {
    items.push({
      itemKey: 'settings',
      text: 'Settings',
      icon: <IconSetting />,
      items: [
        { itemKey: '/users', text: 'User Management' },
        { itemKey: '/generalSettings', text: 'Settings' },
      ],
    });
  } else {
    items.push({
      itemKey: 'settings',
      text: 'Settings',
      icon: <IconSetting />,
      items: [{ itemKey: '/generalSettings', text: 'Settings' }],
    });
  }

  function parsePathName(name) {
    const split = name.split('/').filter((s) => s.length !== 0);
    return '/' + split[0];
  }

  const activeKey = parsePathName(location.pathname);

  // ── Desktop sidebar ──────────────────────────────────────────────────────
  if (!isMobile) {
    return (
      <Nav
        style={{ height: '100%', maxWidth: collapsed ? '60px' : '240px' }}
        items={items}
        isCollapsed={collapsed}
        selectedKeys={[activeKey]}
        onSelect={(key) => navigate(key.itemKey)}
        header={<img src={logoIcon} width={collapsed ? '120' : '180'} alt="AC Immo Invest" />}
        footer={
          <Nav.Footer className="navigate__footer">
            <Logout text={!collapsed} />
            <Button icon={<IconSidebar />} onClick={() => setCollapsed(!collapsed)} />
          </Nav.Footer>
        }
      />
    );
  }

  // ── Mobile: drawer only (triggered via event or fallback button) ─────────
  return (
    <>
      {/* Fallback fixed button — hidden on pages that have their own inline trigger */}
      {!location.pathname.startsWith('/listings') && (
        <button
          className={`navigation__fabTrigger${drawerOpen ? ' navigation__fabTrigger--hidden' : ''}`}
          onClick={() => setDrawerOpen(true)}
          aria-label="Open menu"
        >
          <IconMenu size="large" />
        </button>
      )}

      {/* Backdrop */}
      {drawerOpen && <div className="navigation__backdrop" onClick={() => setDrawerOpen(false)} />}

      {/* Drawer slides in from left */}
      <div className={`navigation__drawer${drawerOpen ? ' navigation__drawer--open' : ''}`}>
        <Nav
          style={{ height: '100%', maxWidth: '240px' }}
          items={items}
          isCollapsed={false}
          selectedKeys={[activeKey]}
          onSelect={(key) => navigate(key.itemKey)}
          header={<img src={logoFull} width={90} className="navigation__drawerLogo" alt="AC Immo Invest" />}
          footer={
            <Nav.Footer className="navigate__footer">
              <Logout text={true} />
              <Button icon={<IconSidebar />} onClick={() => setDrawerOpen(false)} />
            </Nav.Footer>
          }
        />
      </div>
    </>
  );
}
