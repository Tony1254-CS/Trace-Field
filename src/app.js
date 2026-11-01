const DB_NAME = "trace-field-notebook";
const DB_VERSION = 1;
const MAX_PHOTO_BYTES = 8 * 1024 * 1024;
const MAX_SOURCE_PHOTO_BYTES = 24 * 1024 * 1024;
const main = document.querySelector("#mainContent");
const missionDialog = document.querySelector("#missionDialog");
const missionForm = document.querySelector("#missionForm");
const menuDialog = document.querySelector("#menuDialog");
const recordDialog = document.querySelector("#recordDialog");
const reviewDialog = document.querySelector("#reviewDialog");
const toast = document.querySelector("#toast");

const state = {
  view: "missions",
  missions: [],
  observations: [],
  selectedMissionId: null,
  filter: "all",
  query: "",
  photoBlob: null,
  photoUrl: null,
  location: null,
  installPrompt: null,
  toastTimer: null,
  pendingRecord: null,
};

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains("missions")) db.createObjectStore("missions", { keyPath: "id" });
      if (!db.objectStoreNames.contains("observations")) db.createObjectStore("observations", { keyPath: "id" });
      if (!db.objectStoreNames.contains("drafts")) db.createObjectStore("drafts", { keyPath: "missionId" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("Could not open device storage."));
  });
}

const dbReady = openDatabase();

function dbRequest(storeName, mode, action) {
  return dbReady.then((db) => new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, mode);
    const store = tx.objectStore(storeName);
    let request;
    let result;
    try { request = action(store); } catch (error) { reject(error); return; }
    if (request) {
      request.onsuccess = () => { result = request.result; };
      request.onerror = () => reject(request.error || new Error("Device storage request failed."));
    }
    tx.oncomplete = () => resolve(result);
    tx.onerror = () => reject(tx.error || new Error("Device storage transaction failed."));
    tx.onabort = () => reject(tx.error || new Error("Device storage transaction was cancelled."));
  }));
}

const db = {
  all: (name) => dbRequest(name, "readonly", (store) => store.getAll()),
  get: (name, key) => dbRequest(name, "readonly", (store) => store.get(key)),
  put: (name, value) => dbRequest(name, "readwrite", (store) => store.put(value)),
  delete: (name, key) => dbRequest(name, "readwrite", (store) => store.delete(key)),
  clear: (name) => dbRequest(name, "readwrite", (store) => store.clear()),
};

function makeId() {
  return crypto.randomUUID ? crypto.randomUUID() : "trace-" + Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
}

function formatDate(value, includeTime = false) {
  if (!value) return "Date not set";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date not set";
  return new Intl.DateTimeFormat(undefined, includeTime
    ? { dateStyle: "medium", timeStyle: "short" }
    : { dateStyle: "medium" }).format(date);
}

function answerLabel(value) {
  return ({ supports: "Supports", contradicts: "Contradicts", inconclusive: "Inconclusive", "not-observable": "Not observable" })[value] || "Unclassified";
}

function toastMessage(message) {
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(state.toastTimer);
  state.toastTimer = setTimeout(() => toast.classList.remove("show"), 2800);
}

function refreshConnection() {
  const pill = document.querySelector(".connection-pill");
  const text = document.querySelector("#connectionText");
  const online = navigator.onLine;
  pill.classList.toggle("online", online);
  pill.classList.toggle("offline", !online);
  text.textContent = online ? "Online · local" : "Offline · saved here";
  pill.title = online ? "Connected; this version stores data on this device only." : "Offline; missions and notes remain on this device.";
}

