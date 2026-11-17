import { Song } from '../types/music';

export interface PodcastEpisode {
  id: string; // YouTube Video ID
  title: string;
  channel: string;
  channelAvatar: string;
  category: 'horror' | 'crime' | 'chill' | 'knowledge' | 'lifestyle';
  categoryLabel: string;
  duration: number;
  thumbnail: string;
  streamUrl: string;
  description: string;
  publishedDate: string;
  listens: string;
}

export interface PodcastChannel {
  id: string;
  name: string;
  host: string;
  avatar: string;
  banner: string;
  description: string;
  category: string;
  subscribers: string;
  episodes: PodcastEpisode[];
}

const PODCAST_PROGRESS_KEY = 'papabvtify_podcast_progress_v1';

export const PODCAST_CHANNELS: PodcastChannel[] = [
  {
    id: 'nadia-omara',
    name: 'Nadia Omara',
    host: 'Nadia Omara',
    avatar: 'https://i.ytimg.com/vi/tnHAK8H_tvk/hqdefault.jpg',
    banner: 'https://i.ytimg.com/vi/tnHAK8H_tvk/hqdefault.jpg',
    description: 'Kisah misteri, true crime, sejarah unik, dan cerita kiriman netizen yang dikemas khas dan menghibur.',
    category: 'Horor & True Crime',
    subscribers: '9.8M Pelanggan',
    episodes: [
      {
        id: 'tnHAK8H_tvk',
        title: 'Misteri Hilangnya Kru Kapal Mary Celeste — Kapal Hantu Samudera Atlantik',
        channel: 'Nadia Omara',
        channelAvatar: 'https://i.ytimg.com/vi/tnHAK8H_tvk/hqdefault.jpg',
        category: 'crime',
        categoryLabel: 'True Crime',
        duration: 1721,
        thumbnail: 'https://i.ytimg.com/vi/tnHAK8H_tvk/hqdefault.jpg',
        streamUrl: '/api/stream?id=tnHAK8H_tvk',
        description: 'Pembahasan mendalam tentang salah satu teka-teki maritim terbesar sepanjang sejarah.',
        publishedDate: '1 minggu lalu',
        listens: '1.4M'
      },
      {
        id: '_wR61uj1cDA',
        title: 'Kisah Nyata Pendakian Berujung Gaib — ZAQIAH KHW Part 404',
        channel: 'Nadia Omara',
        channelAvatar: 'https://i.ytimg.com/vi/tnHAK8H_tvk/hqdefault.jpg',
        category: 'horror',
        categoryLabel: 'Horor & Misteri',
        duration: 1731,
        thumbnail: 'https://i.ytimg.com/vi/_wR61uj1cDA/hqdefault.jpg',
        streamUrl: '/api/stream?id=_wR61uj1cDA',
        description: 'Kisah pengalaman nyata pendaki yang tersesat di dimensi pasar gaib misterius.',
        publishedDate: '2 minggu lalu',
        listens: '2.1M'
      }
    ]
  },
  {
    id: 'lentera-malam',
    name: 'Lentera Malam',
    host: 'Adit & Jamal',
    avatar: 'https://i.ytimg.com/vi/6E1FTnem1IE/hqdefault.jpg',
    banner: 'https://i.ytimg.com/vi/6E1FTnem1IE/hqdefault.jpg',
    description: 'Podcast horor dan cerita mistis nyata langsung dari narasumber pertama yang mengalaminya.',
    category: 'Horor Pengalaman Nyata',
    subscribers: '4.2M Pelanggan',
    episodes: [
      {
        id: '6E1FTnem1IE',
        title: 'Merinding Parah !! Ini Kos Sarang Pocong Paling Seram di Jogja',
        channel: 'Lentera Malam',
        channelAvatar: 'https://i.ytimg.com/vi/6E1FTnem1IE/hqdefault.jpg',
        category: 'horror',
        categoryLabel: 'Horor Nyata',
        duration: 3994,
        thumbnail: 'https://i.ytimg.com/vi/6E1FTnem1IE/hqdefault.jpg',
        streamUrl: '/api/stream?id=6E1FTnem1IE',
        description: 'Pengalaman nyata penghuni kos saat menghadapi teror makhluk tak kasat mata selama berbulan-bulan.',
        publishedDate: '3 hari lalu',
        listens: '1.8M'
      },
      {
        id: 'plgPVQg1o0o',
        title: '2,5 Juta/Hari.. Warung Laris Gila-Gilaan Ada Jinnya !! Pelaku Pesugihan Pasar',
        channel: 'Lentera Malam',
        channelAvatar: 'https://i.ytimg.com/vi/6E1FTnem1IE/hqdefault.jpg',
        category: 'horror',
        categoryLabel: 'Horor Nyata',
        duration: 3923,
        thumbnail: 'https://i.ytimg.com/vi/plgPVQg1o0o/hqdefault.jpg',
        streamUrl: '/api/stream?id=plgPVQg1o0o',
        description: 'Investigasi pengakuan mantan pelaku pesugihan pasar tradisional dan perjanjian kelamnya.',
        publishedDate: '5 hari lalu',
        listens: '2.4M'
      }
    ]
  },
  {
    id: 'rintik-sedu',
    name: 'Rintik Sedu',
    host: 'Nadhifa Allya Tsana',
    avatar: 'https://i.ytimg.com/vi/6WDASLIxfYg/hqdefault.jpg',
    banner: 'https://i.ytimg.com/vi/6WDASLIxfYg/hqdefault.jpg',
    description: 'Teman bicara di malam hari. Renungan hangat tentang cinta, kehilangan, dan menerima diri sendiri.',
    category: 'Chill & Storytelling',
    subscribers: '3.6M Pelanggan',
    episodes: [
      {
        id: '6WDASLIxfYg',
        title: 'Life After Jatuh Cinta Sendirian — Rintik Sedu Podcast',
        channel: 'Rintik Sedu',
        channelAvatar: 'https://i.ytimg.com/vi/6WDASLIxfYg/hqdefault.jpg',
        category: 'chill',
        categoryLabel: 'Cerita Malam',
        duration: 867,
        thumbnail: 'https://i.ytimg.com/vi/6WDASLIxfYg/hqdefault.jpg',
        streamUrl: '/api/stream?id=6WDASLIxfYg',
        description: 'Malam ini, istirahatlah. Tidak semua hal harus kamu selesaikan sekaligus hari ini.',
        publishedDate: '4 hari lalu',
        listens: '1.2M'
      },
      {
        id: '5_jiR9_xg5Y',
        title: 'Capek Gak Sih? Salam Kenal Mulu — Rintik Sedu Podcast',
        channel: 'Rintik Sedu',
        channelAvatar: 'https://i.ytimg.com/vi/6WDASLIxfYg/hqdefault.jpg',
        category: 'lifestyle',
        categoryLabel: 'Self Reflection',
        duration: 971,
        thumbnail: 'https://i.ytimg.com/vi/5_jiR9_xg5Y/hqdefault.jpg',
        streamUrl: '/api/stream?id=5_jiR9_xg5Y',
        description: 'Sebuah pesan tentang melepaskan beban batin demi kedamaian langkahmu ke depan.',
        publishedDate: '1 minggu lalu',
        listens: '940K'
      }
    ]
  },
  {
    id: 'curhat-bang',
    name: 'CURHAT BANG Denny Sumargo',
    host: 'Denny Sumargo',
    avatar: 'https://i.ytimg.com/vi/Sy_S4TgvKbY/hqdefault.jpg',
    banner: 'https://i.ytimg.com/vi/Sy_S4TgvKbY/hqdefault.jpg',
    description: 'Obrolan mendalam tanpa sensor bersama figur publik dan orang-orang luar biasa.',
    category: 'Talkshow & Inspirasi',
    subscribers: '6.5M Pelanggan',
    episodes: [
      {
        id: 'Sy_S4TgvKbY',
        title: 'MASTER SAIFUL MENGAMUK⁉️ JANGAN PANGGIL AKU MUTANT‼️ - Akhirnya Bertemu Tretan Muslim',
        channel: 'CURHAT BANG Denny Sumargo',
        channelAvatar: 'https://i.ytimg.com/vi/Sy_S4TgvKbY/hqdefault.jpg',
        category: 'lifestyle',
        categoryLabel: 'Talkshow',
        duration: 3219,
        thumbnail: 'https://i.ytimg.com/vi/Sy_S4TgvKbY/hqdefault.jpg',
        streamUrl: '/api/stream?id=Sy_S4TgvKbY',
        description: 'Podcast obrolan santai, viral, dan penuh kejutan dari sudut pandang narasumber.',
        publishedDate: '2 hari lalu',
        listens: '3.1M'
      }
    ]
  }
];

