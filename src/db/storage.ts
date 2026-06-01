export interface SavedGame {
  id: string;
  date: string;
  pgn: string;
  fen: string;
  playerWhite: string;
  playerBlack: string;
  result: string;
  timeControl: string;
  isFavorite?: boolean;
}

export interface AppSettings {
  theme: 'dark' | 'light';
  boardTheme: 'carbon' | 'slate' | 'classic';
  pieceStyle: 'neo' | 'vector';
  soundEnabled: boolean;
  hapticsEnabled: boolean;
  moveHintsEnabled: boolean;
  contrastMode: boolean;
  fontSize: 'small' | 'medium' | 'large';
}

const DEFAULT_SETTINGS: AppSettings = {
  theme: 'dark',
  boardTheme: 'carbon',
  pieceStyle: 'neo',
  soundEnabled: true,
  hapticsEnabled: true,
  moveHintsEnabled: true,
  contrastMode: false,
  fontSize: 'medium'
};

class StorageService {
  private isAvailable: boolean;
  private memoryDb: Record<string, string> = {};

  constructor() {
    try {
      const testKey = '__storage_test__';
      localStorage.setItem(testKey, testKey);
      localStorage.removeItem(testKey);
      this.isAvailable = true;
    } catch (e) {
      this.isAvailable = false;
      console.warn('LocalStorage is not available. Using memory-only database (non-persistent).');
    }
  }

  private set(key: string, value: any) {
    const stringVal = JSON.stringify(value);
    if (this.isAvailable) {
      localStorage.setItem(key, stringVal);
    } else {
      this.memoryDb[key] = stringVal;
    }
  }

  private get<T>(key: string): T | null {
    const stringVal = this.isAvailable ? localStorage.getItem(key) : this.memoryDb[key];
    if (!stringVal) return null;
    try {
      return JSON.parse(stringVal) as T;
    } catch {
      return null;
    }
  }

  // --- Settings Management ---
  public getSettings(): AppSettings {
    const settings = this.get<AppSettings>('chess_settings');
    return settings ? { ...DEFAULT_SETTINGS, ...settings } : DEFAULT_SETTINGS;
  }

  public saveSettings(settings: Partial<AppSettings>) {
    const current = this.getSettings();
    const updated = { ...current, ...settings };
    this.set('chess_settings', updated);
    
    // Apply theme class to body
    if (typeof document !== 'undefined') {
      if (updated.theme === 'dark') {
        document.body.classList.add('dark-theme');
        document.body.classList.remove('light-theme');
      } else {
        document.body.classList.add('light-theme');
        document.body.classList.remove('dark-theme');
      }
    }
  }

  // --- Active Game Persistence ---
  public getActiveGame(): { fen: string; pgn: string; timeControl: string; mode: string; whiteTime?: number; blackTime?: number } | null {
    return this.get('chess_active_game');
  }

  public saveActiveGame(data: { fen: string; pgn: string; timeControl: string; mode: string; whiteTime?: number; blackTime?: number } | null) {
    if (data === null) {
      if (this.isAvailable) {
        localStorage.removeItem('chess_active_game');
      } else {
        delete this.memoryDb['chess_active_game'];
      }
    } else {
      this.set('chess_active_game', data);
    }
  }

  // --- Game History Database ---
  public getGames(): SavedGame[] {
    return this.get<SavedGame[]>('chess_game_history') || [];
  }

  public saveGame(game: Omit<SavedGame, 'id' | 'date'>) {
    const games = this.getGames();
    const newGame: SavedGame = {
      ...game,
      id: Math.random().toString(36).substr(2, 9),
      date: new Date().toISOString()
    };
    games.unshift(newGame); // Newest first
    this.set('chess_game_history', games);
    return newGame;
  }

  public deleteGame(id: string) {
    const games = this.getGames();
    const filtered = games.filter(g => g.id !== id);
    this.set('chess_game_history', filtered);
  }

  public toggleFavoriteGame(id: string) {
    const games = this.getGames();
    const updated = games.map(g => {
      if (g.id === id) {
        return { ...g, isFavorite: !g.isFavorite };
      }
      return g;
    });
    this.set('chess_game_history', updated);
  }

  // --- Bookmarked Puzzle IDs ---
  public getBookmarkedPuzzles(): number[] {
    return this.get<number[]>('chess_bookmarked_puzzles') || [];
  }

  public toggleBookmarkPuzzle(puzzleId: number): boolean {
    const bookmarks = this.getBookmarkedPuzzles();
    const index = bookmarks.indexOf(puzzleId);
    let bookmarked = false;

    if (index === -1) {
      bookmarks.push(puzzleId);
      bookmarked = true;
    } else {
      bookmarks.splice(index, 1);
    }
    this.set('chess_bookmarked_puzzles', bookmarks);
    return bookmarked;
  }

  public isPuzzleBookmarked(puzzleId: number): boolean {
    return this.getBookmarkedPuzzles().includes(puzzleId);
  }

  // --- ELO Rating Database ---
  public getUserElo(): number {
    const elo = this.get<number>('chess_user_elo');
    return elo !== null ? elo : 1200;
  }

  public saveUserElo(elo: number) {
    this.set('chess_user_elo', elo);
  }

  // --- Diagnostics & Reset ---
  public clearAllData() {
    if (this.isAvailable) {
      localStorage.removeItem('chess_active_game');
      localStorage.removeItem('chess_game_history');
      localStorage.removeItem('chess_bookmarked_puzzles');
      localStorage.removeItem('chess_settings');
      localStorage.removeItem('chess_user_elo');
    }
    this.memoryDb = {};
    this.saveSettings(DEFAULT_SETTINGS);
  }
}

export const storageService = new StorageService();
export default storageService;
