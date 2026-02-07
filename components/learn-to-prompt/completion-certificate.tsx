"use client";

import { useState, useRef, useCallback } from "react";
import {
  FileImage,
  FileText,
  Star,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { scoreToStars, calculateOverallScore, scoreStep } from "./simulation-data";
import type { Simulation } from "./simulation-data";

interface CompletionCertificateProps {
  simulation: Simulation;
  stepInputs: Record<number, string>;
  language: "en" | "tr";
  onGoBack: () => void;
}

export function CompletionCertificate({
  simulation,
  stepInputs,
  language,
  onGoBack,
}: CompletionCertificateProps) {
  const [name, setName] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const certificateRef = useRef<HTMLDivElement>(null);

  const stepScores = simulation.steps.map((step) =>
    scoreStep(step, stepInputs[step.id] || "")
  );
  const overallScore = calculateOverallScore(stepScores);
  const stars = scoreToStars(overallScore);
  const completedSteps = stepScores.filter((s) => s > 0).length;
  const dateStr = new Date().toLocaleDateString(
    language === "en" ? "en-US" : "tr-TR",
    { year: "numeric", month: "long", day: "numeric" }
  );

  const simTitle =
    language === "en" ? simulation.titleEn : simulation.titleTr;

  const downloadPNG = useCallback(async () => {
    if (!certificateRef.current || !name.trim()) return;
    setIsGenerating(true);
    try {
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(certificateRef.current, {
        scale: 2,
        backgroundColor: "#ffffff",
        useCORS: true,
      });
      const link = document.createElement("a");
      link.download = `certificate-${simulation.id}-${name.trim().replace(/\s+/g, "-").toLowerCase()}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (err) {
      console.error("PNG export failed:", err);
    } finally {
      setIsGenerating(false);
    }
  }, [name, simulation.id]);

  const downloadPDF = useCallback(async () => {
    if (!certificateRef.current || !name.trim()) return;
    setIsGenerating(true);
    try {
      const html2canvas = (await import("html2canvas")).default;
      const { jsPDF } = await import("jspdf");
      const canvas = await html2canvas(certificateRef.current, {
        scale: 2,
        backgroundColor: "#ffffff",
        useCORS: true,
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "px",
        format: [canvas.width / 2, canvas.height / 2],
      });
      pdf.addImage(imgData, "PNG", 0, 0, canvas.width / 2, canvas.height / 2);
      pdf.save(
        `certificate-${simulation.id}-${name.trim().replace(/\s+/g, "-").toLowerCase()}.pdf`
      );
    } catch (err) {
      console.error("PDF export failed:", err);
    } finally {
      setIsGenerating(false);
    }
  }, [name, simulation.id]);

  return (
    <div className="flex flex-col items-center justify-center min-h-full p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="h-16 w-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            src="/icon.png" 
            alt="AI & LLM Lectures" 
            className="h-12 w-12 rounded-full"
            width={48}
            height={48}
          />
        </div>
        <h2 className="text-2xl font-bold">
          {language === "en" ? "Congratulations!" : "Tebrikler!"}
        </h2>
        <p className="text-muted-foreground text-sm max-w-md">
          {language === "en"
            ? "You've completed the simulation! Enter your name to generate a certificate."
            : "Simulasyonu tamamladiniz! Sertifika olusturmak icin adinizi girin."}
        </p>
      </div>

      {/* Name Input */}
      <div className="w-full max-w-sm space-y-2">
        <label className="text-sm font-medium">
          {language === "en" ? "Your Name" : "Adiniz"}
        </label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={
            language === "en" ? "Enter your full name" : "Tam adinizi girin"
          }
          className="text-center"
        />
      </div>

      {/* Certificate Preview */}
      <div className="w-full max-w-2xl overflow-x-auto">
        <div
          ref={certificateRef}
          className="w-[700px] mx-auto"
          style={{
            background: "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)",
            padding: "40px",
            borderRadius: "12px",
            border: "2px solid #cbd5e1",
            fontFamily: "system-ui, -apple-system, sans-serif",
          }}
        >
          {/* Inner border */}
          <div
            style={{
              border: "1.5px solid #94a3b8",
              borderRadius: "8px",
              padding: "32px",
              background: "rgba(255,255,255,0.7)",
            }}
          >
            {/* Top decoration */}
            <div style={{ textAlign: "center", marginBottom: "12px" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src="/icon.png" 
                alt="AI & LLM Lectures" 
                width={64}
                height={64}
                style={{ marginBottom: '8px', borderRadius: '50%' }}
              />
              <div
                style={{
                  display: "inline-block",
                  width: "60px",
                  height: "3px",
                  background: "linear-gradient(90deg, #3b82f6, #8b5cf6)",
                  borderRadius: "2px",
                }}
              />
            </div>

            <div style={{ textAlign: "center" }}>
              <p
                style={{
                  fontSize: "11px",
                  letterSpacing: "3px",
                  textTransform: "uppercase",
                  color: "#64748b",
                  marginBottom: "4px",
                }}
              >
                {language === "en"
                  ? "Certificate of Completion"
                  : "Tamamlama Sertifikasi"}
              </p>
              <h1
                style={{
                  fontSize: "28px",
                  fontWeight: "700",
                  color: "#1e293b",
                  margin: "12px 0 4px",
                  lineHeight: "1.2",
                }}
              >
                {simTitle}
              </h1>

              <div
                style={{
                  width: "40px",
                  height: "1.5px",
                  background: "#cbd5e1",
                  margin: "16px auto",
                }}
              />

              <p
                style={{
                  fontSize: "12px",
                  color: "#64748b",
                  marginBottom: "4px",
                }}
              >
                {language === "en"
                  ? "This certifies that"
                  : "Bu belge sunun tarafindan"}
              </p>
              <p
                style={{
                  fontSize: "22px",
                  fontWeight: "600",
                  color: "#1e293b",
                  margin: "6px 0",
                  borderBottom: "1px solid #cbd5e1",
                  display: "inline-block",
                  padding: "0 16px 4px",
                  minWidth: "200px",
                }}
              >
                {name.trim() || "_______________"}
              </p>
              <p
                style={{
                  fontSize: "12px",
                  color: "#64748b",
                  marginTop: "4px",
                }}
              >
                {language === "en"
                  ? "has successfully completed the prompt engineering simulation"
                  : "prompt muhendisligi simulasyonunu basariyla tamamladigini tasdik eder"}
              </p>

              {/* Stats */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  gap: "32px",
                  margin: "20px 0 16px",
                }}
              >
                <div style={{ textAlign: "center" }}>
                  <p
                    style={{
                      fontSize: "10px",
                      color: "#94a3b8",
                      textTransform: "uppercase",
                      letterSpacing: "1px",
                    }}
                  >
                    {language === "en" ? "Steps" : "Adimlar"}
                  </p>
                  <p
                    style={{
                      fontSize: "18px",
                      fontWeight: "700",
                      color: "#1e293b",
                    }}
                  >
                    {completedSteps}/{simulation.steps.length}
                  </p>
                </div>
                <div style={{ textAlign: "center" }}>
                  <p
                    style={{
                      fontSize: "10px",
                      color: "#94a3b8",
                      textTransform: "uppercase",
                      letterSpacing: "1px",
                    }}
                  >
                    {language === "en" ? "Score" : "Puan"}
                  </p>
                  <p
                    style={{
                      fontSize: "18px",
                      fontWeight: "700",
                      color: "#1e293b",
                    }}
                  >
                    {overallScore}/100
                  </p>
                </div>
                <div style={{ textAlign: "center" }}>
                  <p
                    style={{
                      fontSize: "10px",
                      color: "#94a3b8",
                      textTransform: "uppercase",
                      letterSpacing: "1px",
                    }}
                  >
                    {language === "en" ? "Rating" : "Derecelendirme"}
                  </p>
                  <p
                    style={{
                      fontSize: "18px",
                      fontWeight: "700",
                      color: "#f59e0b",
                    }}
                  >
                    {"★".repeat(stars)}
                    {"☆".repeat(5 - stars)}
                  </p>
                </div>
              </div>

              {/* Date */}
              <p style={{ fontSize: "11px", color: "#94a3b8" }}>{dateStr}</p>

              {/* Footer */}
              <div
                style={{
                  marginTop: "16px",
                  paddingTop: "12px",
                  borderTop: "1px solid #e2e8f0",
                  fontSize: "9px",
                  color: "#94a3b8",
                }}
              >
                Learn to Prompt &mdash; Prompt Engineering Simulator
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Score Breakdown */}
      <Card className="w-full max-w-sm">
        <CardContent className="p-4 space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {language === "en" ? "Score Breakdown" : "Puan Dagilimi"}
          </p>
          {simulation.steps.map((step, i) => {
            const stepTitle =
              language === "en" ? step.titleEn : step.titleTr;
            return (
              <div key={step.id} className="flex items-center gap-2 text-xs">
                <span className="w-4 text-muted-foreground">{step.id}.</span>
                <span className="flex-1 truncate">{stepTitle}</span>
                <span className="font-mono font-medium w-10 text-right">
                  {stepScores[i]}%
                </span>
              </div>
            );
          })}
          <Separator className="my-1" />
          <div className="flex items-center gap-2 text-xs font-medium">
            <Star className="h-3.5 w-3.5 text-amber-500" />
            <span className="flex-1">
              {language === "en" ? "Overall" : "Genel"}
            </span>
            <span className="font-mono w-10 text-right">{overallScore}%</span>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button
          onClick={downloadPNG}
          disabled={!name.trim() || isGenerating}
          variant="outline"
          className="gap-2"
        >
          <FileImage className="h-4 w-4" />
          {language === "en" ? "Download PNG" : "PNG Indir"}
        </Button>
        <Button
          onClick={downloadPDF}
          disabled={!name.trim() || isGenerating}
          variant="outline"
          className="gap-2"
        >
          <FileText className="h-4 w-4" />
          {language === "en" ? "Download PDF" : "PDF Indir"}
        </Button>
      </div>

      <Button variant="ghost" size="sm" onClick={onGoBack} className="gap-1">
        <ArrowLeft className="h-4 w-4" />
        {language === "en" ? "Back to Simulation" : "Simulasyona Don"}
      </Button>
    </div>
  );
}
