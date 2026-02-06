"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import mermaid from "mermaid";
import { useTheme } from "next-themes";
import { ZoomIn, ZoomOut, RotateCcw, Maximize2, Move } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/language-context";
import { cn } from "@/lib/utils";

interface MermaidProps {
  chart: string;
}

const MIN_ZOOM = 0.2;
const MAX_ZOOM = 4;
const ZOOM_STEP = 0.25;
const WHEEL_ZOOM_SENSITIVITY = 0.002;
const PINCH_ZOOM_SENSITIVITY = 0.01;

// ─── Zoom/Pan Hook ───────────────────────────────────────────────
interface UseZoomPanOptions {
  initialZoom?: number;
  minZoom?: number;
  maxZoom?: number;
  autoFit?: boolean;
}

function useZoomPan({
  initialZoom = 1,
  minZoom = MIN_ZOOM,
  maxZoom = MAX_ZOOM,
  autoFit = true,
}: UseZoomPanOptions = {}) {
  const [zoom, setZoom] = useState(initialZoom);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [autoFitZoom, setAutoFitZoom] = useState<number | null>(null);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const panStartRef = useRef({ x: 0, y: 0 });
  const lastTouchDistRef = useRef<number | null>(null);
  const lastTouchCenterRef = useRef<{ x: number; y: number } | null>(null);

  // Clamp zoom
  const clampZoom = useCallback(
    (z: number) => Math.min(Math.max(z, minZoom), maxZoom),
    [minZoom, maxZoom]
  );

  // Auto-fit: measure SVG vs container after render
  const calculateAutoFit = useCallback(() => {
    if (!autoFit || !wrapperRef.current || !contentRef.current) return;

    const svg = contentRef.current.querySelector("svg");
    if (!svg) return;

    const wrapperRect = wrapperRef.current.getBoundingClientRect();
    const svgWidth = svg.viewBox?.baseVal?.width || svg.getBoundingClientRect().width;
    const svgHeight = svg.viewBox?.baseVal?.height || svg.getBoundingClientRect().height;

    if (svgWidth <= 0 || svgHeight <= 0) return;

    const padding = 32; // px padding inside container
    const availableW = wrapperRect.width - padding;
    const availableH = wrapperRect.height - padding;

    const scaleX = availableW / svgWidth;
    const scaleY = availableH / svgHeight;
    const fitScale = Math.min(scaleX, scaleY, 1.15); // cap at 1.15 so small diagrams don't over-zoom

    const clamped = clampZoom(fitScale);
    setAutoFitZoom(clamped);
    setZoom(clamped);
    setPan({ x: 0, y: 0 });
  }, [autoFit, clampZoom]);

  // ── Wheel / trackpad pinch ──
  const handleWheel = useCallback(
    (e: WheelEvent) => {
      // ctrlKey is set for trackpad pinch gestures on macOS/Chrome
      // also handles Ctrl+scroll on Windows/Linux
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        e.stopPropagation();

        const delta = -e.deltaY * WHEEL_ZOOM_SENSITIVITY;
        setZoom((prev) => {
          const next = clampZoom(prev + prev * delta * 5);
          return next;
        });
      }
    },
    [clampZoom]
  );

  // ── Touch: pinch-to-zoom + two-finger pan ──
  const getTouchDistance = (t1: Touch, t2: Touch) =>
    Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);

  const getTouchCenter = (t1: Touch, t2: Touch) => ({
    x: (t1.clientX + t2.clientX) / 2,
    y: (t1.clientY + t2.clientY) / 2,
  });

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      const dist = getTouchDistance(e.touches[0], e.touches[1]);
      lastTouchDistRef.current = dist;
      lastTouchCenterRef.current = getTouchCenter(e.touches[0], e.touches[1]);
    }
  }, []);

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (e.touches.length === 2 && lastTouchDistRef.current !== null) {
        e.preventDefault();
        const dist = getTouchDistance(e.touches[0], e.touches[1]);
        const center = getTouchCenter(e.touches[0], e.touches[1]);

        // Pinch zoom
        const pinchDelta = (dist - lastTouchDistRef.current) * PINCH_ZOOM_SENSITIVITY;
        setZoom((prev) => clampZoom(prev + pinchDelta));

        // Two-finger pan
        if (lastTouchCenterRef.current) {
          const dx = center.x - lastTouchCenterRef.current.x;
          const dy = center.y - lastTouchCenterRef.current.y;
          setPan((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
        }

        lastTouchDistRef.current = dist;
        lastTouchCenterRef.current = center;
      }
    },
    [clampZoom]
  );

  const handleTouchEnd = useCallback(() => {
    lastTouchDistRef.current = null;
    lastTouchCenterRef.current = null;
  }, []);

  // ── Mouse drag for pan ──
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      // Only left button
      if (e.button !== 0) return;
      e.preventDefault();
      setIsDragging(true);
      dragStartRef.current = { x: e.clientX, y: e.clientY };
      panStartRef.current = { ...pan };
    },
    [pan]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;
      setPan({ x: panStartRef.current.x + dx, y: panStartRef.current.y + dy });
    },
    [isDragging]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Attach global mouse listeners for drag
  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Attach wheel and touch listeners (non-passive for preventDefault)
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;

    el.addEventListener("wheel", handleWheel, { passive: false });
    el.addEventListener("touchstart", handleTouchStart, { passive: false });
    el.addEventListener("touchmove", handleTouchMove, { passive: false });
    el.addEventListener("touchend", handleTouchEnd);

    return () => {
      el.removeEventListener("wheel", handleWheel);
      el.removeEventListener("touchstart", handleTouchStart);
      el.removeEventListener("touchmove", handleTouchMove);
      el.removeEventListener("touchend", handleTouchEnd);
    };
  }, [handleWheel, handleTouchStart, handleTouchMove, handleTouchEnd]);

  // Button handlers
  const zoomIn = () => setZoom((prev) => clampZoom(prev + ZOOM_STEP));
  const zoomOut = () => setZoom((prev) => clampZoom(prev - ZOOM_STEP));
  const resetZoom = () => {
    setZoom(autoFitZoom ?? initialZoom);
    setPan({ x: 0, y: 0 });
  };

  const defaultZoom = autoFitZoom ?? initialZoom;

  return {
    zoom,
    pan,
    isDragging,
    defaultZoom,
    wrapperRef,
    contentRef,
    zoomIn,
    zoomOut,
    resetZoom,
    handleMouseDown,
    calculateAutoFit,
    setZoom,
    setPan,
  };
}

