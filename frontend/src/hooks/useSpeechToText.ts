import { useState, useCallback, useRef, useEffect } from 'react';

interface SpeechToTextState {
  isListening: boolean;
  transcript: string;
  interimTranscript: string;
  error: string | null;
  isSupported: boolean;
  permissionState: 'unknown' | 'prompt' | 'granted' | 'denied';
}

interface UseSpeechToTextReturn extends SpeechToTextState {
  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;
  enableVoiceInput: () => Promise<boolean>;
}

// Type definitions for Web Speech API
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognition;
    webkitSpeechRecognition?: new () => SpeechRecognition;
  }
}

export function useSpeechToText(): UseSpeechToTextReturn {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(true);
  const [permissionState, setPermissionState] = useState<
    'unknown' | 'prompt' | 'granted' | 'denied'
  >('unknown');
  
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const finalTranscriptRef = useRef('');

  useEffect(() => {
    if (!window.isSecureContext) {
      setIsSupported(false);
      setPermissionState('denied');
      setError('Speech recognition requires HTTPS. Please open this app over a secure connection.');
      return;
    }

    // Check for browser support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setIsSupported(false);
      setPermissionState('denied');
      setError('Speech recognition is not supported in this browser. Try Chrome or Edge.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
      setPermissionState('granted');
      setError(null);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0].transcript;
        
        if (result.isFinal) {
          final += transcript + ' ';
        } else {
          interim += transcript;
        }
      }

      if (final) {
        finalTranscriptRef.current += final;
        setTranscript(finalTranscriptRef.current);
      }
      
      setInterimTranscript(interim);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error:', event.error);
      
      let errorMessage = 'An error occurred with speech recognition.';
      
      switch (event.error) {
        case 'no-speech':
          errorMessage = 'No speech was detected. Please try again.';
          break;
        case 'audio-capture':
          errorMessage = 'No microphone was found or microphone is not working.';
          break;
        case 'not-allowed':
          setPermissionState('denied');
          errorMessage = 'Microphone permission was denied. Please allow microphone access.';
          break;
        case 'network':
          errorMessage = 'A network error occurred. Please check your connection.';
          break;
        case 'aborted':
          errorMessage = 'Speech recognition was aborted.';
          break;
        default:
          errorMessage = `Speech recognition error: ${event.error}`;
      }
      
      setError(errorMessage);
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    // Best effort permission introspection for browsers that support the Permissions API.
    if (navigator.permissions?.query) {
      navigator.permissions
        .query({ name: 'microphone' as PermissionName })
        .then((status) => {
          if (status.state === 'granted') {
            setPermissionState('granted');
          } else if (status.state === 'denied') {
            setPermissionState('denied');
          } else {
            setPermissionState('prompt');
          }

          status.onchange = () => {
            if (status.state === 'granted') {
              setPermissionState('granted');
            } else if (status.state === 'denied') {
              setPermissionState('denied');
            } else {
              setPermissionState('prompt');
            }
          };
        })
        .catch(() => {
          setPermissionState('prompt');
        });
    } else {
      setPermissionState('prompt');
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  const enableVoiceInput = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      setError('Speech recognition is not available in this browser.');
      return false;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setPermissionState('prompt');
      return true;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
      setPermissionState('granted');
      setError(null);
      return true;
    } catch {
      setPermissionState('denied');
      setError('Microphone permission was denied. Please enable it in your browser settings.');
      return false;
    }
  }, [isSupported]);

  const startListening = useCallback(() => {
    if (!recognitionRef.current) {
      setError('Speech recognition is not available.');
      return;
    }

    if (permissionState === 'denied') {
      setError('Microphone permission is denied. Enable microphone access and try again.');
      return;
    }

    // Reset interim transcript when starting
    setInterimTranscript('');
    setError(null);
    
    try {
      recognitionRef.current.start();
    } catch {
      // If already started, stop and restart
      try {
        recognitionRef.current.stop();
        setTimeout(() => {
          recognitionRef.current?.start();
        }, 100);
      } catch {
        setError('Could not start speech recognition.');
      }
    }
  }, [permissionState]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
    
    // Append any remaining interim transcript to final
    if (interimTranscript) {
      finalTranscriptRef.current += interimTranscript + ' ';
      setTranscript(finalTranscriptRef.current);
      setInterimTranscript('');
    }
  }, [interimTranscript]);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
    finalTranscriptRef.current = '';
    setError(null);
  }, []);

  return {
    isListening,
    transcript,
    interimTranscript,
    error,
    isSupported,
    permissionState,
    startListening,
    stopListening,
    resetTranscript,
    enableVoiceInput
  };
}
