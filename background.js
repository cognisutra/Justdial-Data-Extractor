/**
 * JustDial Data Extractor - Background service worker
 * Handles CSV download requests.
 */
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg && msg.type === "JD_DOWNLOAD_CSV") {
    try {
      const { filename, dataUrl } = msg;
      chrome.downloads.download(
        { url: dataUrl, filename, saveAs: false },
        (downloadId) => {
          if (chrome.runtime.lastError) {
            sendResponse({ ok: false, error: chrome.runtime.lastError.message });
          } else {
            sendResponse({ ok: true, downloadId });
          }
        }
      );
      return true; // async
    } catch (e) {
      sendResponse({ ok: false, error: e.message });
    }
  }
});