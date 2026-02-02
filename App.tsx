
import React, { useState, useRef, useCallback, useEffect } from 'react';
import Visualizer from './components/Visualizer';
import Controls from './components/Controls';

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const App: React.FC = () => {
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const analyzerRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);

  const handleFileUpload = (file: File) => {
    const url = URL.createObjectURL(file);
    setAudioUrl(url);
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const setupAudio = useCallback(() => {
    if (!audioRef.current) return;

    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    const ctx = audioContextRef.current;
    
    if (!sourceRef.current) {
      sourceRef.current = ctx.createMediaElementSource(audioRef.current);
      analyzerRef.current = ctx.createAnalyser();
      analyzerRef.current.fftSize = 128; 
      sourceRef.current.connect(analyzerRef.current);
      analyzerRef.current.connect(ctx.destination);
    }

    if (ctx.state === 'suspended') {
      ctx.resume();
    }
  }, []);

  const togglePlay = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      setupAudio();
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  const handleSeek = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleEject = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioUrl(null);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
  };

  const onTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const onLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
      audioRef.current.volume = volume;
    }
  };

  useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      if (audioContextRef.current) audioContextRef.current.close();
    };
  }, [audioUrl]);

  return (
    <div className="relative w-full h-screen bg-[#050505] overflow-hidden select-none">
      {/* Background Subtle Gradient */}
      <div className="absolute inset-0 bg-gradient-to-tr from-[#0a0514] via-black to-[#05140a] opacity-50 pointer-events-none" />

      {/* Main Visualizer */}
      <Visualizer analyzer={analyzerRef.current} isPlaying={isPlaying} />

      {/* Interface Overlay */}
      <div className="absolute inset-0 flex flex-col justify-between p-8 pointer-events-none">
        <header className="flex items-center space-x-4">
          <div className="w-10 h-10 border-2 border-cyan-500 rounded-sm flex items-center justify-center rotate-45 shadow-[0_0_10px_rgba(6,182,212,0.5)]">
            <div className="w-4 h-4 bg-cyan-400 animate-pulse -rotate-45" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tighter text-white uppercase italic">
              Cyber<span className="text-cyan-400">Pulse</span>
            </h1>
            <p className="text-[10px] text-cyan-800 uppercase tracking-widest font-mono">
              Advanced Audio Analytics v2.1
            </p>
          </div>
        </header>

        {/* Playback & Volume Controls (Center-Bottom) */}
        <div className="flex flex-col items-center pointer-events-auto mb-16">
          <Controls 
            onUpload={handleFileUpload} 
            onTogglePlay={togglePlay} 
            isPlaying={isPlaying} 
            hasAudio={!!audioUrl}
            volume={volume}
            onVolumeChange={handleVolumeChange}
            onEject={handleEject}
          />
          {audioUrl && (
            <audio 
              ref={audioRef} 
              src={audioUrl} 
              onEnded={() => setIsPlaying(false)}
              onTimeUpdate={onTimeUpdate}
              onLoadedMetadata={onLoadedMetadata}
              className="hidden"
            />
          )}
        </div>

        {/* Global Progress Bar (Fixed Bottom) */}
        {audioUrl && (
          <div className="absolute bottom-0 left-0 w-full p-6 pb-4 pointer-events-auto bg-gradient-to-t from-black/80 to-transparent">
            <div className="max-w-4xl mx-auto space-y-2">
              <div className="flex justify-between items-end text-[10px] font-mono text-cyan-500/80 uppercase tracking-[0.2em]">
                <div className="flex items-baseline space-x-2">
                  <span className="text-xs text-cyan-400">{formatTime(currentTime)}</span>
                  <span className="opacity-40">/ {formatTime(duration)}</span>
                </div>
                <div className="hidden sm:block opacity-40">Stream_Sync: Active</div>
              </div>
              
              <div className="relative group h-1 w-full bg-white/5 rounded-full overflow-hidden cursor-pointer">
                <input
                  type="range"
                  min="0"
                  max={duration || 0}
                  step="0.01"
                  value={currentTime}
                  onChange={(e) => handleSeek(parseFloat(e.target.value))}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                />
                <div 
                  className="absolute top-0 left-0 h-full bg-gradient-to-r from-cyan-600 to-pink-500 shadow-[0_0_15px_rgba(6,182,212,0.8)] transition-all duration-100 z-10"
                  style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
                />
                {/* Visual Glow Line */}
                <div 
                  className="absolute top-0 left-0 h-full w-full bg-cyan-400/10 z-0"
                />
              </div>
            </div>
          </div>
        )}

        <footer className="flex justify-between items-end font-mono text-[9px] text-gray-600 uppercase tracking-widest mt-auto mb-2">
          <div className="space-y-1">
            <p className={isPlaying ? "text-cyan-500 animate-pulse" : ""}>
              SYSTEM_STATUS: {isPlaying ? 'VISUALIZING' : 'STANDBY'}
            </p>
            <p>LATENCY_BUFFER: 2.4MS</p>
          </div>
          <div className="text-right space-y-1 hidden sm:block">
            <p>FFT_SIZE: 128</p>
            <p>SAMP_RATE: 44.1KHZ</p>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default App;
