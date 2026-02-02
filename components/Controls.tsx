
import React from 'react';

interface ControlsProps {
  onUpload: (file: File) => void;
  onTogglePlay: () => void;
  isPlaying: boolean;
  hasAudio: boolean;
  volume: number;
  onVolumeChange: (vol: number) => void;
  onEject: () => void;
}

const Controls: React.FC<ControlsProps> = ({ 
  onUpload, 
  onTogglePlay, 
  isPlaying, 
  hasAudio,
  volume,
  onVolumeChange,
  onEject
}) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onUpload(e.target.files[0]);
    }
  };

  return (
    <div className="flex flex-col items-center space-y-6 w-full max-w-sm bg-black/40 backdrop-blur-xl p-5 rounded-2xl border border-white/5 shadow-2xl">
      {!hasAudio ? (
        <div className="group relative w-full">
          <input
            type="file"
            accept="audio/*"
            onChange={handleFileChange}
            className="hidden"
            id="audio-upload"
          />
          <label
            htmlFor="audio-upload"
            className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-cyan-800 rounded-lg cursor-pointer bg-black/20 backdrop-blur-sm transition-all hover:border-cyan-400 hover:bg-cyan-950/20 group-hover:scale-[1.01] relative z-10"
          >
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <svg className="w-8 h-8 mb-3 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="mb-2 text-sm text-cyan-500 font-mono tracking-tight uppercase">
                <span className="font-semibold text-cyan-300">Sync Audio</span>
              </p>
              <p className="text-[10px] text-cyan-900 font-mono uppercase">Drag/Select Module</p>
            </div>
          </label>
          <div className="absolute -inset-1 bg-cyan-500/10 rounded-lg blur opacity-0 group-hover:opacity-100 transition duration-500 pointer-events-none z-0"></div>
        </div>
      ) : (
        <div className="w-full flex items-center justify-between space-x-6">
          {/* Volume Control */}
          <div className="flex items-center space-x-3 group">
            <svg className="w-4 h-4 text-cyan-500/60 group-hover:text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            </svg>
            <div className="relative w-20 h-1 bg-white/5 rounded-full overflow-hidden">
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
              />
              <div 
                className="absolute top-0 left-0 h-full bg-cyan-500 z-10"
                style={{ width: `${volume * 100}%` }}
              />
            </div>
          </div>

          {/* Play Button */}
          <button
            onClick={onTogglePlay}
            className={`relative group flex items-center justify-center w-14 h-14 rounded-full border transition-all duration-500 ${
              isPlaying 
              ? 'border-pink-500/50 bg-pink-500/5 shadow-[0_0_25px_rgba(236,72,153,0.2)] scale-110' 
              : 'border-cyan-500/50 bg-cyan-500/5 shadow-[0_0_20px_rgba(6,182,212,0.1)]'
            }`}
          >
            <div className={`absolute -inset-2 rounded-full blur-xl opacity-0 group-hover:opacity-40 transition duration-500 pointer-events-none ${
              isPlaying ? 'bg-pink-500' : 'bg-cyan-400'
            }`}></div>
            
            {isPlaying ? (
              <svg className="w-5 h-5 text-pink-500 relative z-10" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-cyan-500 relative z-10 ml-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
              </svg>
            )}
          </button>

          {/* Reset Button (Eject) */}
          <button
            onClick={onEject}
            className="group flex flex-col items-center space-y-1 transition-colors"
          >
            <div className="p-2 border border-pink-500/20 rounded hover:bg-pink-500/10 transition-colors">
              <svg className="w-3.5 h-3.5 text-pink-500/60 group-hover:text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <span className="font-mono text-[7px] text-pink-500/40 uppercase tracking-tighter">Eject_Mod</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default Controls;
