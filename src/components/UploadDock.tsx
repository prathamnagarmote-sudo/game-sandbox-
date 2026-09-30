import React, { useState } from "react";
import { UploadCloud, Link as LinkIcon, Play, RefreshCw } from "lucide-react";

interface UploadDockProps {
  onLoadZip: (file: File) => void;
  onLoadUrl: (url: string) => void;
  loading: boolean;
  error: string | null;
}

export const UploadDock: React.FC<UploadDockProps> = ({
  onLoadZip,
  onLoadUrl,
  loading,
  error
}) => {
  const [urlInput, setUrlInput] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onLoadZip(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) onLoadZip(file);
  };

  return (
    <div className="w-full max-w-xl mx-auto flex flex-col items-center gap-6 p-8 rounded-3xl bg-[#0a0a0f] border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.8)]">
      <div className="text-center">
        <h1 className="text-2xl font-black tracking-wider uppercase text-white mb-2">
          HTML5 Game Sandbox
        </h1>
        <p className="text-xs text-white/50 font-mono">
          Upload an HTML5 Game (.zip) or provide a URL to test responsive execution
        </p>
      </div>

      {error && (
        <div className="w-full p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs text-center font-mono">
          {error}
        </div>
      )}

      {/* Drag & Drop Area */}
      <label
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`w-full h-44 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-3 cursor-pointer transition-all ${
          isDragging
            ? "border-cyan-400 bg-cyan-950/20"
            : "border-white/15 bg-white/[0.02] hover:border-white/30 hover:bg-white/[0.04]"
        }`}
      >
        <input type="file" accept=".zip" onChange={handleFileChange} className="hidden" />
        {loading ? (
          <div className="flex flex-col items-center gap-2">
            <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
            <span className="text-xs text-cyan-400 font-mono">Unpacking virtual assets...</span>
          </div>
        ) : (
          <>
            <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-white/70">
              <UploadCloud className="w-6 h-6" />
            </div>
            <div className="text-center">
              <span className="text-sm font-bold text-white block">Drop game .ZIP archive here</span>
              <span className="text-[11px] text-white/40 font-mono">or click to browse from device</span>
            </div>
          </>
        )}
      </label>

      {/* Or Divider */}
      <div className="w-full flex items-center gap-4">
        <div className="flex-1 h-[1px] bg-white/10" />
        <span className="text-[10px] uppercase font-bold text-white/30 tracking-widest font-mono">Or Test Via URL</span>
        <div className="flex-1 h-[1px] bg-white/10" />
      </div>

      {/* URL Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (urlInput.trim()) onLoadUrl(urlInput.trim());
        }}
        className="w-full flex items-center gap-2"
      >
        <div className="relative flex-1">
          <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input
            type="url"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="https://example.com/game/index.html"
            className="w-full pl-9 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-xs placeholder:text-white/30 focus:outline-none focus:border-cyan-400 font-mono"
          />
        </div>
        <button
          type="submit"
          className="px-5 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold tracking-wider uppercase transition-all flex items-center gap-1.5 shrink-0"
        >
          <Play className="w-3.5 h-3.5 fill-white" />
          <span>Launch</span>
        </button>
      </form>
    </div>
  );
};
