import { useState, useRef } from "react";

export default function ScreenRecording() {
  const [recording, setRecording] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | null>(null);

  const startRecording = async () => {
    setError(null);
    
    // Check if we're in an extension context
    if (!chrome?.desktopCapture) {
      setError("Desktop capture API not available. Make sure this is running as a Chrome extension.");
      return;
    }
    
    // Check if webkitGetUserMedia is available
    console.log("webkitGetUserMedia available:", !!(navigator as any).webkitGetUserMedia);
    console.log("getUserMedia available:", !!navigator.mediaDevices?.getUserMedia);
    
    try {
      // Get the current tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab?.id) {
        setError("Could not get current tab");
        return;
      }

      console.log('Starting desktop capture...');
      
      // Use Chrome's desktopCapture API for extensions
      chrome.desktopCapture.chooseDesktopMedia(['screen', 'window', 'tab'], tab, async (streamId) => {
        console.log('chooseDesktopMedia callback called with streamId:', streamId);
        
        if (!streamId) {
          const lastError = chrome.runtime.lastError;
          if (lastError) {
            console.error('Desktop capture error:', lastError);
            setError(`Desktop capture failed: ${lastError.message}`);
          } else {
            setError('Screen capture was cancelled by user');
          }
          return;
        }

        console.log('Got streamId:', streamId);

        try {
          // For Chrome extensions, use proper constraints format
          const constraints: MediaStreamConstraints = {
            video: {
              // @ts-ignore - Chrome extension specific properties
              mandatory: {
                chromeMediaSource: 'desktop',
                chromeMediaSourceId: streamId,
                maxWidth: window.screen.width,
                maxHeight: window.screen.height
              }
            },
            audio: false // Set to true if you want to capture audio as well
          };

          console.log('Requesting media with constraints:', constraints);
          
          let stream: MediaStream;
          
          // Use webkitGetUserMedia for better Chrome extension compatibility
          if ((navigator as any).webkitGetUserMedia) {
            stream = await new Promise<MediaStream>((resolve, reject) => {
              (navigator as any).webkitGetUserMedia(
                constraints,
                (stream: MediaStream) => {
                  console.log('webkitGetUserMedia success:', stream);
                  resolve(stream);
                },
                (error: any) => {
                  console.error('webkitGetUserMedia error:', error);
                  reject(error);
                }
              );
            });
          } else {
            // Fallback to standard getUserMedia if webkitGetUserMedia is not available
            stream = await navigator.mediaDevices.getUserMedia({
              video: {
                // @ts-ignore - Chrome extension specific properties
                chromeMediaSource: 'desktop',
                chromeMediaSourceId: streamId,
                maxWidth: window.screen.width,
                maxHeight: window.screen.height
              } as MediaTrackConstraints
            });
          }

          console.log('Got media stream:', stream);
          streamRef.current = stream;
          
          // Check if we can use vp9, fallback to vp8 or default
          let mimeType = 'video/webm';
          if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9')) {
            mimeType = 'video/webm;codecs=vp9';
          } else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp8')) {
            mimeType = 'video/webm;codecs=vp8';
          }

          console.log('Using mimeType:', mimeType);

          const mediaRecorder = new MediaRecorder(stream, { mimeType });
          mediaRecorderRef.current = mediaRecorder;

          const chunks: Blob[] = [];

          mediaRecorder.ondataavailable = (event) => {
            console.log('Data available:', event.data.size);
            if (event.data.size > 0) {
              chunks.push(event.data);
            }
          };

          mediaRecorder.onstop = () => {
            console.log('Recording stopped, creating blob...');
            const blob = new Blob(chunks, { type: 'video/webm' });
            const videoUrl = URL.createObjectURL(blob);
            setRecording(videoUrl);
            
            // Store recording in localStorage and open preview
            localStorage.setItem("recording-preview", videoUrl);
            const extensionUrl = chrome.runtime.getURL("src/popup/index.html#/recording-preview");
            chrome.tabs.create({ url: extensionUrl });
          };

          mediaRecorder.onerror = (event) => {
            console.error('MediaRecorder error:', event);
            setError('Recording failed');
            stopRecording();
          };

          // Handle stream ending
          stream.getVideoTracks()[0].addEventListener('ended', () => {
            console.log('Video track ended');
            stopRecording();
          });

          console.log('Starting recording...');
          mediaRecorder.start(1000); // Record in 1-second chunks
          setIsRecording(true);
          setRecordingTime(0);

          // Start timer
          timerRef.current = setInterval(() => {
            setRecordingTime(prev => prev + 1);
          }, 1000);

        } catch (error: any) {
          console.error("Failed to get media stream:", error);
          console.error("Error details:", {
            name: error?.name,
            message: error?.message,
            constraint: error?.constraint,
            constraintName: error?.constraintName
          });
          
          let errorMessage = "Failed to start recording: ";
          
          if (error?.name === 'NotAllowedError') {
            errorMessage += "Permission denied. Please allow screen sharing when prompted.";
          } else if (error?.name === 'NotFoundError') {
            errorMessage += "No screen capture source found.";
          } else if (error?.name === 'NotSupportedError') {
            errorMessage += "Screen recording is not supported in this browser.";
          } else if (error?.name === 'SecurityError') {
            errorMessage += "Security error. Make sure you're using the extension from a secure context.";
          } else if (error?.message) {
            errorMessage += error.message;
          } else {
            errorMessage += "Unknown error occurred.";
          }
          
          setError(errorMessage);
        }
      });

    } catch (error) {
      console.error("Failed to start recording:", error);
      setError("Failed to access screen capture. Please check permissions.");
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
          className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 mb-4"
        >
          Start Recording
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
