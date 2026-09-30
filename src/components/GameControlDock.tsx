import React from "react";
import { UploadCloud, Smartphone, Monitor, RotateCcw, AlertTriangle, Play, Lock, FileArchive, RefreshCw, Image as ImageIcon, X } from "lucide-react";

interface GameControlDockProps {
  onLoadZip: (file: File) => void;
  onLaunchGame: () => void;
  isPortrait: boolean;
  aspectRatio: string;
  onTogglePortrait: (portrait: boolean) => void;
  onChangeAspectRatio: (ratio: any) => void;
  onResetGame: () => void;
  hasStagedGame: boolean;
  isLaunched: boolean;
  stagedFileName: string | null;
  thumbnailUrl: string | null;
  onLoadThumbnail: (file: File) => void;
  onRemoveThumbnail: () => void;
  loading: boolean;
  error: string | null;
}

export const GameControlDock: React.FC<GameControlDockProps> = ({
  onLoadZip,
  onLaunchGame,
  isPortrait,
  aspectRatio,
  onTogglePortrait,
  onChangeAspectRatio,
  onResetGame,
  hasStagedGame,
  isLaunched,
  stagedFileName,
  thumbnailUrl,
  onLoadThumbnail,
  onRemoveThumbnail,
  loading,
  error
}) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onLoadZip(file);
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) onLoadZip(file);
  };

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onLoadThumbnail(file);
    e.target.value = "";
  };

  return (
    <div className="w-full mt-3 flex flex-col gap-2">
      {error && (
        <div className="w-full px-4 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2 font-mono">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Control Dock */}
      <div className="w-full bg-[#0d0d14] border border-white/10 rounded-xl p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3 shadow-lg">
        {/* CASE 1: No game uploaded yet -> STEP 1: Upload ZIP */}
        {!hasStagedGame && !isLaunched && (
          <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0">
                {loading ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <FileArchive className="w-5 h-5" />
                )}
              </div>
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-white">
                  Step 1: Upload Game Package
                </div>
                <div className="text-[11px] text-white/40 font-mono">
                  Select an HTML5 game .ZIP archive containing index.html
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end flex-wrap">
              {/* Optional Background Thumbnail Uploader */}
              {thumbnailUrl ? (
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-pink-500/10 border border-pink-500/25 text-xs font-mono">
                  <img
                    src={thumbnailUrl}
                    alt="Backdrop"
                    className="w-4 h-4 rounded object-cover border border-pink-400/40"
                  />
                  <span className="text-pink-300 text-[11px] font-bold">Backdrop Ready</span>
                  <button
                    type="button"
                    onClick={onRemoveThumbnail}
                    className="text-white/40 hover:text-red-400 p-0.5 rounded cursor-pointer transition-colors"
                    title="Remove backdrop thumbnail"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <label className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white text-xs font-mono transition-all cursor-pointer shadow-sm">
                  <ImageIcon className="w-4 h-4 text-pink-400" />
                  <span>Add Backdrop Image</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleThumbnailChange}
                    className="hidden"
                  />
                </label>
              )}

              {/* Primary ZIP File Picker */}
              <label
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold tracking-wider uppercase transition-all cursor-pointer shadow-lg hover:shadow-cyan-500/25 active:scale-95 shrink-0"
              >
                <UploadCloud className="w-4 h-4" />
                <span>{loading ? "Unpacking Archive..." : "Select Game .ZIP"}</span>
                <input
                  type="file"
                  accept=".zip"
                  disabled={loading}
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        )}

        {/* CASE 2: ZIP is uploaded and staged -> STEP 2: Choose Orientation & STEP 3: Launch */}
        {hasStagedGame && !isLaunched && (
          <div className="w-full flex flex-wrap items-center justify-between gap-3">
            {/* Left: File Badge, Re-upload & Backdrop image */}
            <div className="flex items-center gap-2.5 flex-wrap">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white text-xs font-mono">
                <FileArchive className="w-3.5 h-3.5 text-cyan-400" />
                <span className="font-bold truncate max-w-[180px]">{stagedFileName}</span>
              </div>

              <label className="text-[11px] text-white/50 hover:text-white underline cursor-pointer transition-colors font-mono">
                <span>Change ZIP</span>
                <input
                  type="file"
                  accept=".zip"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>

              {/* Backdrop thumbnail control */}
              {thumbnailUrl ? (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-pink-500/10 border border-pink-500/25 text-xs font-mono">
                  <img
                    src={thumbnailUrl}
                    alt="Backdrop"
                    className="w-4 h-4 rounded object-cover border border-pink-400/40"
                  />
                  <span className="text-pink-300 text-[10px] font-bold">Backdrop Active</span>
                  <button
                    type="button"
                    onClick={onRemoveThumbnail}
                    className="text-white/40 hover:text-red-400 p-0.5 rounded cursor-pointer transition-colors"
                    title="Remove backdrop thumbnail"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <label className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 hover:text-white text-[11px] font-mono transition-all cursor-pointer">
                  <ImageIcon className="w-3.5 h-3.5 text-pink-400" />
                  <span>Add Backdrop Image</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleThumbnailChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* Middle: Step 2 - Orientation Selection (Editable before launch) */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold tracking-widest text-white/40 font-mono hidden md:inline">
                Step 2: Orientation
              </span>
              <div className="flex items-center bg-white/5 rounded-lg p-0.5 border border-white/10">
                <button
                  type="button"
                  onClick={() => onTogglePortrait(true)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    isPortrait ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-sm" : "text-white/40 hover:text-white/80"
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Portrait</span>
                </button>
                <button
                  type="button"
                  onClick={() => onTogglePortrait(false)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    !isPortrait ? "bg-purple-500/20 text-purple-300 border border-purple-500/30 shadow-sm" : "text-white/40 hover:text-white/80"
                  }`}
                >
                  <Monitor className="w-3.5 h-3.5 text-purple-400" />
                  <span>Landscape</span>
                </button>
              </div>

              {/* Aspect Ratio Switcher */}
              <select
                value={aspectRatio}
                onChange={(e) => onChangeAspectRatio(e.target.value as any)}
                className="bg-white/5 border border-white/10 text-white/80 text-xs font-mono rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-cyan-400 cursor-pointer"
              >
                {isPortrait ? (
                  <>
                    <option value="9:16">9:16 (Standard Mobile)</option>
                    <option value="3:4">3:4 (Tablet Portrait)</option>
                    <option value="2:3">2:3 (Tall)</option>
                  </>
                ) : (
                  <>
                    <option value="16:9">16:9 (Standard PC)</option>
                    <option value="4:3">4:3 (Classic)</option>
                    <option value="3:2">3:2 (Wide)</option>
                  </>
                )}
              </select>
            </div>

            {/* Right: Step 3 - Launch Button */}
            <button
              type="button"
              onClick={onLaunchGame}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black uppercase tracking-wider transition-all shadow-[0_4px_16px_rgba(16,185,129,0.35)] cursor-pointer active:scale-95 shrink-0"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Step 3: Launch Game</span>
            </button>
          </div>
        )}

        {/* CASE 3: Game is Launched into iframe -> Dimensions are LOCKED */}
        {isLaunched && (
          <div className="w-full flex flex-wrap items-center justify-between gap-3">
            {/* Left: Active Game Status & Backdrop preview */}
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <div className="flex flex-col">
                <span className="text-xs font-bold uppercase tracking-wider text-white truncate max-w-[200px]">
                  {stagedFileName}
                </span>
                <span className="text-[10px] text-emerald-400/80 font-mono">
                  Sandbox Active
                </span>
              </div>

              {/* Backdrop status / change */}
              {thumbnailUrl ? (
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-pink-500/10 border border-pink-500/25 text-xs font-mono ml-1">
                  <img
                    src={thumbnailUrl}
                    alt="Backdrop"
                    className="w-4 h-4 rounded object-cover border border-pink-400/40"
                  />
                  <span className="text-pink-300 text-[10px] font-bold">Backdrop</span>
                  <button
                    type="button"
                    onClick={onRemoveThumbnail}
                    className="text-white/40 hover:text-red-400 p-0.5 rounded cursor-pointer transition-colors"
                    title="Remove backdrop thumbnail"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <label className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/50 hover:text-white text-[10px] font-mono transition-all cursor-pointer ml-1">
                  <ImageIcon className="w-3 h-3 text-pink-400" />
                  <span>Add Backdrop</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleThumbnailChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* Middle: Locked Orientation Notice (Cannot be changed) */}
            <div className="flex items-center gap-2 bg-white/[0.03] border border-white/10 px-3 py-1.5 rounded-xl">
              <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="text-[11px] font-mono text-white/70">
                Dimension Locked:{" "}
                <strong className="text-white">
                  {isPortrait ? "Portrait" : "Landscape"} ({aspectRatio})
                </strong>
              </span>
              <span className="text-[9px] uppercase tracking-widest text-amber-400/70 font-mono px-1.5 py-0.5 rounded bg-amber-400/10">
                Fixed
              </span>
            </div>

            {/* Right: Eject / Reset Game Button */}
            <button
              type="button"
              onClick={onResetGame}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-sm active:scale-95 shrink-0"
              title="Unload current game and return to upload"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Eject / New Game</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