// ─── Main Component ─────────────────────────────────────────────
export function Mermaid({ chart }: MermaidProps) {
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [isFullscreenOpen, setIsFullscreenOpen] = useState(false);
  const { resolvedTheme } = useTheme();
  const { t } = useLanguage();

  // Inline zoom/pan for the card view
  const inline = useZoomPan({ initialZoom: 1.15, autoFit: true });
  // Fullscreen zoom/pan
  const fullscreen = useZoomPan({ initialZoom: 1, autoFit: true });

  const fullscreenContentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const renderChart = useCallback(
    async (target: HTMLDivElement, chartDefinition: string) => {
      try {
        const theme = resolvedTheme === "dark" ? "dark" : "default";

        mermaid.initialize({
          startOnLoad: false,
          theme,
          securityLevel: "loose",
          fontFamily: "var(--font-fira-code), Fira Code, monospace",
          flowchart: { useMaxWidth: true, htmlLabels: true, curve: "basis" },
          logLevel: "error",
        });

        const cleanedChart = chartDefinition
          .trim()
          .replace(/\r\n/g, "\n")
          .replace(/\r/g, "\n");

        const id = `mermaid-${Math.random().toString(36).substring(2, 11)}`;
        const result = await mermaid.render(id, cleanedChart);

        if (!result?.svg) throw new Error("Mermaid returned empty result");

        target.innerHTML = result.svg;

        // Remove fixed width/height from SVG so it can scale properly
        const svg = target.querySelector("svg");
        if (svg) {
          // Ensure SVG has a viewBox for proper scaling
          if (!svg.getAttribute("viewBox")) {
            const w = svg.getAttribute("width") || svg.getBoundingClientRect().width;
            const h = svg.getAttribute("height") || svg.getBoundingClientRect().height;
            svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
          }
          svg.style.maxWidth = "100%";
          svg.style.height = "auto";
        }

        return result.svg;
      } catch (err: unknown) {
        console.error("Mermaid rendering error:", err);
        const msg = err instanceof Error ? err.message : String(err) || "Failed to render diagram";
        throw new Error(msg);
      }
    },
    [resolvedTheme]
  );

  // Render inline chart
  useEffect(() => {
    if (!mounted || !chart?.trim()) {
      if (!chart?.trim()) setError("Empty chart definition");
      return;
    }

    let alive = true;
    const target = inline.contentRef.current;
    if (!target) return;

    renderChart(target, chart)
      .then(() => {
        if (alive) {
          setError(null);
          // Auto-fit after a tick so DOM has settled
          requestAnimationFrame(() => inline.calculateAutoFit());
        }
      })
      .catch((err) => {
        if (alive) {
          setError(err instanceof Error ? err.message : String(err));
        }
      });

    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chart, resolvedTheme, mounted, renderChart]);

  // Render fullscreen chart
  useEffect(() => {
    if (!isFullscreenOpen || !chart || !mounted) return;

    const timer = setTimeout(() => {
      const target = fullscreenContentRef.current;
      if (!target) return;
      target.innerHTML = "";

      renderChart(target, chart)
        .then(() => {
          requestAnimationFrame(() => fullscreen.calculateAutoFit());
        })
        .catch((err) => {
          console.error("Failed to render fullscreen chart:", err);
        });
    }, 150);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFullscreenOpen, chart, mounted, renderChart]);

  const handleOpenFullscreen = () => {
    setIsFullscreenOpen(true);
    fullscreen.setZoom(1);
    fullscreen.setPan({ x: 0, y: 0 });
  };

  // ── Render ───
  if (!mounted) {
    return (
      <div className="my-6 flex justify-center">
        <div className="text-sm text-muted-foreground">{t("loading")}</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="my-6 p-4 border border-destructive/50 bg-destructive/10 rounded-lg text-destructive text-sm">
        <p className="font-medium">{t("mermaidDiagramError")}</p>
        <p className="mt-1 text-xs">{error}</p>
        <details className="mt-2">
          <summary className="cursor-pointer text-xs">{t("showChartDefinition")}</summary>
          <pre className="mt-2 text-xs overflow-x-auto bg-muted p-2 rounded">{chart}</pre>
        </details>
      </div>
    );
  }

  const zoomPercent = Math.round(inline.zoom * 100);
  const fullscreenZoomPercent = Math.round(fullscreen.zoom * 100);

  return (
    <>
      {/* ── Inline Card View ── */}
      <div className="my-6 relative group">
        <div className="rounded-lg border border-border bg-muted/30 hover:bg-muted/40 transition-colors overflow-hidden">
          {/* Controls bar */}
          <div className="absolute top-2 right-2 z-10 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="text-[10px] font-mono text-muted-foreground bg-background/80 backdrop-blur-sm rounded px-1.5 py-0.5 select-none">
              {zoomPercent}%
            </span>
            <Button
              variant="secondary"
              size="icon"
              className="h-7 w-7 bg-background/90 backdrop-blur-sm"
              onClick={inline.zoomOut}
              disabled={inline.zoom <= MIN_ZOOM}
              title={t("zoomOut")}
            >
              <ZoomOut className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              className="h-7 w-7 bg-background/90 backdrop-blur-sm"
              onClick={inline.resetZoom}
              disabled={inline.zoom === inline.defaultZoom && inline.pan.x === 0 && inline.pan.y === 0}
              title={t("resetZoom")}
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              className="h-7 w-7 bg-background/90 backdrop-blur-sm"
              onClick={inline.zoomIn}
              disabled={inline.zoom >= MAX_ZOOM}
              title={t("zoomIn")}
            >
              <ZoomIn className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              className="h-7 w-7 bg-background/90 backdrop-blur-sm"
              onClick={handleOpenFullscreen}
              title={t("openFullscreen")}
            >
              <Maximize2 className="h-3.5 w-3.5" />
            </Button>
          </div>

          {/* Drag hint */}
          {inline.zoom > 1 && (
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="text-[10px] text-muted-foreground bg-background/80 backdrop-blur-sm rounded-full px-2 py-0.5 flex items-center gap-1 select-none">
                <Move className="h-3 w-3" /> {t("dragToPan")}
              </span>
            </div>
          )}

          {/* Interactive zoom/pan wrapper */}
          <div
            ref={inline.wrapperRef}
            className={cn(
              "overflow-hidden flex justify-center items-center min-h-[200px] p-4 touch-none select-none",
              inline.isDragging ? "cursor-grabbing" : "cursor-grab"
            )}
            style={{ maxHeight: "600px" }}
            onMouseDown={inline.handleMouseDown}
            onDoubleClick={handleOpenFullscreen}
          >
            <div
              ref={inline.contentRef}
              className="mermaid flex justify-center items-center"
              style={{
                transform: `translate(${inline.pan.x}px, ${inline.pan.y}px) scale(${inline.zoom})`,
                transformOrigin: "center center",
                transition: inline.isDragging ? "none" : "transform 0.15s ease-out",
                willChange: "transform",
              }}
            />
          </div>
        </div>
      </div>

      {/* ── Fullscreen Dialog ── */}
      <Dialog open={isFullscreenOpen} onOpenChange={setIsFullscreenOpen}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] w-full h-full flex flex-col p-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b flex flex-row items-center justify-between">
            <DialogTitle>{t("diagram")}</DialogTitle>
            <div className="flex items-center gap-1">
              <span className="text-[10px] font-mono text-muted-foreground mr-1 select-none">
                {fullscreenZoomPercent}%
              </span>
              <Button
                variant="secondary"
                size="icon"
                className="h-8 w-8"
                onClick={fullscreen.zoomOut}
                disabled={fullscreen.zoom <= MIN_ZOOM}
                title={t("zoomOut")}
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Button
                variant="secondary"
                size="icon"
                className="h-8 w-8"
                onClick={fullscreen.resetZoom}
                disabled={fullscreen.zoom === fullscreen.defaultZoom && fullscreen.pan.x === 0 && fullscreen.pan.y === 0}
                title={t("resetZoom")}
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
              <Button
                variant="secondary"
                size="icon"
                className="h-8 w-8"
                onClick={fullscreen.zoomIn}
                disabled={fullscreen.zoom >= MAX_ZOOM}
                title={t("zoomIn")}
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>
          <div
            ref={fullscreen.wrapperRef}
            className={cn(
              "flex-1 overflow-hidden flex items-center justify-center bg-muted/30 touch-none select-none",
              fullscreen.isDragging ? "cursor-grabbing" : "cursor-grab"
            )}
            onMouseDown={fullscreen.handleMouseDown}
          >
            <div
              ref={(el) => {
                // Assign to both refs
                (fullscreenContentRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
                (fullscreen.contentRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
              }}
              className="mermaid flex items-center justify-center"
              style={{
                transform: `translate(${fullscreen.pan.x}px, ${fullscreen.pan.y}px) scale(${fullscreen.zoom})`,
                transformOrigin: "center center",
                transition: fullscreen.isDragging ? "none" : "transform 0.15s ease-out",
                willChange: "transform",
              }}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Component for parsing mermaid code blocks in MDX
export function MermaidCodeBlock({ children }: { children: string }) {
  return <Mermaid chart={children} />;
}
