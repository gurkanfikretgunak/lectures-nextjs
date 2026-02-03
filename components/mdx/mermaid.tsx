"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import mermaid from "mermaid";
import { useTheme } from "next-themes";
import { ZoomIn, ZoomOut, RotateCcw, Maximize2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/language-context";

interface MermaidProps {
  chart: string;
}

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.25;

export function Mermaid({ chart }: MermaidProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const fullscreenContainerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [zoom, setZoom] = useState(1.15); // Default zoom slightly above 1 for better visibility
  const [fullscreenZoom, setFullscreenZoom] = useState(1);
  const [isFullscreenOpen, setIsFullscreenOpen] = useState(false);
  const [svgContent, setSvgContent] = useState<string | null>(null);
  const { resolvedTheme } = useTheme();
  const { t } = useLanguage();

  // Wait for component to mount to avoid hydration issues
  useEffect(() => {
    setMounted(true);
  }, []);

  const renderChart = useCallback(async (targetRef: React.RefObject<HTMLDivElement>, chartDefinition: string) => {
    if (!targetRef.current) return null;

    try {
      // Use resolvedTheme or default to "light" if not yet resolved
      const theme = resolvedTheme === "dark" ? "dark" : "default";
      
      // Initialize Mermaid (re-initialize if theme changed)
      mermaid.initialize({
        startOnLoad: false,
        theme,
        securityLevel: "loose",
        fontFamily: "var(--font-fira-code), Fira Code, monospace",
        flowchart: {
          useMaxWidth: true,
          htmlLabels: true,
          curve: "basis",
        },
        logLevel: "error",
      });

      // Clean chart string
      const cleanedChart = chartDefinition.trim().replace(/\r\n/g, '\n').replace(/\r/g, '\n');
      
      // Generate unique ID
      const id = `mermaid-${Math.random().toString(36).substring(2, 11)}`;
      
      // Render chart using the render API
      const result = await mermaid.render(id, cleanedChart);
      
      if (!result || !result.svg) {
        throw new Error("Mermaid returned empty result");
      }
      
      // Replace the div content with the rendered SVG
      if (targetRef.current) {
        targetRef.current.innerHTML = result.svg;
      }
      
      return result.svg;
    } catch (err: any) {
      console.error("Mermaid rendering error:", err);
      const errorMessage = err?.message || err?.toString() || "Failed to render diagram";
      throw new Error(errorMessage);
    }
  }, [resolvedTheme]);

  useEffect(() => {
    // Don't render until mounted
    if (!mounted) return;
    
    // Don't render if chart is empty
    if (!chart || !chart.trim()) {
      setError("Empty chart definition");
      return;
    }

    renderChart(containerRef, chart)
      .then((svg) => {
        if (svg) {
          setSvgContent(svg);
          setError(null);
        }
      })
      .catch((err) => {
        setError(err.message);
      });
  }, [chart, resolvedTheme, mounted]);

  // Render fullscreen chart when dialog opens
  useEffect(() => {
    if (!isFullscreenOpen || !chart || !mounted) return;
    
    // Small delay to ensure dialog is fully rendered
    const timer = setTimeout(() => {
      if (fullscreenContainerRef.current) {
        // Clear previous content
        fullscreenContainerRef.current.innerHTML = '';
        
        // Re-render the chart in fullscreen to ensure it's fresh and properly sized
        renderChart(fullscreenContainerRef, chart)
          .then(() => {
            // Chart rendered successfully
          })
          .catch((err) => {
            console.error("Failed to render fullscreen chart:", err);
          });
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [isFullscreenOpen, chart, mounted, renderChart]);

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + ZOOM_STEP, MAX_ZOOM));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - ZOOM_STEP, MIN_ZOOM));
  };

  const handleZoomReset = () => {
    setZoom(1.15); // Reset to default zoom
  };

  const handleFullscreenZoomIn = () => {
    setFullscreenZoom((prev) => Math.min(prev + ZOOM_STEP, MAX_ZOOM));
  };

  const handleFullscreenZoomOut = () => {
    setFullscreenZoom((prev) => Math.max(prev - ZOOM_STEP, MIN_ZOOM));
  };

  const handleFullscreenZoomReset = () => {
    setFullscreenZoom(1);
  };

  const handleOpenFullscreen = () => {
    setIsFullscreenOpen(true);
    setFullscreenZoom(1); // Reset zoom when opening fullscreen
  };

  // Don't render until mounted to avoid hydration mismatch
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

  return (
    <>
      <div className="my-6 relative group">
        {/* Card container - fixed, no zoom */}
        <div className="rounded-lg border border-border bg-muted/30 p-4 hover:bg-muted/50 transition-colors overflow-hidden">
          {/* Controls */}
          <div 
            className="absolute top-2 right-2 z-10 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => e.stopPropagation()}
          >
            <Button
              variant="secondary"
              size="icon"
              className="h-8 w-8 bg-background/90 backdrop-blur-sm"
              onClick={(e) => {
                e.stopPropagation();
                handleZoomOut();
              }}
              disabled={zoom <= MIN_ZOOM}
              title={t("zoomOut")}
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              className="h-8 w-8 bg-background/90 backdrop-blur-sm"
              onClick={(e) => {
                e.stopPropagation();
                handleZoomReset();
              }}
              disabled={zoom === 1.15}
              title={t("resetZoom")}
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              className="h-8 w-8 bg-background/90 backdrop-blur-sm"
              onClick={(e) => {
                e.stopPropagation();
                handleZoomIn();
              }}
              disabled={zoom >= MAX_ZOOM}
              title={t("zoomIn")}
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              className="h-8 w-8 bg-background/90 backdrop-blur-sm"
              onClick={(e) => {
                e.stopPropagation();
                handleOpenFullscreen();
              }}
              title={t("openFullscreen")}
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
          </div>

          {/* Scrollable container for zoomed content */}
          <div 
            className="overflow-auto cursor-pointer flex justify-center items-center min-h-[200px]"
            onClick={handleOpenFullscreen}
            style={{
              maxHeight: "600px",
            }}
          >
            {/* Diagram content with zoom - only this scales */}
            <div 
              ref={containerRef} 
              className="mermaid flex justify-center items-center"
              style={{
                transform: `scale(${zoom})`,
                transformOrigin: "center center",
                transition: "transform 0.2s ease-in-out",
              }}
            >
              {/* Content will be replaced by rendered SVG */}
            </div>
          </div>
        </div>
      </div>

      {/* Fullscreen Dialog */}
      <Dialog open={isFullscreenOpen} onOpenChange={setIsFullscreenOpen}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] w-full h-full flex flex-col p-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b flex flex-row items-center justify-between">
            <DialogTitle>{t("diagram")}</DialogTitle>
            <div className="flex gap-1">
              <Button
                variant="secondary"
                size="icon"
                className="h-8 w-8"
                onClick={handleFullscreenZoomOut}
                disabled={fullscreenZoom <= MIN_ZOOM}
                title={t("zoomOut")}
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Button
                variant="secondary"
                size="icon"
                className="h-8 w-8"
                onClick={handleFullscreenZoomReset}
                disabled={fullscreenZoom === 1}
                title={t("resetZoom")}
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
              <Button
                variant="secondary"
                size="icon"
                className="h-8 w-8"
                onClick={handleFullscreenZoomIn}
                disabled={fullscreenZoom >= MAX_ZOOM}
                title={t("zoomIn")}
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>
          <div className="flex-1 overflow-auto p-6 flex items-center justify-center bg-muted/30">
            <div 
              ref={fullscreenContainerRef} 
              className="mermaid flex items-center justify-center"
              style={{
                transform: `scale(${fullscreenZoom})`,
                transformOrigin: "center center",
                transition: "transform 0.2s ease-in-out",
                minWidth: "100%",
                minHeight: "100%",
              }}
            >
              {/* Content will be replaced by rendered SVG */}
            </div>
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
