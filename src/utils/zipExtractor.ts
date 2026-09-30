import JSZip from "jszip";

export interface ExtractedGame {
  blobUrl: string;
  thumbnailUrl?: string;
  revoker: () => void;
}

const getMimeType = (fileName: string): string => {
  const ext = fileName.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "html": case "htm": return "text/html";
    case "js": return "application/javascript";
    case "css": return "text/css";
    case "png": return "image/png";
    case "jpg": case "jpeg": return "image/jpeg";
    case "gif": return "image/gif";
    case "svg": return "image/svg+xml";
    case "json": return "application/json";
    case "mp3": return "audio/mpeg";
    case "ogg": return "audio/ogg";
    case "wav": return "audio/wav";
    case "wasm": return "application/wasm";
    case "txt": return "text/plain";
    default: return "application/octet-stream";
  }
};

export async function extractAndPrepareZipGame(zipFile: Blob | File): Promise<ExtractedGame> {
  const objectUrls: string[] = [];
  const zip = await new JSZip().loadAsync(zipFile);

  const fileNames = Object.keys(zip.files);
  const indexPath = fileNames.find((name) => {
    const lower = name.toLowerCase();
    return lower.endsWith("index.html") && !lower.includes("__macosx") && !name.split("/").pop()?.startsWith("._");
  });

  if (!indexPath) {
    throw new Error("Could not find the entrypoint file 'index.html' inside the ZIP package.");
  }

  const baseDir = indexPath.includes("/") ? indexPath.substring(0, indexPath.lastIndexOf("/") + 1) : "";
  const pathMap: Record<string, string> = {};

  const filesToExtract = fileNames.filter((name) => {
    const isDir = zip.files[name].dir;
    const isMeta = name.toLowerCase().includes("__macosx") || name.split("/").pop()?.startsWith("._");
    return !isDir && !isMeta && name !== indexPath;
  });

  const [, indexText] = await Promise.all([
    Promise.all(filesToExtract.map(async (name) => {
      const file = zip.files[name];
      const mimeType = getMimeType(name);
      const buffer = await file.async("arraybuffer");
      const url = URL.createObjectURL(new Blob([buffer], { type: mimeType }));
      objectUrls.push(url);

      pathMap[name] = url;
      const normalized = name.replace(/\\/g, "/");
      pathMap[normalized] = url;
      pathMap[`./${normalized}`] = url;
      if (baseDir && normalized.startsWith(baseDir)) {
        const relativeToHtml = normalized.substring(baseDir.length);
        pathMap[relativeToHtml] = url;
        pathMap[`./${relativeToHtml}`] = url;
      }
    })),
    zip.files[indexPath].async("text")
  ]);

  const interceptorScript = `
    <script id="sandbox-interceptor">
      (function() {
        const pathMap = ${JSON.stringify(pathMap)};
        const blobUrls = new Set(Object.values(pathMap));

        function resolvePath(url) {
          if (!url) return url;
          if (typeof url !== 'string') {
            try { url = url.toString(); } catch (e) { return url; }
          }
          if (blobUrls.has(url)) return url;

          let cleanUrl = url.split('#')[0].split('?')[0];
          const origin = window.location.origin;
          const blobPrefix = 'blob:' + origin + '/';
          const originPrefix = origin + '/';

          let relative = cleanUrl;
          if (relative.startsWith(blobPrefix)) relative = relative.substring(blobPrefix.length);
          else if (relative.startsWith(originPrefix)) relative = relative.substring(originPrefix.length);

          if (pathMap[relative]) return pathMap[relative];
          let noDot = relative.replace(/^\\.\\//, '');
          if (pathMap[noDot]) return pathMap[noDot];

          try {
            let decoded = decodeURIComponent(relative);
            if (pathMap[decoded]) return pathMap[decoded];
            let decodedNoDot = decoded.replace(/^\\.\\//, '');
            if (pathMap[decodedNoDot]) return pathMap[decodedNoDot];
          } catch (e) {}

          const lowerRelative = relative.toLowerCase();
          for (const key in pathMap) {
            if (key.toLowerCase() === lowerRelative) return pathMap[key];
          }
          const lowerNoDot = noDot.toLowerCase();
          for (const key in pathMap) {
            if (key.toLowerCase() === lowerNoDot) return pathMap[key];
          }
          for (const key in pathMap) {
            if (relative.endsWith(key) || key.endsWith(relative)) return pathMap[key];
          }
          return url;
        }

        try {
          const OriginalURL = window.URL;
          window.URL = function(url, base) {
            if (typeof url === 'string') {
              var resolved = resolvePath(url);
              if (resolved !== url) return new OriginalURL(resolved);
              var stripped = url.replace(/^\\.\\//,'');
              if (stripped !== url) {
                var resolvedStripped = resolvePath(stripped);
                if (resolvedStripped !== stripped) return new OriginalURL(resolvedStripped);
              }
              var parts = stripped.split('/');
              if (parts.length > 1) {
                for (var key in pathMap) {
                  if (key.endsWith('/' + stripped) || key === stripped) return new OriginalURL(pathMap[key]);
                }
              }
            }
            try {
              if (base !== undefined) return new OriginalURL(url, base);
              return new OriginalURL(url);
            } catch(e) {
              if (base) {
                try {
                  var origin = window.location.origin || 'http://localhost:3000';
                  return new OriginalURL(url, origin);
                } catch(e2) {}
              }
              try { return new OriginalURL('about:blank'); } catch(e3) { throw e; }
            }
          };
          window.URL.prototype = OriginalURL.prototype;
          window.URL.createObjectURL = OriginalURL.createObjectURL;
          window.URL.revokeObjectURL = OriginalURL.revokeObjectURL;
          if (OriginalURL.canParse) window.URL.canParse = OriginalURL.canParse;
        } catch(e) {}

        const originalFetch = window.fetch;
        window.fetch = function(input, init) {
          let url = '';
          if (typeof input === 'string') url = input;
          else if (input instanceof URL) url = input.href;
          else if (input instanceof Request) url = input.url;
          else if (input && typeof input.toString === 'function') url = input.toString();

          const resolved = resolvePath(url);
          if (resolved && resolved !== url) {
            if (input instanceof Request) input = new Request(resolved, input);
            else input = resolved;
          }
          return originalFetch.call(this, input, init);
        };

        const originalOpen = XMLHttpRequest.prototype.open;
        XMLHttpRequest.prototype.open = function(method, url, ...args) {
          let urlStr = '';
          if (typeof url === 'string') url = url;
          else if (url instanceof URL) url = url.href;
          else if (url && typeof url.toString === 'function') url = url.toString();
          const resolved = resolvePath(urlStr);
          return originalOpen.call(this, method, resolved || url, ...args);
        };

        const originalWrite = document.write;
        document.write = function(html) {
          if (typeof html === 'string') {
            let modified = html;
            for (const [relativePath, blobUrl] of Object.entries(pathMap)) {
              const escapedPath = relativePath.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\\\$&");
              const attrRegex = new RegExp('(src|href|value|data)\\\\s*=\\\\s*(["\\\']?)(\\\\.\\\\/|\\\\/)?' + escapedPath + '(\\\\?[^"\\\'>\\\\s]*)?(#[^"\\\'>\\\\s]*)?\\\\2', 'gi');
              modified = modified.replace(attrRegex, '$1="' + blobUrl + '"');
            }
            return originalWrite.call(this, modified);
          }
          return originalWrite.apply(this, arguments);
        };

        try {
          const originalSetAttribute = Element.prototype.setAttribute;
          Element.prototype.setAttribute = function(name, value) {
            if (typeof name === 'string' && ['src', 'href', 'data'].includes(name.toLowerCase())) {
              let valStr = typeof value === 'string' ? value : value?.href || value?.toString() || '';
              value = resolvePath(valStr) || value;
            }
            return originalSetAttribute.call(this, name, value);
          };
        } catch (e) {}

        try {
          const OriginalWorker = window.Worker;
          window.Worker = function(scriptURL, options) {
            let urlStr = typeof scriptURL === 'string' ? scriptURL : scriptURL?.href || scriptURL?.toString() || '';
            const resolved = resolvePath(urlStr);
            return new OriginalWorker(resolved || scriptURL, options);
          };
          window.Worker.prototype = OriginalWorker.prototype;
        } catch (e) {}

        function safeOverride(proto, prop) {
          try {
            let desc = undefined;
            let currentProto = proto;
            while (currentProto && !desc) {
              desc = Object.getOwnPropertyDescriptor(currentProto, prop);
              if (!desc) currentProto = Object.getPrototypeOf(currentProto);
            }
            if (desc && desc.set) {
              const originalSet = desc.set;
              const originalGet = desc.get;
              Object.defineProperty(currentProto, prop, {
                set: function(val) {
                  let valStr = typeof val === 'string' ? val : val?.href || val?.toString() || '';
                  originalSet.call(this, resolvePath(valStr) || val);
                },
                get: function() { return originalGet.call(this); },
                configurable: true,
                enumerable: true
              });
            }
          } catch (e) {}
        }

        safeOverride(HTMLImageElement.prototype, 'src');
        safeOverride(HTMLScriptElement.prototype, 'src');
        safeOverride(HTMLLinkElement.prototype, 'href');
        safeOverride(HTMLAudioElement.prototype, 'src');
        safeOverride(HTMLSourceElement.prototype, 'src');

        // iOS AudioContext unlock on first touch
        (function() {
          function unlockAudio() {
            var AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
              var ctx = new AudioContext();
              if (ctx.state === 'suspended') {
                ctx.resume();
              }
            }
            window.removeEventListener('touchstart', unlockAudio, true);
            window.removeEventListener('touchend', unlockAudio, true);
            window.removeEventListener('click', unlockAudio, true);
          }
          window.addEventListener('touchstart', unlockAudio, true);
          window.addEventListener('touchend', unlockAudio, true);
          window.addEventListener('click', unlockAudio, true);
        })();

        window.addEventListener('wheel', function(e) {
          window.parent.postMessage({ type: 'iframe-scroll', deltaY: e.deltaY }, '*');
        }, { passive: true });
      })();
    </script>
    <style id="sandbox-canvas-fix">
      html, body, * {
        scrollbar-width: none !important;
        -ms-overflow-style: none !important;
      }
      html::-webkit-scrollbar, body::-webkit-scrollbar, *::-webkit-scrollbar {
        display: none !important;
        width: 0px !important;
        height: 0px !important;
      }
      html, body {
        margin: 0 !important;
        padding: 0 !important;
        overflow: hidden !important;
        background: #000 !important;
        width: 100% !important;
        height: 100% !important;
        position: fixed !important;
        touch-action: none !important;
      }
      canvas {
        width: 100% !important;
        height: 100% !important;
        object-fit: fill !important;
        display: block !important;
        margin: auto !important;
        touch-action: none !important;
      }
      #canvas, #gameContainer, #game-container, #c2canvasdiv, #unity-container, #unity-canvas {
        width: 100% !important;
        height: 100% !important;
        margin: 0 !important;
        padding: 0 !important;
        position: absolute !important;
        top: 0 !important;
        left: 0 !important;
        transform: none !important;
      }
    </style>
    <script id="universal-scaler">
      (function() {
        if (!document.querySelector('meta[name="viewport"]')) {
          var meta = document.createElement('meta');
          meta.name = 'viewport';
          meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, shrink-to-fit=no, viewport-fit=cover';
          (document.head || document.documentElement).appendChild(meta);
        }

        function fixGameElements() {
          var canvases = document.querySelectorAll('canvas');
          for (var i = 0; i < canvases.length; i++) {
            var c = canvases[i];
            c.style.setProperty('width', '100%', 'important');
            c.style.setProperty('height', '100%', 'important');
            c.style.setProperty('object-fit', 'fill', 'important');
            c.style.setProperty('display', 'block', 'important');
            c.style.setProperty('margin', 'auto', 'important');
          }
        }

        fixGameElements();
        window.addEventListener('load', fixGameElements);
        window.addEventListener('resize', fixGameElements);
        var obs = new MutationObserver(fixGameElements);
        if (document.body) obs.observe(document.body, { childList: true, subtree: true });
        else document.addEventListener('DOMContentLoaded', function() {
          obs.observe(document.body, { childList: true, subtree: true });
        });
      })();
    </script>
  `;

  let modifiedIndex = indexText;
  let inserted = false;
  const headTag = modifiedIndex.match(/<head[^>]*>/i);
  if (headTag) {
    const insertIdx = headTag.index! + headTag[0].length;
    modifiedIndex = modifiedIndex.slice(0, insertIdx) + "\n" + interceptorScript + modifiedIndex.slice(insertIdx);
    inserted = true;
  }
  if (!inserted) {
    const htmlTag = modifiedIndex.match(/<html[^>]*>/i);
    if (htmlTag) {
      const insertIdx = htmlTag.index! + htmlTag[0].length;
      modifiedIndex = modifiedIndex.slice(0, insertIdx) + "\n" + interceptorScript + modifiedIndex.slice(insertIdx);
      inserted = true;
    }
  }
  if (!inserted) {
    modifiedIndex = interceptorScript + modifiedIndex;
  }

  for (const [relativePath, blobUrl] of Object.entries(pathMap)) {
    const escapedPath = relativePath.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
    const attrRegex = new RegExp("(src|href|value|data)\\s*=\\s*([\"']?)(\\.\\/|\\/)?" + escapedPath + "(\\?[^\"'>\\s]*)?(#[^\"'>\\s]*)?\\2", "gi");
    modifiedIndex = modifiedIndex.replace(attrRegex, `$1="${blobUrl}"`);
    const urlRegex = new RegExp("url\\s*\\(\\s*['\"]?(\\.\\/|\\/)?" + escapedPath + "(\\?[^'\")]*)?(#[^'\")]*)?['\"]?\\s*\\)", "gi");
    modifiedIndex = modifiedIndex.replace(urlRegex, `url("${blobUrl}")`);
  }

  const indexBlob = new Blob([modifiedIndex], { type: "text/html" });
  const finalUrl = URL.createObjectURL(indexBlob);
  objectUrls.push(finalUrl);

  const thumbFile = fileNames.find((name) => {
    const base = name.split("/").pop()?.toLowerCase();
    return base && /^(thumbnail|thumb|cover|poster|banner|icon|background)\.(png|jpg|jpeg|webp)$/i.test(base);
  });
  const autoThumbUrl = thumbFile ? pathMap[thumbFile] : undefined;

  return {
    blobUrl: finalUrl,
    thumbnailUrl: autoThumbUrl,
    revoker: () => {
      objectUrls.forEach((u) => URL.revokeObjectURL(u));
    }
  };
}
