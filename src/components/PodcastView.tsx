import React, { useState } from 'react';
import { PodcastService, PodcastEpisode, PodcastChannel } from '../services/podcastService';
import { Song } from '../types/music';
import { ApiConfig } from '../services/apiConfig';
import {
  Radio,
  Play,
  Pause,
  Clock,
  Headphones,
  Sparkles,
  Flame,
  Moon,
  Search,
  BookOpen,
  Filter,
  CheckCircle2
} from 'lucide-react';

interface Props {
  currentSong: Song | null;
  isPlaying: boolean;
  onSelectSong: (song: Song) => void;
  onOpenPlayerModal?: () => void;
}

export const PodcastView: React.FC<Props> = ({
  currentSong,
  isPlaying,
  onSelectSong,
  onOpenPlayerModal
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedChannel, setSelectedChannel] = useState<PodcastChannel | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [livePodcastResults, setLivePodcastResults] = useState<PodcastEpisode[]>([]);
  const [isSearchingLive, setIsSearchingLive] = useState<boolean>(false);

  const channels = PodcastService.getAllChannels();
  const allEpisodes = PodcastService.getAllEpisodes();

  const categories = [
    { id: 'all', label: 'Semua Podcast', icon: Sparkles },
    { id: 'horror', label: 'Horor & Misteri', icon: Moon },
    { id: 'crime', label: 'True Crime', icon: Flame },
    { id: 'chill', label: 'Santai & Cerita', icon: Headphones },
    { id: 'lifestyle', label: 'Self Growth', icon: BookOpen }
  ];

  // Live search for any podcast from YouTube
  React.useEffect(() => {
    if (!searchQuery.trim()) {
      setLivePodcastResults([]);
      setIsSearchingLive(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingLive(true);
      try {
        const res = await ApiConfig.safeFetch(`/api/search?q=${encodeURIComponent(searchQuery.trim() + ' podcast')}`);
        const contentType = res.headers.get('content-type') || '';
        if (res.ok && contentType.includes('application/json')) {
          const items = await res.json().catch(() => []);
          if (Array.isArray(items)) {
            const mapped: PodcastEpisode[] = items.slice(0, 10).map((v: any) => ({
              id: v.id,
              title: v.title,
              channel: v.artist || 'Podcast Creator',
              channelAvatar: v.thumbnail || `https://i.ytimg.com/vi/${v.id}/hqdefault.jpg`,
              category: 'lifestyle',
              categoryLabel: 'Eksplorasi Live',
              duration: v.duration || 1800,
              thumbnail: v.thumbnail || `https://i.ytimg.com/vi/${v.id}/hqdefault.jpg`,
              streamUrl: ApiConfig.resolveStreamUrl(v.streamUrl || `/api/stream?id=${v.id}`),
              description: v.title,
              publishedDate: 'Episode Publik',
              listens: 'Live Stream'
            }));
            setLivePodcastResults(mapped);
          }
        }
      } catch (err) {
        console.warn('Live podcast search error:', err);
      } finally {
        setIsSearchingLive(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const baseEpisodes = searchQuery.trim() && livePodcastResults.length > 0
    ? [...allEpisodes, ...livePodcastResults]
    : allEpisodes;

  const filteredEpisodes = baseEpisodes.filter(ep => {
    const matchCategory = selectedCategory === 'all' || ep.category === selectedCategory || ep.categoryLabel === 'Eksplorasi Live';
    const matchSearch = searchQuery.trim() === '' ||
      ep.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ep.channel.toLowerCase().includes(searchQuery.toLowerCase());
    const matchChannel = !selectedChannel || ep.channel === selectedChannel.name;
    return matchCategory && matchSearch && matchChannel;
  });

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handlePlayEpisode = (ep: PodcastEpisode) => {
    const song = PodcastService.toSong(ep);
    onSelectSong(song);
  };

  return (
    <div className="flex-1 h-full overflow-y-auto px-6 sm:px-10 py-5 space-y-6 max-w-7xl mx-auto select-none pb-28 animate-fadeIn">
      {/* Header Banner */}
      <div className="relative rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-[#e1ebfa] via-[#eaf1fd] to-[#f0f5fe] dark:from-[#101A35] dark:via-[#152347] dark:to-[#1b2b54] border border-[#d2e2f8] dark:border-[#1E2D56] shadow-sm overflow-hidden">
        <div className="relative z-10 max-w-xl space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/80 dark:bg-black/40 border border-[#d2e2f8] dark:border-white/10 text-xs font-bold text-[#142247] dark:text-[#42DDAA]">
            <Radio className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
            <span>Podcast Originals & Populer</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#142247] dark:text-white tracking-tight">
            Pusat Podcast PAPABVTIFY
          </h1>
          <p className="text-xs sm:text-sm text-[#5d729c] dark:text-[#94A6D2] leading-relaxed">
            Dengarkan kisah horor misteri nyata, investigasi true crime, hingga obrolan santai pengantar tidur dengan audio jernih tanpa iklan.
          </p>
        </div>

        {/* Ambient Decorative Graphic */}
        <div className="absolute right-6 top-1/2 -translate-y-1/2 w-48 h-48 rounded-full bg-[#315BCE]/15 dark:bg-[#42DDAA]/10 blur-3xl pointer-events-none" />
      </div>

      {/* Category Filter Pills & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {categories.map(c => {
            const Icon = c.icon;
            const isActive = selectedCategory === c.id;
            return (
              <button
                key={c.id}
                onClick={() => {
                  setSelectedCategory(c.id);
                  setSelectedChannel(null);
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all active:scale-95 ${
                  isActive
                    ? 'bg-[#142247] text-white dark:bg-[#42DDAA] dark:text-[#070B18] shadow-sm'
                    : 'bg-white dark:bg-[#101A35] text-[#5d729c] dark:text-[#94A6D2] border border-[#dce7f7] dark:border-[#1E2D56] hover:text-[#142247] dark:hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{c.label}</span>
              </button>
            );
          })}
        </div>

        {/* Search Podcast */}
        <div className="relative w-full sm:w-64 shrink-0">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5d729c]" />
          <input
            type="text"
            placeholder="Cari judul episode / kreator..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-2xl bg-white dark:bg-[#101A35] border border-[#dce7f7] dark:border-[#1E2D56] text-xs text-[#142247] dark:text-white placeholder-[#8fa1c4] outline-none focus:border-[#315BCE] transition"
          />
        </div>
      </div>

      {/* Featured Creators / Channels Section */}
      {!selectedChannel && (
        <div className="space-y-3">
          <h3 className="text-sm font-extrabold uppercase tracking-wider text-[#142247] dark:text-[#EAF0FF]">
            Kreator Podcast Pilihan
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {channels.map(ch => (
              <div
                key={ch.id}
                onClick={() => setSelectedChannel(ch)}
                className="p-4 rounded-3xl bg-white/90 dark:bg-[#101A35]/90 border border-[#dce7f7] dark:border-[#1E2D56] hover:border-[#a8c5ff] dark:hover:border-[#315BCE] transition-all cursor-pointer group shadow-sm flex items-center gap-3.5"
              >
                <img
                  src={ch.avatar}
                  alt={ch.name}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=200&auto=format&fit=crop&q=80';
                  }}
                  className="w-14 h-14 rounded-2xl object-cover shrink-0 border border-black/5 dark:border-white/10 group-hover:scale-105 transition-transform"
                />
                <div className="min-w-0 flex-1">
                  <h4 className="text-sm font-bold text-[#142247] dark:text-white truncate group-hover:text-[#315BCE] dark:group-hover:text-[#42DDAA] transition">
                    {ch.name}
                  </h4>
                  <span className="text-[11px] font-mono text-[#5d729c] dark:text-[#94A6D2] block truncate">
                    {ch.category}
                  </span>
                  <span className="text-[10px] text-emerald-600 dark:text-[#42DDAA] font-semibold mt-0.5 block">
                    {ch.subscribers}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Episode Listing */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-extrabold uppercase tracking-wider text-[#142247] dark:text-[#EAF0FF] flex items-center gap-2">
            <span>Daftar Episode</span>
            {selectedChannel && (
              <span className="text-xs text-[#315BCE] dark:text-[#42DDAA] lowercase font-normal">
                (filter: {selectedChannel.name} · <button onClick={() => setSelectedChannel(null)} className="underline hover:opacity-80">reset</button>)
              </span>
            )}
          </h3>
          <span className="text-xs text-[#5d729c] dark:text-[#94A6D2] font-mono">
            {filteredEpisodes.length} episode tersedia
          </span>
        </div>

        <div className="space-y-2.5">
          {filteredEpisodes.map(ep => {
            const isCurrent = currentSong?.id === ep.id;
            return (
              <div
                key={ep.id}
                onClick={() => handlePlayEpisode(ep)}
                className={`p-3.5 sm:p-4 rounded-3xl bg-white/95 dark:bg-[#101A35]/95 border transition-all flex items-center justify-between gap-4 cursor-pointer group ${
                  isCurrent
                    ? 'border-[#315BCE] dark:border-[#42DDAA] shadow-md ring-2 ring-[#315BCE]/20'
                    : 'border-[#dce7f7] dark:border-[#1E2D56] hover:border-[#cadcf8] dark:hover:border-[#283863]'
                }`}
              >
                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                  <div className="relative w-14 h-14 rounded-2xl overflow-hidden shrink-0 bg-slate-200 dark:bg-slate-800 border border-black/5 dark:border-white/10 shadow-sm">
                    <img
                      src={ep.thumbnail}
                      alt={ep.title}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=200&auto=format&fit=crop&q=80';
                      }}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    {isCurrent && isPlaying && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <Radio className="w-5 h-5 text-[#42DDAA] animate-pulse" />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#edf3fd] dark:bg-[#152347] text-[#142247] dark:text-[#42DDAA] border border-[#d2e2f8] dark:border-[#1E2D56]">
                        {ep.categoryLabel}
                      </span>
                      <span className="text-[11px] font-mono text-[#5d729c] dark:text-[#94A6D2]">
                        {ep.channel}
                      </span>
                    </div>

                    <h4 className="text-xs sm:text-sm font-bold text-[#142247] dark:text-white truncate group-hover:text-[#315BCE] dark:group-hover:text-[#42DDAA] transition">
                      {ep.title}
                    </h4>

                    <div className="flex items-center gap-3 text-[11px] font-mono text-[#5d729c] dark:text-[#8fa1c4]">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{formatDuration(ep.duration)}</span>
                      </span>
                      <span>•</span>
                      <span>{ep.listens} pendengar</span>
                      <span>•</span>
                      <span>{ep.publishedDate}</span>
                    </div>
                  </div>
                </div>

                {/* Play Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePlayEpisode(ep);
                  }}
                  className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-all shadow-sm active:scale-90 ${
                    isCurrent && isPlaying
                      ? 'bg-[#315BCE] text-white dark:bg-[#42DDAA] dark:text-[#070B18]'
                      : 'bg-[#edf3fd] dark:bg-[#1a2548] text-[#142247] dark:text-[#EAF0FF] hover:bg-[#142247] hover:text-white dark:hover:bg-[#42DDAA] dark:hover:text-[#070B18]'
                  }`}
                  title={isCurrent && isPlaying ? 'Jeda' : 'Putar Episode'}
                >
                  {isCurrent && isPlaying ? (
                    <Pause className="w-4 h-4 fill-current" />
                  ) : (
                    <Play className="w-4 h-4 fill-current ml-0.5" />
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
