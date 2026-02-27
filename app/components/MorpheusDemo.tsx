"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { ReactorView, WebcamStream, useReactor } from "@reactor-team/js-sdk";
import { StatusBadge } from "./StatusBadge";
import { coverFit } from "../lib/image";

const CAPTURE_W = 640;
const CAPTURE_H = 360;

const BTN_SHADOW =
  "shadow-[0px_1px_2px_0px_rgba(0,0,0,0.1),0px_4px_4px_0px_rgba(0,0,0,0.09),0px_10px_6px_0px_rgba(0,0,0,0.05)]";

export function MorpheusDemo() {
  const [isDisguised, setIsDisguised] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [captureStream, setCaptureStream] = useState<MediaStream | null>(null);
  const captureVideoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { status, sendCommand, connect, disconnect } = useReactor((state) => ({
    status: state.status,
    sendCommand: state.sendCommand,
    connect: state.connect,
    disconnect: state.disconnect,
  }));

  // Set up capture stream
  useEffect(() => {
    const initCapture = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 1280, height: 720, facingMode: "user" },
          audio: false,
        });
        setCaptureStream(stream);
        if (captureVideoRef.current) {
          captureVideoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error("[Morpheus] Failed to init capture stream:", error);
      }
    };
    initCapture();

    return () => {
      if (captureStream) {
        captureStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Attach stream to video element when available
  useEffect(() => {
    if (captureVideoRef.current && captureStream) {
      captureVideoRef.current.srcObject = captureStream;
    }
  }, [captureStream]);

  // Reset state when disconnected
  useEffect(() => {
    if (status === "disconnected") {
      setIsDisguised(false);
      setCapturedImage(null);
    }
  }, [status]);

  const captureFrame = useCallback((): string | null => {
    const video = captureVideoRef.current;
    if (!video || !video.videoWidth) return null;

    const canvas = document.createElement("canvas");
    canvas.width = CAPTURE_W;
    canvas.height = CAPTURE_H;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    const { x, y, w, h } = coverFit(
      video.videoWidth,
      video.videoHeight,
      CAPTURE_W,
      CAPTURE_H
    );

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(video, x, y, w, h, 0, 0, CAPTURE_W, CAPTURE_H);

    return canvas.toDataURL("image/jpeg", 0.7);
  }, []);

  const handleClonePerson = useCallback(async () => {
    if (status !== "ready" || isCapturing) return;

    setIsCapturing(true);

    try {
      const frameBase64 = captureFrame();
      if (!frameBase64) {
        throw new Error("Failed to capture frame");
      }

      setCapturedImage(frameBase64);

      await sendCommand("set_reference_image", { image_b64: frameBase64 });
      await sendCommand("reset", {});

      setIsDisguised(true);
    } catch (error) {
      console.error("[Morpheus] Failed to clone person:", error);
    } finally {
      setIsCapturing(false);
    }
  }, [status, isCapturing, captureFrame, sendCommand]);

  const handleUploadImage = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file || status !== "ready" || isCapturing) return;

      setIsCapturing(true);

      try {
        const img = new Image();
        const imageUrl = URL.createObjectURL(file);

        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = reject;
          img.src = imageUrl;
        });

        const canvas = document.createElement("canvas");
        canvas.width = CAPTURE_W;
        canvas.height = CAPTURE_H;
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("Failed to get canvas context");

        const { x, y, w, h } = coverFit(
          img.width,
          img.height,
          CAPTURE_W,
          CAPTURE_H
        );

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, x, y, w, h, 0, 0, CAPTURE_W, CAPTURE_H);

        const imageBase64 = canvas.toDataURL("image/jpeg", 0.7);

        URL.revokeObjectURL(imageUrl);

        setCapturedImage(imageBase64);

        await sendCommand("set_reference_image", { image_b64: imageBase64 });
        await sendCommand("reset", {});

        setIsDisguised(true);
      } catch (error) {
        console.error("[Morpheus] Failed to upload image:", error);
      } finally {
        setIsCapturing(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    },
    [status, isCapturing, sendCommand]
  );

  const handleReset = useCallback(async () => {
    setIsDisguised(false);
    setCapturedImage(null);
    try {
      await sendCommand("reset", {});
    } catch (error) {
      console.error("[Morpheus] Failed to reset:", error);
    }
  }, [sendCommand]);

  const isReady = status === "ready";

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Hidden video element for capture */}
      <video
        ref={captureVideoRef}
        autoPlay
        muted
        playsInline
        style={{ position: "absolute", opacity: 0, pointerEvents: "none" }}
      />

      <div className="relative z-10 min-h-screen flex flex-col p-6 md:p-8">
        {/* Header */}
        <header className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-medium tracking-tight text-white">
            Morpheus
          </h1>
          <p className="mt-3 text-sm text-[#bdbdbd] font-mono uppercase tracking-widest">
            Real-Time Human Video Editing
          </p>
        </header>

        {/* Main content */}
        <div className="flex-1 flex flex-col items-center justify-center gap-6">
          {/* Video container */}
          <div className="relative w-full max-w-4xl">
            <div
              className={`relative aspect-video rounded overflow-hidden border border-white/10 ${BTN_SHADOW}`}
            >
              {/* Video display - both always mounted, toggle visibility */}
              <div className="absolute inset-0 bg-black">
                <div
                  className={`absolute inset-0 transition-opacity duration-200 ${isDisguised ? "opacity-0 z-0" : "opacity-100 z-10"}`}
                >
                  <WebcamStream
                    track="webcam"
                    className="w-full h-full"
                    videoObjectFit="cover"
                    videoConstraints={{
                      width: 1280,
                      height: 720,
                      facingMode: "user",
                    }}
                  />
                </div>
                <div
                  className={`absolute inset-0 transition-opacity duration-200 ${isDisguised ? "opacity-100 z-10" : "opacity-0 z-0"}`}
                >
                  <ReactorView
                    className="w-full h-full"
                    videoObjectFit="cover"
                    track="main_video"
                  />
                </div>
              </div>

              {/* Status overlay */}
              <div className="absolute top-4 left-4 z-10">
                <div
                  className={`flex items-center gap-2 px-3 py-1.5 rounded transition-all duration-300 ${
                    isDisguised
                      ? "bg-[#c7c099] text-black"
                      : "bg-black/80 text-white"
                  }`}
                >
                  <div
                    className={`w-2 h-2 rounded-full ${
                      isDisguised ? "bg-black" : "bg-[#bdbdbd]"
                    }`}
                  />
                  <span className="text-xs font-mono uppercase">
                    {isDisguised ? "Transform Active" : "Original Feed"}
                  </span>
                </div>
              </div>

              {/* Captured reference preview when disguised */}
              {isDisguised && capturedImage && (
                <div className="absolute bottom-4 right-4 z-10">
                  <div className="relative w-32 aspect-video rounded overflow-hidden border border-white/20">
                    <img
                      src={capturedImage}
                      alt="Reference"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                    <span className="absolute bottom-1 left-2 text-[10px] font-mono text-[#c7c099] uppercase">
                      Reference
                    </span>
                  </div>
                </div>
              )}

              {/* Original webcam PiP when disguised */}
              {isDisguised && (
                <div className="absolute bottom-4 left-4 z-10">
                  <div className="relative w-40 aspect-video rounded overflow-hidden border border-white/20">
                    <WebcamStream
                      track="webcam"
                      className="w-full h-full"
                      videoObjectFit="cover"
                      videoConstraints={{
                        width: 640,
                        height: 360,
                        facingMode: "user",
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                    <span className="absolute bottom-1 left-2 text-[10px] font-mono text-white/80 uppercase">
                      Live Input
                    </span>
                  </div>
                </div>
              )}

              {/* Capturing overlay */}
              {isCapturing && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-30">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 border-2 border-[#c7c099] border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm font-mono text-[#c7c099] uppercase">
                      Capturing...
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-col items-center gap-4 w-full max-w-md">
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleUploadImage}
              className="hidden"
            />

            {/* Main action buttons */}
            <div className="flex gap-3 w-full">
              <button
                onClick={handleClonePerson}
                disabled={!isReady || isCapturing}
                className={`flex-1 px-3 py-2 rounded bg-white text-black font-mono text-sm uppercase leading-[1.2] transition-all duration-200 hover:bg-[#fdf5c6] disabled:bg-white/20 disabled:text-[#bdbdbd] disabled:cursor-not-allowed ${BTN_SHADOW}`}
              >
                Clone
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={!isReady || isCapturing}
                className={`flex-1 px-3 py-2 rounded bg-white text-black font-mono text-sm uppercase leading-[1.2] transition-all duration-200 hover:bg-[#fdf5c6] disabled:bg-white/20 disabled:text-[#bdbdbd] disabled:cursor-not-allowed ${BTN_SHADOW}`}
              >
                Upload
              </button>
              <button
                onClick={handleReset}
                disabled={!isReady || isCapturing}
                className={`flex-1 px-3 py-2 rounded bg-white/10 text-white font-mono text-sm uppercase leading-[1.2] transition-all duration-200 hover:bg-white/20 disabled:bg-white/5 disabled:text-[#bdbdbd] disabled:cursor-not-allowed ${BTN_SHADOW}`}
              >
                Reset
              </button>
            </div>

            {/* Connection status and controls */}
            <div className="flex items-center gap-3">
              <StatusBadge status={status} />

              {status === "disconnected" ? (
                <button
                  onClick={() => connect()}
                  className={`px-3 py-2 rounded bg-white text-black font-mono text-sm uppercase leading-[1.2] transition-all duration-200 hover:bg-[#fdf5c6] ${BTN_SHADOW}`}
                >
                  Connect
                </button>
              ) : (
                <button
                  onClick={() => disconnect()}
                  className={`px-3 py-2 rounded bg-white/10 text-white font-mono text-sm uppercase leading-[1.2] transition-all duration-200 hover:bg-white/20 ${BTN_SHADOW}`}
                >
                  Disconnect
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-8 flex flex-col items-center gap-3">
          <div className="flex items-center gap-3">
            <img
              src="/logos/reactor-symbol-white.svg"
              alt="Reactor"
              className="h-5 w-auto opacity-40"
            />
            <img
              src="/logos/reactor-wordmark-white.svg"
              alt="Reactor"
              className="h-4 w-auto opacity-40"
            />
          </div>
          <p className="text-xs text-[#bdbdbd]/60 font-mono">
            &copy; {new Date().getFullYear()} Reactor Technologies, Inc.
          </p>
        </footer>
      </div>
    </div>
  );
}
