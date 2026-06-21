/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Mic, MicOff, Volume2, Info, AlertCircle } from "lucide-react";

interface VoiceInputProps {
  id?: string;
  onTranscript: (text: string) => void;
  placeholder?: string;
  className?: string;
}

export default function VoiceInput({
  id = "voice-input-btn",
  onTranscript,
  placeholder = "Fale o que está fazendo...",
  className = ""
}: VoiceInputProps) {
  const [isListening, setIsListening] = useState(false);
  const [supported, setSupported] = useState(true);
  const [permissionError, setPermissionError] = useState(false);
  const [transcriptText, setTranscriptText] = useState("");

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSupported(false);
    }
  }, []);

  const startListening = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setSupported(false);
      return;
    }

    setPermissionError(false);
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "pt-BR";

    recognition.onstart = () => {
      setIsListening(true);
      setTranscriptText("");
    };

    recognition.onerror = (event: any) => {
      console.error("Erro no reconhecimento de voz: ", event);
      if (event.error === "not-allowed") {
        setPermissionError(true);
      }
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onresult = (event: any) => {
      const resultText = event.results[0][0].transcript;
      if (resultText) {
        onTranscript(resultText);
        setTranscriptText(resultText);
      }
    };

    try {
      recognition.start();
    } catch (e) {
      console.error(e);
      setIsListening(false);
    }
  };

  return (
    <div className={`flex flex-col gap-1 w-full ${className}`} id={`voice-container-${id}`}>
      <div className="flex items-center gap-2">
        <button
          type="button"
          id={id}
          onClick={startListening}
          className={`flex-none p-3.5 rounded-xl transition-all duration-300 flex items-center justify-center cursor-pointer ${
            isListening
              ? "bg-red-500 hover:bg-red-600 text-white animate-pulse shadow-lg shadow-red-500/30"
              : "bg-teal-50 hover:bg-teal-100 text-teal-700 active:scale-95"
          }`}
          title={isListening ? "Ouvindo... toque para parar" : "Falar Atividade (Gravar Voz)"}
        >
          {isListening ? (
            <Volume2 className="h-5 w-5 animate-bounce" id={`mic-on-${id}`} />
          ) : (
            <Mic className="h-5 w-5" id={`mic-off-${id}`} />
          )}
        </button>

        <div className="flex-1 text-xs">
          {isListening ? (
            <span className="text-red-500 font-medium flex items-center gap-1">
              <span className="inline-block w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-red-500 animate-ping"></span>
              Ouvindo seu comando... pode falar!
            </span>
          ) : transcriptText ? (
            <span className="text-gray-500 italic block truncate max-w-xs">
              Entendido: "{transcriptText}"
            </span>
          ) : (
            <span className="text-gray-400 block truncate">
              {supported
                ? "Toque no microfone para falar o nome da tarefa"
                : "Reconhecimento de voz não suportado neste navegador"}
            </span>
          )}
        </div>
      </div>

      {permissionError && (
        <div className="mt-1.5 p-2 bg-amber-50 rounded-lg text-amber-800 text-xs flex items-start gap-1.5 border border-amber-200" id={`permission-err-${id}`}>
          <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Microfone bloqueado</p>
            <p>Por favor, permita o acesso ao microfone nas configurações do seu navegador para usar a fala.</p>
          </div>
        </div>
      )}
    </div>
  );
}
