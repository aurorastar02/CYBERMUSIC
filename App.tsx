
import React, { useState, useRef, useCallback, useEffect } from 'react';
import Visualizer from './components/Visualizer';
import Controls from './components/Controls';

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
    // Note: We keep the audio context and source connected for the next track
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
    <div className="relative w-full h-screen bg-[#050505] overflow-hidden">
      {/* Background Subtle Gradient */}
      <div className="absolute inset-0 bg-gradient-to-tr from-[#0a0514] via-black to-[#05140a] opacity-50 pointer-events-none" />

      {/* Main Visualizer */}
      <Visualizer analyzer={analyzerRef.current} isPlaying={isPlaying} />

      {/* Interface Overlay */}
      <div className="absolute inset-0 flex flex-col justify-between p-8 pointer-events-none">
        <header className="flex items-center space-x-4">
          <div className="w-10 h-10 border-2 border-cyan-500 rounded-sm flex items-center justify-center rotate-45">
            <div className="w-4 h-4 bg-cyan-400 animate-pulse -rotate-45" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tighter text-white uppercase italic">
              Cyber<span className="text-cyan-400">Pulse</span>
            </h1>
            <p className="text-[10px] text-cyan-800 uppercase tracking-widest font-mono">
              Advanced Audio Analytics v2.0
            </p>
          </div>
        </header>

        <div className="flex flex-col items-center pointer-events-auto">
          <Controls 
            onUpload={handleFileUpload} 
            onTogglePlay={togglePlay} 
            isPlaying={isPlaying} 
            hasAudio={!!audioUrl}
            volume={volume}
            onVolumeChange={handleVolumeChange}
            currentTime={currentTime}
            duration={duration}
            onSeek={handleSeek}
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

        <footer className="flex justify-between items-end font-mono text-[10px] text-gray-500">
          <div className="space-y-1">
            <p>SYSTEM_STATUS: {isPlaying ? 'VISUALIZING' : 'STANDBY'}</p>
            <p>LATENCY_BUFFER: 2.4MS</p>
          </div>
          <div className="text-right space-y-1">
            <p>FFT_SIZE: 128</p>
            <p>SAMP_RATE: 44.1KHZ</p>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default App;
