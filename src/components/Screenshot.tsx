import { useState } from "react";

export default function Screenshot() {
  const [screenshot, setScreenshot] = useState<string | null>(null);

  const captureScreenVideo = async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab?.id) {
        chrome.tabs.captureVisibleTab(tab.windowId, { format: "png" }, (image) => {
          if (chrome.runtime.lastError) {
            console.error(chrome.runtime.lastError);
            return;
          }
          setScreenshot(image);
          // Store screenshot in localStorage and open preview route in new tab
          if (image) {
            localStorage.setItem("screenshot-preview", image);
            const extensionUrl = chrome.runtime.getURL("src/popup/index.html#/preview");
            chrome.tabs.create({ url: extensionUrl });
          }
        });
      }
    } catch (error) {
      console.error("Failed to capture screenshot:", error);
    }
  };

  const downloadScreenshot = async () => {
    if (screenshot) {
      const link = document.createElement("a");
      link.href = screenshot;
      const tab = await chrome.tabs.getCurrent();
      link.download = `${tab?.title || "screenshot"}-${Date.now()}.png`;
      link.click();
    }
  };

  return (
    <div className="p-6 min-w-80">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Screenshot Capturing</h2>
      <button 
        onClick={captureScreenVideo}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 mb-4"
      >
        Capture Screenshot
      </button>
      {screenshot && (
        <div className="mt-4">
          <img
            src={screenshot}
            alt="Screenshot"
            className="w-full rounded-lg shadow-md mb-4"
          />
          <button 
            onClick={downloadScreenshot}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
          >
            Download Screenshot
          </button>
        </div>
      )}
    </div>
  );
}
