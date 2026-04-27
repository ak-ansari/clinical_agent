import { useState, useCallback, useRef, useEffect } from "react";

export function useVoice() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = "en-US";

      recognition.onstart = () => setIsRecording(true);
      recognition.onend = () => setIsRecording(false);
      recognition.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        setIsRecording(false);
      };

      recognition.onresult = (event: any) => {
        const text = event.results[0][0].transcript;
        setTranscript(text);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const startRecording = useCallback(() => {
    setTranscript("");
    recognitionRef.current?.start();
  }, []);

  const stopRecording = useCallback(() => {
    recognitionRef.current?.stop();
  }, []);

  const speak = useCallback((text: string) => {
    if (!("speechSynthesis" in window)) return;

    const synth = window.speechSynthesis;
    synth.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1;
    utterance.pitch = 1.1; // Slightly higher pitch feels more "female"
    utterance.volume = 1;

    const setVoice = () => {
      const voices = synth.getVoices();

      if (!voices.length) return;

      // Prioritize known female voices across platforms
      const femaleVoice =
        voices.find((v) => v.name.includes("Samantha")) || // macOS / iOS
        voices.find((v) => v.name.includes("Google US English Female")) || // Chrome
        voices.find((v) => v.name.toLowerCase().includes("female")) ||
        voices.find((v) => v.name.toLowerCase().includes("zira")) || // Windows
        voices.find((v) => v.lang === "en-US"); // fallback

      if (femaleVoice) {
        utterance.voice = femaleVoice;
      }

      synth.speak(utterance);
    };

    // Handle async voice loading issue
    if (synth.getVoices().length === 0) {
      synth.onvoiceschanged = setVoice;
    } else {
      setVoice();
    }
  }, []);
  return {
    isRecording,
    transcript,
    startRecording,
    stopRecording,
    speak,
    hasSupport: !!(
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition
    ),
  };
}
