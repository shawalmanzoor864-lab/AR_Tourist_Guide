import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BottomDock } from './components/BottomDock';
import { TopBar } from './components/TopBar';
import { Viewport3D } from './components/Viewport3D';
import {
  ALL_STOPS_BY_MODULE,
  ArBackdropMode,
  JAPANESE_PAVILION_STOPS,
  JAPANESE_VOICEOVER_URL,
  LAHORE_FORT_VOICEOVER_CUES,
  LAHORE_FORT_VOICEOVER_STOP_IDS,
  LAHORE_FORT_VOICEOVER_URL,
  LightingPreset,
  ModuleId,
  TourStop,
  VoiceLanguage,
} from './data/tourData';
import { voiceEngine } from './utils/voiceEngine';

function getScriptForLanguage(stop: TourStop, lang: VoiceLanguage): string {
  if (lang === 'ur' && stop.narrationUr) return stop.narrationUr;
  if (lang === 'ja' && stop.narrationJa) return stop.narrationJa;
  return stop.narrationEn;
}

export default function App() {
  const [activeModule, setActiveModule] = useState<ModuleId>('lahore-fort');
  const [activeStopIdByModule, setActiveStopIdByModule] = useState<Record<ModuleId, string>>({
    'lahore-fort': ALL_STOPS_BY_MODULE['lahore-fort'][0].id,
    'japanese-pavilion': ALL_STOPS_BY_MODULE['japanese-pavilion'][0].id,
  });

  const [voiceLanguage, setVoiceLanguage] = useState<VoiceLanguage>('en');
  const [speechRate, setSpeechRate] = useState<number>(1);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);

  const [arBackdropMode, setArBackdropMode] = useState<ArBackdropMode>('studio-3d');
  const [lightingPreset, setLightingPreset] = useState<LightingPreset>('golden-hour');
  const [dockCollapsed, setDockCollapsed] = useState<boolean>(false);
  const [notice, setNotice] = useState<string | null>(null);

  // Recorded voice-over audio (Lahore Fort)
  const [customAudioMap] = useState<
    Record<string, { name: string; url: string }>
  >(() =>
    Object.fromEntries([
      ...LAHORE_FORT_VOICEOVER_STOP_IDS.map((id) => [
        id,
        { name: 'Lahore Fort voice-over.mp3', url: LAHORE_FORT_VOICEOVER_URL },
      ]),
      // Japanese commander: every stop plays the recorded voice-over (no text-to-speech)
      ...JAPANESE_PAVILION_STOPS.map((st) => [
        st.id,
        { name: 'Japanese voice-over.mp3', url: JAPANESE_VOICEOVER_URL },
      ]),
    ]),
  );

  // Mutable 60fps speech amplitude ref passed into Three.js loop without re-renders
  const speechAmplitudeRef = useRef<number>(0);

  const stops = ALL_STOPS_BY_MODULE[activeModule];
  const activeStop = useMemo(() => {
    const targetId = activeStopIdByModule[activeModule];
    return stops.find((s) => s.id === targetId) ?? stops[0];
  }, [activeModule, activeStopIdByModule, stops]);

  const effectiveLang: VoiceLanguage =
    activeModule === 'lahore-fort' && voiceLanguage === 'ja' ? 'en' : voiceLanguage;

  // Stops with a recorded voice-over show their short summary instead of the old narration script
  const activeScript = useMemo(
    () =>
      customAudioMap[activeStop.id]
        ? activeStop.summary
        : getScriptForLanguage(activeStop, effectiveLang),
    [activeStop, effectiveLang, customAudioMap],
  );

  const showTemporaryNotice = useCallback((msg: string) => {
    setNotice(msg);
  }, []);

  useEffect(() => {
    if (!notice) return;
    const id = window.setTimeout(() => setNotice(null), 4200);
    return () => window.clearTimeout(id);
  }, [notice]);

  const speakStop = useCallback(
    (
      stop: TourStop,
      lang: VoiceLanguage,
      rate: number,
      audioOverrides: Record<string, { name: string; url: string }>,
    ) => {
      const customAudio = audioOverrides[stop.id];
      const callbacks = {
        onStart: () => setIsSpeaking(true),
        onEnd: () => {
          setIsSpeaking(false);
          speechAmplitudeRef.current = 0;
          setProgress(0);
        },
        onAmplitude: (amp: number) => {
          speechAmplitudeRef.current = amp;
        },
        onProgress: (ratio: number) => {
          setProgress(ratio);
        },
      };

      if (customAudio) {
        // Recorded Lahore Fort tour: follow the cue table and navigate to each place as it is narrated
        let lastCueStop = stop.id;
        const cuedCallbacks =
          stop.module === 'lahore-fort'
            ? {
                ...callbacks,
                onTime: (t: number) => {
                  let cue: (typeof LAHORE_FORT_VOICEOVER_CUES)[number] | undefined;
                  for (const c of LAHORE_FORT_VOICEOVER_CUES) {
                    if (c.at <= t) cue = c;
                  }
                  if (cue && cue.stopId !== lastCueStop) {
                    lastCueStop = cue.stopId;
                    const target = cue.stopId;
                    setActiveStopIdByModule((prev) => ({ ...prev, 'lahore-fort': target }));
                  }
                },
              }
            : callbacks;
        voiceEngine.speakCustomAudio(customAudio.url, cuedCallbacks);
      } else {
        const text = getScriptForLanguage(stop, lang);
        voiceEngine.speakText(text, lang, rate, callbacks);
      }
    },
    [],
  );

  // Stop speech when unmounting
  useEffect(() => {
    return () => {
      voiceEngine.stop();
    };
  }, []);

  // Keyboard shortcut 'H' for Collapse/Expand HUD (Cinema view)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;
      if (e.key === 'h' || e.key === 'H') {
        setDockCollapsed((prev) => !prev);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const handleSelectModule = useCallback(
    (module: ModuleId) => {
      if (module === activeModule) return;
      voiceEngine.stop();
      setActiveModule(module);
      const nextStops = ALL_STOPS_BY_MODULE[module];
      const nextId = activeStopIdByModule[module];
      const nextStop = nextStops.find((s) => s.id === nextId) ?? nextStops[0];
      const nextLang: VoiceLanguage =
        module === 'lahore-fort' && voiceLanguage === 'ja' ? 'en' : voiceLanguage;
      if (nextLang !== voiceLanguage) setVoiceLanguage(nextLang);

      voiceEngine.playSelectionChime(module);
      speakStop(nextStop, nextLang, speechRate, customAudioMap);
    },
    [activeModule, activeStopIdByModule, customAudioMap, speakStop, speechRate, voiceLanguage],
  );

  const handleSelectStop = useCallback(
    (stopId: string) => {
      const found = stops.find((s) => s.id === stopId);
      if (!found) return;
      setActiveStopIdByModule((prev) => ({
        ...prev,
        [activeModule]: found.id,
      }));
      voiceEngine.playSelectionChime(activeModule);
      speakStop(found, effectiveLang, speechRate, customAudioMap);
    },
    [activeModule, customAudioMap, effectiveLang, speakStop, speechRate, stops],
  );

  const handleTogglePlayNarration = useCallback(() => {
    if (isSpeaking) {
      voiceEngine.stop();
    } else {
      voiceEngine.playSelectionChime(activeModule);
      speakStop(activeStop, effectiveLang, speechRate, customAudioMap);
    }
  }, [activeModule, activeStop, customAudioMap, effectiveLang, isSpeaking, speakStop, speechRate]);

  const handleChangeLanguage = useCallback(
    (lang: VoiceLanguage) => {
      setVoiceLanguage(lang);
      if (isSpeaking) {
        speakStop(activeStop, lang, speechRate, customAudioMap);
      }
    },
    [activeStop, customAudioMap, isSpeaking, speakStop, speechRate],
  );

  const handleChangeRate = useCallback(
    (rate: number) => {
      setSpeechRate(rate);
      if (isSpeaking) {
        speakStop(activeStop, effectiveLang, rate, customAudioMap);
      }
    },
    [activeStop, customAudioMap, effectiveLang, isSpeaking, speakStop],
  );

  const handleToggleArModeFromHeader = useCallback(() => {
    setArBackdropMode((prev) => (prev === 'studio-3d' ? 'ar-backdrop' : 'studio-3d'));
  }, []);

  const handleCameraError = useCallback(
    (message: string) => {
      setArBackdropMode('ar-backdrop');
      showTemporaryNotice(message);
    },
    [showTemporaryNotice],
  );

  return (
    <div className="relative w-screen h-screen flex flex-col overflow-hidden bg-[#0e1116] text-[#f4f1ea]">
      <TopBar
        activeModule={activeModule}
        arBackdropMode={arBackdropMode}
        isSpeaking={isSpeaking}
        onSelectModule={handleSelectModule}
        onToggleArMode={handleToggleArModeFromHeader}
        onTogglePlayNarration={handleTogglePlayNarration}
      />

      {/* Full-viewport 3D / AR Scene */}
      <main className="relative flex-1 min-h-0 w-full">
        <Viewport3D
          activeModule={activeModule}
          activeStop={activeStop}
          isSpeaking={isSpeaking}
          speechAmplitudeRef={speechAmplitudeRef}
          arBackdropMode={arBackdropMode}
          lightingPreset={lightingPreset}
          customLahoreModelUrl={null}
          customJapaneseModelUrl={null}
          onSelectStop={handleSelectStop}
          onCameraError={handleCameraError}
        />

        {/* Minimal single-line floating context prompt at top-center (non-blocking) */}
        <div className="pointer-events-none absolute top-4 left-1/2 -translate-x-1/2 z-10 text-center">
          <p className="text-xs text-[#e5dfd3]/85 bg-[#11151c]/80 border border-white/10 px-3.5 py-1.5 rounded-lg md:whitespace-nowrap max-w-[92vw]">
            {activeModule === 'lahore-fort'
              ? 'Click any Lahore Fort landmark in 3D or below for AR guide voice-over'
              : 'Click the Japanese commander or the heritage house to hear voice-over'}
          </p>
        </div>

        {/* Transient user feedback notice */}
        {notice && (
          <div className="pointer-events-none absolute top-14 left-1/2 -translate-x-1/2 z-30">
            <div className="px-4 py-2 rounded-lg bg-[#1a202b] border border-amber-500/40 text-xs text-[#f4f1ea] shadow-lg whitespace-nowrap">
              {notice}
            </div>
          </div>
        )}

        <BottomDock
          activeModule={activeModule}
          stops={stops}
          activeStop={activeStop}
          activeScript={activeScript}
          voiceLanguage={effectiveLang}
          speechRate={speechRate}
          isSpeaking={isSpeaking}
          progress={progress}
          hasCustomAudioForStop={Boolean(customAudioMap[activeStop.id])}
          arBackdropMode={arBackdropMode}
          lightingPreset={lightingPreset}
          collapsed={dockCollapsed}
          onToggleCollapse={() => setDockCollapsed((prev) => !prev)}
          onSelectStop={handleSelectStop}
          onTogglePlay={handleTogglePlayNarration}
          onChangeLanguage={handleChangeLanguage}
          onChangeRate={handleChangeRate}
          onChangeArMode={setArBackdropMode}
          onChangeLighting={setLightingPreset}
          />
      </main>

    </div>
  );
}