import { useEffect, useState } from "react";
import VideoEditor from "./VideoEditor";

export default function RecordingPreview() {
  const [recording, setRecording] = useState<string | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [editedRecording, setEditedRecording] = useState<string | null>(null);

  useEffect(() => {
    // Get recording from localStorage
    const rec = localStorage.getItem("recording-preview");
    setRecording(rec);
  }, []);

  const downloadRecording = () => {
    const videoUrl = editedRecording || recording;
    if (videoUrl) {
      const link = document.createElement("a");
      link.href = videoUrl;
      link.download = `screen-recording-${Date.now()}.webm`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const copyRecording = async () => {
    const videoUrl = editedRecording || recording;
    if (videoUrl) {
      try {
        const response = await fetch(videoUrl);
        const blob = await response.blob();
        const item = new ClipboardItem({ [blob.type]: blob });
        await navigator.clipboard.write([item]);
      } catch (error) {
        console.error("Failed to copy recording:", error);
      }
    }
  };

  const handleSaveEdit = (editedVideoUrl: string) => {
    setEditedRecording(editedVideoUrl);
    setShowEditor(false);
  };

  const openEditor = () => {
    setShowEditor(true);
  };

  const closeEditor = () => {
    setShowEditor(false);
  };

  const openEditorInNewTab = () => {
    if (recording) {
      const extensionUrl = chrome.runtime.getURL("src/popup/index.html#/video-editor");
      chrome.tabs.create({ url: extensionUrl });
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <div className="flex-1 flex items-center justify-center bg-white p-4">
        {recording && (
          <video
            src={editedRecording || recording}
            controls
            className="max-w-[90%] max-h-[90%] rounded-lg shadow-lg"
          />
        )}
      </div>
      <div className="w-80 bg-gray-50 flex flex-col items-center justify-center border-l border-gray-200 space-y-4">
        <button 
          onClick={openEditor}
          className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 w-40"
        >
          Edit Video
        </button>
        <button 
          onClick={openEditorInNewTab}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 w-40"
        >
          Full-Screen Editor
        </button>
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
        {editedRecording && (
          <div className="text-center text-sm text-gray-600">
            <p>✓ Video has been edited</p>
            <button
              onClick={() => setEditedRecording(null)}
              className="text-blue-600 hover:text-blue-800 underline mt-1"
            >
              Reset to original
            </button>
          </div>
        )}
      </div>

      {showEditor && recording && (
        <VideoEditor
          videoUrl={recording}
          onSave={handleSaveEdit}
          onClose={closeEditor}
        />
      )}
    </div>
  );
}
