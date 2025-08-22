import { useState } from "react";

export default function Screenshot() {
  const [screenshot, setScreenshot] = useState<string | null>(null);

  const captureScreenVideo = () => {
    chrome.tabs.captureVisibleTab(null, { format: "png" }, (image) => {
      setScreenshot(image);
    });
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
    <div>
      <h2>Screenshot Capturing</h2>
      <button onClick={captureScreenVideo}>Capture Screenshot</button>
      {screenshot && (
        <div>
          <img
            src={screenshot}
            alt="Screenshot"
            style={{ width: "100%", margin: "10px 0" }}
          />
          <button onClick={downloadScreenshot}>Download Screenshot</button>
        </div>
      )}
    </div>
  );
}
