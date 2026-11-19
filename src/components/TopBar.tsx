import React from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { ArBackdropMode, ModuleId } from '../data/tourData';

interface TopBarProps {
  activeModule: ModuleId;
  arBackdropMode: ArBackdropMode;
  isSpeaking: boolean;
  onSelectModule: (module: ModuleId) => void;
  onToggleArMode: () => void;
  onTogglePlayNarration: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  activeModule,
  arBackdropMode,
  isSpeaking,
  onSelectModule,
  onToggleArMode,
  onTogglePlayNarration,
}) => {
  return (
    <header className="relative z-20 flex items-center justify-between gap-8 px-6 h-16 bg-[#0e1116]/94 border-b border-white/10">
      {/* Zone 1: Single-element Brand Wordmark */}
      <button
        type="button"
        onClick={() => onSelectModule('lahore-fort')}
        className="font-display text-xl font-semibold tracking-tight text-[#f4f1ea] whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-400"
      >
        Dastan AR
      </button>

      {/* Zone 2: 4 single-line navigation links */}
      <nav
        aria-label="Primary modules"
        className="flex items-center gap-6 overflow-x-auto no-scrollbar text-sm font-medium"
      >
        <button
          type="button"
          onClick={() => onSelectModule('lahore-fort')}
          className={`whitespace-nowrap shrink-0 py-1 border-b-2 transition-colors cursor-pointer ${
            activeModule === 'lahore-fort'
              ? 'text-[#f4f1ea] border-amber-500'
              : 'text-[#a39e93] border-transparent hover:text-[#f4f1ea]'
          }`}
        >
          Lahore Fort
        </button>

        <button
          type="button"
          onClick={() => onSelectModule('japanese-pavilion')}
          className={`whitespace-nowrap shrink-0 py-1 border-b-2 transition-colors cursor-pointer ${
            activeModule === 'japanese-pavilion'
              ? 'text-[#f4f1ea] border-amber-500'
              : 'text-[#a39e93] border-transparent hover:text-[#f4f1ea]'
          }`}
        >
          Japanese Pavilion
        </button>

        <button
          type="button"
          onClick={onToggleArMode}
          className={`whitespace-nowrap shrink-0 py-1 border-b-2 transition-colors cursor-pointer ${
            arBackdropMode !== 'studio-3d'
              ? 'text-[#f4f1ea] border-amber-500'
              : 'text-[#a39e93] border-transparent hover:text-[#f4f1ea]'
          }`}
        >
          AR View
        </button>

      </nav>

      {/* Zone 3: Single Primary Action */}
      <div className="flex items-center shrink-0">
        <button
          type="button"
          onClick={onTogglePlayNarration}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400"
        >
          {isSpeaking ? (
            <>
              <VolumeX className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Stop Narration</span>
            </>
          ) : (
            <>
              <Volume2 className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Start Voice Tour</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
};
