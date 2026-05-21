/**
 * JustDial Data Extractor - Popup
 */
const $ = (id) => document.getElementById(id);
const extractBtn = $("extractBtn");
const downloadBtn = $("downloadBtn");
const clearBtn = $("clearBtn");
const recordCount = $("recordCount");
const statusEl = $("status");

const STORAGE_KEY = "jd_extracted_data";

const setStatus = (msg, type = "info") => {
  statusEl.className = `status ${type}`;
  statusEl.textContent = msg;
  statusEl.classList.remove("hidden");
};
const clearStatus = () => statusEl.classList.add("hidden");

const updateCount = (n) => {
  recordCount.textContent = n;
  downloadBtn.disabled = n === 0;
};

const csvEscape = (val) => {
  const s = (val == null ? "" : String(val));
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
};

const toCSV = (rows) => {
  const header = ["Business Name", "Contact", "Location", "Category"];
  const lines = [header.join(",")];
  for (const r of rows) {
    lines.push([
      csvEscape(r.name),
      csvEscape(r.phone),
      csvEscape(r.location),
      csvEscape(r.category)
    ].join(","));
  }
  return lines.join("\r\n");
};

const timestamp = () => {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}_${p(d.getHours())}${p(d.getMinutes())}`;
};

/** Get the active tab */
const getActiveTab = async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
};

/** Ensure content script is injected (in case page loaded before extension install) */
const ensureContentScript = async (tabId) => {
  try {
    await chrome.tabs.sendMessage(tabId, { type: "JD_PING" });
  } catch {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ["content.js"]
    });
  }
};

const loadStored = async () => {
  const obj = await chrome.storage.local.get(STORAGE_KEY);
  return obj[STORAGE_KEY] || [];
};

const saveStored = async (data) => {
  await chrome.storage.local.set({ [STORAGE_KEY]: data });
};

/* ----- Event handlers ----- */

extractBtn.addEventListener("click", async () => {
  clearStatus();
  extractBtn.disabled = true;
  setStatus("Extracting listings... please wait.", "loading");

  try {
    const tab = await getActiveTab();
    if (!tab || !tab.url || !/justdial\.com/i.test(tab.url)) {
      setStatus("Please open a JustDial search page first.", "error");
      extractBtn.disabled = false;
      return;
    }

    await ensureContentScript(tab.id);

    const response = await chrome.tabs.sendMessage(tab.id, { type: "JD_EXTRACT" });

    if (!response || !response.ok) {
      setStatus(`Extraction failed: ${response?.error || "Unknown error"}`, "error");
      extractBtn.disabled = false;
      return;
    }

    const data = response.data || [];
    await saveStored(data);
    updateCount(data.length);

    if (data.length === 0) {
      setStatus("No listings detected. JustDial may have changed its layout.", "error");
    } else {
      setStatus(`Extracted ${data.length} unique listings successfully.`, "success");
    }
  } catch (e) {
    setStatus(`Error: ${e.message || e}`, "error");
  } finally {
    extractBtn.disabled = false;
  }
});

downloadBtn.addEventListener("click", async () => {
  try {
    const data = await loadStored();
    if (!data.length) {
      setStatus("No data available to download. Extract first.", "error");
      return;
    }
    const csv = toCSV(data);
    const dataUrl = "data:text/csv;charset=utf-8," + encodeURIComponent(csv);
    const filename = `justdial_data_${timestamp()}.csv`;

    const res = await chrome.runtime.sendMessage({
      type: "JD_DOWNLOAD_CSV",
      dataUrl,
      filename
    });

    if (res && res.ok) {
      setStatus(`Downloaded ${filename}`, "success");
    } else {
      setStatus(`Download failed: ${res?.error || "Unknown error"}`, "error");
    }
  } catch (e) {
    setStatus(`Error: ${e.message || e}`, "error");
  }
});

clearBtn.addEventListener("click", async () => {
  await chrome.storage.local.remove(STORAGE_KEY);
  updateCount(0);
  setStatus("Cleared stored data.", "info");
});

/* ----- Init ----- */
(async () => {
  const data = await loadStored();
  updateCount(data.length);
})();