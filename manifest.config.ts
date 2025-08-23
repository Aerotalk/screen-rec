import { defineManifest } from "@crxjs/vite-plugin";
import pkg from "./package.json";

export default defineManifest({
  manifest_version: 3,
  name: pkg.name,
  description: pkg.description,
  version: pkg.version,
  icons: {
    48: "public/logo.png",
  },
  background: {
    service_worker: "src/background.ts",
    type: "module",
  },
  permissions: ["desktopCapture", "tabs", "activeTab", "storage"],
  action: {
    default_popup: "src/popup/index.html",
    default_title: "Screen Recorder",
  },
  content_security_policy: {
    extension_pages: "script-src 'self'; object-src 'self'",
  },
});