async function refreshData() {
  const values = await Promise.all([db.all("missions"), db.all("observations")]);
  state.missions = values[0].sort((a, b) => (b.updatedAt || b.createdAt).localeCompare(a.updatedAt || a.createdAt));
  state.observations = values[1].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

function renderMissionCard(mission, index) {
  const status = mission.archived ? "archived" : "active";
  const count = state.observations.filter((item) => item.missionId === mission.id).length;
  const location = mission.place || (mission.target ? mission.target.lat.toFixed(3) + ", " + mission.target.lng.toFixed(3) : "Location not set");
  return '<article class="mission-card"><div class="card-top"><span class="mission-index">MISSION / ' + String(index + 1).padStart(2, "0") + '</span><span class="status-tag ' + status + '">' + (mission.archived ? "Archived" : "Open") + '</span></div>' +
    '<h3>' + escapeHTML(mission.title) + '</h3><p>' + escapeHTML(mission.prompt) + '</p><div class="card-bottom"><span class="mission-meta">' + escapeHTML(location) + ' · ' + count + ' ' + (count === 1 ? "note" : "notes") + '</span><div>' + (mission.archived ? '<button class="small-action" data-action="archive-mission" data-id="' + escapeHTML(mission.id) + '">Reopen</button>' : '<button class="small-action" data-action="capture-mission" data-id="' + escapeHTML(mission.id) + '">Capture</button>') + ' <button class="small-action" data-action="edit-mission" data-id="' + escapeHTML(mission.id) + '" aria-label="Edit ' + escapeHTML(mission.title) + '">Edit</button> <button class="small-action" data-action="archive-mission" data-id="' + escapeHTML(mission.id) + '" aria-label="' + (mission.archived ? "Reopen " : "Archive ") + escapeHTML(mission.title) + '">' + (mission.archived ? "↺" : "Archive") + '</button></div></div></article>';
}

function missionEmpty() {
  return '<div class="empty-state"><div><div class="empty-mark" aria-hidden="true">+</div><h3>Your field list starts here</h3><p>Create a mission with a clear observation question. TRACE keeps it on this device so it is available in the field.</p><button class="button primary" data-action="new-mission" type="button">Create a mission <span class="button-arrow">↗</span></button></div></div>';
}

function renderMissions() {
  const active = state.missions.filter((item) => !item.archived).length;
  const notes = state.observations.length;
  const cards = state.missions.length ? state.missions.map(renderMissionCard).join("") : missionEmpty();
  return '<section class="hero"><div class="hero-copy"><span class="eyebrow">FIELD NOTES / READY WHEN YOU ARE</span><h1>Go where the evidence is.</h1><p>Open a mission, record what you can observe, and keep every note safe when the signal drops.</p></div><div class="hero-action"><button class="button primary" data-action="new-mission" type="button">New mission <span class="button-arrow">↗</span></button></div></section>' +
    '<div class="stat-strip" aria-label="Your device records"><div class="stat"><strong>' + active + '</strong><span>open missions</span></div><div class="stat"><strong>' + notes + '</strong><span>field notes</span></div><div class="stat"><strong>LOCAL</strong><span>device storage</span></div></div>' +
    '<div class="section-head"><div><h2>Your missions</h2><p>Only missions you create or restore appear here.</p></div><button class="text-button" data-action="new-mission" type="button">+ Add mission</button></div>' +
    '<section class="mission-grid" aria-label="Missions">' + cards + '</section>' +
    '<aside class="privacy-banner"><span class="privacy-symbol" aria-hidden="true">⌑</span><div><b>Your notes stay on this device</b><p>TRACE has no account or cloud sync in this version. Export a backup before clearing browser data or changing devices.</p></div></aside>';
}

function renderPicker() {
  const available = state.missions.filter((mission) => !mission.archived);
  if (!available.length) return '<div class="empty-state"><div><div class="empty-mark" aria-hidden="true">＋</div><h3>No open missions yet</h3><p>Create a TRACE mission first, then start a field note from it.</p><button class="button primary" data-action="new-mission" type="button">Create mission</button></div></div>';
  return '<div class="mission-picker">' + available.map((mission) => '<button class="mission-pick ' + (state.selectedMissionId === mission.id ? "selected" : "") + '" data-action="select-mission" data-id="' + escapeHTML(mission.id) + '" type="button"><strong>' + escapeHTML(mission.title) + '</strong><span>' + escapeHTML(mission.place || "Place not set") + ' · ' + escapeHTML(mission.prompt) + '</span></button>').join("") + '</div>';
}

function renderCapture() {
  const selected = state.missions.find((mission) => mission.id === state.selectedMissionId && !mission.archived);
  const draft = state.currentDraft || {};
  const photoPreview = state.photoUrl ? '<img class="photo-preview" src="' + state.photoUrl + '" alt="Selected field photo preview"><button class="small-action remove-photo" data-action="remove-photo" type="button">Remove photo</button>' : '<span class="privacy-symbol" aria-hidden="true">＋</span>';
  const locationText = state.location ? Number(state.location.lat).toFixed(5) + ', ' + Number(state.location.lng).toFixed(5) + ' · ±' + Math.round(state.location.accuracy) + ' m' : "No location attached";
  const missionContext = [selected?.place, selected?.visitDate ? "Visit date: " + formatDate(selected.visitDate) : "", selected?.target ? "Target: " + Number(selected.target.lat).toFixed(4) + ", " + Number(selected.target.lng).toFixed(4) : ""].filter(Boolean).join(" · ");
  const captureForm = selected ? '<div class="mission-callout"><strong>' + escapeHTML(selected.title) + '</strong><p>' + escapeHTML(selected.prompt) + '</p>' + (missionContext ? '<p class="mission-context">' + escapeHTML(missionContext) + '</p>' : "") + '</div>' +
    '<form id="captureForm" class="capture-form"><div><span class="eyebrow">YOUR OBSERVATION</span><div class="response-options" role="radiogroup" aria-label="Choose your observation" style="margin-top:9px">' +
    [["supports", "Supports"], ["contradicts", "Contradicts"], ["inconclusive", "Inconclusive"], ["not-observable", "Not observable"]].map(([value, label]) => '<label class="response-option"><input type="radio" name="answer" value="' + value + '" required ' + (draft.answer === value ? "checked" : "") + '><span>' + label + '</span></label>').join("") + '</div></div>' +
    '<label>Field note <span class="helper">What did you observe? Keep interpretation separate from what you saw.</span><textarea name="note" rows="4" maxlength="1200" placeholder="Describe the visible conditions, time, and anything that may affect the observation.">' + escapeHTML(draft.note || "") + '</textarea></label>' +
    '<div><span class="eyebrow">LOCATION / OPTIONAL</span><div class="capture-row" style="margin-top:8px"><button class="gps-button" id="gpsButton" type="button">◎ Add current location</button><span class="gps-output" id="gpsOutput">' + escapeHTML(locationText) + '</span></div><input type="hidden" name="capturedAt" value="' + escapeHTML(state.location?.capturedAt || "") + '"></div>' +
    '<div><label for="photoInput">Photo evidence <span class="helper">Optional. TRACE stores a resized copy on this device.</span></label><div class="photo-box" style="margin-top:8px">' + photoPreview + '<input id="photoInput" type="file" accept="image/*" capture="environment" aria-label="Add photo evidence"></div></div>' +
    '<div class="form-actions"><button class="button secondary" id="saveDraftButton" type="button">Save draft</button><button class="button primary" type="submit">Save field note <span class="button-arrow">↗</span></button></div><p class="helper">Saved locally on this device. Not submitted or independently verified.</p></form>' : '<div class="panel"><h2>Choose a mission</h2><p class="helper" style="margin-bottom:14px">Select an open TRACE mission to attach your observation to.</p>' + renderPicker() + '</div>';
  return '<div class="page-intro"><span class="eyebrow">TRACE / FIELD CAPTURE</span><h1>Record what you see.</h1><p>Capture an observation in your own words. Location and photo are optional; your note stays on this device.</p></div><div class="capture-layout"><section class="panel"><h2>' + (selected ? "Observation" : "Mission") + '</h2>' + (selected ? captureForm : renderPicker()) + '</section><aside class="panel"><span class="eyebrow">FIELD PRACTICE</span><h2 style="margin-top:8px">Evidence before interpretation.</h2><p class="helper">Describe visible conditions first. If you cannot tell, choose inconclusive or not observable. A photo is supporting evidence, not automatic confirmation.</p><div class="privacy-banner" style="margin-top:17px"><span class="privacy-symbol" aria-hidden="true">⌖</span><div><b>Location is your choice</b><p>TRACE asks for your position only when you tap Add current location. Accuracy is saved with the coordinates.</p></div></div></aside></div>';
}

function renderRecordCard(record) {
  const mission = state.missions.find((item) => item.id === record.missionId);
  const caption = mission ? mission.title : "Mission unavailable";
  const location = record.location ? Number(record.location.lat).toFixed(4) + ", " + Number(record.location.lng).toFixed(4) + " · ±" + Math.round(record.location.accuracy) + " m" : "No location";
  return '<article class="record-card"><div><h3>' + escapeHTML(caption) + '</h3><p>' + escapeHTML(record.note || "No written note") + '</p><p class="record-time">' + escapeHTML(formatDate(record.capturedAt, true)) + '</p><p style="margin-top:7px">' + escapeHTML(location) + (record.photo ? " · Photo attached" : "") + '</p></div><div class="record-side"><span class="answer-tag ' + escapeHTML(record.answer) + '">' + answerLabel(record.answer) + '</span><button class="detail-button" data-action="view-record" data-id="' + escapeHTML(record.id) + '" type="button">View record</button></div></article>';
}

function renderRecords() {
  const filtered = state.observations.filter((record) => {
    const mission = state.missions.find((item) => item.id === record.missionId);
    const search = (record.note + " " + (mission?.title || "")).toLowerCase();
    const matchesQuery = !state.query || search.includes(state.query.toLowerCase());
    const matchesFilter = state.filter === "all" || record.answer === state.filter;
    return matchesQuery && matchesFilter;
  });
  const list = filtered.length ? filtered.map(renderRecordCard).join("") : '<div class="empty-state"><div><div class="empty-mark" aria-hidden="true">⌕</div><h3>' + (state.observations.length ? "No matching notes" : "Your field notes will live here") + '</h3><p>' + (state.observations.length ? "Try another search or response filter." : "Saved observations appear here with their mission, time, location accuracy, and attached photo.") + '</p></div></div>';
  return '<div class="page-intro"><span class="eyebrow">TRACE / DEVICE RECORDS</span><h1>Field notes, kept.</h1><p>Browse observations saved on this device. No record is marked as independently verified.</p></div><div class="records-toolbar"><input class="search-field" id="recordSearch" type="search" placeholder="Search notes or missions" value="' + escapeHTML(state.query) + '" aria-label="Search field notes"><select id="recordFilter" aria-label="Filter by response"><option value="all" ' + (state.filter === "all" ? "selected" : "") + '>All responses</option><option value="supports" ' + (state.filter === "supports" ? "selected" : "") + '>Supports</option><option value="contradicts" ' + (state.filter === "contradicts" ? "selected" : "") + '>Contradicts</option><option value="inconclusive" ' + (state.filter === "inconclusive" ? "selected" : "") + '>Inconclusive</option><option value="not-observable" ' + (state.filter === "not-observable" ? "selected" : "") + '>Not observable</option></select><button class="button secondary" data-action="export" type="button">Export backup</button></div><section class="record-list" style="margin-top:14px" aria-label="Saved field notes">' + list + '</section>';
}

async function render() {
  document.querySelectorAll(".nav-item").forEach((button) => {
    const active = button.dataset.view === state.view;
    button.classList.toggle("active", active);
    if (active) button.setAttribute("aria-current", "page"); else button.removeAttribute("aria-current");
  });
  try {
    await refreshData();
    main.innerHTML = state.view === "capture" ? renderCapture() : state.view === "records" ? renderRecords() : renderMissions();
  } catch (error) {
    main.innerHTML = '<div class="not-found"><span class="eyebrow">LOCAL STORAGE / ERROR</span><h1>TRACE cannot open its notebook.</h1><p>' + escapeHTML(error.message || "Check browser storage permissions and reload the app.") + '</p><button class="button secondary" data-action="retry" type="button">Try again</button></div>';
  }
}

function openMissionEditor(mission) {
  missionForm.reset();
  missionForm.elements.id.value = mission?.id || "";
  missionForm.elements.title.value = mission?.title || "";
  missionForm.elements.prompt.value = mission?.prompt || "";
  missionForm.elements.place.value = mission?.place || "";
  missionForm.elements.visitDate.value = mission?.visitDate || "";
  missionForm.elements.lat.value = mission?.target?.lat ?? "";
  missionForm.elements.lng.value = mission?.target?.lng ?? "";
  document.querySelector("#missionDialogTitle").textContent = mission ? "Edit mission" : "New mission";
  missionDialog.showModal();
  missionForm.elements.title.focus();
}

missionForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = new FormData(missionForm);
  const id = form.get("id") || makeId();
  const lat = form.get("lat").trim();
  const lng = form.get("lng").trim();
  if ((lat && !lng) || (!lat && lng)) {
    toastMessage("Add both target coordinates or leave both blank.");
    return;
  }
  const mission = {
    id,
    title: form.get("title").trim(),
    prompt: form.get("prompt").trim(),
    place: form.get("place").trim(),
    visitDate: form.get("visitDate"),
    target: lat && lng ? { lat: Number(lat), lng: Number(lng) } : null,
    archived: state.missions.find((item) => item.id === id)?.archived || false,
    createdAt: state.missions.find((item) => item.id === id)?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  if (!mission.title || !mission.prompt) { toastMessage("Add a mission name and a clear observation question."); return; }
  if (lat && lng && (!Number.isFinite(mission.target.lat) || Math.abs(mission.target.lat) > 90 || !Number.isFinite(mission.target.lng) || Math.abs(mission.target.lng) > 180)) { toastMessage("Target coordinates must be within valid latitude and longitude ranges."); return; }
  try {
    await db.put("missions", mission);
    missionDialog.close();
    await render();
    toastMessage("Mission saved on this device.");
  } catch (error) { toastMessage("Could not save mission: " + error.message); }
});

