import { useState, useEffect } from "react";
import VideoEditor from "../../components/VideoEditor";

export default function VideoEditorTab() {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Get video URL from URL parameters or localStorage
    const urlParams = new URLSearchParams(window.location.search);
    const videoParam = urlParams.get('video');
    
    if (videoParam) {
      setVideoUrl(videoParam);
    } else {
      // Fallback to localStorage
      const recording = localStorage.getItem("recording-preview");
      if (recording) {
        setVideoUrl(recording);
      }
    }
    
    setIsLoading(false);
  }, []);

  const handleSave = (editedVideoUrl: string) => {
    // Store the edited video
    localStorage.setItem("recording-preview", editedVideoUrl);
    
    // Update the current video
    setVideoUrl(editedVideoUrl);
    
    // Show success message
    alert("Video edited successfully! You can now download or copy the edited version.");
  };

  const handleClose = () => {
    // Go back to the previous page or close the tab
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.close();
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading video editor...</p>
        </div>
      </div>
    );
  }

  if (!videoUrl) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">No Video Found</h1>
          <p className="text-gray-600 mb-4">Please record a video first or provide a video URL.</p>
          <button
            onClick={handleClose}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <VideoEditor
        videoUrl={videoUrl}
        onSave={handleSave}
        onClose={handleClose}
      />
    </div>
  );
}
