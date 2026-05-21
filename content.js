/**
 * JustDial Data Extractor - Content Script
 * Scrapes business listings from the current JustDial page.
 */
(() => {
  if (window.__JD_EXTRACTOR_LOADED__) return;
  window.__JD_EXTRACTOR_LOADED__ = true;

  /** Safely query text from a node */
  const text = (el, sel) => {
    try {
      const n = sel ? el.querySelector(sel) : el;
      return n ? (n.innerText || n.textContent || "").trim().replace(/\s+/g, " ") : "";
    } catch { return ""; }
  };

  /** Try multiple selectors and return first non-empty result */
  const firstText = (el, selectors) => {
    for (const sel of selectors) {
      const v = text(el, sel);
      if (v) return v;
    }
    return "";
  };

  /** Extract phone number from a card. JustDial sometimes obfuscates phones. */
  const extractPhone = (el) => {
    // Common containers
    const phoneSelectors = [
      "p.contact-info", ".contact-info", ".callcontent", ".tel",
      "span.mobilesv", "a[href^='tel:']", "[class*='phone']", "[class*='contact']"
    ];
    for (const sel of phoneSelectors) {
      const node = el.querySelector(sel);
      if (!node) continue;
      if (node.tagName === "A" && node.href && node.href.startsWith("tel:")) {
        return node.href.replace("tel:", "").trim();
      }
      const t = (node.innerText || node.textContent || "").trim();
      const m = t.match(/(\+?\d[\d\s\-]{7,}\d)/);
      if (m) return m[1].replace(/\s+/g, "");
    }
    // Fallback: scan entire card text for a phone-like pattern
    const all = (el.innerText || "").match(/(\+?\d[\d\s\-]{8,}\d)/);
    return all ? all[1].replace(/\s+/g, "") : "";
  };

  /** Identify business cards on the page using several known patterns */
  const findCards = () => {
    const selectorGroups = [
      "div.resultbox",
      "div.resultbox_info",
      "div[class*='resultbox']",
      "li.cntanr",
      "div.cntanr",
      "div.store-details",
      "div[class*='result']",
      "section[class*='result']"
    ];
    const seen = new Set();
    const cards = [];
    for (const sel of selectorGroups) {
      document.querySelectorAll(sel).forEach((node) => {
        // Skip nested duplicates
        if (seen.has(node)) return;
        // Skip if a parent already accepted
        let parent = node.parentElement;
        let skip = false;
        while (parent) {
          if (seen.has(parent)) { skip = true; break; }
          parent = parent.parentElement;
        }
        if (skip) return;
        seen.add(node);
        cards.push(node);
      });
      if (cards.length) break; // first matching group is usually correct
    }
    return cards;
  };

  const extractOne = (card) => {
    const name = firstText(card, [
      "h2.resultbox_title_anchor", "h2 .resultbox_title_anchor",
      "h2.store-name", "h2", "h3", ".lng_cont_name", ".resultbox_title",
      "a.resultbox_title_anchorbox", "[class*='title']"
    ]);

    const location = firstText(card, [
      ".resultbox_address", ".cont_sw_addr", ".locatcity",
      "[class*='address']", "[class*='locat']"
    ]);

    const category = firstText(card, [
      ".resultbox_categorylist", ".cont_catg", ".newcategory",
      "[class*='category']", "[class*='catg']"
    ]);

    const phone = extractPhone(card);

    return {
      name: name || "",
      phone: phone || "",
      location: location || "",
      category: category || ""
    };
  };

  /** Auto-scroll to trigger lazy loading */
  const autoScroll = async (maxScrolls = 8, delay = 700) => {
    for (let i = 0; i < maxScrolls; i++) {
      const before = document.body.scrollHeight;
      window.scrollTo({ top: document.body.scrollHeight, behavior: "instant" });
      await new Promise((r) => setTimeout(r, delay));
      const after = document.body.scrollHeight;
      if (after === before) break;
    }
    window.scrollTo({ top: 0, behavior: "instant" });
  };

  const dedupe = (rows) => {
    const seen = new Set();
    const out = [];
    for (const r of rows) {
      const key = `${(r.name || "").toLowerCase()}|${r.phone}|${(r.location || "").toLowerCase()}`;
      if (key === "||") continue;
      if (!r.name && !r.phone) continue;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(r);
    }
    return out;
  };

  const runExtraction = async () => {
    try {
      await autoScroll();
      const cards = findCards();
      const rows = cards.map(extractOne);
      const clean = dedupe(rows);
      return { ok: true, data: clean, total: clean.length };
    } catch (err) {
      return { ok: false, error: err && err.message ? err.message : String(err) };
    }
  };

  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (msg && msg.type === "JD_EXTRACT") {
      runExtraction().then(sendResponse);
      return true; // keep channel open
    }
    if (msg && msg.type === "JD_PING") {
      sendResponse({ ok: true });
      return false;
    }
  });
})();