export class PodcastService {
  public static getAllChannels(): PodcastChannel[] {
    return PODCAST_CHANNELS;
  }

  public static getChannelById(id: string): PodcastChannel | undefined {
    return PODCAST_CHANNELS.find(c => c.id === id);
  }

  public static getAllEpisodes(): PodcastEpisode[] {
    const list: PodcastEpisode[] = [];
    for (const c of PODCAST_CHANNELS) {
      list.push(...c.episodes);
    }
    return list;
  }

  public static getEpisodesByCategory(category: string): PodcastEpisode[] {
    if (category === 'all') return this.getAllEpisodes();
    return this.getAllEpisodes().filter(e => e.category === category);
  }

  public static getProgress(episodeId: string): number {
    try {
      const saved = localStorage.getItem(PODCAST_PROGRESS_KEY);
      if (saved) {
        const map = JSON.parse(saved);
        return map[episodeId] || 0;
      }
    } catch {}
    return 0;
  }

  public static saveProgress(episodeId: string, seconds: number): void {
    try {
      const saved = localStorage.getItem(PODCAST_PROGRESS_KEY);
      const map = saved ? JSON.parse(saved) : {};
      map[episodeId] = seconds;
      localStorage.setItem(PODCAST_PROGRESS_KEY, JSON.stringify(map));
    } catch {}
  }

  /**
   * Converts a PodcastEpisode into standard Song object for unified playback
   */
  public static toSong(ep: PodcastEpisode): Song {
    return {
      id: ep.id,
      title: ep.title,
      artist: ep.channel,
      album: `Podcast • ${ep.categoryLabel}`,
      duration: ep.duration,
      thumbnail: ep.thumbnail,
      streamUrl: ep.streamUrl,
      liked: false,
      plays: ep.listens
    };
  }
}
