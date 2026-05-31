import React from 'react';
import { storageService } from '../db/storage';
import type { AppSettings } from '../db/storage';

interface SettingsViewProps {
  settings: AppSettings;
  onUpdateSettings: (settings: Partial<AppSettings>) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onUpdateSettings
}) => {

  const handleClearData = () => {
    if (confirm('⚠️ FACTORY RESET WARNING: This will permanently wipe all your saved games, favorites, active progress, and reset settings back to default. This cannot be undone. Do you wish to continue?')) {
      storageService.clearAllData();
      onUpdateSettings(storageService.getSettings());
      alert('All offline data has been successfully cleared.');
      window.location.reload();
    }
  };

  return (
    <div className="animate-fade-in" style={styles.container}>
      <h2 style={styles.title}>System Settings</h2>
      <p style={styles.subtitle}>Customize your offline chessboard, sound oscillators, and layout parameters.</p>

      <div style={styles.list}>
        {/* Visual Settings Card */}
        <div className="card" style={styles.card}>
          <h3 style={styles.cardHeader}>🎨 Aesthetics & Themes</h3>
          
          {/* Theme selection */}
          <div style={styles.settingRow}>
            <div>
              <span style={styles.label}>Visual Mode</span>
              <p style={styles.desc}>Select dark or light color scheme.</p>
            </div>
            <div style={styles.tabGroup}>
              <button
                className={`btn ${settings.theme === 'dark' ? 'btn-primary' : 'btn-secondary'}`}
                style={styles.tabBtn}
                onClick={() => onUpdateSettings({ theme: 'dark' })}
              >
                🌙 Dark Mode
              </button>
              <button
                className={`btn ${settings.theme === 'light' ? 'btn-primary' : 'btn-secondary'}`}
                style={styles.tabBtn}
                onClick={() => onUpdateSettings({ theme: 'light' })}
              >
                ☀️ Light Mode
              </button>
            </div>
          </div>

          <div style={styles.divider}></div>

          {/* Board Theme */}
          <div style={styles.settingRow}>
            <div>
              <span style={styles.label}>Board Theme skin</span>
              <p style={styles.desc}>Choose square textures and colors.</p>
            </div>
            <select
              style={styles.select}
              value={settings.boardTheme}
              onChange={(e) => onUpdateSettings({ boardTheme: e.target.value as any })}
            >
              <option value="carbon">Minimal Carbon (Cool Charcoal & Slate)</option>
              <option value="slate">Modern Slate (Deep Blue-Gray & Silver)</option>
              <option value="classic">Classic Wood (Familiar Oak & Cream)</option>
            </select>
          </div>

          <div style={styles.divider}></div>

          {/* Piece Style */}
          <div style={styles.settingRow}>
            <div>
              <span style={styles.label}>Piece Style theme</span>
              <p style={styles.desc}>Choose piece visual silhouettes.</p>
            </div>
            <select
              style={styles.select}
              value={settings.pieceStyle}
              onChange={(e) => onUpdateSettings({ pieceStyle: e.target.value as any })}
            >
              <option value="neo">Neo Style (Familiar Premium Silhouettes)</option>
              <option value="vector">Elegant Outlines (Original Vectors)</option>
            </select>
          </div>
        </div>

        {/* Audio & Feedback Card */}
        <div className="card" style={styles.card}>
          <h3 style={styles.cardHeader}>🔊 Audio & Feedback</h3>

          {/* Sound Toggle */}
          <div style={styles.settingRow}>
            <div>
              <span style={styles.label}>Synthesized Audio Sounds</span>
              <p style={styles.desc}>Play real-time Web Audio moves and capture oscillators.</p>
            </div>
            <input
              type="checkbox"
              style={styles.checkbox}
              checked={settings.soundEnabled}
              onChange={(e) => onUpdateSettings({ soundEnabled: e.target.checked })}
            />
          </div>

          <div style={styles.divider}></div>

          {/* Haptics Toggle */}
          <div style={styles.settingRow}>
            <div>
              <span style={styles.label}>Tactile Haptic Click Vibration</span>
              <p style={styles.desc}>Vibrate device slightly on chess move selection (mobile supported).</p>
            </div>
            <input
              type="checkbox"
              style={styles.checkbox}
              checked={settings.hapticsEnabled}
              onChange={(e) => onUpdateSettings({ hapticsEnabled: e.target.checked })}
            />
          </div>
        </div>

        {/* Gameplay & Assistance Card */}
        <div className="card" style={styles.card}>
          <h3 style={styles.cardHeader}>💡 Gameplay & Assistance</h3>

          {/* Move Hints */}
          <div style={styles.settingRow}>
            <div>
              <span style={styles.label}>Legal Move Hints & Dots</span>
              <p style={styles.desc}>Display dot overlays on squares indicating valid move options.</p>
            </div>
            <input
              type="checkbox"
              style={styles.checkbox}
              checked={settings.moveHintsEnabled}
              onChange={(e) => onUpdateSettings({ moveHintsEnabled: e.target.checked })}
            />
          </div>
        </div>

        {/* Accessibility parameters */}
        <div className="card" style={styles.card}>
          <h3 style={styles.cardHeader}>👁️ Accessibility Options</h3>

          {/* Contrast Mode */}
          <div style={styles.settingRow}>
            <div>
              <span style={styles.label}>High Contrast mode</span>
              <p style={styles.desc}>Sharpen visibility borders and outline contrasts.</p>
            </div>
            <input
              type="checkbox"
              style={styles.checkbox}
              checked={settings.contrastMode}
              onChange={(e) => onUpdateSettings({ contrastMode: e.target.checked })}
            />
          </div>

          <div style={styles.divider}></div>

          {/* Font scale */}
          <div style={styles.settingRow}>
            <div>
              <span style={styles.label}>Font Scale parameters</span>
              <p style={styles.desc}>Adjust text display size across components.</p>
            </div>
            <select
              style={styles.select}
              value={settings.fontSize}
              onChange={(e) => onUpdateSettings({ fontSize: e.target.value as any })}
            >
              <option value="small">Small scale</option>
              <option value="medium">Standard medium scale</option>
              <option value="large">Large magnified scale</option>
            </select>
          </div>
        </div>

        {/* Local Storage diagnostic screen */}
        <div className="card" style={{ ...styles.card, borderColor: 'var(--danger-color)' }}>
          <h3 style={{ ...styles.cardHeader, color: 'var(--danger-color)' }}>⚠️ Storage Diagnostics</h3>
          <div style={styles.settingRow}>
            <div>
              <span style={styles.label}>Offline Local Database Maintenance</span>
              <p style={styles.desc}>Wipe all cached matches, preferences, and reset the environment completely.</p>
            </div>
            <button className="btn btn-danger" style={{ padding: '8px 20px' }} onClick={handleClearData}>
              Factory Reset Data
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: '750px',
    width: '100%',
    margin: '0 auto',
    padding: '0 16px',
    paddingBottom: '40px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  title: {
    fontSize: '1.8rem',
    fontWeight: 800,
    color: 'var(--text-primary)'
  },
  subtitle: {
    fontSize: '0.9rem',
    color: 'var(--text-secondary)',
    marginBottom: '20px'
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  card: {
    padding: '20px 24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  cardHeader: {
    fontSize: '1rem',
    fontWeight: 750,
    color: 'var(--text-primary)'
  },
  settingRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '12px'
  },
  label: {
    display: 'block',
    fontSize: '0.92rem',
    fontWeight: 700,
    color: 'var(--text-primary)'
  },
  desc: {
    fontSize: '0.78rem',
    color: 'var(--text-secondary)'
  },
  tabGroup: {
    display: 'flex',
    backgroundColor: 'var(--bg-primary)',
    borderRadius: '10px',
    padding: '3px',
    border: '1px solid var(--border-color)'
  },
  tabBtn: {
    padding: '6px 14px',
    fontSize: '0.8rem',
    borderRadius: '8px'
  },
  select: {
    padding: '6px 12px',
    borderRadius: '8px',
    backgroundColor: 'var(--bg-primary)',
    color: 'var(--text-primary)',
    border: '1px solid var(--border-color)',
    fontSize: '0.85rem',
    fontWeight: 650,
    outline: 'none',
    cursor: 'pointer',
    height: '34px'
  },
  checkbox: {
    width: '18px',
    height: '18px',
    cursor: 'pointer'
  },
  divider: {
    height: '1px',
    backgroundColor: 'var(--border-color)'
  }
};
