import "./App.css";
import { Routes, Route } from "react-router";
import MainApp from "@/components/MainApp";
import ScreenshotPreview from "@/components/ScreenshotPreview";
import RecordingPreview from "@/components/RecordingPreview";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<MainApp />} />
      <Route path="/preview" element={<ScreenshotPreview />} />
      <Route path="/recording-preview" element={<RecordingPreview />} />
    </Routes>
  );
}
