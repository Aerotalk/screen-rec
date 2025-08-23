// Background script for handling desktop capture
chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (request.action === 'startRecording') {
    console.log('Background: Starting desktop capture...');
    
    // Get the current tab
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        console.log('Background: Got tab ID:', tabs[0].id);
        
        // Use Chrome's desktopCapture API
        chrome.desktopCapture.chooseDesktopMedia(['screen', 'window', 'tab'], tabs[0], (streamId) => {
          console.log('Background: Desktop capture callback, streamId:', streamId);
          
          if (chrome.runtime.lastError) {
            console.error('Background: Chrome runtime error:', chrome.runtime.lastError);
            sendResponse({ success: false, error: chrome.runtime.lastError.message });
            return;
          }
          
          if (!streamId) {
            console.log('Background: No streamId received (user cancelled)');
            sendResponse({ success: false, error: 'Screen capture was cancelled' });
            return;
          }
          
          console.log('Background: Got streamId:', streamId);
          sendResponse({ success: true, streamId: streamId });
        });
      } else {
        console.error('Background: Could not get current tab');
        sendResponse({ success: false, error: 'Could not get current tab' });
      }
    });
    
    return true; // Keep the message channel open for async response
  }
});

console.log('Background script loaded');
