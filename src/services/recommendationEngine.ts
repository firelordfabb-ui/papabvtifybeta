import { Song, RecommendationConfig, RecommendationMode } from '../types/music';
import { StorageService } from './storage';
import { REFERENCE_PLAYLIST, InnerTubeService } from './innertube';
import { ArtistService } from './artistService';

export class RecommendationEngine {
  private static recommendationConfig: RecommendationConfig = {
    mode: 'similar_vibes',
    explorationLevel: 30
  };

  public static setRecommendationConfig(config: Partial<RecommendationConfig>): void {
    this.recommendationConfig = {
      ...this.recommendationConfig,
      ...config
    };
  }

  public static getRecommendationConfig(): RecommendationConfig {
    return { ...this.recommendationConfig };
  }
  /**
   * Evaluates user listening profiles: top artists, top genres, play frequency
   */
  public static getUserTasteProfile(): {
    favoriteArtists: string[];
    favoriteGenres: string[];
    recentArtistIds: string[];
    likedSongIds: Set<string>;
  } {
    const stats = StorageService.getListeningStats();
    const recents = StorageService.getRecentlyPlayed();
    const favorites = StorageService.getFavorites();
    const likedSet = new Set(favorites);

    // Compute play frequency per artist from real recorded stats
    const artistScores = new Map<string, number>();
    const artistPlayCounts = stats.artistPlayCounts || {};
    for (const [artistName, item] of Object.entries(artistPlayCounts)) {
      if (artistName && item) {
        const score = (artistScores.get(artistName) || 0) + (item.count || 0) * 2;
        artistScores.set(artistName, score);
      }
    }

    const songPlayCounts = stats.songPlayCounts || {};
    for (const [, item] of Object.entries(songPlayCounts)) {
      if (item && item.song && item.song.artist) {
        const score = (artistScores.get(item.song.artist) || 0) + (item.count || 0);
        artistScores.set(item.song.artist, score);
      }
    }

    // Boost score for liked songs
    for (const song of recents) {
      if (song.artist) {
        const boost = likedSet.has(song.id) ? 5 : 2;
        const score = (artistScores.get(song.artist) || 0) + boost;
        artistScores.set(song.artist, score);
      }
    }

    const sortedArtists = Array.from(artistScores.entries())
      .sort((a, b) => b[1] - a[1])
      .map(entry => entry[0]);

    // Top genres from user preferences or fallback
    const favoriteGenres = ['Indonesian Pop', 'Pop', 'Indie', 'Acoustic'];

    const recentArtistIds = recents.map(s => s.artist).filter(Boolean);

    // Fallback artists across varied genres if user has no listening history yet
    const diverseStarterArtists = [
      'Bernadya',
      'Hindia',
      'Nadin Amizah',
      'The Weeknd',
      'Billie Eilish',
      'Sal Priadi',
      'beabadoobee',
      'Mac DeMarco',
      'Lady Gaga'
    ];

    return {
      favoriteArtists: sortedArtists.length > 0 ? sortedArtists : diverseStarterArtists,
      favoriteGenres,
      recentArtistIds,
      likedSongIds: likedSet
    };
  }

  /**
   * Personalized Mix: Combines frequent tracks, liked artists, and catalog discovery
   */
  public static getPersonalizedMix(): Song[] {
    const profile = this.getUserTasteProfile();
    const recents = StorageService.getRecentlyPlayed();
    const allArtists = ArtistService.getAllArtists();

    const pool: Song[] = [];
    const seen = new Set<string>();

    // 1. Prioritize songs from favorite artists
    for (const artistName of profile.favoriteArtists) {
      const art = allArtists.find(a => a.name.toLowerCase() === artistName.toLowerCase());
      if (art && art.topSongs) {
        for (const s of art.topSongs) {
          if (!seen.has(s.id)) {
            seen.add(s.id);
            pool.push({ ...s, liked: profile.likedSongIds.has(s.id) });
          }
        }
      }
    }

    // 2. Add recent favorites
    for (const s of recents) {
      if (!seen.has(s.id)) {
        seen.add(s.id);
        pool.push({ ...s, liked: profile.likedSongIds.has(s.id) });
      }
    }

    // 3. Fallback to reference playlist if pool is too small
    for (const s of REFERENCE_PLAYLIST) {
      if (!seen.has(s.id) && pool.length < 12) {
        seen.add(s.id);
        pool.push({ ...s, liked: profile.likedSongIds.has(s.id) });
      }
    }

    return pool.slice(0, 10);
  }

