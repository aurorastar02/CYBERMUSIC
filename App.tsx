
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
      
      // Auto-play on seek if not already playing
      if (!isPlaying) {
        setupAudio();
        audioRef.current.play();
        setIsPlaying(true);
      }
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
      {/* 3D Visualizer Canvas (Background) */}
      <div className="absolute inset-0 z-0">
        <Visualizer analyzer={analyzerRef.current} isPlaying={isPlaying} />
      </div>

      {/* Interface Overlay (Frontend) */}
      <div className="absolute inset-0 flex flex-col justify-between p-8 pointer-events-none z-10">
        <header className="flex items-center space-x-4">
          <div className="w-10 h-10 border-2 border-cyan-500 rounded-sm flex items-center justify-center rotate-45 shadow-[0_0_15px_rgba(6,182,212,0.8)]">
            <div className="w-4 h-4 bg-cyan-400 animate-pulse -rotate-45" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tighter text-white uppercase italic">
              Cyber<span className="text-cyan-400">Pulse</span> <span className="text-xs font-normal not-italic text-pink-500 ml-1">3D ENGINE</span>
            </h1>
            <p className="text-[10px] text-cyan-800 uppercase tracking-widest font-mono">
              Real-time Physics Analytics v3.0
            </p>
          </div>
        </header>

        {/* Unified Bottom Interface */}
        <div className="absolute bottom-0 left-0 w-full p-8 pointer-events-auto bg-gradient-to-t from-black via-black/80 to-transparent">
          <div className="max-w-5xl mx-auto flex flex-col items-center space-y-6">
            
            {/* Playback & Volume Controls */}
            <Controls 
              onUpload={handleFileUpload} 
              onTogglePlay={togglePlay} 
              isPlaying={isPlaying} 
              hasAudio={!!audioUrl}
              volume={volume}
              onVolumeChange={handleVolumeChange}
              onEject={handleEject}
            />

            {/* Progress Bar Container */}
            {audioUrl && (
              <div className="w-full space-y-3">
                <div className="flex justify-between items-end text-[10px] font-mono text-cyan-500/80 uppercase tracking-[0.3em]">
                  <div className="flex items-baseline space-x-3">
                    <span className="text-sm text-cyan-400 font-bold">{formatTime(currentTime)}</span>
                    <span className="opacity-30">|</span>
                    <span className="opacity-40">{formatTime(duration)}</span>
                  </div>
                  <div className="hidden sm:block opacity-40 animate-pulse uppercase">Sync_Buffer: {Math.round((currentTime / duration) * 100 || 0)}%</div>
                </div>
                
                <div className="relative group h-2 w-full bg-white/5 rounded-full overflow-hidden cursor-pointer border border-white/5">
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
                    className="absolute top-0 left-0 h-full bg-gradient-to-r from-cyan-600 via-pink-500 to-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.8)] transition-all duration-100 z-10"
                    style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
                  />
                  <div className="absolute inset-0 bg-cyan-400/5 z-0" />
                </div>
              </div>
            )}
            
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
        </div>

        <footer className="flex justify-between items-end font-mono text-[9px] text-gray-700 uppercase tracking-widest mt-auto mb-32 md:mb-40">
          <div className="space-y-1">
            <p className={isPlaying ? "text-cyan-500 animate-pulse" : ""}>
              ENGINE: {isPlaying ? 'RUNNING_SIMULATION' : 'DORMANT'}
            </p>
            <p>PHYSICS_ENGINE: CANNON_JS</p>
          </div>
          <div className="text-right space-y-1 hidden sm:block">
            <p>RENDER_BUFFER: 60FPS</p>
            <p>GEOMETRY_COMPLEXITY: LOW</p>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default App;
