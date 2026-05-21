/**
 * JustDial Data Extractor - Popup
 * v2.0 | cognisutra.in
 */
const $ = (id) => document.getElementById(id);
const extractBtn    = $("extractBtn");
const downloadCSV   = $("downloadCSV");
const downloadJSON  = $("downloadJSON");
const downloadTSV   = $("downloadTSV");
const downloadHTML  = $("downloadHTML");
const clearBtn      = $("clearBtn");
const recordCount   = $("recordCount");
const statusEl      = $("status");
const previewSection = $("previewSection");
const exportSection  = $("exportSection");
const previewBody    = $("previewBody");
const previewCount   = $("previewCount");

const STORAGE_KEY = "jd_extracted_data";

/* ---- Helpers ---- */
const setStatus = (msg, type = "info") => {
  statusEl.className = `status ${type}`;
  statusEl.textContent = msg;
  statusEl.classList.remove("hidden");
};
const clearStatus = () => statusEl.classList.add("hidden");

const updateCount = (n) => {
  recordCount.textContent = n;
};

const showUI = (data) => {
  const n = data.length;
  updateCount(n);
  if (n === 0) {
    previewSection.classList.add("hidden");
    exportSection.classList.add("hidden");
    return;
  }
  // Render preview (first 50 rows)
  previewBody.innerHTML = "";
  const slice = data.slice(0, 50);
  slice.forEach((r, i) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="num">${i + 1}</td>
      <td title="${esc(r.name)}">${esc(r.name) || "—"}</td>
      <td title="${esc(r.phone)}">${esc(r.phone) || "—"}</td>
      <td title="${esc(r.location)}">${esc(r.location) || "—"}</td>
      <td title="${esc(r.category)}">${esc(r.category) || "—"}</td>
    `;
    previewBody.appendChild(tr);
  });
  previewCount.textContent = n > 50 ? `Showing 50 of ${n}` : `${n} record${n !== 1 ? "s" : ""}`;
  previewSection.classList.remove("hidden");
  exportSection.classList.remove("hidden");
};

const esc = (v) => {
  if (!v) return "";
  return String(v).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
};

const csvEscape = (val) => {
  const s = (val == null ? "" : String(val));
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
};

const timestamp = () => {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${p(d.getMonth()+1)}${p(d.getDate())}_${p(d.getHours())}${p(d.getMinutes())}`;
};

/* ---- Format converters ---- */
const toCSV = (rows) => {
  const header = ["Business Name","Contact","Location","Category"];
  const lines = [header.join(",")];
  for (const r of rows) {
    lines.push([csvEscape(r.name), csvEscape(r.phone), csvEscape(r.location), csvEscape(r.category)].join(","));
  }
  return lines.join("\r\n");
};

const toTSV = (rows) => {
  const header = ["Business Name","Contact","Location","Category"];
  const lines = [header.join("\t")];
  for (const r of rows) {
    lines.push([r.name||"", r.phone||"", r.location||"", r.category||""].map(v=>String(v).replace(/\t/g," ")).join("\t"));
  }
  return lines.join("\r\n");
};

const toJSON = (rows) => JSON.stringify(rows, null, 2);

const toHTML = (rows) => {
  const ts = new Date().toLocaleString("en-IN");
  const rowsHTML = rows.map((r, i) => `
    <tr>
      <td>${i+1}</td>
      <td>${esc(r.name)||"—"}</td>
      <td>${esc(r.phone)||"—"}</td>
      <td>${esc(r.location)||"—"}</td>
      <td>${esc(r.category)||"—"}</td>
    </tr>`).join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>JustDial Export — ${ts}</title>
<style>
  body { font-family: Arial, sans-serif; font-size: 13px; color: #1f2937; max-width: 960px; margin: 32px auto; padding: 0 16px; }
  h1 { font-size: 20px; color: #d32f2f; margin-bottom: 4px; }
  .meta { font-size: 12px; color: #6b7280; margin-bottom: 20px; }
  table { width: 100%; border-collapse: collapse; }
  th { background: #d32f2f; color: #fff; padding: 8px 12px; text-align: left; font-size: 12px; }
  td { padding: 7px 12px; border-bottom: 1px solid #f3f4f6; }
  tr:nth-child(even) td { background: #f9fafb; }
  tr:hover td { background: #fef2f2; }
  .footer { text-align: center; margin-top: 24px; font-size: 11px; color: #9ca3af; }
  .footer a { color: #d32f2f; text-decoration: none; font-weight: bold; }
</style>
</head>
<body>
<h1>JustDial Business Listings</h1>
<p class="meta">Exported on ${ts} &nbsp;|&nbsp; ${rows.length} records</p>
<table>
  <thead><tr><th>#</th><th>Business Name</th><th>Phone</th><th>Location</th><th>Category</th></tr></thead>
  <tbody>${rowsHTML}</tbody>
</table>
<div class="footer">Made with ❤️ by <a href="https://cognisutra.in" target="_blank">cognisutra.in</a></div>
</body>
</html>`;
};

/* ---- Download helper ---- */
const triggerDownload = async (content, filename, mimeType) => {
  const dataUrl = `data:${mimeType};charset=utf-8,` + encodeURIComponent(content);
  const res = await chrome.runtime.sendMessage({ type: "JD_DOWNLOAD_CSV", dataUrl, filename });
  if (res && res.ok) {
    setStatus(`Downloaded: ${filename}`, "success");
  } else {
    setStatus(`Download failed: ${res?.error || "Unknown"}`, "error");
  }
};

/* ---- Storage ---- */
const loadStored = async () => {
  const obj = await chrome.storage.local.get(STORAGE_KEY);
  return obj[STORAGE_KEY] || [];
};
const saveStored = async (data) => chrome.storage.local.set({ [STORAGE_KEY]: data });

const getActiveTab = async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
};
const ensureContentScript = async (tabId) => {
  try { await chrome.tabs.sendMessage(tabId, { type: "JD_PING" }); }
  catch { await chrome.scripting.executeScript({ target: { tabId }, files: ["content.js"] }); }
};

/* ---- Event Handlers ---- */
extractBtn.addEventListener("click", async () => {
  clearStatus();
  extractBtn.disabled = true;
  setStatus("Extracting listings… please wait.", "loading");
  try {
    const tab = await getActiveTab();
    if (!tab?.url || !/justdial\.com/i.test(tab.url)) {
      setStatus("Please open a JustDial search page first.", "error");
      extractBtn.disabled = false;
      return;
    }
    await ensureContentScript(tab.id);
    const response = await chrome.tabs.sendMessage(tab.id, { type: "JD_EXTRACT" });
    if (!response?.ok) {
      setStatus(`Extraction failed: ${response?.error || "Unknown error"}`, "error");
      extractBtn.disabled = false;
      return;
    }
    const data = response.data || [];
    await saveStored(data);
    showUI(data);
    if (data.length === 0) {
      setStatus("No listings detected. JustDial may have changed its layout.", "error");
    } else {
      setStatus(`✅ Extracted ${data.length} unique listings. Pick a format to export.`, "success");
    }
  } catch (e) {
    setStatus(`Error: ${e.message || e}`, "error");
  } finally {
    extractBtn.disabled = false;
  }
});

downloadCSV.addEventListener("click", async () => {
  const data = await loadStored();
  if (!data.length) { setStatus("No data. Extract first.", "error"); return; }
  await triggerDownload(toCSV(data), `justdial_${timestamp()}.csv`, "text/csv");
});

downloadJSON.addEventListener("click", async () => {
  const data = await loadStored();
  if (!data.length) { setStatus("No data. Extract first.", "error"); return; }
  await triggerDownload(toJSON(data), `justdial_${timestamp()}.json`, "application/json");
});

downloadTSV.addEventListener("click", async () => {
  const data = await loadStored();
  if (!data.length) { setStatus("No data. Extract first.", "error"); return; }
  await triggerDownload(toTSV(data), `justdial_${timestamp()}.tsv`, "text/tab-separated-values");
});

downloadHTML.addEventListener("click", async () => {
  const data = await loadStored();
  if (!data.length) { setStatus("No data. Extract first.", "error"); return; }
  await triggerDownload(toHTML(data), `justdial_${timestamp()}.html`, "text/html");
});

clearBtn.addEventListener("click", async () => {
  await chrome.storage.local.remove(STORAGE_KEY);
  updateCount(0);
  previewSection.classList.add("hidden");
  exportSection.classList.add("hidden");
  clearStatus();
  setStatus("Cleared stored data.", "info");
});

/* ---- Init ---- */
(async () => {
  const data = await loadStored();
  showUI(data);
})();