document.querySelectorAll(".dialog-close,.dialog-cancel").forEach((button) => button.addEventListener("click", () => button.closest("dialog").close()));
document.querySelectorAll("dialog").forEach((dialog) => dialog.addEventListener("click", (event) => { if (event.target === dialog) dialog.close(); }));

async function selectMission(id) {
  state.selectedMissionId = id;
  state.currentDraft = await db.get("drafts", id) || {};
  state.location = state.currentDraft.location || null;
  state.photoBlob = state.currentDraft.photoBlob || null;
  if (state.photoUrl) URL.revokeObjectURL(state.photoUrl);
  state.photoUrl = state.photoBlob ? URL.createObjectURL(state.photoBlob) : null;
  state.view = "capture";
  await render();
}

async function saveDraft() {
  const form = document.querySelector("#captureForm");
  const mission = state.missions.find((item) => item.id === state.selectedMissionId);
  if (!form || !mission) return;
  const values = new FormData(form);
  const draft = {
    missionId: mission.id,
    answer: values.get("answer") || "",
    note: values.get("note") || "",
    location: state.location,
    photoBlob: state.photoBlob,
    updatedAt: new Date().toISOString(),
  };
  await db.put("drafts", draft);
  state.currentDraft = draft;
}

async function compressPhoto(file) {
  if (!file || !/^image\/(jpeg|png|webp|gif|bmp|heic|heif)$/i.test(file.type)) throw new Error("Choose a supported photo format (JPEG, PNG, WebP, or GIF).");
  if (file.size > MAX_SOURCE_PHOTO_BYTES) throw new Error("Choose an image under 24 MB.");
  if (!("createImageBitmap" in window)) {
    if (file.size > MAX_PHOTO_BYTES) throw new Error("This browser cannot resize the photo. Choose an image under 8 MB.");
    return file;
  }
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const context = canvas.getContext("2d", { alpha: false });
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.82));
  if (!blob) throw new Error("Could not prepare this photo.");
  if (blob.size > MAX_PHOTO_BYTES) throw new Error("Prepared photo is still larger than 8 MB. Choose a smaller image.");
  return blob;
}

