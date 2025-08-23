import { useState, useRef } from "react";

export default function ScreenRecording() {
  // Removed unused 'recording' state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | null>(null);

  const startMediaCapture = async (streamId: string) => {
    try {
      console.log("Popup: Starting media capture with streamId:", streamId);

      const constraints = {
        audio: {
          mandatory: {
            chromeMediaSource: "desktop",
            chromeMediaSourceId: streamId,
          },
        },
        video: {
          mandatory: {
            chromeMediaSource: "desktop",
            chromeMediaSourceId: streamId,
            maxWidth: 1920,
            maxHeight: 1080,
          },
        },
      } as any;

      console.log("Popup: getUserMedia constraints:", constraints);

      const stream = await new Promise<MediaStream>((resolve, reject) => {
        const legacyGetUserMedia =
          (navigator as any).webkitGetUserMedia ||
          (navigator as any).mozGetUserMedia ||
          (navigator as any).getUserMedia;

        if (legacyGetUserMedia) {
          legacyGetUserMedia.call(navigator, constraints, resolve, reject);
        } else {
          navigator.mediaDevices
            .getUserMedia(constraints)
            .then(resolve)
            .catch(reject);
        }
      });

      console.log("Popup: Got media stream:", stream);
      streamRef.current = stream;

      let mimeType = "video/webm";
      const supportedTypes = [
        "video/webm;codecs=vp9",
        "video/webm;codecs=vp8",
        "video/webm",
      ];

      for (const type of supportedTypes) {
        if (MediaRecorder.isTypeSupported(type)) {
          mimeType = type;
          break;
        }
      }

      console.log("Popup: Using mimeType:", mimeType);

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: 2500000,
      });
      mediaRecorderRef.current = mediaRecorder;

      const chunks: Blob[] = [];

      mediaRecorder.ondataavailable = (event: BlobEvent) => {
        console.log("Popup: Data available:", event.data.size);
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        console.log("Popup: Recording stopped, creating blob...");
        const blob = new Blob(chunks, { type: mimeType });
        const videoUrl = URL.createObjectURL(blob);
        // Removed setting 'recording' as it is no longer used

        // Store recording and open preview
        localStorage.setItem("recording-preview", videoUrl);
        localStorage.setItem(
          "recording-filename",
          `screen-recording-${Date.now()}.webm`
        );

        const extensionUrl = chrome.runtime.getURL(
          "src/popup/index.html#/recording-preview"
        );
        chrome.tabs.create({ url: extensionUrl });
      };

      mediaRecorder.onerror = (event: Event) => {
        console.error("Popup: MediaRecorder error:", event);
        setError("Recording failed");
        stopRecording();
      };

      mediaRecorder.onstart = () => {
        console.log("Popup: Recording started successfully");
        setIsRecording(true);
        setRecordingTime(0);
        setIsStarting(false);

        // Start timer
        timerRef.current = window.setInterval(() => {
          setRecordingTime((prev) => prev + 1);
        }, 1000);
      };

      // Handle stream ending
      stream.getVideoTracks()[0].addEventListener("ended", () => {
        console.log("Popup: Video track ended");
        stopRecording();
      });

      console.log("Popup: Starting recording...");
      mediaRecorder.start(1000);
    } catch (error) {
      console.error("Popup: Failed to get media stream:", error);
      setError(`Failed to start recording: ${(error as Error).message}`);
      setIsStarting(false);
    }
  };

  const stopRecording = () => {
    console.log("Popup: Stopping recording...");

    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    setIsRecording(false);
    setIsPaused(false);
    setRecordingTime(0);
  };

  const pauseRecording = () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === "recording"
    ) {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const resumeRecording = () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === "paused"
    ) {
      mediaRecorderRef.current.resume();
      setIsPaused(false);

      // Resume timer
      timerRef.current = window.setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    }
  };

  const startRecording = async () => {
    console.log("Popup: Start recording clicked");
    setIsStarting(true);
    setError(null);

    try {
      console.log("Popup: Sending message to background script...");

      // Use a more robust message passing approach
      const response = await new Promise<{
        streamId?: string;
        error?: string;
        success?: boolean;
      }>((resolve, reject) => {
        let responseReceived = false;

        // Set a timeout
        const timeout = setTimeout(() => {
          if (!responseReceived) {
            console.error("Popup: Timeout - no response from background");
            reject(new Error("Background script timeout"));
          }
        }, 15000); // Increased to 15 seconds

        // Send the message
        try {
          chrome.runtime.sendMessage({ action: "startCapture" }, (response) => {
            console.log("Popup: sendMessage callback triggered");
            responseReceived = true;
            clearTimeout(timeout);

            // Check for runtime errors
            if (chrome.runtime.lastError) {
              console.error("Popup: Runtime error:", chrome.runtime.lastError);
              reject(new Error(chrome.runtime.lastError.message));
              return;
            }

            console.log("Popup: Response received:", response);

            if (response) {
              resolve(response);
            } else {
              reject(new Error("Empty response from background"));
            }
          });
          console.log("Popup: Message sent successfully");
        } catch (error) {
          responseReceived = true;
          clearTimeout(timeout);
          console.error("Popup: Error sending message:", error);
          reject(error);
        }
      });

      console.log("Popup: Got response:", response);

      if (response.streamId) {
        console.log(
          "Popup: Starting media capture with streamId:",
          response.streamId
        );
        await startMediaCapture(response.streamId);
      } else {
        const errorMsg = response.error || "No stream ID received";
        console.error("Popup: Error:", errorMsg);
        throw new Error(errorMsg);
      }
    } catch (error) {
      console.error("Popup: Failed to start recording:", error);
      setError(`Failed to start recording: ${(error as Error).message}`);
      setIsStarting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, "0")}:${secs
        .toString()
        .padStart(2, "0")}`;
    }
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  return (
    <div className="p-6 w-80 bg-white">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-800">Screen Recorder</h1>
        <div className="w-3 h-3 rounded-full bg-gray-300"></div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
          <div className="flex items-center">
            <svg
              className="w-4 h-4 mr-2"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            {error}
          </div>
        </div>
      )}

      {!isRecording && !isStarting && (
        <div className="space-y-4">
          <button
            onClick={startRecording}
            className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <circle cx="10" cy="10" r="8" />
            </svg>
            Start Recording
          </button>
          <p className="text-sm text-gray-500 text-center">
            Click to start recording your screen
          </p>
        </div>
      )}

      {isStarting && (
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-red-500 border-t-transparent"></div>
          </div>
          <p className="text-gray-600 font-medium">Starting recording...</p>
          <p className="text-sm text-gray-500">
            Please select your screen to share
          </p>
        </div>
      )}

      {isRecording && (
        <div className="space-y-6">
          {/* Recording Status */}
          <div className="text-center">
            <div className="flex items-center justify-center mb-3">
              <div
                className={`w-3 h-3 rounded-full mr-3 ${
                  isPaused ? "bg-yellow-500" : "bg-red-500 animate-pulse"
                }`}
              ></div>
              <span
                className={`font-semibold ${
                  isPaused ? "text-yellow-600" : "text-red-600"
                }`}
              >
                {isPaused ? "Paused" : "Recording"}
              </span>
            </div>

            {/* Timer */}
            <div className="text-3xl font-mono font-bold text-gray-800 mb-1">
              {formatTime(recordingTime)}
            </div>
            <p className="text-sm text-gray-500">
              {isPaused ? "Recording is paused" : "Recording in progress..."}
            </p>
          </div>

          {/* Controls */}
          <div className="flex space-x-3">
            {!isPaused ? (
              <button
                onClick={pauseRecording}
                className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center"
              >
                <svg
                  className="w-4 h-4 mr-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                Pause
              </button>
            ) : (
              <button
                onClick={resumeRecording}
                className="flex-1 bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center"
              >
                <svg
                  className="w-4 h-4 mr-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                    clipRule="evenodd"
                  />
                </svg>
                Resume
              </button>
            )}

            <button
              onClick={stopRecording}
              className="flex-1 bg-gray-800 hover:bg-gray-900 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center"
            >
              <svg
                className="w-4 h-4 mr-2"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z"
                  clipRule="evenodd"
                />
              </svg>
              Stop
            </button>
          </div>

          {/* Recording Info */}
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center text-sm text-gray-600">
              <svg
                className="w-4 h-4 mr-2"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
                  clipRule="evenodd"
                />
              </svg>
              Recording will open in a new tab when stopped
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
