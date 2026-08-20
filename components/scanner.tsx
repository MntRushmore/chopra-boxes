"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { extractCode } from "@/lib/codes";
import type Tesseract from "tesseract.js";

export function Scanner({
  onFound,
}: {
  onFound: (code: string) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const workerRef = useRef<Tesseract.Worker | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [hint, setHint] = useState(
    "Line up the Sharpie code, then tap Read this.",
  );

  useEffect(() => {
    let stopped = false;

    async function start() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
          audio: false,
        });
        if (stopped) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (!videoRef.current) return;
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute("playsinline", "true");
        videoRef.current.setAttribute("webkit-playsinline", "true");
        await videoRef.current.play();
      } catch {
        setError("Could not open the camera. Check permission and try again.");
      }
    }

    void start();

    return () => {
      stopped = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      const worker = workerRef.current;
      workerRef.current = null;
      void worker?.terminate();
    };
  }, []);

  async function readThis() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || busy) return;
    if (video.readyState < 2) {
      setHint("Camera is still starting — try again in a second.");
      return;
    }

    setBusy(true);
    setHint("Reading…");
    setError("");

    try {
      preprocessFrame(video, canvas);
      if (!workerRef.current) {
        const tess = await import("tesseract.js");
        const worker = await tess.createWorker("eng");
        await worker.setParameters({
          tessedit_char_whitelist: "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-",
          tessedit_pageseg_mode: tess.PSM.SINGLE_LINE,
        });
        workerRef.current = worker;
      }
      const worker = workerRef.current;
      const { data } = await worker.recognize(canvas);
      const code = extractCode(data.text ?? "");
      if (code) {
        onFound(code);
        return;
      }
      setHint("Couldn’t read it — try closer, or type the code.");
    } catch {
      setHint("Couldn’t read it — try closer, or type the code.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <video
        ref={videoRef}
        className="aspect-[3/4] w-full rounded-[1.4rem] bg-black object-cover"
        playsInline
        muted
        autoPlay
      />
      <canvas ref={canvasRef} className="hidden" aria-hidden />
      <Button
        type="button"
        onClick={readThis}
        disabled={busy || Boolean(error)}
        className="mt-4 h-14 min-h-14 w-full text-base"
      >
        {busy ? "Reading…" : "Read this"}
      </Button>
      <p className="mt-3 text-center text-base text-muted-foreground">
        {error || hint}
      </p>
    </div>
  );
}

function preprocessFrame(video: HTMLVideoElement, canvas: HTMLCanvasElement) {
  const srcW = video.videoWidth || 640;
  const srcH = video.videoHeight || 480;
  const maxW = 1280;
  const scale = srcW > maxW ? maxW / srcW : 1;
  const w = Math.max(1, Math.round(srcW * scale));
  const h = Math.max(1, Math.round(srcH * scale));
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return;
  ctx.drawImage(video, 0, 0, w, h);
  const image = ctx.getImageData(0, 0, w, h);
  const pixels = image.data;
  const gray = new Uint8Array(w * h);
  let min = 255;
  let max = 0;
  for (let i = 0, p = 0; i < pixels.length; i += 4, p += 1) {
    const g = 0.299 * pixels[i] + 0.587 * pixels[i + 1] + 0.114 * pixels[i + 2];
    gray[p] = g;
    if (g < min) min = g;
    if (g > max) max = g;
  }
  const range = Math.max(1, max - min);
  for (let i = 0, p = 0; i < pixels.length; i += 4, p += 1) {
    const stretched = ((gray[p] - min) / range) * 255;
    const v = stretched < 140 ? 0 : 255;
    pixels[i] = v;
    pixels[i + 1] = v;
    pixels[i + 2] = v;
    pixels[i + 3] = 255;
  }
  ctx.putImageData(image, 0, 0);
}