main.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-action]");
  if (!button) return;
  const { action, id } = button.dataset;
  if (action === "new-mission") openMissionEditor();
  if (action === "edit-mission") {
    const mission = state.missions.find((item) => item.id === id);
    if (mission) openMissionEditor(mission);
  }
  if (action === "capture-mission") await selectMission(id);
  if (action === "remove-photo") {
    state.photoBlob = null;
    if (state.photoUrl) URL.revokeObjectURL(state.photoUrl);
    state.photoUrl = null;
    await saveDraft();
    await render();
    toastMessage("Photo removed from this draft.");
  }
  if (action === "select-mission") {
    state.selectedMissionId = id;
    await selectMission(id);
  }
  if (action === "archive-mission") {
    const mission = state.missions.find((item) => item.id === id);
    if (mission && window.confirm((mission.archived ? "Reopen " : "Archive ") + mission.title + "?")) {
      mission.archived = !mission.archived;
      mission.updatedAt = new Date().toISOString();
      await db.put("missions", mission);
      await render();
    }
  }
  if (action === "view-record") showRecord(id);
  if (action === "delete-record") {
    if (window.confirm("Delete this field note from this device? This cannot be undone.")) {
      await db.delete("observations", id);
      recordDialog.close();
      await render();
      toastMessage("Field note deleted from this device.");
    }
  }
  if (action === "export") await exportBackup();
  if (action === "retry") await render();
});

