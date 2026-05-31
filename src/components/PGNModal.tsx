import React, { useState } from 'react';

interface PGNModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPgn: string;
  onImport: (pgn: string) => void;
  gameSummary: {
    result: string;
    movesCount: number;
    timeControl: string;
  } | null;
}

export const PGNModal: React.FC<PGNModalProps> = ({
  isOpen,
  onClose,
  currentPgn,
  onImport,
  gameSummary
}) => {
  const [pgnInput, setPgnInput] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);
  const [importError, setImportError] = useState('');

  if (!isOpen) return null;

  const handleCopyPgn = async () => {
    try {
      await navigator.clipboard.writeText(currentPgn);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy PGN', err);
    }
  };

  const handleCopySummary = async () => {
    if (!gameSummary) return;
    const summaryText = `♟️ Chess Game Summary ♟️\nTime Control: ${gameSummary.timeControl}\nResult: ${gameSummary.result}\nMoves: ${gameSummary.movesCount}\n\nReplay this game offline on Antigravity Chess!`;
    try {
      await navigator.clipboard.writeText(summaryText);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy summary', err);
    }
  };

  const handleImportSubmit = () => {
    if (!pgnInput.trim()) {
      setImportError('Please enter a valid PGN string.');
      return;
    }
    try {
      onImport(pgnInput);
      setPgnInput('');
      setImportError('');
      onClose();
    } catch (e) {
      setImportError('Failed to parse PGN. Please verify the chess notation syntax.');
    }
  };

  return (
    <div style={styles.overlay}>
      <div className="card-glass animate-fade-in" style={styles.modalCard}>
        <div style={styles.header}>
          <h3 style={styles.title}>PGN Management</h3>
          <button style={styles.closeBtn} onClick={onClose}>&times;</button>
        </div>

        <div style={styles.body}>
          {/* Export Section */}
          <div style={styles.section}>
            <h4 style={styles.sectionHeader}>Export Game PGN</h4>
            <textarea
              style={styles.textarea}
              readOnly
              value={currentPgn || 'No moves recorded yet.'}
            />
            <div style={styles.btnRow}>
              <button 
                className="btn btn-secondary" 
                style={styles.actionBtn}
                disabled={!currentPgn}
                onClick={handleCopyPgn}
              >
                Copy PGN
              </button>
              {gameSummary && (
                <button 
                  className="btn btn-secondary" 
                  style={styles.actionBtn}
                  onClick={handleCopySummary}
                >
                  Share Summary
                </button>
              )}
            </div>
            {copySuccess && <div style={styles.successMsg}>Copied to clipboard successfully!</div>}
          </div>

          <div style={styles.divider}></div>

          {/* Import Section */}
          <div style={styles.section}>
            <h4 style={styles.sectionHeader}>Import Game PGN</h4>
            <textarea
              style={styles.textarea}
              placeholder="Paste a standard chess PGN string here (e.g. 1. e4 e5 2. Nf3...)"
              value={pgnInput}
              onChange={(e) => setPgnInput(e.target.value)}
            />
            {importError && <div style={styles.errorMsg}>{importError}</div>}
            <div style={styles.btnRow}>
              <button 
                className="btn btn-primary" 
                style={{ ...styles.actionBtn, width: '100%' }}
                onClick={handleImportSubmit}
              >
                Import & Play Position
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    backdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2000,
    padding: '16px'
  },
  modalCard: {
    maxWidth: '500px',
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    padding: '24px',
    border: '1px solid var(--border-color)'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px'
  },
  title: {
    fontSize: '1.25rem',
    fontWeight: 700,
    color: 'var(--text-primary)'
  },
  closeBtn: {
    fontSize: '1.75rem',
    color: 'var(--text-secondary)',
    lineHeight: 1,
    cursor: 'pointer',
    transition: 'color var(--transition-fast)'
  },
  body: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  sectionHeader: {
    fontSize: '0.9rem',
    fontWeight: 600,
    color: 'var(--text-primary)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em'
  },
  textarea: {
    width: '100%',
    height: '90px',
    backgroundColor: 'var(--bg-primary)',
    color: 'var(--text-primary)',
    border: '1px solid var(--border-color)',
    borderRadius: '8px',
    padding: '10px',
    fontSize: '0.85rem',
    fontFamily: 'monospace',
    resize: 'none',
    outline: 'none',
    transition: 'border-color var(--transition-fast)'
  },
  btnRow: {
    display: 'flex',
    gap: '10px'
  },
  actionBtn: {
    flex: 1,
    padding: '8px 16px',
    fontSize: '0.88rem'
  },
  divider: {
    height: '1px',
    backgroundColor: 'var(--border-color)'
  },
  successMsg: {
    fontSize: '0.78rem',
    color: 'var(--success-color)',
    fontWeight: 600,
    textAlign: 'center',
    marginTop: '4px'
  },
  errorMsg: {
    fontSize: '0.78rem',
    color: 'var(--danger-color)',
    fontWeight: 600,
    marginTop: '4px'
  }
};
