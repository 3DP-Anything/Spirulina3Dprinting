import React from 'react';
import { 
  Play, Pause, SkipBack, SkipForward, ChevronLeft, ChevronRight, Rewind, FastForward,
  RotateCcw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'motion/react';

interface GCodePlayerControlsProps {
  currentLineIndex: number;
  playhead: number;
  isPlaying: boolean;
  playbackSpeed: number;
  totalDistance: number;
  currentBuildTimeSeconds: number;
  totalBuildTimeSeconds: number;
  gcodeLines: string[];
  lastLayerComment: string | null;
  viewMode: 'path' | 'material';
  setIsPlaying: (playing: boolean) => void;
  setPlaybackSpeed: (speed: number) => void;
  setPlayhead: (val: number) => void;
  setViewMode: (mode: 'path' | 'material') => void;
  goToLine: (index: number) => void;
  jumpToLayer: (direction: 'next' | 'prev') => void;
  getGCodeExplanation: (line: string) => string | null;
  formatTime: (seconds: number) => string;
}

export function GCodePlayerControls({
  currentLineIndex,
  playhead,
  isPlaying,
  playbackSpeed,
  totalDistance,
  currentBuildTimeSeconds,
  totalBuildTimeSeconds,
  gcodeLines,
  lastLayerComment,
  viewMode,
  setIsPlaying,
  setPlaybackSpeed,
  setPlayhead,
  setViewMode,
  goToLine,
  jumpToLayer,
  getGCodeExplanation,
  formatTime
}: GCodePlayerControlsProps) {

  const playOneLine = () => {
    setIsPlaying(false);
    goToLine(Math.min(gcodeLines.length - 1, currentLineIndex + 1));
  };

  const playOneLayer = () => {
    setIsPlaying(false);
    jumpToLayer('next');
  };

  return (
    <div className="flex flex-col gap-1.5 w-full bg-transparent border-none rounded-none p-0 shadow-none">
      {/* Sleek track playhead timeline */}
      <div className="relative group/progress h-1 px-1 cursor-pointer">
        <input 
          type="range"
          min="0"
          max="1"
          step="0.0001"
          value={isNaN(playhead) ? 0 : playhead}
          onChange={(e) => {
            setIsPlaying(false);
            setPlayhead(parseFloat(e.target.value));
          }}
          className="absolute inset-0 w-full h-full opacity-0 z-10 cursor-pointer"
        />
        <div className="h-1 bg-stone-200 rounded-full overflow-hidden transition-all group-hover/progress:h-1.5">
          <motion.div 
            className="h-full bg-red-600 shadow-[0_0_12px_rgba(220,38,38,0.55)] rounded-full"
            initial={false}
            animate={{ width: `${(playhead || 0) * 100}%` }}
            transition={{ type: 'spring', bounce: 0, duration: 0.1 }}
          />
        </div>
      </div>

      <div className="flex flex-col items-center justify-center gap-1.5 mt-0.5">
        {/* Playback Buttons matched exactly to modern media controller layout as reference */}
        <div className="flex items-center justify-center gap-2">
          {/* Beginning (<<) */}
          <button 
            onClick={() => goToLine(0)}
            className="text-stone-500 hover:text-stone-900 transition-colors cursor-pointer p-0.5"
            title="Beginning (<<)"
          >
            <Rewind className="w-3.5 h-3.5" />
          </button>

          {/* Previous Layer (|<) */}
          <button 
            onClick={() => jumpToLayer('prev')}
            className="text-stone-500 hover:text-stone-900 transition-colors cursor-pointer p-0.5"
            title="Previous Layer (|<<)"
          >
            <SkipBack className="w-3.5 h-3.5" />
          </button>

          {/* Previous Line (<) */}
          <button 
            onClick={() => goToLine(currentLineIndex - 1)}
            className="text-stone-500 hover:text-stone-900 transition-colors cursor-pointer p-0.5"
            title="Previous Line (<)"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Red Glowing Play/Pause */}
          <button 
            onClick={() => {
              if (!isPlaying && playhead >= 0.999) {
                setPlayhead(0);
              }
              setIsPlaying(!isPlaying);
            }}
            className="w-8 h-8 bg-red-600 hover:bg-red-500 text-white rounded-full hover:scale-105 transition-all duration-300 shadow-[0_0_12px_rgba(220,38,38,0.4)] flex items-center justify-center relative cursor-pointer group shrink-0"
            title={isPlaying ? "Pause" : "Play"}
          >
            <div className="absolute inset-0 rounded-full bg-red-500/20 blur group-hover:scale-110 transition-all" />
            {isPlaying ? (
              <Pause className="w-3.5 h-3.5 fill-white text-white relative z-10 animate-pulse" />
            ) : (
              <Play className="w-3.5 h-3.5 fill-white text-white ml-0.5 relative z-10" />
            )}
          </button>

          {/* Next Line (>) */}
          <button 
            onClick={() => goToLine(currentLineIndex + 1)}
            className="text-stone-500 hover:text-stone-900 transition-colors cursor-pointer p-0.5"
            title="Next Line (>)"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Next Layer (>|) */}
          <button 
            onClick={() => jumpToLayer('next')}
            className="text-stone-500 hover:text-stone-900 transition-colors cursor-pointer p-0.5"
            title="Next Layer (>>|)"
          >
            <SkipForward className="w-3.5 h-3.5" />
          </button>

          {/* End (>>) */}
          <button 
            onClick={() => goToLine(gcodeLines.length - 1)}
            className="text-stone-500 hover:text-stone-900 transition-colors cursor-pointer p-0.5"
            title="End (>>)"
          >
            <FastForward className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* View Mode Section & Speed Selector matched perfectly to Card 2 elements */}
        <div className="flex flex-row items-center justify-between gap-3 w-full px-1 mt-0.5">
          {/* Pill Toggle Selection for VIEWMODE */}
          <div className="flex-1 max-w-[170px] bg-stone-100 rounded-full border border-stone-300 p-[2px] flex items-center">
            <button
              onClick={() => setViewMode('path')}
              className={`flex-1 py-0.5 px-2 text-[9px] font-black uppercase tracking-wider rounded-full transition-all duration-300 cursor-pointer ${
                viewMode === 'path' 
                  ? 'bg-[#15803D] text-white shadow-[0_2px_8px_rgba(21,128,61,0.25)] font-black' 
                  : 'text-stone-500 hover:text-stone-900 bg-transparent'
              }`}
            >
              PATH
            </button>
            <button
              onClick={() => setViewMode('material')}
              className={`flex-1 py-0.5 px-1 text-[9px] font-black uppercase tracking-wider rounded-full transition-all duration-300 cursor-pointer ${
                viewMode === 'material' 
                  ? 'bg-[#15803D] text-white shadow-[0_2px_8px_rgba(21,128,61,0.25)] font-black' 
                  : 'text-stone-500 hover:text-stone-900 bg-transparent'
              }`}
            >
              3D MODEL
            </button>
          </div>

          {/* Speed Selector with Chevron Down */}
          <div className="w-[100px] bg-stone-100 rounded-full border border-stone-300 px-2 py-0.5 flex items-center justify-between relative cursor-pointer">
            <select 
              value={playbackSpeed}
              onChange={(e) => setPlaybackSpeed(parseFloat(e.target.value))}
              className="w-full bg-transparent text-[10px] font-black text-[#D97706] outline-none cursor-pointer appearance-none font-mono tracking-wider select-none z-10 pr-3.5 text-center leading-normal"
            >
              <option value={0.5} className="bg-white text-stone-800">0.5x</option>
              <option value={1} className="bg-white text-stone-800">1.0x</option>
              <option value={2} className="bg-white text-stone-800">2.0x</option>
              <option value={5} className="bg-white text-stone-800 font-bold">5.0x</option>
              <option value={10} className="bg-white text-stone-800 font-bold">10.0x</option>
            </select>
            <div className="absolute right-2 pointer-events-none text-[#D97706] z-0">
              <ChevronRight className="w-3.5 h-3.5 rotate-90" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
