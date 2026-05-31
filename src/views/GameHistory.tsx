import { useState, useEffect } from 'react';
import { storageService } from '../db/storage';
import type { SavedGame } from '../db/storage';

interface GameHistoryProps {
  onNavigate: (view: string) => void;
  onLoadGamePgn: (pgn: string) => void;
}

export const GameHistory: React.FC<GameHistoryProps> = ({
  onNavigate,
  onLoadGamePgn
}) => {
  const [games, setGames] = useState<SavedGame[]>([]);
  const [filter, setFilter] = useState<'all' | 'favorites'>('all');
  const [copyStatus, setCopyStatus] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadGames();
  }, []);

  const loadGames = () => {
    setGames(storageService.getGames());
  };

  const handleToggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    storageService.toggleFavoriteGame(id);
    loadGames();
  };

  const handleDeleteGame = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to permanently delete this game from your offline archives?')) {
      storageService.deleteGame(id);
      loadGames();
    }
  };

  const handleCopyPgn = async (game: SavedGame, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(game.pgn);
      setCopyStatus(prev => ({ ...prev, [game.id]: true }));
      setTimeout(() => {
        setCopyStatus(prev => ({ ...prev, [game.id]: false }));
      }, 2000);
    } catch (err) {
      console.error('Failed to copy PGN', err);
    }
  };

  const handleReplayGame = (game: SavedGame) => {
    onLoadGamePgn(game.pgn);
    onNavigate('play');
  };

  const handlePurgeAll = () => {
    if (confirm('⚠️ WARNING: This will permanently wipe your entire saved games history. Are you sure you want to continue?')) {
      storageService.clearAllData();
      loadGames();
    }
  };

  const displayedGames = filter === 'all' 
    ? games 
    : games.filter(g => g.isFavorite);

  const formatDate = (isoString: string): string => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString(undefined, { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="animate-fade-in" style={styles.container}>
      
      {/* Title Header and Purge button */}
      <div style={styles.headerRow}>
        <div>
          <h2 style={styles.title}>Game Archives</h2>
          <p style={styles.subtitle}>Review, replay, and manage your offline matches ({games.length} total)</p>
        </div>
        {games.length > 0 && (
          <button className="btn btn-danger" style={{ padding: '8px 16px', fontSize: '0.82rem' }} onClick={handlePurgeAll}>
            ⚠️ Purge All Data
          </button>
        )}
      </div>

      {/* Filter tab group */}
      <div style={styles.filterBar}>
        <div style={styles.tabGroup}>
          <button 
            className={`btn ${filter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
            style={styles.filterBtn}
            onClick={() => setFilter('all')}
          >
            All Completed Games
          </button>
          <button 
            className={`btn ${filter === 'favorites' ? 'btn-primary' : 'btn-secondary'}`}
            style={styles.filterBtn}
            onClick={() => setFilter('favorites')}
          >
            ⭐ Bookmarked Favorites
          </button>
        </div>
      </div>

      {/* Game history cards list */}
      <div style={styles.list}>
        {displayedGames.length === 0 ? (
          <div className="card" style={styles.placeholderCard}>
            <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>⏳</div>
            <h4>No saved games found.</h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
              {filter === 'favorites' 
                ? 'Mark some matches as favorites to see them here!' 
                : 'Play some local or engine matches, and completed games will be archived here automatically.'}
            </p>
          </div>
        ) : (
          displayedGames.map((g) => {
            const isCopied = !!copyStatus[g.id];
            return (
              <div 
                key={g.id} 
                className="card" 
                style={styles.gameCard}
                onClick={() => handleReplayGame(g)}
              >
                {/* Meta Row: Date & Time control */}
                <div style={styles.cardMetaRow}>
                  <span style={styles.date}>{formatDate(g.date)}</span>
                  <span style={styles.timeControl}>⚡ {g.timeControl}</span>
                </div>

                {/* Matchup row */}
                <div style={styles.matchup}>
                  <div style={styles.playerColumn}>
                    <span style={styles.playerColor}>White</span>
                    <span style={styles.playerName}>{g.playerWhite}</span>
                  </div>
                  <div style={styles.vs}>VS</div>
                  <div style={styles.playerColumn}>
                    <span style={styles.playerColor}>Black</span>
                    <span style={styles.playerName}>{g.playerBlack}</span>
                  </div>
                </div>

                <div style={styles.divider}></div>

                {/* Foot Row: Result and controls */}
                <div style={styles.cardFoot}>
                  <div>
                    <span style={styles.resultLabel}>Result:</span>
                    <span style={styles.resultValue}>{g.result}</span>
                  </div>
                  
                  <div style={styles.actions}>
                    <button 
                      style={styles.iconAction}
                      onClick={(e) => handleToggleFavorite(g.id, e)}
                      title="Toggle Favorite Status"
                    >
                      {g.isFavorite ? '⭐' : '☆'}
                    </button>
                    <button 
                      className="btn btn-secondary" 
                      style={styles.miniBtn}
                      onClick={(e) => handleCopyPgn(g, e)}
                    >
                      {isCopied ? 'Copied' : 'Copy PGN'}
                    </button>
                    <button 
                      className="btn btn-danger" 
                      style={{ ...styles.miniBtn, padding: '5px' }}
                      onClick={(e) => handleDeleteGame(g.id, e)}
                      title="Delete Game permanently"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: '850px',
    width: '100%',
    margin: '0 auto',
    padding: '0 16px',
    paddingBottom: '40px',
    display: 'flex',
    flexDirection: 'column',
    gap: '24px'
  },
  headerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '16px'
  },
  title: {
    fontSize: '1.8rem',
    fontWeight: 800,
    color: 'var(--text-primary)'
  },
  subtitle: {
    fontSize: '0.9rem',
    color: 'var(--text-secondary)'
  },
  filterBar: {
    display: 'flex'
  },
  tabGroup: {
    display: 'flex',
    backgroundColor: 'var(--bg-secondary)',
    borderRadius: '10px',
    padding: '4px',
    border: '1px solid var(--border-color)'
  },
  filterBtn: {
    padding: '6px 16px',
    fontSize: '0.85rem',
    borderRadius: '8px'
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  placeholderCard: {
    padding: '40px',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px'
  },
  gameCard: {
    padding: '16px 20px',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    transition: 'transform var(--transition-fast), box-shadow var(--transition-fast)'
  },
  cardMetaRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.75rem',
    color: 'var(--text-secondary)',
    fontWeight: 600
  },
  date: {
    opacity: 0.8
  },
  timeControl: {
    backgroundColor: 'var(--accent-bg)',
    padding: '2px 8px',
    borderRadius: '4px'
  },
  matchup: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-around',
    padding: '8px 0'
  },
  playerColumn: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
    flex: 1
  },
  playerColor: {
    fontSize: '0.65rem',
    fontWeight: 700,
    textTransform: 'uppercase',
    color: 'var(--text-muted)'
  },
  playerName: {
    fontSize: '1.05rem',
    fontWeight: 700,
    color: 'var(--text-primary)'
  },
  vs: {
    fontSize: '0.75rem',
    fontWeight: 800,
    color: 'var(--text-muted)',
    backgroundColor: 'var(--bg-primary)',
    padding: '4px 8px',
    borderRadius: '6px',
    border: '1px solid var(--border-color)'
  },
  divider: {
    height: '1px',
    backgroundColor: 'var(--border-color)'
  },
  cardFoot: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  resultLabel: {
    fontSize: '0.8rem',
    color: 'var(--text-secondary)',
    marginRight: '6px'
  },
  resultValue: {
    fontSize: '0.9rem',
    fontWeight: 700,
    color: 'var(--text-primary)'
  },
  actions: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  iconAction: {
    fontSize: '1.25rem',
    cursor: 'pointer',
    padding: '4px',
    transition: 'transform var(--transition-fast)'
  },
  miniBtn: {
    padding: '4px 10px',
    fontSize: '0.78rem',
    borderRadius: '6px'
  }
};
