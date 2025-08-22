import { useEffect, useState } from "react";

export default function ScreenshotPreview() {
  const [screenshot, setScreenshot] = useState<string | null>(null);

  useEffect(() => {
    // Get screenshot from localStorage
    const img = localStorage.getItem("screenshot-preview");
    setScreenshot(img);
  }, []);

  const copyImage = async () => {
    if (screenshot) {
      const res = await fetch(screenshot);
      const blob = await res.blob();
      const item = new ClipboardItem({ [blob.type]: blob });
      await navigator.clipboard.write([item]);
    }
  };

  const downloadImage = () => {
    if (screenshot) {
      const link = document.createElement("a");
      link.href = screenshot;
      link.download = `screenshot-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <div className="flex-1 flex items-center justify-center bg-white">
        {screenshot && (
          <img
            src={screenshot}
            alt="Screenshot"
            className="max-w-[90%] max-h-[90%] rounded-lg shadow-lg"
          />
        )}
      </div>
      <div className="w-80 bg-gray-50 flex flex-col items-center justify-center border-l border-gray-200 space-y-4">
        <button 
          onClick={copyImage}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 w-40"
        >
          Copy
        </button>
        <button 
          onClick={downloadImage}
          className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 w-40"
        >
          Download
        </button>
      </div>
    </div>
  );
}
