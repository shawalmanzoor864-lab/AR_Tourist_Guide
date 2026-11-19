import React from 'react';
import {
  Camera,
  ChevronDown,
  ChevronUp,
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

  return (
    <div
      className="fixed left-1/2 bottom-4 z-20 w-[min(980px,95vw)] transition-transform duration-200 ease-out"
      style={{
        transform: collapsed ? 'translate(-50%, calc(100% - 34px))' : 'translate(-50%, 0)',
      }}
    >
      {/* Collapse / Expand Cinema Toggle attached to top edge of dock */}
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

      {/* Main Dock Container — Solid/Translucent RGBA surface (no backdrop-blur over WebGL) */}
      <div className="rounded-2xl bg-[#11151c]/95 border border-white/12 shadow-2xl p-4 flex flex-col gap-3">
        {/* Progress Hairline */}
        <div className="w-full h-0.5 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-amber-500 transition-[width] duration-150 ease-linear"
            style={{ width: `${Math.round(progress * 100)}%` }}
          />
        </div>

        {/* Row 1: Active Landmark Info + Voice-Over Narration Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            {/* Clean unboxed typographic metadata (zero-pill discipline) */}
            <div className="flex items-center gap-2 text-xs text-[#a39e93] mb-0.5 flex-wrap">
              <span>{activeModule === 'lahore-fort' ? 'Lahore Fort · Shahi Qila' : 'Japanese Heritage Module'}</span>
              <span aria-hidden="true">·</span>
              <span>{activeStop.era}</span>
              {hasCustomAudioForStop && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="text-amber-400">Custom Voice Attached</span>
                </>
              )}
            </div>

            <div className="flex items-baseline gap-2.5 flex-wrap">
              <h1 className="font-display text-lg sm:text-xl font-semibold text-[#f4f1ea] leading-tight">
                {activeStop.name}
              </h1>
              <span className="text-xs text-[#a39e93]">{activeStop.localName}</span>
            </div>

            <p className="text-xs sm:text-[13px] text-[#c7c2b8] line-clamp-2 mt-1 leading-relaxed">
              {activeScript}
            </p>
          </div>

          {/* Voice-Over Playback & Language Controls */}
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <button
              type="button"
              onClick={onTogglePlay}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
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

            {/* Segmented Language Control */}
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

            {/* Speech Rate Toggle */}
            <button
              type="button"
              onClick={() => onChangeRate(speechRate === 1 ? 1.15 : speechRate === 1.15 ? 0.9 : 1)}
              className="px-2.5 py-1.5 rounded-lg text-xs font-mono-tabular bg-[#1a202b] border border-white/10 text-[#d4cfc4] hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              title="Adjust voice-over speed"
            >
              {speechRate.toFixed(2).replace(/\.00$/, '.0')}x
            </button>
          </div>
        </div>

        <hr className="border-white/8" />

        {/* Row 2: Clickable Places / Landmarks + AR & Environment Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Landmarks / Chapters Strip */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
            {stops.map((stop, idx) => {
              const selected = stop.id === activeStop.id;
              return (
                <button
                  key={stop.id}
                  type="button"
                  onClick={() => onSelectStop(stop.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer border ${
                    selected
                      ? 'bg-amber-600/20 border-amber-500/70 text-[#f4f1ea]'
                      : 'bg-[#171c25] border-white/8 text-[#a39e93] hover:text-[#f4f1ea] hover:border-white/20'
                  }`}
                >
                  <span className="font-mono-tabular text-[11px] text-amber-400/90 mr-1.5">
                    0{idx + 1}
                  </span>
                  <span>{stop.name}</span>
                </button>
              );
            })}
          </div>

          {/* Scene Mode Toolbar */}
          <div className="flex items-center gap-1.5 shrink-0 overflow-x-auto no-scrollbar">
            <div className="flex items-center p-0.5 rounded-lg bg-[#1a202b] border border-white/10">
              <button
                type="button"
                onClick={() => onChangeArMode('studio-3d')}
                className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  arBackdropMode === 'studio-3d'
                    ? 'bg-[#2a3342] text-white'
                    : 'text-[#a39e93] hover:text-white'
                }`}
              >
                <Layers className="w-3 h-3" aria-hidden="true" />
                <span>3D</span>
              </button>
              <button
                type="button"
                onClick={() => onChangeArMode('ar-backdrop')}
                className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  arBackdropMode === 'ar-backdrop'
                    ? 'bg-[#2a3342] text-white'
                    : 'text-[#a39e93] hover:text-white'
                }`}
              >
                <ImageIcon className="w-3 h-3" aria-hidden="true" />
                <span>AR Photo</span>
              </button>
              <button
                type="button"
                onClick={() => onChangeArMode('live-camera')}
                className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  arBackdropMode === 'live-camera'
                    ? 'bg-[#2a3342] text-white'
                    : 'text-[#a39e93] hover:text-white'
                }`}
              >
                <Camera className="w-3 h-3" aria-hidden="true" />
                <span>Live AR</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() =>
                onChangeLighting(lightingPreset === 'golden-hour' ? 'twilight' : 'golden-hour')
              }
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

          </div>
        </div>
      </div>
    </div>
  );
};
