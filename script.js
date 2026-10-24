(() => {
  "use strict";

  const grid = document.querySelector("#design-grid");
  const status = document.querySelector("#catalog-status");
  const statusText = status.querySelector("span:last-child");
  const errorBox = document.querySelector("#catalog-error");
  const errorMessage = document.querySelector("#catalog-error-message");
  const search = document.querySelector("#design-search");
  const resultsCount = document.querySelector("#results-count");
  const emptyState = document.querySelector("#empty-state");
  const dialog = document.querySelector("#design-dialog");
  const dialogPanel = dialog.querySelector(".dialog-panel");
  const dialogImageFrame = document.querySelector("#dialog-image-frame");
  const dialogNumber = document.querySelector("#dialog-design-number");
  const dialogPosition = document.querySelector("#dialog-position");
  const unknownDesign = document.querySelector("#unknown-design");
  const entriesById = new Map();
  let designs = [];
  let visibleDesigns = [];
  let activeIndex = -1;
  let returnFocus = null;
  let hashMessageTimer = 0;

  document.querySelector("#year").textContent = new Date().getFullYear();

  function setStatus(message, state = "") {
    statusText.textContent = message;
    status.classList.toggle("is-ready", state === "ready");
    status.classList.toggle("is-error", state === "error");
  }

  function showCatalogError(message) {
    errorMessage.textContent = message;
    errorBox.hidden = false;
    grid.replaceChildren();
    setStatus("The design book needs attention.", "error");
    resultsCount.textContent = "";
  }

  function validateManifest(payload) {
    if (!payload || !Array.isArray(payload.designs)) {
      throw new Error('designs.json must contain a top-level "designs" array.');
    }
    const seen = new Set();
    const problems = [];
    payload.designs.forEach((design, index) => {
      const label = `Entry ${index + 1}`;
      if (!design || typeof design !== "object" || Array.isArray(design)) {
        problems.push(`${label} is not an object.`);
        return;
      }
      if (typeof design.number !== "string" || !design.number.trim()) {
        problems.push(`${label} needs a non-blank string number (keep the owner's exact number as a string).`);
      } else if (seen.has(design.number.trim().toLocaleLowerCase())) {
        problems.push(`The design number "${design.number}" duplicates another number after normalization.`);
      } else {
        seen.add(design.number.trim().toLocaleLowerCase());
      }
      if (typeof design.image !== "string" || !design.image.trim()) {
        problems.push(`${label} (${design.number || "no number"}) needs an image path.`);
      } else if (/^(?:https?:|data:|\/\/|\/)/i.test(design.image) || design.image.includes("\\") || design.image.split("/").includes("..")) {
        problems.push(`${label} (${design.number || "no number"}) needs a safe relative image path inside this site.`);
      }
      if (typeof design.alt !== "string" || !design.alt.trim()) {
        problems.push(`${label} (${design.number || "no number"}) needs descriptive alt text.`);
      }
      if (typeof design.number === "string" && typeof design.alt === "string" && !design.alt.includes(design.number)) {
        problems.push(`${label} alt text should include its exact design number.`);
      }
      if (design.demo !== undefined && typeof design.demo !== "boolean") {
        problems.push(`${label} (${design.number || "no number"}) must use true or false for the optional demo flag.`);
      }
    });
    if (problems.length) throw new Error(problems.join(" "));
    return payload.designs;
  }

  function safeImagePath(path) {
    if (/^(?:https?:|data:|\/\/)/i.test(path) || path.startsWith("/")) return path;
    return new URL(path, document.baseURI).href;
  }

  function buildCard(design, index) {
    const article = document.createElement("article");
    article.className = "design-card";
    article.style.setProperty("--card-delay", `${Math.min(index, 8) * 55}ms`);
    const button = document.createElement("button");
    button.className = "design-open";
    button.type = "button";
    button.setAttribute("aria-label", `Enlarge design number ${design.number}${design.demo ? ", demonstration artwork" : ""}`);
    button.dataset.designNumber = design.number;

    const imageWrap = document.createElement("span");
    imageWrap.className = "design-image-wrap";
    const image = document.createElement("img");
    image.src = safeImagePath(design.image);
    image.alt = design.alt;
    image.loading = "lazy";
    image.decoding = "async";
    image.addEventListener("error", () => {
      image.remove();
      const fallback = document.createElement("span");
      fallback.className = "image-error";
      const message = document.createElement("span");
      message.textContent = "IMAGE NOT AVAILABLE";
      const number = document.createElement("strong");
      number.textContent = design.number;
      fallback.append(message, number);
      imageWrap.append(fallback);
      button.setAttribute("aria-label", `Image unavailable for design number ${design.number}`);
    }, { once: true });
    imageWrap.append(image);
    button.append(imageWrap);
    button.addEventListener("click", () => openDesign(design.number, button));

    const meta = document.createElement("span");
    meta.className = "card-meta";
    const number = document.createElement("span");
    number.className = "design-number";
    number.textContent = `NO. ${design.number}`;
    meta.append(number);

    const subline = document.createElement("span");
    subline.className = "card-subline";
    const edition = document.createElement("span");
    edition.textContent = "EMBROIDERY DETAIL";
    subline.append(edition);
    if (design.demo) {
      const demo = document.createElement("span");
      demo.className = "demo-tag";
      demo.textContent = "DEMO ART";
      subline.append(demo);
    }
    article.append(button, meta, subline);
    return article;
  }

  function renderCollection() {
    const query = search.value.trim().toLocaleLowerCase();
    visibleDesigns = query
      ? designs.filter((design) => design.number.toLocaleLowerCase() === query)
      : designs;
    grid.replaceChildren(...visibleDesigns.map(buildCard));
    const count = visibleDesigns.length;
    resultsCount.textContent = `${count} ${count === 1 ? "design" : "designs"}`;
    emptyState.hidden = count !== 0;
  }

  function announceUnknown(id) {
    window.clearTimeout(hashMessageTimer);
    unknownDesign.textContent = `We couldn’t find design number “${id}” in this catalogue. Check the number and try again.`;
    unknownDesign.hidden = false;
    hashMessageTimer = window.setTimeout(() => { unknownDesign.hidden = true; }, 7500);
  }

  function syncFromHash() {
    const match = window.location.hash.match(/^#design-(.*)$/);
    if (!match) {
      unknownDesign.hidden = true;
      return;
    }
    let id;
    try {
      id = decodeURIComponent(match[1]);
    } catch {
      closeDialog(false);
      announceUnknown(match[1]);
      return;
    }
    if (!entriesById.has(id)) {
      closeDialog(false);
      announceUnknown(id);
      return;
    }
    unknownDesign.hidden = true;
    search.value = "";
    renderCollection();
    const opener = [...grid.querySelectorAll(".design-open")]
      .find((button) => button.dataset.designNumber === id);
    openDesign(id, opener || document.activeElement, false);
  }

  function updateHash(id) {
    const hash = `#design-${encodeURIComponent(id)}`;
    if (window.location.hash !== hash) history.pushState({ design: id }, "", hash);
  }

  function openDesign(id, opener, changeHash = true) {
    const foundIndex = visibleDesigns.findIndex((design) => design.number === id);
    if (foundIndex < 0) {
      announceUnknown(id);
      return;
    }
    activeIndex = foundIndex;
    if (!dialog.classList.contains("is-open")) returnFocus = opener || document.activeElement;
    renderDialogDesign();
    dialog.classList.add("is-open");
    dialog.setAttribute("aria-hidden", "false");
    document.body.classList.add("dialog-open");
    if (changeHash) updateHash(id);
    dialogPanel.focus({ preventScroll: true });
  }

  function renderDialogDesign() {
    const design = visibleDesigns[activeIndex];
    if (!design) return;
    const image = document.createElement("img");
    image.src = safeImagePath(design.image);
    image.alt = design.alt;
    image.addEventListener("error", () => {
      const fallback = document.createElement("div");
      fallback.className = "image-error";
      const content = document.createElement("span");
      content.textContent = `Image unavailable · design ${design.number}`;
      fallback.append(content);
      dialogImageFrame.replaceChildren(fallback);
    }, { once: true });
    dialogImageFrame.replaceChildren(image);
    dialogNumber.textContent = `NO. ${design.number}${design.demo ? " · DEMO ART" : ""}`;
    dialogPosition.textContent = `${String(activeIndex + 1).padStart(2, "0")} / ${String(visibleDesigns.length).padStart(2, "0")}`;
    const disabled = visibleDesigns.length < 2;
    dialog.querySelector(".dialog-previous").disabled = disabled;
    dialog.querySelector(".dialog-next").disabled = disabled;
  }

  function closeDialog(updateLocation = true) {
    if (!dialog.classList.contains("is-open")) return;
    dialog.classList.remove("is-open");
    dialog.setAttribute("aria-hidden", "true");
    document.body.classList.remove("dialog-open");
    if (updateLocation && /^#design-/.test(window.location.hash)) {
      history.pushState(null, "", `${window.location.pathname}${window.location.search}`);
    }
    if (returnFocus && typeof returnFocus.focus === "function" && returnFocus.isConnected) returnFocus.focus({ preventScroll: true });
  }

  function moveDesign(direction) {
    if (visibleDesigns.length < 2) return;
    activeIndex = (activeIndex + direction + visibleDesigns.length) % visibleDesigns.length;
    renderDialogDesign();
    updateHash(visibleDesigns[activeIndex].id);
  }

  function getFocusable() {
    return [...dialog.querySelectorAll('button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])')]
      .filter((element) => element.getClientRects().length > 0);
  }

  async function loadCatalog() {
    errorBox.hidden = true;
    grid.replaceChildren();
    emptyState.hidden = true;
    setStatus("Gathering the design book…");
    try {
      const response = await fetch(new URL("designs.json", document.baseURI), { cache: "no-cache" });
      if (!response.ok) throw new Error(`The catalogue file could not be loaded (HTTP ${response.status}).`);
      const payload = await response.json();
      designs = validateManifest(payload);
      entriesById.clear();
      designs.forEach((design) => entriesById.set(design.number, design));
      setStatus(designs.length ? "A small collection, made for looking closely." : "The design book is ready for its first design.", "ready");
      renderCollection();
      if (window.location.hash.startsWith("#design-")) syncFromHash();
    } catch (error) {
      showCatalogError(error instanceof Error ? error.message : "Please try again in a moment.");
    }
  }

  search.addEventListener("input", renderCollection);
  document.querySelector("#clear-search").addEventListener("click", () => {
    search.value = "";
    renderCollection();
    search.focus();
  });
  document.querySelector("#retry-catalog").addEventListener("click", loadCatalog);
  dialog.querySelectorAll("[data-close-dialog]").forEach((element) => element.addEventListener("click", () => closeDialog()));
  dialog.querySelector(".dialog-previous").addEventListener("click", () => moveDesign(-1));
  dialog.querySelector(".dialog-next").addEventListener("click", () => moveDesign(1));
  dialog.addEventListener("keydown", (event) => {
    if (!dialog.classList.contains("is-open")) return;
    if (event.key === "Escape") {
      event.preventDefault();
      closeDialog();
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      moveDesign(-1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      moveDesign(1);
    } else if (event.key === "Tab") {
      const focusable = getFocusable();
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (document.activeElement === dialogPanel) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
      } else if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  });
  window.addEventListener("hashchange", syncFromHash);
  window.addEventListener("popstate", () => {
    if (window.location.hash.startsWith("#design-")) syncFromHash();
    else closeDialog(false);
  });
  loadCatalog();
})();