recordDialog.addEventListener("click", async (event) => {
  const button = event.target.closest('[data-action="delete-record"]');
  if (!button) return;
  if (!window.confirm("Delete this field note from this device? This cannot be undone.")) return;
  try {
    await db.delete("observations", button.dataset.id);
    recordDialog.close();
    await render();
    toastMessage("Field note deleted from this device.");
  } catch (error) { toastMessage("Could not delete field note: " + error.message); }
});

main.addEventListener("input", (event) => {
  if (event.target.id === "recordSearch") {
    state.query = event.target.value;
    const cursor = event.target.selectionStart;
    render().then(() => {
      const input = document.querySelector("#recordSearch");
      if (input) { input.focus(); input.setSelectionRange(cursor, cursor); }
    });
  }
  if (event.target.closest("#captureForm")) {
    clearTimeout(state.draftTimer);
    state.draftTimer = setTimeout(() => saveDraft().catch(() => {}), 500);
  }
});

main.addEventListener("change", async (event) => {
  if (event.target.id === "recordFilter") { state.filter = event.target.value; await render(); }
  if (event.target.id === "photoInput") {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const photo = await compressPhoto(file);
      if (state.photoUrl) URL.revokeObjectURL(state.photoUrl);
      state.photoBlob = photo;
      state.photoUrl = URL.createObjectURL(photo);
      await saveDraft();
      const photoBox = event.target.closest(".photo-box");
      const image = document.createElement("img");
      image.className = "photo-preview";
      image.alt = "Selected field photo preview";
      image.src = state.photoUrl;
      photoBox.querySelector("img,.privacy-symbol")?.replaceWith(image);
      const removeButton = document.createElement("button");
      removeButton.type = "button";
      removeButton.className = "small-action remove-photo";
      removeButton.dataset.action = "remove-photo";
      removeButton.textContent = "Remove photo";
      photoBox.querySelector(".remove-photo")?.remove();
      photoBox.insertBefore(removeButton, event.target);
      toastMessage("Photo added to your local draft.");
    } catch (error) { toastMessage(error.message); event.target.value = ""; }
  }
});

