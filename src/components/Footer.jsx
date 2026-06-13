import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer style={styles.footer}>
      <div style={styles.inner}>
        <div style={styles.brand}>
          ⚡ TaskCampus · Campus task marketplace
        </div>
        <div style={styles.links}>
          <Link to="/about"   style={styles.link}>About</Link>
          <Link to="/contact" style={styles.link}>Contact</Link>
          <Link to="/privacy" style={styles.link}>Privacy Policy</Link>
          <Link to="/terms"   style={styles.link}>Terms</Link>
          <Link to="/refund"  style={styles.link}>Refund Policy</Link>
        </div>
        <div style={styles.copy}>
          © {new Date().getFullYear()} TaskCampus. All rights reserved.
        </div>
      </div>
    </footer>
  );
}

const styles = {
  footer: { borderTop: '1px solid var(--border)', marginTop: 80, padding: '32px 24px' },
  inner:  { maxWidth: 900, margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 },
  brand:  { fontSize: 13, fontWeight: 700, color: 'var(--text2)' },
  links:  { display: 'flex', gap: 24, flexWrap: 'wrap', justifyContent: 'center' },
  link:   { fontSize: 12, color: 'var(--text3)', textDecoration: 'none', transition: 'color .15s' },
  copy:   { fontSize: 11, color: 'var(--text3)' },
};