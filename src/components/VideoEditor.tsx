import { useState, useRef, useEffect } from "react";

interface VideoSegment {
  id: string;
  startTime: number;
  endTime: number;
  label: string;
}

interface VideoEditorProps {
  videoUrl: string;
  onSave: (editedVideoUrl: string) => void;
  onClose: () => void;
}

export default function VideoEditor({ videoUrl, onSave, onClose }: VideoEditorProps) {
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [segments, setSegments] = useState<VideoSegment[]>([]);
  const [selectedSegment, setSelectedSegment] = useState<string | null>(null);
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      const video = videoRef.current;
      
      const handleLoadedMetadata = () => {
        setDuration(video.duration);
        setTrimEnd(video.duration);
      };

      const handleTimeUpdate = () => {
        setCurrentTime(video.currentTime);
      };

      video.addEventListener('loadedmetadata', handleLoadedMetadata);
      video.addEventListener('timeupdate', handleTimeUpdate);

      return () => {
        video.removeEventListener('loadedmetadata', handleLoadedMetadata);
        video.removeEventListener('timeupdate', handleTimeUpdate);
      };
    }
  }, []);

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const seekTo = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(0, Math.min(time, duration));
    }
  };

  const addSegment = () => {
    const newSegment: VideoSegment = {
      id: Date.now().toString(),
      startTime: currentTime,
      endTime: Math.min(currentTime + 5, duration),
      label: `Segment ${segments.length + 1}`
    };
    setSegments([...segments, newSegment]);
  };

  const updateSegment = (id: string, updates: Partial<VideoSegment>) => {
    setSegments(segments.map(seg => 
      seg.id === id ? { ...seg, ...updates } : seg
    ));
  };

  const deleteSegment = (id: string) => {
    setSegments(segments.filter(seg => seg.id !== id));
    if (selectedSegment === id) {
      setSelectedSegment(null);
    }
  };

  const captureFrame = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        ctx.drawImage(videoRef.current, 0, 0);
        
        // Download the frame
        const link = document.createElement('a');
        link.download = `frame-${Math.floor(currentTime)}.png`;
        link.href = canvas.toDataURL();
        link.click();
      }
    }
  };

  const trimVideo = async () => {
    if (!videoRef.current) return;

    setIsProcessing(true);
    try {
      // For now, we'll just save the original video since captureStream is not widely supported
      // In a real implementation, you would use a more sophisticated video processing library
      onSave(videoUrl);
      setIsProcessing(false);
    } catch (error) {
      console.error('Error trimming video:', error);
      setIsProcessing(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Video Editor</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-xl"
          >
            ×
          </button>
        </div>

        {/* Video Player */}
        <div className="mb-6">
          <video
            ref={videoRef}
            src={videoUrl}
            className="w-full rounded-lg shadow-lg"
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
          />
          
          {/* Video Controls */}
          <div className="mt-4 space-y-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={togglePlayPause}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
              >
                {isPlaying ? 'Pause' : 'Play'}
              </button>
              
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Volume:</span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={volume}
                  onChange={(e) => {
                    const newVolume = parseFloat(e.target.value);
                    setVolume(newVolume);
                    if (videoRef.current) {
                      videoRef.current.volume = newVolume;
                    }
                  }}
                  className="w-20"
                />
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Speed:</span>
                <select
                  value={playbackRate}
                  onChange={(e) => {
                    const newRate = parseFloat(e.target.value);
                    setPlaybackRate(newRate);
                    if (videoRef.current) {
                      videoRef.current.playbackRate = newRate;
                    }
                  }}
                  className="border rounded px-2 py-1"
                >
                  <option value={0.25}>0.25x</option>
                  <option value={0.5}>0.5x</option>
                  <option value={1}>1x</option>
                  <option value={1.5}>1.5x</option>
                  <option value={2}>2x</option>
                </select>
              </div>
            </div>

            {/* Timeline */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-600">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
              <input
                type="range"
                min="0"
                max={duration}
                step="0.1"
                value={currentTime}
                onChange={(e) => seekTo(parseFloat(e.target.value))}
                className="w-full"
              />
            </div>
          </div>
        </div>

        {/* Trim Controls */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-semibold mb-3">Trim Video</h3>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Start:</span>
              <input
                type="range"
                min="0"
                max={duration}
                step="0.1"
                value={trimStart}
                onChange={(e) => setTrimStart(parseFloat(e.target.value))}
                className="w-32"
              />
              <span className="text-sm font-mono">{formatTime(trimStart)}</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">End:</span>
              <input
                type="range"
                min="0"
                max={duration}
                step="0.1"
                value={trimEnd}
                onChange={(e) => setTrimEnd(parseFloat(e.target.value))}
                className="w-32"
              />
              <span className="text-sm font-mono">{formatTime(trimEnd)}</span>
            </div>

            <button
              onClick={trimVideo}
              disabled={isProcessing}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg"
            >
              {isProcessing ? 'Processing...' : 'Trim Video'}
            </button>
          </div>
        </div>

        {/* Segments */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-semibold">Segments</h3>
            <button
              onClick={addSegment}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg text-sm"
            >
              Add Segment
            </button>
          </div>
          
          <div className="space-y-2">
            {segments.map((segment) => (
              <div
                key={segment.id}
                className={`p-3 border rounded-lg cursor-pointer ${
                  selectedSegment === segment.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                }`}
                onClick={() => setSelectedSegment(segment.id)}
              >
                <div className="flex justify-between items-center">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={segment.label}
                      onChange={(e) => updateSegment(segment.id, { label: e.target.value })}
                      className="font-medium bg-transparent border-none outline-none w-full"
                    />
                    <div className="text-sm text-gray-600">
                      {formatTime(segment.startTime)} - {formatTime(segment.endTime)}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => seekTo(segment.startTime)}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      Go to Start
                    </button>
                    <button
                      onClick={() => deleteSegment(segment.id)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Frame Capture */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">Frame Capture</h3>
          <button
            onClick={captureFrame}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg"
          >
            Capture Current Frame
          </button>
          <canvas ref={canvasRef} className="hidden" />
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-4">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(videoUrl)}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
