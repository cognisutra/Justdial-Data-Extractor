# JustDial Data Extractor

> A free Chrome extension to scrape business listings from JustDial and export them in 4 formats — built by [cognisutra.in](https://cognisutra.in)

![Version](https://img.shields.io/badge/version-2.0.0-red) ![License](https://img.shields.io/badge/license-MIT-green) ![Manifest](https://img.shields.io/badge/manifest-v3-blue) ![Made by](https://img.shields.io/badge/made%20by-cognisutra.in-red)

---

## What It Does

Open any JustDial search results page, click **Extract Data**, and instantly get a clean, deduplicated list of business names, phone numbers, locations and categories — ready to export in your preferred format.

No accounts. No API keys. No subscriptions. Everything runs locally in your browser.

---

## Features

- **One-click extraction** — auto-scrolls the page to trigger lazy-loaded listings
- **Live preview table** — see your records inside the popup before downloading
- **4 export formats** — CSV, JSON, Excel/TSV, and a styled HTML report
- **Smart deduplication** — removes duplicate entries automatically
- **100% local & private** — data never leaves your device
- **Free forever** — no limits, no paywalls

---

## Installation (Chrome)

Since this extension is not on the Chrome Web Store, you load it as an **unpacked extension** using Developer Mode. It takes about 60 seconds.

### Step 1 — Download

Download the latest release ZIP from (https://justdialextractor.vercel.app/) or from the [Releases](#) section of this repo.

### Step 2 — Unzip

Extract the ZIP file. You should get a folder named `justdial-extractor-v2`.

**Windows:** Right-click the ZIP → Extract All  
**Mac:** Double-click the ZIP

### Step 3 — Open Chrome Extensions

In Chrome, navigate to:

```
chrome://extensions
```

Or go to **Menu (⋮) → More Tools → Extensions**.

### Step 4 — Enable Developer Mode

Toggle **Developer mode** ON using the switch in the **top-right corner** of the Extensions page. Three new buttons will appear.

### Step 5 — Load Unpacked

Click **Load unpacked** → navigate to and select the extracted `justdial-extractor-v2` folder → click **Select Folder**.

The extension will appear in your extensions list with the Cognisutra icon.

### Step 6 — Pin the Extension (Recommended)

Click the **puzzle icon 🧩** in Chrome's toolbar → find **JustDial Data Extractor** → click the **pin icon** to keep it visible in your toolbar.

---

## How to Use

1. Go to any JustDial search page — e.g. `https://www.justdial.com/Mumbai/Restaurants`
2. Wait for the results to fully load
3. Click the **JustDial Data Extractor** icon in your Chrome toolbar
4. Click **⚡ Extract Data**
5. The extension auto-scrolls the page and scrapes all visible listings
6. Review the **preview table** inside the popup
7. Click your preferred export format:

| Button | Format | Best For |
|--------|--------|----------|
| 📄 CSV | `.csv` | Google Sheets, general import |
| 📦 JSON | `.json` | Developers, APIs, automation |
| 📊 Excel/TSV | `.tsv` | Microsoft Excel (opens directly) |
| 🌐 HTML | `.html` | Shareable formatted report |

---

## Extracted Fields

Each record contains the following fields:

| Field | Description |
|-------|-------------|
| `name` | Business name |
| `phone` | Contact number |
| `location` | Area / address |
| `category` | Business category |

---

## File Structure

```
justdial-extractor-v2/
├── manifest.json       # Chrome extension manifest (v3)
├── popup.html          # Extension popup UI
├── popup.js            # Popup logic — extraction, preview, exports
├── styles.css          # Popup styles
├── content.js          # Content script — scrapes JustDial page
├── background.js       # Service worker — handles file downloads
└── icon.png            # Extension icon
```

---

## Troubleshooting

**Extraction returned 0 results**  
JustDial occasionally updates their page markup. Try refreshing the JustDial page and extracting again. If the issue persists, [open an issue](#) or contact [cognisutra.in](https://cognisutra.in).

**"Developer Mode" warning on Chrome restart**  
Chrome shows a warning about developer extensions on startup — this is normal behaviour for unpacked extensions. Simply dismiss it.

**Extension icon not visible in toolbar**  
Click the puzzle icon 🧩 in Chrome's toolbar and pin the extension.

**Results seem incomplete**  
The extractor auto-scrolls, but for very long pages try manually scrolling to the bottom before clicking Extract.

**Want to extract a different city/category**  
Click **Clear Data** first, then navigate to the new JustDial search page and extract again.

---

## Privacy

- All data is processed locally in your browser
- No data is sent to any server
- Extracted records are stored in Chrome's `localStorage` and cleared when you click Clear
- The extension only has access to `justdial.com` pages

---

## Tech Stack

- **Manifest v3** Chrome Extension API
- Vanilla JS — no external dependencies
- `chrome.scripting`, `chrome.storage.local`, `chrome.downloads`

---

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you'd like to change.

---

## License

MIT — free to use, modify and distribute.

---

## Credits

Built with ❤️ by **[Cognisutra Tech Services](https://cognisutra.in)**  
Web development, SEO & AI/ML solutions — Salem, Tamil Nadu, India  
Udyam Reg.: UDYAM-BR-11-0105715

---

*For support, feature requests or custom tool development — reach out at [cognisutra.in/contact](https://cognisutra.in/contact)*
