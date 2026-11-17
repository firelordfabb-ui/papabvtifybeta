import { RadioStation } from '../types/music';

const makeRadioSvg = (code: string, color: string, bg: string): string => {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'>
    <defs>
      <linearGradient id='g' x1='0%' y1='0%' x2='100%' y2='100%'>
        <stop offset='0%' stop-color='${bg}'/>
        <stop offset='100%' stop-color='#0a0a14'/>
      </linearGradient>
    </defs>
    <rect width='200' height='200' rx='40' fill='url(#g)'/>
    <circle cx='100' cy='100' r='60' fill='none' stroke='${color}' stroke-width='4' opacity='0.3'/>
    <circle cx='100' cy='100' r='40' fill='none' stroke='${color}' stroke-width='4' opacity='0.6'/>
    <circle cx='100' cy='100' r='18' fill='${color}'/>
    <text x='100' y='170' font-family='monospace' font-size='22' font-weight='900' fill='#ffffff' text-anchor='middle' letter-spacing='2'>${code}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

export const CURATED_RADIO_STATIONS: RadioStation[] = [
  // INDONESIA
  {
    id: 'iradio-jakarta',
    name: 'I-Radio 89.6 FM Jakarta',
    country: 'Indonesia',
    countryCode: 'ID',
    genre: 'Pop Indonesia & Hits Terkini',
    streamUrl: 'https://stream.radiojar.com/4ywdgup3bnzuv',
    logo: makeRadioSvg('IRADIO', '#ff442b', '#3b1219')
  },
  {
    id: 'rri-pro3',
    name: 'RRI Pro 3 KBRN Nasional',
    country: 'Indonesia',
    countryCode: 'ID',
    genre: 'Berita & Musik Nusantara',
    streamUrl: 'https://stream-node0.rri.co.id/streaming/14/9014/kbrn.mp3',
    logo: makeRadioSvg('RRI PRO3', '#3b82f6', '#0f244a')
  },
  {
    id: 'mstream-indo',
    name: 'M-Stream Indie Jakarta',
    country: 'Indonesia',
    countryCode: 'ID',
    genre: 'Indie & Alternative Pop Indo',
    streamUrl: 'https://stream.zeno.fm/iln4upodbvuuv',
    logo: makeRadioSvg('INDIE', '#10b981', '#063623')
  },
  {
    id: 'sbfm-kenangan',
    name: 'SB FM Tembang Kenangan',
    country: 'Indonesia',
    countryCode: 'ID',
    genre: 'Nostalgia Klasik 80-90s',
    streamUrl: 'https://stream.zeno.fm/d16n50mkzhhvv',
    logo: makeRadioSvg('KENANGAN', '#f59e0b', '#422405')
  },

  // JEPANG / JAPAN
  {
    id: 'jpop-sakura',
    name: 'J-Pop Sakura 17 Tokyo',
    country: 'Jepang',
    countryCode: 'JP',
    genre: 'J-Pop, Anisong & City Pop',
    streamUrl: 'https://kathy.torontocast.com:3560/stream',
    logo: makeRadioSvg('J-POP', '#ec4899', '#40122a')
  },
  {
    id: 'anime-nami',
    name: 'Anime Nami Radio Japan',
    country: 'Jepang',
    countryCode: 'JP',
    genre: 'Anime OST, Vocaloid & Touhou',
    streamUrl: 'https://ssl.shoutcastnet.com:10174/',
    logo: makeRadioSvg('ANIME', '#a855f7', '#31104a')
  },

  // GLOBAL / US / UK
  {
    id: 'lofi-girl-live',
    name: 'Lofi Girl 24/7 Live Stream',
    country: 'Global',
    countryCode: 'WW',
    genre: 'Lo-Fi Chill Beats & Focus',
    streamUrl: 'https://play.streamafrica.net/lofiradio',
    logo: makeRadioSvg('LO-FI', '#6366f1', '#181b4d')
  },
  {
    id: 'kexp-seattle',
    name: 'KEXP 90.3 FM Seattle',
    country: 'Amerika Serikat',
    countryCode: 'US',
    genre: 'Indie Rock & Live In-Studio',
    streamUrl: 'https://kexp.streamguys1.com/kexp160.aac',
    logo: makeRadioSvg('KEXP', '#14b8a6', '#093630')
  },
  {
    id: 'bigb-kpop',
    name: 'Big B Radio K-POP Seoul',
    country: 'Korea Selatan',
    countryCode: 'KR',
    genre: 'K-Pop Hits & Charts',
    streamUrl: 'https://stream.zeno.fm/7x4yrb4cdchvv',
    logo: makeRadioSvg('K-POP', '#f43f5e', '#450d18')
  }
];

export class RadioService {
  public static getCuratedStations(countryFilter?: string): RadioStation[] {
    if (!countryFilter || countryFilter === 'Semua') {
      return CURATED_RADIO_STATIONS;
    }
    return CURATED_RADIO_STATIONS.filter(s => 
      s.country.toLowerCase().includes(countryFilter.toLowerCase()) || 
      s.countryCode.toLowerCase() === countryFilter.toLowerCase()
    );
  }

  public static async searchGlobalStations(query: string): Promise<RadioStation[]> {
    if (!query.trim()) return CURATED_RADIO_STATIONS;
    try {
      const res = await fetch(`https://de1.api.radio-browser.info/json/stations/byname/${encodeURIComponent(query)}?limit=15`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          return data.map((item: any) => ({
            id: `rb-${item.stationuuid}`,
            name: item.name || 'Radio Station',
            country: item.country || 'Global',
            countryCode: item.countrycode || 'WW',
            genre: item.tags || 'Live Radio',
            streamUrl: item.url_resolved || item.url,
            logo: item.favicon || makeRadioSvg((item.countrycode || 'LIVE').toUpperCase(), '#38bdf8', '#0c2738'),
            bitrate: item.bitrate
          }));
        }
      }
    } catch (err) {
      console.warn('Radio search error:', err);
    }
    return CURATED_RADIO_STATIONS.filter(s =>
      s.name.toLowerCase().includes(query.toLowerCase()) ||
      s.genre.toLowerCase().includes(query.toLowerCase())
    );
  }
}
