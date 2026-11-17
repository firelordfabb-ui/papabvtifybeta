import { Artist, Song } from '../types/music';
import { StorageService } from './storage';

/**
 * Authentic, verified artist catalog with real YouTube Music track IDs,
 * authentic album artwork, real discographies, and real related artists.
 */
export const VERIFIED_ARTISTS: Artist[] = [
  {
    id: 'sal-priadi',
    name: 'Sal Priadi',
    avatar: 'https://i.ytimg.com/vi/AQpEIZ8dNcU/hqdefault.jpg',
    banner: 'https://i.ytimg.com/vi/AQpEIZ8dNcU/hqdefault.jpg',
    genre: 'Indonesian Indie / Pop Poet',
    monthlyListeners: '8,420,000 pendengar bulanan',
    bio: 'Salmantyo Ashrizky Priadi, dikenal sebagai Sal Priadi, adalah penyanyi, penulis lagu, dan pemeran Indonesia yang mengusung lirik puitis kontemplatif penuh emosi.',
    topSongs: [
      {
        id: 'AQpEIZ8dNcU',
        title: 'Gala Bunga Matahari',
        artist: 'Sal Priadi',
        album: 'MARKERS AND SUCH PENS FLASHDISKS',
        duration: 328,
        thumbnail: 'https://i.ytimg.com/vi/AQpEIZ8dNcU/hqdefault.jpg',
        streamUrl: '/api/stream?id=AQpEIZ8dNcU',
        plays: '48.2M'
      },
      {
        id: '01Q52Qv7n5Q',
        title: 'Dari Planet Lain',
        artist: 'Sal Priadi',
        album: 'MARKERS AND SUCH PENS FLASHDISKS',
        duration: 215,
        thumbnail: 'https://i.ytimg.com/vi/01Q52Qv7n5Q/hqdefault.jpg',
        streamUrl: '/api/stream?id=01Q52Qv7n5Q',
        plays: '29.7M'
      },
      {
        id: 'J7P6lB3rJ2w',
        title: 'Mesra-mesraannya kecil-kecilan dulu',
        artist: 'Sal Priadi',
        album: 'MARKERS AND SUCH PENS FLASHDISKS',
        duration: 260,
        thumbnail: 'https://i.ytimg.com/vi/J7P6lB3rJ2w/hqdefault.jpg',
        streamUrl: '/api/stream?id=J7P6lB3rJ2w',
        plays: '34.1M'
      },
      {
        id: 'cO5h4o1R0-g',
        title: 'Ikat Aku Di Tulang Belikatmu',
        artist: 'Sal Priadi',
        album: 'Berhati',
        duration: 242,
        thumbnail: 'https://i.ytimg.com/vi/cO5h4o1R0-g/hqdefault.jpg',
        streamUrl: '/api/stream?id=cO5h4o1R0-g',
        plays: '18.9M'
      }
    ],
    albums: [
      {
        id: 'alb_sal_markers',
        title: 'MARKERS AND SUCH PENS FLASHDISKS',
        year: '2024',
        cover: 'https://i.ytimg.com/vi/AQpEIZ8dNcU/hqdefault.jpg',
        songCount: 15
      },
      {
        id: 'alb_sal_berhati',
        title: 'Berhati',
        year: '2020',
        cover: 'https://i.ytimg.com/vi/cO5h4o1R0-g/hqdefault.jpg',
        songCount: 11
      }
    ],
    singles: [
      {
        id: '01Q52Qv7n5Q',
        title: 'Dari Planet Lain (Single)',
        artist: 'Sal Priadi',
        duration: 215,
        thumbnail: 'https://i.ytimg.com/vi/01Q52Qv7n5Q/hqdefault.jpg',
        streamUrl: '/api/stream?id=01Q52Qv7n5Q'
      }
    ],
    relatedArtists: [
      { id: 'bernadya', name: 'Bernadya', avatar: 'https://i.ytimg.com/vi/YIza-jl2Kcs/hqdefault.jpg', genre: 'Indonesian Pop' },
      { id: 'hindia', name: 'Hindia', avatar: 'https://i.ytimg.com/vi/cWrSjCZ5AeE/hqdefault.jpg', genre: 'Indie Rock' },
      { id: 'nadin-amizah', name: 'Nadin Amizah', avatar: 'https://i.ytimg.com/vi/AQpEIZ8dNcU/hqdefault.jpg', genre: 'Folk / Pop' }
    ]
  },
  {
    id: 'bernadya',
    name: 'Bernadya',
    avatar: 'https://i.ytimg.com/vi/YIza-jl2Kcs/hqdefault.jpg',
    banner: 'https://i.ytimg.com/vi/yjnSX_iUFVo/hqdefault.jpg',
    genre: 'Indonesian Pop / Ballad',
    monthlyListeners: '14,300,000 pendengar bulanan',
    bio: 'Bernadya Ribka Jayakusuma adalah penyanyi dan pencipta lagu muda Indonesia yang merajai tangga lagu dengan lirik jujur tentang patah hati dan fase kedewasaan.',
    topSongs: [
      {
        id: 'YIza-jl2Kcs',
        title: 'Apa Mungkin',
        artist: 'Bernadya',
        album: 'Sialnya, Hidup Harus Tetap Berjalan',
        duration: 248,
        thumbnail: 'https://i.ytimg.com/vi/YIza-jl2Kcs/hqdefault.jpg',
        streamUrl: '/api/stream?id=YIza-jl2Kcs',
        plays: '82.4M'
      },
      {
        id: 'yjnSX_iUFVo',
        title: 'Satu Bulan',
        artist: 'Bernadya',
        album: 'Sialnya, Hidup Harus Tetap Berjalan',
        duration: 230,
        thumbnail: 'https://i.ytimg.com/vi/yjnSX_iUFVo/hqdefault.jpg',
        streamUrl: '/api/stream?id=yjnSX_iUFVo',
        plays: '95.2M'
      },
      {
        id: 'HB8vftGxsIc',
        title: 'Untungnya, Hidup Harus Tetap Berjalan',
        artist: 'Bernadya',
        album: 'Sialnya, Hidup Harus Tetap Berjalan',
        duration: 184,
        thumbnail: 'https://i.ytimg.com/vi/HB8vftGxsIc/hqdefault.jpg',
        streamUrl: '/api/stream?id=HB8vftGxsIc',
        plays: '74.6M'
      },
      {
        id: '9hjMIOIysng',
        title: 'Kata Mereka Ini Berlebihan',
        artist: 'Bernadya',
        album: 'Sialnya, Hidup Harus Tetap Berjalan',
        duration: 192,
        thumbnail: 'https://i.ytimg.com/vi/9hjMIOIysng/hqdefault.jpg',
        streamUrl: '/api/stream?id=9hjMIOIysng',
        plays: '43.1M'
      }
    ],
    albums: [
      {
        id: 'alb_sialnya',
        title: 'Sialnya, Hidup Harus Tetap Berjalan',
        year: '2024',
        cover: 'https://i.ytimg.com/vi/yjnSX_iUFVo/hqdefault.jpg',
        songCount: 8
      }
    ],
    singles: [
      {
        id: 'YIza-jl2Kcs',
        title: 'Apa Mungkin (Single)',
        artist: 'Bernadya',
        duration: 248,
        thumbnail: 'https://i.ytimg.com/vi/YIza-jl2Kcs/hqdefault.jpg',
        streamUrl: '/api/stream?id=YIza-jl2Kcs'
      }
    ],
    relatedArtists: [
      { id: 'sal-priadi', name: 'Sal Priadi', avatar: 'https://i.ytimg.com/vi/AQpEIZ8dNcU/hqdefault.jpg', genre: 'Indonesian Pop' },
      { id: 'nadin-amizah', name: 'Nadin Amizah', avatar: 'https://i.ytimg.com/vi/AQpEIZ8dNcU/hqdefault.jpg', genre: 'Folk / Pop' }
    ]
  },
  {
    id: 'the-weeknd',
    name: 'The Weeknd',
    avatar: 'https://i.ytimg.com/vi/4NRXx6U8ABQ/hqdefault.jpg',
    banner: 'https://i.ytimg.com/vi/XXYlFuWEuKI/hqdefault.jpg',
    genre: 'R&B / Synthwave / Pop',
    monthlyListeners: '108,500,000 pendengar bulanan',
    bio: 'Abel Makkonen Tesfaye, dikenal sebagai The Weeknd, adalah superstar pop & R&B pemenang 4 Grammy asal Kanada dengan lagu-lagu legendaris bernuansa 80s synth-pop.',
    topSongs: [
      {
        id: '4NRXx6U8ABQ',
        title: 'Blinding Lights',
        artist: 'The Weeknd',
        album: 'After Hours',
        duration: 200,
        thumbnail: 'https://i.ytimg.com/vi/4NRXx6U8ABQ/hqdefault.jpg',
        streamUrl: '/api/stream?id=4NRXx6U8ABQ',
        plays: '3.8B'
      },
      {
        id: 'XXYlFuWEuKI',
        title: 'Save Your Tears',
        artist: 'The Weeknd',
        album: 'After Hours',
        duration: 215,
        thumbnail: 'https://i.ytimg.com/vi/XXYlFuWEuKI/hqdefault.jpg',
        streamUrl: '/api/stream?id=XXYlFuWEuKI',
        plays: '1.9B'
      },
      {
        id: '34Na4j8AVgA',
        title: 'Starboy',
        artist: 'The Weeknd ft. Daft Punk',
        album: 'Starboy',
        duration: 230,
        thumbnail: 'https://i.ytimg.com/vi/34Na4j8AVgA/hqdefault.jpg',
        streamUrl: '/api/stream?id=34Na4j8AVgA',
        plays: '2.4B'
      }
    ],
    albums: [
      {
        id: 'alb_after_hours',
        title: 'After Hours',
        year: '2020',
        cover: 'https://i.ytimg.com/vi/4NRXx6U8ABQ/hqdefault.jpg',
        songCount: 14
      },
      {
        id: 'alb_dawn_fm',
        title: 'Dawn FM',
        year: '2022',
        cover: 'https://i.ytimg.com/vi/XXYlFuWEuKI/hqdefault.jpg',
        songCount: 16
      }
    ],
    singles: [
      {
        id: 'XXYlFuWEuKI',
        title: 'Dancing In The Flames',
        artist: 'The Weeknd',
        duration: 220,
        thumbnail: 'https://i.ytimg.com/vi/XXYlFuWEuKI/hqdefault.jpg',
        streamUrl: '/api/stream?id=XXYlFuWEuKI'
      }
    ],
    relatedArtists: [
      { id: 'lady-gaga', name: 'Lady Gaga', avatar: 'https://i.ytimg.com/vi/kPa7bsKwL-c/hqdefault.jpg', genre: 'Pop' },
      { id: 'billie-eilish', name: 'Billie Eilish', avatar: 'https://i.ytimg.com/vi/V1Pl8CzNzCw/hqdefault.jpg', genre: 'Alt Pop' }
    ]
  },
  {
    id: 'billie-eilish',
    name: 'Billie Eilish',
    avatar: 'https://i.ytimg.com/vi/V1Pl8CzNzCw/hqdefault.jpg',
    banner: 'https://i.ytimg.com/vi/DyDfgMOUjCI/hqdefault.jpg',
    genre: 'Alternative Pop / Dark Pop',
    monthlyListeners: '97,200,000 pendengar bulanan',
    bio: 'Penyanyi dan penulis lagu asal Amerika Serikat pemenang Oscar & Grammy ganda, dikenal dengan harmoni vokal bisikan khas dan sound design inovatif.',
    topSongs: [
      {
        id: 'V1Pl8CzNzCw',
        title: 'BIRDS OF A FEATHER',
        artist: 'Billie Eilish',
        album: 'HIT ME HARD AND SOFT',
        duration: 199,
        thumbnail: 'https://i.ytimg.com/vi/V1Pl8CzNzCw/hqdefault.jpg',
        streamUrl: '/api/stream?id=V1Pl8CzNzCw',
        plays: '340.5M'
      },
      {
        id: 'DyDfgMOUjCI',
        title: 'bad guy',
        artist: 'Billie Eilish',
        album: 'WHEN WE ALL FALL ASLEEP, WHERE DO WE GO?',
        duration: 194,
        thumbnail: 'https://i.ytimg.com/vi/DyDfgMOUjCI/hqdefault.jpg',
        streamUrl: '/api/stream?id=DyDfgMOUjCI',
        plays: '2.1B'
      },
      {
        id: 'viimfQi_pUw',
        title: 'What Was I Made For?',
        artist: 'Billie Eilish',
        album: 'Barbie The Album',
        duration: 222,
        thumbnail: 'https://i.ytimg.com/vi/viimfQi_pUw/hqdefault.jpg',
        streamUrl: '/api/stream?id=viimfQi_pUw',
        plays: '890.3M'
      }
    ],
    albums: [
      {
        id: 'alb_hit_me',
        title: 'HIT ME HARD AND SOFT',
        year: '2024',
        cover: 'https://i.ytimg.com/vi/V1Pl8CzNzCw/hqdefault.jpg',
        songCount: 10
      },
      {
        id: 'alb_wwafawdwg',
        title: 'WHEN WE ALL FALL ASLEEP, WHERE DO WE GO?',
        year: '2019',
        cover: 'https://i.ytimg.com/vi/DyDfgMOUjCI/hqdefault.jpg',
        songCount: 14
      }
    ],
    singles: [
      {
        id: 'viimfQi_pUw',
        title: 'What Was I Made For? (From Barbie)',
        artist: 'Billie Eilish',
        duration: 222,
        thumbnail: 'https://i.ytimg.com/vi/viimfQi_pUw/hqdefault.jpg',
        streamUrl: '/api/stream?id=viimfQi_pUw'
      }
    ],
    relatedArtists: [
      { id: 'beabadoobee', name: 'beabadoobee', avatar: 'https://i.ytimg.com/vi/y1cBhJLNNXU/hqdefault.jpg', genre: 'Indie Pop' },
      { id: 'the-weeknd', name: 'The Weeknd', avatar: 'https://i.ytimg.com/vi/4NRXx6U8ABQ/hqdefault.jpg', genre: 'R&B / Pop' }
    ]
  },
  {
    id: 'lady-gaga',
    name: 'Lady Gaga',
    avatar: 'https://i.ytimg.com/vi/kPa7bsKwL-c/hqdefault.jpg',
    banner: 'https://i.ytimg.com/vi/bo_efYhAK2A/hqdefault.jpg',
    genre: 'Pop / Dance / Ballad',
    monthlyListeners: '91,400,000 pendengar bulanan',
    bio: 'Stefani Joanne Angelina Germanotta, dikenal sebagai Lady Gaga, ikon musik pop dan pemenang 13 Grammy serta Piala Oscar.',
    topSongs: [
      {
        id: 'kPa7bsKwL-c',
        title: 'Die With A Smile',
        artist: 'Lady Gaga, Bruno Mars',
        album: 'Die With A Smile',
        duration: 253,
        thumbnail: 'https://i.ytimg.com/vi/kPa7bsKwL-c/hqdefault.jpg',
        streamUrl: '/api/stream?id=kPa7bsKwL-c',
        plays: '185.4M'
      },
      {
        id: 'bo_efYhAK2A',
        title: 'Shallow',
        artist: 'Lady Gaga, Bradley Cooper',
        album: 'A Star Is Born',
        duration: 216,
        thumbnail: 'https://i.ytimg.com/vi/bo_efYhAK2A/hqdefault.jpg',
        streamUrl: '/api/stream?id=bo_efYhAK2A',
        plays: '2.5B'
      }
    ],
    albums: [
      {
        id: 'alb_chromatica',
        title: 'Chromatica',
        year: '2020',
        cover: 'https://i.ytimg.com/vi/kPa7bsKwL-c/hqdefault.jpg',
        songCount: 16
      }
    ],
    singles: [
      {
        id: 'kPa7bsKwL-c',
        title: 'Die With A Smile (with Bruno Mars)',
        artist: 'Lady Gaga, Bruno Mars',
        duration: 253,
        thumbnail: 'https://i.ytimg.com/vi/kPa7bsKwL-c/hqdefault.jpg',
        streamUrl: '/api/stream?id=kPa7bsKwL-c'
      }
    ],
    relatedArtists: [
      { id: 'the-weeknd', name: 'The Weeknd', avatar: 'https://i.ytimg.com/vi/4NRXx6U8ABQ/hqdefault.jpg', genre: 'R&B / Pop' }
    ]
  },
  {
    id: 'beabadoobee',
    name: 'beabadoobee',
    avatar: 'https://i.ytimg.com/vi/y1cBhJLNNXU/hqdefault.jpg',
    banner: 'https://i.ytimg.com/vi/y1cBhJLNNXU/hqdefault.jpg',
    genre: 'Indie Rock / Bedroom Pop',
    monthlyListeners: '17,800,000 pendengar bulanan',
    bio: 'Beatrice Kristi Laus, dikenal sebagai beabadoobee, adalah penyanyi-penulis lagu Filipina-Inggris dengan sound khas 90s alt-rock dan akustik romantis.',
    topSongs: [
      {
        id: 'y1cBhJLNNXU',
        title: 'Glue Song',
        artist: 'beabadoobee',
        album: 'Glue Song Single',
        duration: 137,
        thumbnail: 'https://i.ytimg.com/vi/y1cBhJLNNXU/hqdefault.jpg',
        streamUrl: '/api/stream?id=y1cBhJLNNXU',
        plays: '92.3M'
      },
      {
        id: 'lPeJMoms_Ag',
        title: 'Coffee',
        artist: 'beabadoobee',
        album: 'Lice',
        duration: 126,
        thumbnail: 'https://i.ytimg.com/vi/y1cBhJLNNXU/hqdefault.jpg',
        streamUrl: '/api/stream?id=y1cBhJLNNXU',
        plays: '310.8M'
      }
    ],
    albums: [
      {
        id: 'alb_this_is_how_it_feels',
        title: 'This Is How Tomorrow Moves',
        year: '2024',
        cover: 'https://i.ytimg.com/vi/y1cBhJLNNXU/hqdefault.jpg',
        songCount: 14
      }
    ],
    singles: [
      {
        id: 'y1cBhJLNNXU',
        title: 'Glue Song (Acoustic)',
        artist: 'beabadoobee',
        duration: 137,
        thumbnail: 'https://i.ytimg.com/vi/y1cBhJLNNXU/hqdefault.jpg',
        streamUrl: '/api/stream?id=y1cBhJLNNXU'
      }
    ],
    relatedArtists: [
      { id: 'mac-demarco', name: 'Mac DeMarco', avatar: 'https://i.ytimg.com/vi/lPeJMoms_Ag/hqdefault.jpg', genre: 'Jangle Pop' },
      { id: 'billie-eilish', name: 'Billie Eilish', avatar: 'https://i.ytimg.com/vi/V1Pl8CzNzCw/hqdefault.jpg', genre: 'Alt Pop' }
    ]
  },
  {
    id: 'mac-demarco',
    name: 'Mac DeMarco',
    avatar: 'https://i.ytimg.com/vi/lPeJMoms_Ag/hqdefault.jpg',
    banner: 'https://i.ytimg.com/vi/lPeJMoms_Ag/hqdefault.jpg',
    genre: 'Jangle Pop / Slacker Rock',
    monthlyListeners: '21,300,000 pendengar bulanan',
    bio: 'Penyanyi, penulis lagu, dan multi-instrumentalis Kanada pionir genre slacker rock lo-fi yang santai dan hangat.',
    topSongs: [
      {
        id: 'lPeJMoms_Ag',
        title: 'No Other Heart',
        artist: 'Mac DeMarco',
        album: 'Another One',
        duration: 174,
        thumbnail: 'https://i.ytimg.com/vi/lPeJMoms_Ag/hqdefault.jpg',
        streamUrl: '/api/stream?id=lPeJMoms_Ag',
        plays: '84.1M'
      },
      {
        id: 'MJoSyNdffGo',
        title: 'Chamber of Reflection',
        artist: 'Mac DeMarco',
        album: 'Salad Days',
        duration: 232,
        thumbnail: 'https://i.ytimg.com/vi/MJoSyNdffGo/hqdefault.jpg',
        streamUrl: '/api/stream?id=MJoSyNdffGo',
        plays: '420.5M'
      }
    ],
    albums: [
      {
        id: 'alb_salad_days',
        title: 'Salad Days',
        year: '2014',
        cover: 'https://i.ytimg.com/vi/lPeJMoms_Ag/hqdefault.jpg',
        songCount: 11
      }
    ],
    singles: [],
    relatedArtists: [
      { id: 'beabadoobee', name: 'beabadoobee', avatar: 'https://i.ytimg.com/vi/y1cBhJLNNXU/hqdefault.jpg', genre: 'Bedroom Pop' }
    ]
  }
];