  /**
   * Discover Weekly: Fresh songs in the user's preferred genres that aren't overplayed
   */
  public static getDiscoverWeekly(): Song[] {
    const profile = this.getUserTasteProfile();
    const allArtists = ArtistService.getAllArtists();
    const seen = new Set<string>();
    const discover: Song[] = [];

    // Filter artists matching user genres
    const genreKeywords = profile.favoriteGenres.map(g => g.toLowerCase());
    const matchedArtists = allArtists.filter(a =>
      genreKeywords.some(gk => a.genre.toLowerCase().includes(gk))
    );

    for (const art of matchedArtists) {
      if (art.topSongs) {
        for (const s of art.topSongs) {
          if (!seen.has(s.id) && !profile.likedSongIds.has(s.id)) {
            seen.add(s.id);
            discover.push(s);
          }
        }
      }
    }

    // Add diversified catalog
    for (const s of REFERENCE_PLAYLIST) {
      if (!seen.has(s.id)) {
        seen.add(s.id);
        discover.push({ ...s, liked: profile.likedSongIds.has(s.id) });
      }
    }

    return discover.slice(0, 8);
  }

  /**
   * Similar To Current Taste: Finds songs matching musical energy, genre, or artist style
   */
  public static getSimilarToYourTaste(currentSong?: Song | null): Song[] {
    const profile = this.getUserTasteProfile();
    const allArtists = ArtistService.getAllArtists();
    const seen = new Set<string>();
    if (currentSong) seen.add(currentSong.id);

    const similar: Song[] = [];

    if (currentSong) {
      // Find current artist in catalog
      const curArt = allArtists.find(a =>
        a.name.toLowerCase() === currentSong.artist.toLowerCase() ||
        currentSong.artist.toLowerCase().includes(a.name.toLowerCase())
      );

      if (curArt) {
        // Related artists
        for (const rel of curArt.relatedArtists || []) {
          const relatedArtObj = allArtists.find(a => a.id === rel.id || a.name.toLowerCase() === rel.name.toLowerCase());
          if (relatedArtObj && relatedArtObj.topSongs) {
            for (const s of relatedArtObj.topSongs) {
              if (!seen.has(s.id)) {
                seen.add(s.id);
                similar.push({ ...s, liked: profile.likedSongIds.has(s.id) });
              }
            }
          }
        }
      }
    }

    // Fill with personalized mix
    for (const s of this.getPersonalizedMix()) {
      if (!seen.has(s.id) && similar.length < 8) {
        seen.add(s.id);
        similar.push(s);
      }
    }

    return similar.slice(0, 8);
  }

  /**
   * Recently Inspired: Recommendations based on the last 3 tracks played
   */
  public static getRecentlyInspired(): Song[] {
    const recents = StorageService.getRecentlyPlayed();
    if (recents.length === 0) return this.getPersonalizedMix();

    const lastTrack = recents[0];
    return this.getSimilarToYourTaste(lastTrack);
  }

