import { useEffect, useState } from "react";

export default function RecordingPreview() {
  const [recording, setRecording] = useState<string | null>(null);

  useEffect(() => {
    // Get recording from localStorage
    const rec = localStorage.getItem("recording-preview");
    setRecording(rec);
  }, []);

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

  const copyRecording = async () => {
    if (recording) {
      try {
        const response = await fetch(recording);
        const blob = await response.blob();
        const item = new ClipboardItem({ [blob.type]: blob });
        await navigator.clipboard.write([item]);
      } catch (error) {
        console.error("Failed to copy recording:", error);
      }
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <div className="flex-1 flex items-center justify-center bg-white p-4">
        {recording && (
          <video
            src={recording}
            controls
            className="max-w-[90%] max-h-[90%] rounded-lg shadow-lg"
          />
        )}
      </div>
      <div className="w-80 bg-gray-50 flex flex-col items-center justify-center border-l border-gray-200 space-y-4">
        <button 
          onClick={copyRecording}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 w-40"
        >
          Copy
        </button>
        <button 
          onClick={downloadRecording}
          className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 w-40"
        >
          Download
        </button>
      </div>
    </div>
  );
}