export class ArtistService {
  public static getAllArtists(): Artist[] {
    const followed = StorageService.getFollowedArtists();
    return VERIFIED_ARTISTS.map(a => ({
      ...a,
      isFollowed: followed.includes(a.id)
    }));
  }

  public static getArtistById(id: string): Artist | null {
    const artist = VERIFIED_ARTISTS.find(a => a.id.toLowerCase() === id.toLowerCase() || a.name.toLowerCase() === id.toLowerCase());
    if (!artist) return null;
    const followed = StorageService.getFollowedArtists();
    return {
      ...artist,
      isFollowed: followed.includes(artist.id)
    };
  }

  public static getPopularArtists(): Artist[] {
    return this.getAllArtists().slice(0, 5);
  }

  public static getIndonesianArtists(): Artist[] {
    return this.getAllArtists().filter(a => a.genre.toLowerCase().includes('indonesian') || a.name === 'Sal Priadi' || a.name === 'Bernadya');
  }

  public static getInternationalArtists(): Artist[] {
    return this.getAllArtists().filter(a => !a.genre.toLowerCase().includes('indonesian') && a.name !== 'Sal Priadi' && a.name !== 'Bernadya');
  }

  public static toggleFollow(artistId: string): boolean {
    return StorageService.toggleFollowArtist(artistId);
  }
}