  /**
   * Calculates similarity and affinity score between candidate song and current song + user profile
   */
  public static calculateSongSimilarityScore(
    candidate: Song,
    currentSong: Song,
    historyIds: string[],
    userProfile: { favoriteArtists: string[]; favoriteGenres: string[]; likedSongIds: Set<string> },
    config: RecommendationConfig
  ): number {
    let score = 0;

    // Hard reject if in immediate last 15 history
    const recentSlice = historyIds.slice(-15);
    if (recentSlice.includes(candidate.id)) {
      return -9999;
    }

    const candArtist = (candidate.artist || '').toLowerCase().trim();
    const currArtist = (currentSong.artist || '').toLowerCase().trim();
    const isSameArtist = candArtist === currArtist || candArtist.includes(currArtist) || currArtist.includes(candArtist);

    // 1. Artist Proximity & Anti-Repetition Rules
    if (isSameArtist) {
      // Check if artist already played recently
      const recentArtists = historyIds.slice(-4).map(id => {
        const found = REFERENCE_PLAYLIST.find(s => s.id === id);
        return found ? found.artist.toLowerCase() : '';
      });
      const sameArtistRecentCount = recentArtists.filter(a => a && a === candArtist).length;

      if (sameArtistRecentCount >= 2) {
        // Severe penalty: Avoid looping same artist 3+ times
        score -= 45;
      } else {
        // Mild boost for continuation
        score += 8;
      }
    }

    // 2. Genre / Subgenre Coherence
    const candGenre = (candidate.genre || '').toLowerCase();
    const currGenre = (currentSong.genre || '').toLowerCase();
    if (candGenre && currGenre) {
      if (candGenre === currGenre) {
        score += 20;
      } else if (candGenre.includes(currGenre) || currGenre.includes(candGenre)) {
        score += 14;
      }
    }

    // 3. Mood / Vibe Coherence
    const candMood = (candidate.mood || '').toLowerCase();
    const currMood = (currentSong.mood || '').toLowerCase();
    if (candMood && currMood) {
      if (candMood === currMood) {
        score += 15;
      }
    }

    // 4. Energy Proximity (0.0 - 1.0)
    if (candidate.energy !== undefined && currentSong.energy !== undefined) {
      const energyDiff = Math.abs(candidate.energy - currentSong.energy);
      score += Math.max(0, 12 * (1.0 - energyDiff));
    }

    // 5. Tempo / BPM Proximity
    if (candidate.tempo && currentSong.tempo) {
      const tempoDiff = Math.abs(candidate.tempo - currentSong.tempo);
      score += Math.max(0, 10 * (1.0 - Math.min(tempoDiff / 40, 1.0)));
    }

    // 6. User Affinity (Favorites, Likes, Plays)
    if (userProfile.likedSongIds.has(candidate.id)) {
      score += 14;
    }
    const isFavoriteArtist = userProfile.favoriteArtists.some(fa => fa.toLowerCase() === candArtist);
    if (isFavoriteArtist) {
      score += 10;
    }

    // 7. Mode-Specific Biases
    if (config.mode === 'familiar') {
      if (isFavoriteArtist || userProfile.likedSongIds.has(candidate.id)) {
        score += 25;
      }
    } else if (config.mode === 'similar_vibes') {
      // Prioritize smooth acoustic and genre coherence
      if (candGenre === currGenre) score += 10;
    } else if (config.mode === 'discovery') {
      // Discovery Mode: Reward fresh artists not in user's top history
      if (!isFavoriteArtist && !isSameArtist) {
        score += 22;
      }
      // Exploration level adds controlled stochastic noise (0 - 100%)
      const explorationFactor = (config.explorationLevel / 100) * (Math.random() * 24);
      score += explorationFactor;
    }

    return score;
  }