main.addEventListener("click", async (event) => {
  if (event.target.id === "gpsButton") {
    if (!navigator.geolocation) { toastMessage("Location is not available in this browser."); return; }
    const button = event.target;
    const output = document.querySelector("#gpsOutput");
    button.disabled = true;
    button.textContent = "Finding location…";
    navigator.geolocation.getCurrentPosition(async (position) => {
      state.location = { lat: position.coords.latitude, lng: position.coords.longitude, accuracy: position.coords.accuracy, capturedAt: new Date(position.timestamp).toISOString() };
      output.textContent = Number(state.location.lat).toFixed(5) + ", " + Number(state.location.lng).toFixed(5) + " · ±" + Math.round(state.location.accuracy) + " m";
      button.disabled = false;
      button.textContent = "◎ Update location";
      await saveDraft();
      toastMessage("Location saved with its reported accuracy.");
    }, (error) => {
      button.disabled = false;
      button.textContent = "◎ Add current location";
      output.textContent = error.code === 1 ? "Permission not granted" : error.code === 2 ? "Position unavailable" : "Location request timed out";
      toastMessage(output.textContent + ". You can still save without location.");
    }, { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 });
  }
  if (event.target.id === "saveDraftButton") {
    try { await saveDraft(); toastMessage("Draft saved on this device."); }
    catch (error) { toastMessage("Could not save draft: " + error.message); }
  }
});

main.addEventListener("submit", async (event) => {
  if (event.target.id !== "captureForm") return;
  event.preventDefault();
  if (!event.target.reportValidity()) return;
  const form = new FormData(event.target);
  const mission = state.missions.find((item) => item.id === state.selectedMissionId && !item.archived);
  if (!mission) { toastMessage("Choose an open mission before saving."); return; }
  state.pendingRecord = {
    id: makeId(),
    missionId: mission.id,
    answer: form.get("answer"),
    note: String(form.get("note") || "").trim(),
    location: state.location,
    photo: state.photoBlob,
    capturedAt: state.location?.capturedAt || new Date().toISOString(),
    createdAt: new Date().toISOString(),
    status: "saved_on_device",
    verification: "awaiting_review",
  };
  const pending = state.pendingRecord;
  const location = pending.location ? Number(pending.location.lat).toFixed(5) + ", " + Number(pending.location.lng).toFixed(5) + " · ±" + Math.round(pending.location.accuracy) + " m" : "No location attached";
  document.querySelector("#reviewSummary").innerHTML = '<div class="detail-grid"><div class="detail-value"><small>Mission</small><strong>' + escapeHTML(mission.title) + '</strong></div><div class="detail-value"><small>Response</small><strong>' + escapeHTML(answerLabel(pending.answer)) + '</strong></div><div class="detail-value"><small>Location</small><strong>' + escapeHTML(location) + '</strong></div><div class="detail-value"><small>Photo</small><strong>' + (pending.photo ? "Attached" : "None") + '</strong></div></div><p class="privacy-copy">' + escapeHTML(pending.note || "No written note was added.") + '</p>' + (pending.photo ? '<img class="record-detail-photo" src="' + escapeHTML(state.photoUrl || "") + '" alt="Photo evidence preview for this field note">' : "");
  reviewDialog.showModal();
});

document.querySelector("#confirmSaveButton").addEventListener("click", async () => {
  const record = state.pendingRecord;
  if (!record) return;
  try {
    await db.put("observations", record);
    await db.delete("drafts", record.missionId);
    reviewDialog.close();
    state.pendingRecord = null;
    state.currentDraft = {};
    state.location = null;
    state.photoBlob = null;
    if (state.photoUrl) URL.revokeObjectURL(state.photoUrl);
    state.photoUrl = null;
    state.view = "records";
    await render();
    toastMessage("Field note saved on this device. It has not been submitted.");
  } catch (error) { toastMessage("Could not save note: " + error.message); }
});

document.querySelector("#moreButton").addEventListener("click", () => menuDialog.showModal());
document.querySelector("#exportButton").addEventListener("click", exportBackup);
document.querySelector("#importInput").addEventListener("change", async (event) => {
  const file = event.target.files?.[0];
  event.target.value = "";
  if (!file) return;
  try {
    if (file.size > 30 * 1024 * 1024) throw new Error("Backup must be smaller than 30 MB.");
    const payload = JSON.parse(await file.text());
    await restoreBackup(payload);
    menuDialog.close();
    await render();
    toastMessage("Backup restored. Imported records are stored on this device.");
  } catch (error) { toastMessage("Could not restore backup: " + error.message); }
});

async function blobToDataUrl(blob) {
  if (!blob) return null;
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Could not read an attached photo."));
    reader.readAsDataURL(blob);
  });
}

