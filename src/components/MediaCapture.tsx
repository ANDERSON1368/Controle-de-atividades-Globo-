/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from "react";
import { Camera, Video, Square, RefreshCw, Upload, Trash2, ShieldAlert, Check, Play, Film } from "lucide-react";
import { TaskAttachment } from "../types";

interface MediaCaptureProps {
  attachments: TaskAttachment[];
  onChange: (attachments: TaskAttachment[]) => void;
  id?: string;
}

export default function MediaCapture({
  attachments,
  onChange,
  id = "media-capture"
}: MediaCaptureProps) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Stop stream when component unmounts
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [stream]);

  // Handle live counting during tape
  useEffect(() => {
    if (isRecording) {
      setRecordingSeconds(0);
      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording]);

  const startCamera = async () => {
    setCameraError(null);
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode },
        audio: true
      });
      setStream(mediaStream);
      setIsCameraActive(true);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err: any) {
      console.error("Camera access error: ", err);
      setCameraError(
        "Não foi possível acessar a câmera do aparelho em tempo real no iframe. Você pode usar a opção de upload abaixo para anexar fotos ou vídeos direto da sua galeria!"
      );
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setIsCameraActive(false);
    setIsRecording(false);
  };

  const toggleCameraFacing = async () => {
    const nextFacing = facingMode === "user" ? "environment" : "user";
    setFacingMode(nextFacing);
    // Restart camera with new settings
    setTimeout(() => {
      if (isCameraActive) {
        startCamera();
      }
    }, 100);
  };

  // Capture Photo from Canvas
  const capturePhoto = () => {
    if (!videoRef.current) return;
    try {
      const video = videoRef.current;
      const canvas = document.createElement("canvas");
      // Match high quality dimension
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;

      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        // Save as compressed JPEG base64 to prevent storage bloating
        const dataUrl = canvas.toDataURL("image/jpeg", 0.75);

        const newAttachment: TaskAttachment = {
          id: `attach_img_${Date.now()}`,
          type: "photo",
          url: dataUrl,
          timestamp: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
        };

        onChange([...attachments, newAttachment]);
        stopCamera();
      }
    } catch (err) {
      console.error(err);
      alert("Erro ao congelar foto.");
    }
  };

  // Video recording controls
  const startRecordingVideo = () => {
    if (!stream) return;
    recordedChunksRef.current = [];
    
    try {
      const options = { mimeType: "video/webm;codecs=vp8,opus" };
      let mediaRecorder;
      try {
        mediaRecorder = new MediaRecorder(stream, options);
      } catch (e) {
        // Fallback mimeType
        mediaRecorder = new MediaRecorder(stream);
      }

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: "video/webm" });
        // Since video binary can be large and exceed standard 5MB localStorage, we will create an Object URL or reader for this session.
        // For standard local persistence we also attempt to save as base64 chunk if it is short, otherwise Object Blob URL.
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64data = reader.result as string;
          
          const newAttachment: TaskAttachment = {
            id: `attach_vid_${Date.now()}`,
            type: "video",
            url: base64data,
            timestamp: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
          };

          onChange([...attachments, newAttachment]);
        };
        reader.readAsDataURL(blob);
        stopCamera();
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (e) {
      console.error("MediaRecorder start error: ", e);
      alert("Não foi possível iniciar gravador de vídeo neste aparelho.");
    }
  };

  const stopRecordingVideo = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // Handle native file input uploads directly from gallery (essential fallback)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: "photo" | "video") => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const reader = new FileReader();
      
      reader.onload = (event) => {
        const url = event.target?.result as string;
        if (url) {
          const newAttach: TaskAttachment = {
            id: `attach_upload_${type}_${Date.now()}_${i}`,
            type: type,
            url: url,
            timestamp: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
          };
          onChange([...attachments, newAttach]);
        }
      };
      
      // Keep safety limits for base64 storage
      if (file.size > 8 * 1024 * 1024) {
        alert(`O arquivo "${file.name}" é muito pesado. Por favor, selecione arquivos com menos de 8MB para garantir o salvamento.`);
        continue;
      }

      reader.readAsDataURL(file);
    }
    // clear input value
    e.target.value = "";
  };

  const deleteAttachment = (attachId: string) => {
    onChange(attachments.filter((a) => a.id !== attachId));
  };

  const formatSeconds = (totalSecs: number) => {
    const m = Math.floor(totalSecs / 60);
    const s = totalSecs % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex flex-col gap-3 w-full" id={`media-capture-panel-${id}`}>
      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">
        Evidências Visuais (Fotos / Vídeos da Atividade)
      </label>

      {/* Attachments preview list */}
      {attachments.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 bg-neutral-50 p-2.5 rounded-2xl border border-neutral-200/60 max-h-48 overflow-y-auto">
          {attachments.map((attach) => (
            <div key={attach.id} className="relative group rounded-xl overflow-hidden border border-neutral-300 bg-neutral-900 aspect-video flex items-center justify-center">
              {attach.type === "photo" ? (
                <img
                  src={attach.url}
                  alt="Evidência"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-full h-full relative flex items-center justify-center bg-black">
                  <Film className="w-8 h-8 text-neutral-500" />
                  <span className="absolute bottom-2 left-2 text-[8px] uppercase tracking-wider font-bold bg-black/60 text-white px-1.5 py-0.5 rounded flex items-center gap-1">
                    <Film className="w-2 h-2 text-amber-400" />
                    VÍDEO
                  </span>
                  <video 
                    src={attach.url} 
                    className="absolute inset-0 w-full h-full object-contain pointer-events-auto opacity-70 hover:opacity-100" 
                    controls 
                    preload="metadata"
                  />
                </div>
              )}

              {/* Remove attachment button */}
              <button
                type="button"
                onClick={() => deleteAttachment(attach.id)}
                className="absolute top-1.5 right-1.5 p-1 bg-red-600/90 hover:bg-red-700 text-white rounded-lg transition-all scale-90 active:scale-75 shadow-md cursor-pointer"
                title="Remover anexo"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>

              <span className="absolute bottom-1 right-2 text-[9px] bg-black/50 text-neutral-300 font-mono px-1 rounded">
                {attach.timestamp}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Active Camera Live Preview Area */}
      {isCameraActive && (
        <div className="relative rounded-2xl overflow-hidden bg-black aspect-video border-2 border-teal-500 shadow-lg flex flex-col items-center justify-center">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />

          {/* Indicators overlay */}
          <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none">
            {isRecording ? (
              <span className="bg-red-600 text-white text-[9px] font-bold px-2 py-1 rounded-full animate-pulse uppercase tracking-wider flex items-center gap-1.5 shadow-md">
                <span className="w-2 h-2 rounded-full bg-white block animate-ping" />
                Gravando {formatSeconds(recordingSeconds)}
              </span>
            ) : (
              <span className="bg-teal-600/90 text-white text-[9px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider shadow-md">
                Câmera ao vivo
              </span>
            )}

            <div className="flex gap-1.5 pointer-events-auto">
              <button
                type="button"
                onClick={toggleCameraFacing}
                className="p-1.5 bg-black/60 hover:bg-black/80 rounded-lg text-white transition-all cursor-pointer"
                title="Girar câmera"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Real-time capturing action menu bar */}
          <div className="absolute bottom-3 left-0 right-0 flex items-center justify-center gap-3">
            {!isRecording ? (
              <>
                <button
                  type="button"
                  onClick={capturePhoto}
                  className="bg-white hover:bg-neutral-100 text-gray-900 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-xl transition-all active:scale-95 cursor-pointer border border-neutral-300"
                >
                  <Camera className="w-4 h-4 text-teal-600" />
                  <span>Tirar Foto</span>
                </button>

                <button
                  type="button"
                  onClick={startRecordingVideo}
                  className="bg-amber-500 hover:bg-amber-600 text-neutral-900 font-extrabold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-xl transition-all active:scale-95 cursor-pointer"
                >
                  <Video className="w-4 h-4 fill-neutral-900" />
                  <span>Gravar Vídeo</span>
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={stopRecordingVideo}
                className="bg-red-600 hover:bg-red-700 text-white font-extrabold px-6 py-2.5 rounded-xl text-xs flex items-center gap-1.5 shadow-xl transition-all active:scale-95 cursor-pointer"
              >
                <Square className="w-4 h-4 fill-white animate-pulse" />
                <span>Parar e Salvar</span>
              </button>
            )}

            <button
              type="button"
              onClick={stopCamera}
              className="bg-black/60 hover:bg-black/80 text-white font-medium px-3 py-2 rounded-xl text-xs shadow-md transition-all cursor-pointer"
            >
              Fechar Câmera
            </button>
          </div>
        </div>
      )}

      {/* Trigger Buttons UI */}
      {!isCameraActive && (
        <div className="flex flex-col gap-2">
          {/* Active direct options */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={startCamera}
              className="bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold p-3 rounded-xl text-xs flex items-center justify-center gap-2 transition-all border border-teal-200 cursor-pointer active:scale-95"
            >
              <Camera className="w-4 h-4 text-teal-600" />
              <span>Abrir Câmera</span>
            </button>

            {/* Quick direct native device photo snap backup using standard HTML picker */}
            <label className="bg-neutral-50 hover:bg-neutral-100 text-neutral-700 font-bold p-3 rounded-xl text-xs flex items-center justify-center gap-2 transition-all border border-neutral-200 cursor-pointer text-center active:scale-95">
              <Upload className="w-4 h-4 text-gray-500" />
              <span>Tirar Foto (Nativo)</span>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={(e) => handleFileUpload(e, "photo")}
                className="hidden"
              />
            </label>
          </div>

          {/* Quick upload backups for larger media */}
          <div className="grid grid-cols-2 gap-2">
            <label className="bg-neutral-50/70 hover:bg-neutral-100 text-neutral-600 p-2.5 rounded-xl text-[11px] font-medium flex items-center justify-center gap-1.5 border border-dashed border-neutral-300 cursor-pointer text-center">
              <Upload className="w-3.5 h-3.5" />
              <span>Inserir da Galeria (Foto)</span>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => handleFileUpload(e, "photo")}
                className="hidden"
              />
            </label>

            <label className="bg-neutral-50/70 hover:bg-neutral-100 text-neutral-600 p-2.5 rounded-xl text-[11px] font-medium flex items-center justify-center gap-1.5 border border-dashed border-neutral-300 cursor-pointer text-center">
              <Upload className="w-3.5 h-3.5" />
              <span>Inserir da Galeria (Vídeo)</span>
              <input
                type="file"
                accept="video/*"
                onChange={(e) => handleFileUpload(e, "video")}
                className="hidden"
              />
            </label>
          </div>
        </div>
      )}

      {/* Warnings alerts panel */}
      {cameraError && (
        <div className="p-3 bg-amber-50 rounded-2xl text-amber-800 text-[11px] flex items-start gap-1.5 border border-amber-200">
          <ShieldAlert className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Aviso sobre permissão de câmera</p>
            <p className="mt-0.5 leading-relaxed">{cameraError}</p>
          </div>
        </div>
      )}
    </div>
  );
}
