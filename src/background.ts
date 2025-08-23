console.log("Background script loaded");

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("Background: Received message:", request);
  console.log("Background: Sender:", sender);

  if (request.action === "startCapture") {
    console.log("Background: Processing startCapture request...");

    // Get the current active tab
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      console.log("Background: Query tabs result:", tabs);

      if (!tabs || tabs.length === 0 || !tabs[0].id) {
        console.error("Background: No active tab found");
        const errorResponse = { error: "No active tab found", success: false };
        console.log("Background: Sending error response:", errorResponse);
        sendResponse(errorResponse);
        return;
      }

      const tab = tabs[0];
      console.log("Background: Using tab:", tab.id, tab.url);

      try {
        // Request desktop capture
        const streamId = chrome.desktopCapture.chooseDesktopMedia(
          ["screen", "window", "tab"],
          tab,
          (captureStreamId) => {
            console.log("Background: chooseDesktopMedia callback called");
            console.log("Background: Received streamId:", captureStreamId);

            if (captureStreamId) {
              const successResponse = {
                streamId: captureStreamId,
                success: true,
              };
              console.log(
                "Background: Sending success response:",
                successResponse
              );

              // Send response immediately
              try {
                sendResponse(successResponse);
                console.log("Background: Response sent successfully");
              } catch (e) {
                console.error("Background: Error sending response:", e);
              }
            } else {
              const cancelResponse = {
                error: "User cancelled screen sharing or no screen selected",
                success: false,
              };
              console.log(
                "Background: Sending cancel response:",
                cancelResponse
              );

              try {
                sendResponse(cancelResponse);
                console.log("Background: Cancel response sent");
              } catch (e) {
                console.error("Background: Error sending cancel response:", e);
              }
            }
          }
        );

        console.log("Background: chooseDesktopMedia returned:", streamId);
      } catch (error) {
        console.error("Background: Exception in chooseDesktopMedia:", error);
        const exceptionResponse = {
          error: `Desktop capture failed: ${
            error instanceof Error ? error.message : "Unknown error"
          }`,
          success: false,
        };
        sendResponse(exceptionResponse);
      }
    });

    // Return true to indicate async response
    console.log("Background: Returning true for async response");
    return true;
  }

  // Handle unknown actions
  console.log("Background: Unknown action, sending error");
  sendResponse({ error: "Unknown action", success: false });
  return false;
});

// Add some debugging for the service worker lifecycle
self.addEventListener("install", () => {
  console.log("Background: Service worker installing...");
});

self.addEventListener("activate", () => {
  console.log("Background: Service worker activated");
});