  /**
   * Smart Next Autoplay Engine:
   * Multi-dimensional similarity scoring + 3 Modes (Familiar, Similar Vibes, Discovery)
   * Anti-repetition, non-random coherent transitions.
   */
  public static async getNextAutoplaySong(currentSong: Song, historyIds: string[] = []): Promise<Song> {
    const historySet = new Set(historyIds);
    historySet.add(currentSong.id);

    const userProfile = this.getUserTasteProfile();
    const config = this.recommendationConfig;
    const allArtists = ArtistService.getAllArtists();

    const candidates: Song[] = [];
    const seen = new Set<string>();

    const addCandidate = (song: Song) => {
      if (song && song.id && !historySet.has(song.id) && song.id !== currentSong.id && !seen.has(song.id)) {
        seen.add(song.id);
        candidates.push({
          ...song,
          liked: userProfile.likedSongIds.has(song.id),
          isRecommended: true
        });
      }
    };

    // 1. Live Contextual Search based on current song and mode
    try {
      const cleanArtist = currentSong.artist.split(/[,&feat]/)[0].trim();
      let query = `${currentSong.title} ${cleanArtist}`;
      if (config.mode === 'similar_vibes') {
        query = `${cleanArtist} ${currentSong.genre || 'lagu populer'}`;
      } else if (config.mode === 'discovery') {
        query = `${currentSong.genre || 'pop indie'} fresh tracks`;
      }
      
      const liveResults = await InnerTubeService.search(query);
      if (liveResults && liveResults.length > 0) {
        for (const item of liveResults) {
          addCandidate(item);
          if (candidates.length >= 10) break;
        }
      }
    } catch (e) {
      console.warn('Live contextual search note:', e);
    }

    // 2. Related Artists from catalog
    const currentArtistObj = allArtists.find(a =>
      a.name.toLowerCase() === currentSong.artist.toLowerCase() ||
      currentSong.artist.toLowerCase().includes(a.name.toLowerCase())
    );

    if (currentArtistObj && currentArtistObj.relatedArtists) {
      for (const rel of currentArtistObj.relatedArtists) {
        const relObj = allArtists.find(a => a.id === rel.id || a.name.toLowerCase() === rel.name.toLowerCase());
        if (relObj && relObj.topSongs) {
          for (const s of relObj.topSongs) {
            addCandidate(s);
          }
        }
      }
    }

    // 3. Fallback to catalog songs & reference playlist
    for (const art of allArtists) {
      if (art.topSongs) {
        for (const s of art.topSongs) {
          addCandidate(s);
        }
      }
    }
    for (const s of REFERENCE_PLAYLIST) {
      addCandidate(s);
    }

    // 4. Score all candidates using multidimensional similarity scoring
    const scoredCandidates = candidates
      .map(cand => ({
        song: cand,
        score: this.calculateSongSimilarityScore(cand, currentSong, historyIds, userProfile, config)
      }))
      .filter(item => item.score > -100) // Filter out hard rejected items
      .sort((a, b) => b.score - a.score);

    if (scoredCandidates.length > 0) {
      // Pick with soft temperature from top 3 candidates to avoid rigid determinism
      const topSlice = scoredCandidates.slice(0, Math.min(3, scoredCandidates.length));
      const chosen = topSlice[Math.floor(Math.random() * topSlice.length)].song;
      
      let reason = 'Vibe akustik yang cocok';
      if (config.mode === 'discovery') {
        reason = 'Eksplorasi musik baru yang selaras';
      } else if (config.mode === 'familiar') {
        reason = `Berdasarkan artis favorit Anda (${chosen.artist})`;
      } else if (chosen.genre && currentSong.genre && chosen.genre.toLowerCase() === currentSong.genre.toLowerCase()) {
        reason = `Genre serupa: ${chosen.genre}`;
      } else if (chosen.artist.toLowerCase() === currentSong.artist.toLowerCase()) {
        reason = `Koleksi lain dari ${chosen.artist}`;
      } else if (chosen.mood && currentSong.mood) {
        reason = `Mood serupa: ${chosen.mood}`;
      }

      return {
        ...chosen,
        isRecommended: true,
        recommendationReason: reason
      };
    }

    // 5. Ultimate fallback if all else exhausted
    const unplayed = REFERENCE_PLAYLIST.filter(s => !historySet.has(s.id));
    if (unplayed.length > 0) {
      const chosen = unplayed[Math.floor(Math.random() * unplayed.length)];
      return {
        ...chosen,
        isRecommended: true,
        recommendationReason: 'Rekomendasi pilihan santai'
      };
    }

    const otherSongs = REFERENCE_PLAYLIST.filter(s => s.id !== currentSong.id);
    const chosen = otherSongs.length > 0 ? otherSongs[0] : REFERENCE_PLAYLIST[0];
    return {
      ...chosen,
      isRecommended: true,
      recommendationReason: 'Rekomendasi katalog PAPABVTIFY'
    };
  }
}
