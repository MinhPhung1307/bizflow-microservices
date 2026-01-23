import { useState, useEffect, useRef, useCallback } from 'react';

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any; 
  }
}

const useSpeechRecognition = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState(''); // Văn bản đã chốt
  const [interimTranscript, setInterimTranscript] = useState(''); // Văn bản đang nói dở
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Kiểm tra trình duyệt hỗ trợ
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setError("Trình duyệt của bạn không hỗ trợ nhận diện giọng nói.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true; // Cho phép nói liên tục không bị ngắt
    recognition.interimResults = true; // Cho phép trả về kết quả ngay khi đang nói
    recognition.lang = 'vi-VN';

    recognition.onstart = () => setIsListening(true);
    
    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      let interim = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript + ' ';
        } else {
          interim += event.results[i][0].transcript;
        }
      }

      // Cập nhật state
      if (finalTranscript) {
        setTranscript((prev) => prev + finalTranscript);
      }
      setInterimTranscript(interim);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error", event.error);
      if (event.error === 'not-allowed') {
        setError("Vui lòng cấp quyền micro để sử dụng tính năng này.");
      }
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      setInterimTranscript(''); // Xóa văn bản tạm khi dừng
    };

    recognitionRef.current = recognition;
  }, []);

  const startListening = useCallback(() => {
    setError(null);
    if (recognitionRef.current) {
        try {
            recognitionRef.current.start();
        } catch (e) {
            console.log("Recognition already started");
        }
    }
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
        recognitionRef.current.stop();
    }
  }, []);

  const resetTranscript = useCallback(() => {
      setTranscript('');
      setInterimTranscript('');
  }, []);

  return {
    isListening,
    transcript,
    interimTranscript,
    startListening,
    stopListening,
    resetTranscript,
    error,
    supported: !!(typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition))
  };
};

export default useSpeechRecognition;