async function exportBackup() {
  try {
    await refreshData();
    const observations = await Promise.all(state.observations.map(async (record) => ({ ...record, photo: await blobToDataUrl(record.photo) })));
    const payload = { format: "TRACE_DEVICE_BACKUP", version: 1, exportedAt: new Date().toISOString(), missions: state.missions, observations };
    const url = URL.createObjectURL(new Blob([JSON.stringify(payload)], { type: "application/json" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "trace-backup-" + new Date().toISOString().slice(0, 10) + ".json";
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toastMessage("Device backup exported.");
  } catch (error) { toastMessage("Backup export failed: " + error.message); }
}

function dataUrlToBlob(value) {
  if (typeof value !== "string" || !value.startsWith("data:image/")) throw new Error("Backup contains an invalid photo.");
  const parts = value.split(",");
  const mime = parts[0].match(/data:([^;]+);base64/);
  if (!mime) throw new Error("Backup contains an invalid photo encoding.");
  if (!/^image\/(jpeg|png|webp|gif|bmp|heic|heif)$/i.test(mime[1])) throw new Error("Backup photo format is not supported.");
  const binary = atob(parts[1]);
  if (!binary.length) throw new Error("Backup contains an empty photo.");
  if (binary.length > MAX_PHOTO_BYTES) throw new Error("Backup photo is larger than 8 MB.");
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new Blob([bytes], { type: mime[1] });
}

async function restoreBackup(payload) {
  if (!payload || payload.format !== "TRACE_DEVICE_BACKUP" || payload.version !== 1 || !Array.isArray(payload.missions) || !Array.isArray(payload.observations)) throw new Error("This is not a supported TRACE backup.");
  if (payload.missions.length > 1000 || payload.observations.length > 10000) throw new Error("Backup contains too many records.");
  const missionIds = new Map();
  const importedMissions = payload.missions.map((mission) => {
    if (!mission || typeof mission.title !== "string" || !mission.title.trim() || mission.title.length > 72 || typeof mission.prompt !== "string" || !mission.prompt.trim() || mission.prompt.length > 500) throw new Error("Backup contains an invalid mission.");
    if (typeof mission.id !== "string" || !mission.id || missionIds.has(mission.id)) throw new Error("Backup contains a missing or duplicate mission ID.");
    if (mission.place != null && (typeof mission.place !== "string" || mission.place.length > 100)) throw new Error("Backup contains an invalid mission place.");
    if (mission.visitDate && (typeof mission.visitDate !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(mission.visitDate) || Number.isNaN(Date.parse(mission.visitDate)))) throw new Error("Backup contains an invalid mission date.");
    if (mission.target && (!Number.isFinite(mission.target.lat) || Math.abs(mission.target.lat) > 90 || !Number.isFinite(mission.target.lng) || Math.abs(mission.target.lng) > 180)) throw new Error("Backup contains invalid target coordinates.");
    if (mission.createdAt && (typeof mission.createdAt !== "string" || Number.isNaN(Date.parse(mission.createdAt)))) throw new Error("Backup contains an invalid mission timestamp.");
    if (mission.updatedAt && (typeof mission.updatedAt !== "string" || Number.isNaN(Date.parse(mission.updatedAt)))) throw new Error("Backup contains an invalid mission timestamp.");
    const id = makeId();
    missionIds.set(mission.id, id);
    const now = new Date().toISOString();
    return { ...mission, id, title: mission.title.trim(), prompt: mission.prompt.trim(), place: mission.place || "", archived: Boolean(mission.archived), createdAt: mission.createdAt || now, updatedAt: mission.updatedAt || now };
  });
  const recordIds = new Set();
  const importedRecords = payload.observations.map((record) => {
    if (!record || typeof record.id !== "string" || !record.id || !missionIds.has(record.missionId) || !["supports", "contradicts", "inconclusive", "not-observable"].includes(record.answer) || (record.note != null && (typeof record.note !== "string" || record.note.length > 1200)) || typeof record.capturedAt !== "string" || Number.isNaN(Date.parse(record.capturedAt)) || (record.createdAt && (typeof record.createdAt !== "string" || Number.isNaN(Date.parse(record.createdAt))))) throw new Error("Backup contains an invalid observation.");
    if (recordIds.has(record.id)) throw new Error("Backup contains a duplicate observation ID.");
    recordIds.add(record.id);
    const photo = record.photo ? dataUrlToBlob(record.photo) : null;
    if (record.location && (!Number.isFinite(record.location.lat) || Math.abs(record.location.lat) > 90 || !Number.isFinite(record.location.lng) || Math.abs(record.location.lng) > 180 || !Number.isFinite(record.location.accuracy) || record.location.accuracy < 0 || (record.location.capturedAt && (typeof record.location.capturedAt !== "string" || Number.isNaN(Date.parse(record.location.capturedAt)))))) throw new Error("Backup contains invalid observation coordinates or accuracy.");
    const location = record.location ? { lat: record.location.lat, lng: record.location.lng, accuracy: record.location.accuracy, capturedAt: record.location.capturedAt || record.capturedAt } : null;
    return { ...record, id: makeId(), missionId: missionIds.get(record.missionId), photo, location, note: record.note || "", status: "saved_on_device", verification: "awaiting_review", createdAt: record.createdAt || new Date().toISOString() };
  });
  const database = await dbReady;
  await new Promise((resolve, reject) => {
    const tx = database.transaction(["missions", "observations"], "readwrite");
    importedMissions.forEach((mission) => tx.objectStore("missions").put(mission));
    importedRecords.forEach((record) => tx.objectStore("observations").put(record));
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error || new Error("Backup could not be restored."));
    tx.onabort = () => reject(tx.error || new Error("Backup restore was cancelled."));
  });
}

async function showRecord(id) {
  const record = await db.get("observations", id);
  if (!record) return;
  const mission = state.missions.find((item) => item.id === record.missionId);
  const photoUrl = record.photo ? URL.createObjectURL(record.photo) : null;
  const loc = record.location ? Number(record.location.lat).toFixed(6) + ", " + Number(record.location.lng).toFixed(6) : "Not provided";
  document.querySelector("#recordDetail").innerHTML = '<div class="dialog-head"><div><span class="eyebrow">TRACE / SAVED LOCALLY</span><h2>' + escapeHTML(mission?.title || "Field note") + '</h2></div><button type="button" class="icon-button dialog-close" aria-label="Close">×</button></div>' +
    '<span class="answer-tag ' + escapeHTML(record.answer) + '">' + answerLabel(record.answer) + '</span>' +
    '<p class="mission-prompt-detail"><span class="eyebrow">MISSION QUESTION</span>' + escapeHTML(mission?.prompt || "Mission prompt unavailable") + '</p><p class="privacy-copy">' + escapeHTML(record.note || "No written note was added.") + '</p>' + (photoUrl ? '<img class="record-detail-photo" src="' + photoUrl + '" alt="Photo attached to field note">' : "") +
    '<div class="detail-grid"><div class="detail-value"><small>Captured</small><strong>' + escapeHTML(formatDate(record.capturedAt, true)) + '</strong></div><div class="detail-value"><small>Location</small><strong>' + escapeHTML(loc) + '</strong></div><div class="detail-value"><small>GPS accuracy</small><strong>' + (record.location ? "±" + Math.round(record.location.accuracy) + " m" : "Not recorded") + '</strong></div><div class="detail-value"><small>Record state</small><strong>Saved on this device</strong></div><div class="detail-value"><small>Review state</small><strong>Awaiting review</strong></div><div class="detail-value"><small>Mission</small><strong>' + escapeHTML(mission?.place || "Place not set") + '</strong></div></div>' +
    '<div class="dialog-actions"><button type="button" class="button secondary dialog-close">Close</button><button type="button" class="button secondary" data-action="delete-record" data-id="' + escapeHTML(record.id) + '">Delete record</button></div>';
  document.querySelectorAll("#recordDetail .dialog-close").forEach((button) => button.addEventListener("click", () => recordDialog.close()));
  recordDialog.showModal();
  recordDialog.addEventListener("close", () => { if (photoUrl) URL.revokeObjectURL(photoUrl); }, { once: true });
}

document.querySelectorAll(".nav-item").forEach((button) => button.addEventListener("click", async () => {
  if (state.view === "capture" && document.querySelector("#captureForm")) {
    try { await saveDraft(); }
    catch { toastMessage("Draft could not be saved. Stay here and export your notes before leaving."); return; }
  }
  state.view = button.dataset.view;
  await render();
  main.focus({ preventScroll: true });
}));

window.addEventListener("online", refreshConnection);
window.addEventListener("offline", refreshConnection);
window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  state.installPrompt = event;
  document.querySelector("#installButton").hidden = false;
});
document.querySelector("#installButton").addEventListener("click", async () => {
  if (!state.installPrompt) { toastMessage("To install, use your browser menu and choose Add to Home Screen."); return; }
  state.installPrompt.prompt();
  await state.installPrompt.userChoice;
  state.installPrompt = null;
  document.querySelector("#installButton").hidden = true;
});

if ("serviceWorker" in navigator && location.protocol !== "file:") {
  navigator.serviceWorker.register(new URL("../sw.js", import.meta.url), { scope: new URL("../", import.meta.url).pathname }).catch(() => toastMessage("Offline app shell could not be prepared. Use TRACE online and try again."));
}

refreshConnection();
render();

