import { useCallback, useEffect, useRef, useState } from "react";

// La Web Speech API no está en lib.dom, así que declaramos lo mínimo que usamos.
type SpeechResult = { transcript: string };
type SpeechAlternatives = { 0: SpeechResult; isFinal: boolean; length: number };
type SpeechEvent = { resultIndex: number; results: { length: number } & Record<number, SpeechAlternatives> };

type Recognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechEvent) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
};

type RecognitionConstructor = new () => Recognition;

function getRecognitionConstructor(): RecognitionConstructor | null {
  const w = window as unknown as {
    SpeechRecognition?: RecognitionConstructor;
    webkitSpeechRecognition?: RecognitionConstructor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function useSpeech() {
  const [texto, setTexto] = useState("");
  const [escuchando, setEscuchando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<Recognition | null>(null);
  const finalRef = useRef("");

  const soportado = typeof window !== "undefined" && getRecognitionConstructor() !== null;

  const detener = useCallback(() => {
    recognitionRef.current?.stop();
    setEscuchando(false);
  }, []);

  const empezar = useCallback(() => {
    const Constructor = getRecognitionConstructor();
    if (!Constructor) {
      setError("Tu navegador no deja dictar. Usa el lápiz para escribir.");
      return;
    }

    const recognition = new Constructor();
    recognition.lang = "es-CO";
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event) => {
      let intermedio = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const resultado = event.results[i];
        if (resultado.isFinal) finalRef.current += resultado[0].transcript;
        else intermedio += resultado[0].transcript;
      }
      setTexto((finalRef.current + intermedio).trim());
    };

    recognition.onerror = (event) => {
      setError(
        event.error === "not-allowed"
          ? "No diste permiso del micrófono. Actívalo en los ajustes del navegador."
          : "Se perdió el dictado. Intenta otra vez o escribe con el lápiz.",
      );
      setEscuchando(false);
    };

    recognition.onend = () => setEscuchando(false);

    recognitionRef.current = recognition;
    finalRef.current = "";
    setTexto("");
    setError(null);
    setEscuchando(true);
    recognition.start();
  }, []);

  useEffect(() => () => recognitionRef.current?.abort(), []);

  return { texto, setTexto, escuchando, error, soportado, empezar, detener };
}
