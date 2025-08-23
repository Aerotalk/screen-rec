import { useState, useRef } from "react";

export default function ScreenRecording() {
  const [recording, setRecording] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | null>(null);

  const startRecording = async () => {
    setError(null);
    setIsStarting(true);
    
    try {
      console.log('Popup: Checking if chrome.runtime is available:', !!chrome.runtime);
      console.log('Popup: Sending message to background script...');
      
      // Send message to background script to handle desktop capture
      chrome.runtime.sendMessage({ action: 'startRecording' }, (response) => {
        console.log('Popup: Received response from background:', response);
        setIsStarting(false);
        
        if (chrome.runtime.lastError) {
          console.error('Popup: Runtime error:', chrome.runtime.lastError);
          setError(`Extension error: ${chrome.runtime.lastError.message}`);
          return;
        }
        
        if (!response || !response.success) {
          const errorMsg = response?.error || 'Failed to start recording';
          console.error('Popup: Recording failed:', errorMsg);
          setError(errorMsg);
          return;
        }
        
        console.log('Popup: Got streamId from background:', response.streamId);
        
                 // Now try to get the media stream
         startMediaCapture(response.streamId);
      });
      
    } catch (error) {
      console.error("Popup: Failed to send message:", error);
      setError("Failed to communicate with extension. Please reload.");
      setIsStarting(false);
    }
  };

  const startMediaCapture = async (streamId: string) => {
    try {
      console.log('Popup: Starting media capture with streamId:', streamId);
      
      const constraints = {
        audio: false,
        video: {
          mandatory: {
            chromeMediaSource: 'desktop',
            chromeMediaSourceId: streamId
          }
        }
      } as any;
      
      console.log('Popup: getUserMedia constraints:', constraints);
      
      let stream: MediaStream;
      
      // Try the modern API first
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (modernError) {
        console.warn('Popup: Modern getUserMedia failed, trying legacy method:', modernError);
        
        // Fallback to legacy getUserMedia
        const legacyGetUserMedia = (navigator as any).webkitGetUserMedia || 
                                 (navigator as any).mozGetUserMedia || 
                                 (navigator as any).getUserMedia;
        
        if (legacyGetUserMedia) {
          stream = await new Promise<MediaStream>((resolve, reject) => {
            legacyGetUserMedia.call(navigator, constraints, resolve, reject);
          });
        } else {
          throw modernError;
        }
      }

      console.log('Popup: Got media stream:', stream);
      streamRef.current = stream;
      
      // Check if we can use vp9, fallback to vp8 or default
      let mimeType = 'video/webm';
      if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9')) {
        mimeType = 'video/webm;codecs=vp9';
      } else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp8')) {
        mimeType = 'video/webm;codecs=vp8';
      }

      console.log('Popup: Using mimeType:', mimeType);

      let mediaRecorder: MediaRecorder;
      
      try {
        mediaRecorder = new MediaRecorder(stream, { mimeType });
        mediaRecorderRef.current = mediaRecorder;
      } catch (error) {
        console.error('Popup: Failed to create MediaRecorder:', error);
        // Try without mimeType as fallback
        try {
          mediaRecorder = new MediaRecorder(stream);
          mediaRecorderRef.current = mediaRecorder;
          console.log('Popup: MediaRecorder created without mimeType');
        } catch (fallbackError) {
          console.error('Popup: Failed to create MediaRecorder even without mimeType:', fallbackError);
          setError('Failed to initialize recording. Please try again.');
          stream.getTracks().forEach(track => track.stop());
          return;
        }
      }

      const chunks: Blob[] = [];

      mediaRecorder.ondataavailable = (event: BlobEvent) => {
        console.log('Popup: Data available:', event.data.size);
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        console.log('Popup: Recording stopped, creating blob...');
        const blob = new Blob(chunks, { type: 'video/webm' });
        const videoUrl = URL.createObjectURL(blob);
        setRecording(videoUrl);
        
        // Store recording in localStorage and open preview
        localStorage.setItem("recording-preview", videoUrl);
        const extensionUrl = chrome.runtime.getURL("src/popup/index.html#/recording-preview");
        chrome.tabs.create({ url: extensionUrl });
      };

      mediaRecorder.onerror = (event: Event) => {
        console.error('Popup: MediaRecorder error:', event);
        setError('Recording failed');
        stopRecording();
      };

      // Handle stream ending
      stream.getVideoTracks()[0].addEventListener('ended', () => {
        console.log('Popup: Video track ended');
        stopRecording();
      });

      console.log('Popup: Starting recording...');
      mediaRecorder.start(1000); // Record in 1-second chunks
      setIsRecording(true);
      setRecordingTime(0);

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (error) {
      console.error("Popup: Failed to get media stream:", error);
      console.error("Popup: Error details:", {
        name: (error as Error).name,
        message: (error as Error).message,
        stack: (error as Error).stack
      });
      setError(`Failed to start recording: ${(error as Error).message}`);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    setIsRecording(false);
    setRecordingTime(0);
  };

  const downloadRecording = () => {
    if (recording) {
      const link = document.createElement("a");
      link.href = recording;
      link.download = `screen-recording-${Date.now()}.webm`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="p-6 min-w-80">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Screen Recording</h2>
      

      
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded-lg text-red-700">
          {error}
        </div>
      )}
      
      {!isRecording ? (
        <button 
          onClick={startRecording}
          disabled={isStarting}
          className={`w-full font-semibold py-3 px-4 rounded-lg transition-colors duration-200 mb-4 ${
            isStarting
              ? 'bg-gray-400 cursor-not-allowed text-white'
              : 'bg-red-600 hover:bg-red-700 text-white'
          }`}
        >
          {isStarting ? 'Starting...' : 'Start Recording'}
        </button>
      ) : (
        <div className="space-y-4">
          <div className="bg-red-100 border border-red-300 rounded-lg p-4 text-center">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-red-700 font-semibold">Recording</span>
            </div>
            <div className="text-2xl font-mono text-red-700">
              {formatTime(recordingTime)}
            </div>
          </div>
          <button 
            onClick={stopRecording}
            className="w-full bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200"
          >
            Stop Recording
          </button>
        </div>
      )}

      {recording && !isRecording && (
        <div className="mt-4">
          <video
            src={recording}
            controls
            className="w-full rounded-lg shadow-md mb-4"
          />
          <button 
            onClick={downloadRecording}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
          >
            Download Recording
          </button>
        </div>
      )}
    </div>
  );
}
