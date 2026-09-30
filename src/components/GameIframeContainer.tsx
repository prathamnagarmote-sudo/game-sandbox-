import React, { useEffect, useRef, useState } from "react";
import { Maximize2, LogOut, EyeOff, ChevronDown, UploadCloud, RefreshCw, Play, Lock, Gamepad2 } from "lucide-react";

interface GameIframeContainerProps {
  gameSrc: string | null;
  gameTitle?: string;
  thumbnailUrl?: string | null;
  isPortrait: boolean;
  aspectRatio: "16:9" | "9:16" | "4:3" | "3:4" | "2:3" | "3:2";
  loading: boolean;
  isStaged?: boolean;
  onResetGame: () => void;
}

export const GameIframeContainer: React.FC<GameIframeContainerProps> = ({
  gameSrc,
  gameTitle = "HTML5 Game",
  thumbnailUrl,
  isPortrait,
  aspectRatio,
  loading,
  isStaged = false
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isTopBarHidden, setIsTopBarHidden] = useState(false);
  const [showHideSpaceToast, setShowHideSpaceToast] = useState(false);
  const [isMobileDevice, setIsMobileDevice] = useState(false);
  const [isDevicePortrait, setIsDevicePortrait] = useState(true);

  const triggerLayoutResize = () => {
    try {
      if (iframeRef.current?.contentWindow) {
        iframeRef.current.contentWindow.dispatchEvent(new Event("resize"));
      }
    } catch (e) {}
    window.dispatchEvent(new Event("resize"));
  };

  useEffect(() => {
    const isMobile = window.innerWidth < 768 || /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    setIsMobileDevice(isMobile);

    const handleResize = () => {
      const orientationObj = (window.screen as any)?.orientation;
      const isLandscapeType = (orientationObj?.type && typeof orientationObj.type === "string" && orientationObj.type.includes("landscape")) ||
        window.orientation === 90 ||
        window.orientation === -90;
      setIsDevicePortrait(!isLandscapeType);
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("orientationchange", handleResize);
    handleResize();

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", handleResize);
    };
  }, []);

  // Multi-step layout resize pulse
  useEffect(() => {
    triggerLayoutResize();
    const timers = [50, 150, 300, 500, 800, 1200].map((t) =>
      setTimeout(triggerLayoutResize, t)
    );
    return () => timers.forEach(clearTimeout);
  }, [isFullscreen, isTopBarHidden, isPortrait, aspectRatio, gameSrc]);

  // Lock body scroll during mobile fullscreen to eliminate iOS rubber-band bounce
  useEffect(() => {
    if (isMobileDevice && isFullscreen) {
      document.body.style.overflow = "hidden";
      document.body.style.position = "fixed";
      document.body.style.width = "100%";
      document.body.style.height = "100%";
    } else {
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.width = "";
      document.body.style.height = "";
    }
    return () => {
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.width = "";
      document.body.style.height = "";
    };
  }, [isMobileDevice, isFullscreen]);

  // Fullscreen change & Orientation lock
  useEffect(() => {
    const handleFullscreenChange = () => {
      const active = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement
      );
      setIsFullscreen(active);

      if (active) {
        if (isMobileDevice && !isPortrait) {
          const orientation = (window.screen as any)?.orientation;
          if (orientation?.lock) orientation.lock("landscape").catch(() => {});
        }
      } else {
        setIsTopBarHidden(false);
        setShowHideSpaceToast(false);
        if (isMobileDevice) {
          const orientation = (window.screen as any)?.orientation;
          if (orientation?.unlock) {
            try { orientation.unlock(); } catch (e) {}
          }
        }
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
    };
  }, [isMobileDevice, isPortrait]);

  const handleFullscreen = async () => {
    const el = containerRef.current as any;
    if (el) {
      try {
        if (el.requestFullscreen) await el.requestFullscreen().catch(() => {});
        else if (el.webkitRequestFullscreen) await el.webkitRequestFullscreen();
      } catch (err) {
        console.warn("Fullscreen API not available, using CSS fixed overlay:", err);
      }
    }
    setIsFullscreen(true);
  };

  const handleExitFullscreen = () => {
    try {
      if (document.exitFullscreen) document.exitFullscreen().catch(() => {});
      else if ((document as any).webkitExitFullscreen) (document as any).webkitExitFullscreen();
    } catch (e) {}
    setIsFullscreen(false);
    setIsTopBarHidden(false);
    setShowHideSpaceToast(false);
  };

  const toggleFullscreen = () => {
    if (isFullscreen) {
      handleExitFullscreen();
    } else {
      handleFullscreen();
    }
  };

  // Keyboard scroll lock & ESC key handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement === iframeRef.current || isFullscreen) {
        if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space", " "].includes(e.key)) {
          e.preventDefault();
        }
      }
      if (e.key === "Escape" && isFullscreen) {
        if (isTopBarHidden) {
          // If top bar was hidden, first restore safe space bar
          setIsTopBarHidden(false);
          setShowHideSpaceToast(false);
        } else {
          handleExitFullscreen();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFullscreen, isTopBarHidden]);

  // Aspect ratio calculation matching MultiGaming
  let aspectClass = "aspect-video";
  if (isPortrait) {
    if (aspectRatio === "3:4") aspectClass = "aspect-[3/4]";
    else if (aspectRatio === "2:3") aspectClass = "aspect-[2/3]";
    else aspectClass = "aspect-[9/16]";
  } else {
    if (aspectRatio === "3:4") aspectClass = "aspect-[4/3]";
    else if (aspectRatio === "2:3") aspectClass = "aspect-[3/2]";
    else aspectClass = "aspect-video";
  }

  return (
    <div
      ref={containerRef}
      style={
        isFullscreen && isMobileDevice
          ? { height: "100dvh", width: "100dvw", top: 0, left: 0 }
          : {}
      }
      className={`w-full relative flex flex-col items-center justify-center bg-[#0a0a10] border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.8)] rounded-2xl overflow-hidden transition-all duration-300 ${
        isFullscreen
          ? "fixed inset-0 z-50 rounded-none border-none bg-black"
          : isMobileDevice
            ? "h-[54vh] min-h-[320px] max-h-[480px]"
            : "h-[calc(100vh-175px)] min-h-[500px] max-h-[820px]"
      }`}
    >
      {/* ── 1. PC FULLSCREEN SAFE AREA TOP BAR (EXACT MULTIGAMING STYLE) ── */}
      {isFullscreen && !isMobileDevice && (
        <div
          className={`absolute top-0 left-0 right-0 h-[30px] bg-black/95 z-50 select-none flex items-center justify-between px-4 border-b border-white/10 transition-transform duration-300 ease-in-out ${
            isTopBarHidden ? "-translate-y-full pointer-events-none" : "translate-y-0"
          }`}
        >
          <div className="flex items-center gap-2 select-none">
            <span className="text-[10px] font-black tracking-wider text-white uppercase italic truncate max-w-[320px]">
              {gameTitle}
            </span>
            <span className="text-[8px] font-extrabold uppercase tracking-widest bg-white/10 text-white/50 px-1.5 py-0.5 rounded font-mono">
              Fullscreen Mode
            </span>
            <span className="text-[8px] font-extrabold uppercase tracking-widest bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded font-mono flex items-center gap-1">
              <Lock className="w-2.5 h-2.5" />
              {isPortrait ? "Portrait" : "Landscape"} Locked
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Hide Space Button (transitions to True Edge-to-Edge view) */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsTopBarHidden(true);
                setShowHideSpaceToast(true);
                setTimeout(() => setShowHideSpaceToast(false), 3200);
              }}
              title="Hide top safe bar for edge-to-edge view"
              className="flex items-center justify-center gap-1 px-2.5 py-1 rounded bg-white/10 hover:bg-white/20 text-white text-[9px] font-bold tracking-wider transition-all cursor-pointer border-none"
            >
              <EyeOff className="w-3 h-3 text-cyan-400" />
              <span>Hide Space</span>
            </button>

            {/* Purple Exit Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleExitFullscreen();
              }}
              className="flex items-center justify-center gap-1.5 px-3 py-1 rounded bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-extrabold text-[10px] tracking-wider transition-all shadow-[0_2px_8px_rgba(124,58,237,0.45)] cursor-pointer border-none"
            >
              <LogOut className="w-3 h-3 text-white -scale-x-100" />
              <span>Exit</span>
            </button>
          </div>
        </div>
      )}

      {/* ── 2. TRANSIENT ESC TOAST NOTIFICATION ── */}
      {showHideSpaceToast && isFullscreen && !isMobileDevice && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[70] px-5 py-2.5 rounded-full bg-black/95 backdrop-blur-md border border-purple-500/40 text-white/90 text-xs font-bold font-mono tracking-widest shadow-2xl flex items-center gap-2 animate-bounce pointer-events-none">
          <span>Press</span>
          <span className="px-2 py-0.5 rounded bg-purple-600/40 text-purple-200 font-black text-[10px] border border-purple-500/30 shadow-inner">
            ESC
          </span>
          <span>to restore safe space and exit full view</span>
        </div>
      )}

      {/* ── 3. SHOW SAFE BAR TAB (RESTORES TOP BAR WHEN HIDDEN) ── */}
      {isFullscreen && !isMobileDevice && isTopBarHidden && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 z-[60] flex items-center justify-center">
          <button
            type="button"
            onClick={() => {
              setIsTopBarHidden(false);
              setShowHideSpaceToast(false);
            }}
            className="flex items-center gap-1.5 px-3.5 py-1 rounded-b-xl bg-black/90 hover:bg-black border border-white/20 border-t-0 text-white/70 hover:text-white transition-all text-[9.5px] uppercase tracking-widest font-black font-mono shadow-2xl cursor-pointer"
            title="Restore safe space top bar"
          >
            <ChevronDown className="w-3.5 h-3.5 text-purple-400" />
            <span>Show Safe Bar</span>
          </button>
        </div>
      )}

      {/* ── CRISP, UNBLURRED BACKGROUND THUMBNAIL IMAGE ── */}
      {thumbnailUrl ? (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
          <img
            src={thumbnailUrl}
            alt="Game Background"
            className="w-full h-full object-cover object-center transition-opacity duration-500"
          />
        </div>
      ) : (
        gameSrc && (isFullscreen || isPortrait) && (
          <div className="absolute inset-0 bg-[#12121e] opacity-40 scale-105 pointer-events-none z-0">
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80" />
          </div>
        )
      )}

      {/* Standard Non-Fullscreen Top Right Fullscreen Trigger (Desktop only) */}
      {gameSrc && !isFullscreen && !isMobileDevice && (
        <div className="absolute top-3 right-3 z-30 flex items-center gap-2">
          <button
            onClick={toggleFullscreen}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/60 hover:bg-black/85 backdrop-blur-md border border-white/15 text-white/90 hover:text-white transition-all text-[11px] font-bold uppercase tracking-wider shadow-lg cursor-pointer"
            title="Fullscreen Mode"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>Fullscreen</span>
          </button>
        </div>
      )}

      {/* ── 4. MAIN VIEWPORT & IFRAME ── */}
      {gameSrc ? (
        isMobileDevice && !isFullscreen ? (
          /* Mobile Pre-Fullscreen Gate: Show game name and Play Now button */
          <div className="flex flex-col items-center justify-center p-6 text-center select-none z-10 w-full max-w-sm mx-auto bg-black/40 backdrop-blur-xs rounded-2xl border border-white/5">
            {thumbnailUrl ? (
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden border border-white/20 shadow-2xl mb-3 relative group">
                <img src={thumbnailUrl} alt={gameTitle} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/25 flex items-center justify-center">
                  <Play className="w-8 h-8 fill-white text-white drop-shadow-md" />
                </div>
              </div>
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mb-3 text-cyan-400 shadow-xl">
                <Gamepad2 className="w-8 h-8 text-cyan-400" />
              </div>
            )}

            <div className="text-[10px] font-mono font-bold uppercase tracking-widest text-cyan-400 mb-1 px-2.5 py-0.5 rounded-full bg-cyan-950/60 border border-cyan-500/30">
              {isPortrait ? "Portrait Game" : "Landscape Game"} · {aspectRatio}
            </div>

            <h2 className="text-xl font-black uppercase tracking-wider text-white mb-1.5 truncate max-w-full px-2">
              {gameTitle}
            </h2>

            <p className="text-[11px] text-white/50 font-mono mb-4">
              Tap below to play in full screen mode
            </p>

            <button
              type="button"
              onClick={handleFullscreen}
              className="w-full max-w-[200px] flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 active:scale-95 text-white font-black text-xs tracking-wider uppercase shadow-[0_4px_20px_rgba(16,185,129,0.4)] transition-all cursor-pointer"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Play Now</span>
            </button>
          </div>
        ) : (
          <div
            className={`overflow-hidden relative flex items-center justify-center z-10 transition-all duration-300 ${
              isFullscreen
                ? isMobileDevice
                  ? isPortrait
                    ? "absolute inset-0 w-full h-full bg-black"
                    : isDevicePortrait
                      ? "rotate-landscape-mobile bg-black"
                      : "absolute inset-0 w-full h-full bg-black flex flex-col"
                  : isPortrait
                    ? isTopBarHidden
                      ? `relative h-full w-auto ${aspectClass} mx-auto flex-shrink-0 bg-black flex flex-col shadow-2xl`
                      : `relative h-[calc(100%-30px)] mt-[30px] w-auto ${aspectClass} mx-auto flex-shrink-0 bg-black flex flex-col shadow-2xl`
                    : isTopBarHidden
                      ? "absolute inset-0 w-full h-full flex-shrink-0 bg-black flex flex-col"
                      : "absolute top-[30px] bottom-0 left-0 right-0 w-full h-[calc(100%-30px)] flex-shrink-0 bg-black flex flex-col"
                : isPortrait
                  ? `relative h-full w-auto ${aspectClass} mx-auto flex-shrink-0 bg-black flex flex-col shadow-2xl`
                  : "w-full h-full flex-1 flex flex-col bg-black"
            }`}
          >
            {/* EXACT MULTIGAMING Mobile Safe Area Bar for Portrait Games (30px high) */}
            {isFullscreen && isMobileDevice && isPortrait && (
              <div className="absolute top-0 left-0 right-0 h-[30px] bg-black z-50 select-none mobile-safe-area-bar">
                <button onClick={toggleFullscreen} className="mobile-exit-btn">
                  <LogOut className="mobile-exit-icon -scale-x-100" />
                  <span>Exit</span>
                </button>
              </div>
            )}

            {/* EXACT MULTIGAMING Mobile Safe Area Bar for Landscape Games (30px wide) */}
            {isFullscreen && isMobileDevice && !isPortrait && (
              <div className="mobile-safe-area-bar-landscape select-none">
                <button onClick={toggleFullscreen} className="mobile-exit-btn-landscape">
                  <span className="mobile-exit-text-landscape">Exit</span>
                  <LogOut className="mobile-exit-icon-landscape -scale-x-100" />
                </button>
              </div>
            )}

            <iframe
              ref={iframeRef}
              src={gameSrc}
              title={gameTitle}
              width="100%"
              height="100%"
              onLoad={() => {
                triggerLayoutResize();
                iframeRef.current?.focus();
              }}
              className={`border-none block ${
                isFullscreen && isMobileDevice
                  ? isPortrait
                    ? "absolute top-[30px] left-0 w-full h-[calc(100%-30px)] z-0"
                    : "landscape-game-iframe"
                  : "w-full h-full"
              }`}
              allow="autoplay; keyboard; gamepad; pointer-lock; accelerometer; gyroscope; microphone; camera; display-capture; web-share"
            />
          </div>
        )
      ) : isStaged ? (
        /* Staged State: Game ZIP is loaded, waiting for user to select orientation & Launch */
        <div className="flex flex-col items-center justify-center p-8 text-center select-none z-10 bg-black/40 backdrop-blur-xs rounded-2xl border border-white/5">
          {thumbnailUrl ? (
            <div className="w-24 h-24 rounded-2xl overflow-hidden border border-white/20 shadow-2xl mb-4 relative group">
              <img src={thumbnailUrl} alt="Thumbnail" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                <Play className="w-8 h-8 fill-white text-white drop-shadow-md" />
              </div>
            </div>
          ) : (
            <div className="w-16 h-16 rounded-3xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mb-4 text-cyan-400 shadow-lg animate-pulse">
              <Play className="w-7 h-7 fill-cyan-400 ml-1" />
            </div>
          )}
          <div className="text-[10px] font-mono font-bold uppercase tracking-widest text-cyan-400 mb-1.5 px-2.5 py-0.5 rounded-full bg-cyan-950/60 border border-cyan-500/30">
            Step 2: Ready to Launch
          </div>
          <h2 className="text-lg sm:text-xl font-black uppercase tracking-wider text-white mb-2">
            {gameTitle}
          </h2>
          <p className="text-xs text-white/60 max-w-sm font-mono leading-relaxed mb-3">
            Game package is unpacked. Choose <strong className="text-white">{isPortrait ? "Portrait" : "Landscape"}</strong> below and click <strong className="text-emerald-400">Launch Game</strong> to start.
          </p>
          <div className="text-[11px] font-mono text-white/50 bg-black/50 px-3 py-1 rounded-lg border border-white/10">
            Current Target: {isPortrait ? "Portrait" : "Landscape"} ({aspectRatio}) · Dimensions will lock upon launch
          </div>
        </div>
      ) : (
        /* Empty State inside Container */
        <div className="flex flex-col items-center justify-center p-8 text-center select-none z-10 bg-black/40 backdrop-blur-xs rounded-2xl border border-white/5">
          <div className="w-16 h-16 rounded-3xl bg-white/[0.03] border border-white/10 flex items-center justify-center mb-4 text-white/30 shadow-inner">
            {loading ? (
              <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
            ) : (
              <UploadCloud className="w-8 h-8" />
            )}
          </div>
          <h2 className="text-base sm:text-lg font-black uppercase tracking-wider text-white/80 mb-1">
            {loading ? "Unpacking Virtual Game Assets..." : "Empty Game Container"}
          </h2>
          <p className="text-xs text-white/40 max-w-sm font-mono leading-relaxed">
            {loading
              ? "Decompressing scripts, assets & mounting virtual interceptor..."
              : "Upload an HTML5 game package (.zip) in the dock directly below to begin."}
          </p>
        </div>
      )}
    </div>
  );
};
