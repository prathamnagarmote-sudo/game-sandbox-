import { useState } from "react";
import { GameIframeContainer } from "./components/GameIframeContainer";
import { GameControlDock } from "./components/GameControlDock";
import { extractAndPrepareZipGame, ExtractedGame } from "./utils/zipExtractor";

export default function App() {
  const [gameSrc, setGameSrc] = useState<string | null>(null);
  const [activeExtractor, setActiveExtractor] = useState<ExtractedGame | null>(null);
  const [stagedFileName, setStagedFileName] = useState<string | null>(null);
  const [customThumbnailUrl, setCustomThumbnailUrl] = useState<string | null>(null);
  const [isLaunched, setIsLaunched] = useState(false);
  const [isPortrait, setIsPortrait] = useState(true); // Default to portrait
  const [aspectRatio, setAspectRatio] = useState<"16:9" | "9:16" | "4:3" | "3:4" | "2:3" | "3:2">("9:16");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gameTitle, setGameTitle] = useState<string>("HTML5 Test Sandbox");

  // Custom uploaded thumbnail takes precedence over zip-detected thumbnail
  const activeThumbnail = customThumbnailUrl || activeExtractor?.thumbnailUrl || null;

  const handleLoadZip = async (file: File) => {
    try {
      setLoading(true);
      setError(null);

      // Clean up previous game if any
      if (activeExtractor) {
        activeExtractor.revoker();
        setActiveExtractor(null);
      }

      setGameSrc(null);
      setIsLaunched(false);

      const extracted = await extractAndPrepareZipGame(file);
      setActiveExtractor(extracted);
      setStagedFileName(file.name);
      setGameTitle(file.name.replace(/\.zip$/i, ""));
    } catch (err: any) {
      setError(err?.message || "Failed to parse ZIP package.");
      setActiveExtractor(null);
      setStagedFileName(null);
      setIsLaunched(false);
      setGameSrc(null);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadThumbnail = (file: File) => {
    if (customThumbnailUrl) {
      URL.revokeObjectURL(customThumbnailUrl);
    }
    const url = URL.createObjectURL(file);
    setCustomThumbnailUrl(url);
  };

  const handleRemoveThumbnail = () => {
    if (customThumbnailUrl) {
      URL.revokeObjectURL(customThumbnailUrl);
      setCustomThumbnailUrl(null);
    }
  };

  const handleLaunchGame = () => {
    if (!activeExtractor) {
      setError("Please upload an HTML5 game .ZIP archive first.");
      return;
    }
    setError(null);
    setGameSrc(activeExtractor.blobUrl);
    setIsLaunched(true);
  };

  const handleResetGame = () => {
    if (activeExtractor) {
      activeExtractor.revoker();
      setActiveExtractor(null);
    }
    setGameSrc(null);
    setStagedFileName(null);
    setIsLaunched(false);
    setError(null);
    setGameTitle("HTML5 Test Sandbox");
  };

  // Dimensions can ONLY be changed before launch
  const handleTogglePortrait = (portrait: boolean) => {
    if (isLaunched) return; // Prevent change after launch
    setIsPortrait(portrait);
    if (portrait) {
      setAspectRatio(aspectRatio === "4:3" || aspectRatio === "3:4" ? "3:4" : "9:16");
    } else {
      setAspectRatio(aspectRatio === "3:4" || aspectRatio === "4:3" ? "4:3" : "16:9");
    }
  };

  const handleChangeAspectRatio = (ratio: "16:9" | "9:16" | "4:3" | "3:4" | "2:3" | "3:2") => {
    if (isLaunched) return; // Prevent change after launch
    setAspectRatio(ratio);
  };

  return (
    <div className="w-full min-h-screen bg-[#07070b] text-white flex flex-col items-center justify-start p-3 sm:p-5 select-none overflow-x-hidden pb-16 sm:pb-6">
      {/* Top Header */}
      <header className="w-full max-w-[1440px] flex items-center justify-between pb-3 mb-2 border-b border-white/5">
        <div className="flex items-center gap-2">
          <div
            className={`w-2.5 h-2.5 rounded-full ${
              isLaunched ? "bg-emerald-400 animate-pulse" : activeExtractor ? "bg-amber-400 animate-pulse" : "bg-white/20"
            }`}
          />
          <h1 className="text-xs sm:text-sm font-black uppercase tracking-widest text-white/90 font-mono">
            {gameTitle}
          </h1>
        </div>
        <div className="text-[11px] font-mono text-white/40 flex items-center gap-2">
          {isLaunched ? (
            <span className="text-emerald-400 font-bold">
              Active: {isPortrait ? "Portrait" : "Landscape"} ({aspectRatio}) [Locked]
            </span>
          ) : activeExtractor ? (
            <span className="text-amber-300">
              Ready to Launch ({isPortrait ? "Portrait" : "Landscape"})
            </span>
          ) : (
            <span>No Game Loaded</span>
          )}
        </div>
      </header>

      {/* 1. GAME CONTAINER VIEW */}
      <section className="w-full max-w-[1440px] flex flex-col items-center">
        <GameIframeContainer
          gameSrc={gameSrc}
          gameTitle={gameTitle}
          thumbnailUrl={activeThumbnail}
          isPortrait={isPortrait}
          aspectRatio={aspectRatio}
          loading={loading}
          isStaged={!!activeExtractor && !isLaunched}
          onResetGame={handleResetGame}
        />

        {/* 2. GAME CONTROL DOCK (ZIP UPLOAD -> ORIENTATION -> LAUNCH -> LOCKED + THUMBNAIL) */}
        <GameControlDock
          onLoadZip={handleLoadZip}
          onLaunchGame={handleLaunchGame}
          isPortrait={isPortrait}
          aspectRatio={aspectRatio}
          onTogglePortrait={handleTogglePortrait}
          onChangeAspectRatio={handleChangeAspectRatio}
          onResetGame={handleResetGame}
          hasStagedGame={!!activeExtractor}
          isLaunched={isLaunched}
          stagedFileName={stagedFileName}
          thumbnailUrl={activeThumbnail}
          onLoadThumbnail={handleLoadThumbnail}
          onRemoveThumbnail={handleRemoveThumbnail}
          loading={loading}
          error={error}
        />
      </section>
    </div>
  );
}
