import React, { useEffect, useState } from 'react';
import {
  Camera,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  Pause,
  Play,
  Sun,
  Moon,
  Layers,
  Image as ImageIcon,
} from 'lucide-react';
import {
  ArBackdropMode,
  LightingPreset,
  ModuleId,
  TourStop,
  VoiceLanguage,
} from '../data/tourData';

interface BottomDockProps {
  activeModule: ModuleId;
  stops: TourStop[];
  activeStop: TourStop;
  activeScript: string;
  voiceLanguage: VoiceLanguage;
  speechRate: number;
  isSpeaking: boolean;
  progress: number;
  hasCustomAudioForStop: boolean;
  arBackdropMode: ArBackdropMode;
  lightingPreset: LightingPreset;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onSelectStop: (stopId: string) => void;
  onTogglePlay: () => void;
  onChangeLanguage: (lang: VoiceLanguage) => void;
  onChangeRate: (rate: number) => void;
  onChangeArMode: (mode: ArBackdropMode) => void;
  onChangeLighting: (preset: LightingPreset) => void;
}

/** True on phone-sized screens (< 768px). Laptops keep the bottom control panel. */
function useIsMobile(): boolean {
  const query = '(max-width: 767px)';
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(query).matches,
  );
  useEffect(() => {
    const mq = window.matchMedia(query);
    const onChange = () => setIsMobile(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return isMobile;
}

export const BottomDock: React.FC<BottomDockProps> = ({
  activeModule,
  stops,
  activeStop,
  activeScript,
  voiceLanguage,
  speechRate,
  isSpeaking,
  progress,
  hasCustomAudioForStop,
  arBackdropMode,
  lightingPreset,
  collapsed,
  onToggleCollapse,
  onSelectStop,
  onTogglePlay,
  onChangeLanguage,
  onChangeRate,
  onChangeArMode,
  onChangeLighting,
}) => {
  const languageOptions: Array<{ id: VoiceLanguage; label: string }> =
    activeModule === 'lahore-fort'
      ? [
          { id: 'en', label: 'English' },
          { id: 'ur', label: 'Urdu Mix' },
        ]
      : [
          { id: 'en', label: 'English' },
          { id: 'ja', label: 'Japanese' },
          { id: 'ur', label: 'Urdu Mix' },
        ];

  const isMobile = useIsMobile();
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Recorded voice-overs have a fixed language and speed, so those controls are hidden for them
  const showVoiceTuning = !hasCustomAudioForStop;

  const infoBlock = (
    <div className={`min-w-0 ${isMobile ? '' : 'flex-1'}`}>
      <div className="flex items-center gap-2 text-xs text-[#a39e93] mb-0.5 flex-wrap">
        <span>{activeModule === 'lahore-fort' ? 'Lahore Fort · Shahi Qila' : 'Japanese Heritage Module'}</span>
        <span aria-hidden="true">·</span>
        <span>{activeStop.era}</span>
        {hasCustomAudioForStop && (
          <>
            <span aria-hidden="true">·</span>
            <span className="text-amber-400">Voice-over</span>
          </>
        )}
      </div>

      <div className="flex items-baseline gap-2.5 flex-wrap">
        <h1 className="font-display text-lg sm:text-xl font-semibold text-[#f4f1ea] leading-tight">
          {activeStop.name}
        </h1>
        <span className="text-xs text-[#a39e93]">{activeStop.localName}</span>
      </div>

      <p
        className={`text-xs sm:text-[13px] text-[#c7c2b8] mt-1 leading-relaxed ${
          isMobile ? '' : 'line-clamp-2'
        }`}
      >
        {activeScript}
      </p>
    </div>
  );

  const playButton = (
    <button
      type="button"
      onClick={onTogglePlay}
      className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
    >
      {isSpeaking ? (
        <>
          <Pause className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Pause Voice</span>
        </>
      ) : (
        <>
          <Play className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Speak Guide</span>
        </>
      )}
    </button>
  );

  const voiceTuning = showVoiceTuning && (
    <>
      <div className="flex items-center p-0.5 rounded-lg bg-[#1a202b] border border-white/10">
        {languageOptions.map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChangeLanguage(opt.id)}
            className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              voiceLanguage === opt.id
                ? 'bg-[#2a3342] text-[#f4f1ea]'
                : 'text-[#a39e93] hover:text-[#f4f1ea]'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={() => onChangeRate(speechRate === 1 ? 1.15 : speechRate === 1.15 ? 0.9 : 1)}
        className="px-2.5 py-1.5 rounded-lg text-xs font-mono-tabular bg-[#1a202b] border border-white/10 text-[#d4cfc4] hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        title="Adjust voice-over speed"
      >
        {speechRate.toFixed(2).replace(/\.00$/, '.0')}x
      </button>
    </>
  );

  const stopButtons = stops.map((stop, idx) => {
    const selected = stop.id === activeStop.id;
    return (
      <button
        key={stop.id}
        type="button"
        onClick={() => onSelectStop(stop.id)}
        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer border ${
          isMobile ? 'text-left' : ''
        } ${
          selected
            ? 'bg-amber-600/20 border-amber-500/70 text-[#f4f1ea]'
            : 'bg-[#171c25] border-white/8 text-[#a39e93] hover:text-[#f4f1ea] hover:border-white/20'
        }`}
      >
        <span className="font-mono-tabular text-[11px] text-amber-400/90 mr-1.5">0{idx + 1}</span>
        <span>{stop.name}</span>
      </button>
    );
  });

  const modeButtonClass = (active: boolean) =>
    `inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
      active ? 'bg-[#2a3342] text-white' : 'text-[#a39e93] hover:text-white'
    }`;

  const sceneToolbar = (
    <>
      <div className="flex items-center p-0.5 rounded-lg bg-[#1a202b] border border-white/10">
        <button type="button" onClick={() => onChangeArMode('studio-3d')} className={modeButtonClass(arBackdropMode === 'studio-3d')}>
          <Layers className="w-3 h-3" aria-hidden="true" />
          <span>3D</span>
        </button>
        <button type="button" onClick={() => onChangeArMode('ar-backdrop')} className={modeButtonClass(arBackdropMode === 'ar-backdrop')}>
          <ImageIcon className="w-3 h-3" aria-hidden="true" />
          <span>AR Photo</span>
        </button>
        <button type="button" onClick={() => onChangeArMode('live-camera')} className={modeButtonClass(arBackdropMode === 'live-camera')}>
          <Camera className="w-3 h-3" aria-hidden="true" />
          <span>Live AR</span>
        </button>
      </div>

      <button
        type="button"
        onClick={() => onChangeLighting(lightingPreset === 'golden-hour' ? 'twilight' : 'golden-hour')}
        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs bg-[#1a202b] border border-white/10 text-[#d4cfc4] hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        title="Toggle scene lighting"
      >
        {lightingPreset === 'golden-hour' ? (
          <>
            <Sun className="w-3.5 h-3.5 text-amber-400" aria-hidden="true" />
            <span>Golden</span>
          </>
        ) : (
          <>
            <Moon className="w-3.5 h-3.5 text-sky-300" aria-hidden="true" />
            <span>Twilight</span>
          </>
        )}
      </button>
    </>
  );

  const progressBar = (
    <div className="w-full h-0.5 bg-white/10 rounded-full overflow-hidden shrink-0">
      <div
        className="h-full bg-amber-500 transition-[width] duration-150 ease-linear"
        style={{ width: `${Math.round(progress * 100)}%` }}
      />
    </div>
  );

  // ---------- MOBILE: slide-in side drawer (open / close) so the full 3D view stays visible ----------
  if (isMobile) {
    return (
      <>
        {/* Edge handle: always visible, opens the drawer */}
        {!drawerOpen && (
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="fixed left-0 top-1/2 -translate-y-1/2 z-30 flex items-center gap-1 pl-2 pr-2.5 py-3 rounded-r-xl bg-[#11151c]/95 border border-l-0 border-white/15 text-[#f4f1ea] shadow-xl cursor-pointer"
            aria-label="Open voice controls"
          >
            <SlidersHorizontal className="w-4 h-4 text-amber-400" aria-hidden="true" />
            <ChevronRight className="w-4 h-4" aria-hidden="true" />
          </button>
        )}

        <aside
          className="fixed left-0 top-16 bottom-0 z-30 w-[min(86vw,340px)] flex flex-col gap-3 p-4 overflow-y-auto bg-[#11151c]/97 border-r border-white/12 shadow-2xl transition-transform duration-200 ease-out"
          style={{ transform: drawerOpen ? 'translateX(0)' : 'translateX(-102%)' }}
          aria-hidden={!drawerOpen}
          aria-label="Voice controls"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#a39e93]">Voice controls</span>
            <button
              type="button"
              onClick={() => setDrawerOpen(false)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs bg-[#1a202b] border border-white/10 text-[#d4cfc4] cursor-pointer"
              aria-label="Close voice controls"
            >
              <ChevronLeft className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Close</span>
            </button>
          </div>

          {progressBar}
          {infoBlock}

          <div className="flex items-center gap-2 flex-wrap">
            {playButton}
            {voiceTuning}
          </div>

          <hr className="border-white/8" />

          <div className="flex flex-col gap-1.5">{stopButtons}</div>

          <hr className="border-white/8" />

          <div className="flex items-center gap-1.5 flex-wrap">{sceneToolbar}</div>
        </aside>
      </>
    );
  }

  // ---------- LAPTOP / DESKTOP: original bottom control panel ----------
  return (
    <div
      className="fixed left-1/2 bottom-4 z-20 w-[min(980px,95vw)] transition-transform duration-200 ease-out"
      style={{
        transform: collapsed ? 'translate(-50%, calc(100% - 34px))' : 'translate(-50%, 0)',
      }}
    >
      <div className="flex justify-center mb-1.5">
        <button
          type="button"
          onClick={onToggleCollapse}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-t-lg text-xs font-medium bg-[#12161d]/95 text-[#d4cfc4] hover:text-white border border-b-0 border-white/12 cursor-pointer whitespace-nowrap"
          aria-expanded={!collapsed}
        >
          {collapsed ? (
            <>
              <ChevronUp className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Show Controls</span>
            </>
          ) : (
            <>
              <ChevronDown className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Hide Controls</span>
            </>
          )}
        </button>
      </div>

      <div className="rounded-2xl bg-[#11151c]/95 border border-white/12 shadow-2xl p-4 flex flex-col gap-3">
        {progressBar}

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {infoBlock}
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            {playButton}
            {voiceTuning}
          </div>
        </div>

        <hr className="border-white/8" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">{stopButtons}</div>
          <div className="flex items-center gap-1.5 shrink-0 overflow-x-auto no-scrollbar">{sceneToolbar}</div>
        </div>
      </div>
    </div>
  );
};