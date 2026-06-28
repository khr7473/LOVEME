const STORE_KEY = "loveme-desktop-pair-template-v4";

const defaultState = {
  pairName: "LOVE.exe",
  clockText: "21:28",
  name1: "SUBJECT 01",
  name2: "SUBJECT 02",
  storyTitle: "PAIR STORY",
  storyText: "둘이 처음 만났던 순간부터 지금까지의 이야기를 적어 주세요. 길게 적어도 메모장 안에서 자연스럽게 줄바꿈됩니다.",
  storyMemo: "this file remembers everything.",
  statLabel1: "LOVE",
  statLabel2: "TRUST",
  statLabel3: "OBSESSION",
  stat1: "87",
  stat2: "41",
  stat3: "99",
  songTitle: "NO SIGNAL",
  songArtist: "UNKNOWN ARTIST",
  songLyric: "재생되지 않는 마음도 저장됩니다.",
  images: {},
  imageNames: {},
  colors: {
    "--pink":"#ef9ac9",
    "--lavender":"#c9b8ff",
    "--accent":"#d85f9d",
    "--mint":"#9fe2d2"
  }
};

const state = JSON.parse(JSON.stringify(defaultState));

const imageTargets = {
  sd1: ["sdImage1"],
  sd2: ["sdImage2"],
  secret1: ["secretImage1"],
  secret2: ["secretImage2"],
  cover: ["musicCover"]
};

function $(selector, root = document) {
  return root.querySelector(selector);
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value ?? "";
}

function clamp(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}

function applyText() {
  setText("topPairName", state.pairName);
  setText("mainPairName", state.pairName);
  setText("name1Card", state.name1);
  setText("name2Card", state.name2);
  setText("secretName1", state.name1);
  setText("secretName2", state.name2);
  setText("storyTitle", state.storyTitle);
  setText("storyText", state.storyText);
  setText("storyMemo", state.storyMemo);
  setText("statLabel1", state.statLabel1);
  setText("statLabel2", state.statLabel2);
  setText("statLabel3", state.statLabel3);
  setText("statValue1", `${clamp(state.stat1)}%`);
  setText("statValue2", `${clamp(state.stat2)}%`);
  setText("statValue3", `${clamp(state.stat3)}%`);
  setText("songTitle", state.songTitle);
  setText("songArtist", state.songArtist);
  setText("songLyric", state.songLyric);
  setText("desktopClock", state.clockText || "21:28");

  ["meter1", "meter2", "meter3"].forEach((id, index) => {
    const meter = document.getElementById(id);
    const value = [state.stat1, state.stat2, state.stat3][index];
    if (meter) meter.style.setProperty("--v", `${clamp(value)}%`);
  });
}

function applyImages() {
  Object.entries(imageTargets).forEach(([key, ids]) => {
    const src = state.images[key] || "";
    ids.forEach(id => {
      const img = document.getElementById(id);
      if (!img) return;
      if (src) {
        img.src = src;
        img.dataset.loaded = "true";
      } else {
        img.removeAttribute("src");
        img.dataset.loaded = "false";
      }
    });
  });
}

function applyColors() {
  Object.entries(state.colors || {}).forEach(([name, value]) => {
    if (name.startsWith("--") && value) document.documentElement.style.setProperty(name, value);
  });
}

function applyInputs() {
  document.querySelectorAll("[data-bind]").forEach(input => {
    const key = input.dataset.bind;
    if (state[key] != null && input.value !== String(state[key])) input.value = state[key];
  });
  document.querySelectorAll("[data-color]").forEach(input => {
    const key = input.dataset.color;
    const value = state.colors?.[key] || defaultState.colors[key];
    if (value && input.value !== value) input.value = value;
  });
  document.querySelectorAll("[data-file-status]").forEach(status => {
    const key = status.dataset.fileStatus;
    const name = state.imageNames?.[key];
    status.textContent = state.images?.[key] ? `이미지 적용됨${name ? ` · ${name}` : ""}` : "선택된 이미지 없음";
  });
}

function render() {
  applyColors();
  applyText();
  applyImages();
  applyInputs();
}

function saveLocal() {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(state));
  } catch (error) {
    console.warn("저장 공간이 부족할 수 있어요.", error);
  }
}

function loadLocal() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return;
    const saved = JSON.parse(raw);
    if (!saved || typeof saved !== "object") return;
    Object.assign(state, defaultState, saved);
    state.images = saved.images || {};
    state.imageNames = saved.imageNames || {};
    state.colors = Object.assign({}, defaultState.colors, saved.colors || {});
  } catch (error) {
    console.warn(error);
  }
}

function readImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function bindEditor() {
  document.querySelectorAll("[data-bind]").forEach(input => {
    input.addEventListener("input", () => {
      state[input.dataset.bind] = input.value;
      render();
      saveLocal();
    });
  });

  document.querySelectorAll("[data-color]").forEach(input => {
    input.addEventListener("input", () => {
      state.colors[input.dataset.color] = input.value;
      render();
      saveLocal();
    });
  });

  document.querySelectorAll("[data-image]").forEach(input => {
    input.addEventListener("change", async () => {
      const file = input.files && input.files[0];
      if (!file) return;
      const key = input.dataset.image;
      try {
        state.images[key] = await readImage(file);
        state.imageNames[key] = file.name;
        input.value = "";
        render();
        saveLocal();
      } catch (error) {
        console.error(error);
        alert("이미지를 읽지 못했어요. 다른 파일로 다시 시도해 주세요.");
      }
    });
  });

  $("#savePngButton")?.addEventListener("click", savePng);
  $("#exportJsonButton")?.addEventListener("click", exportJson);
  $("#importJsonInput")?.addEventListener("change", importJson);
  $("#resetButton")?.addEventListener("click", () => {
    if (!confirm("입력한 내용을 초기화할까요?")) return;
    localStorage.removeItem(STORE_KEY);
    location.reload();
  });
}

function exportJson() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type:"application/json" });
  downloadBlob(blob, `${safeFileName(state.pairName || "loveme")}.json`);
}

async function importJson(event) {
  const file = event.target.files && event.target.files[0];
  event.target.value = "";
  if (!file) return;
  try {
    const text = await file.text();
    const imported = JSON.parse(text);
    Object.assign(state, defaultState, imported);
    state.images = imported.images || {};
    state.imageNames = imported.imageNames || {};
    state.colors = Object.assign({}, defaultState.colors, imported.colors || {});
    render();
    saveLocal();
  } catch (error) {
    console.error(error);
    alert("JSON 파일을 불러오지 못했어요.");
  }
}

function safeFileName(name) {
  return String(name || "loveme_desktop").replace(/[\\/:*?"<>|]/g, "_").trim() || "loveme_desktop";
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function waitFrame(count = 1) {
  return new Promise(resolve => {
    const step = () => {
      count -= 1;
      if (count <= 0) resolve();
      else requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  });
}

async function waitForAssets(area) {
  if (document.fonts && document.fonts.ready) {
    try { await document.fonts.ready; } catch {}
  }
  const images = Array.from(area.querySelectorAll("img")).filter(img => img.src);
  await Promise.all(images.map(img => {
    if (img.complete && img.naturalWidth > 0) return Promise.resolve();
    if (img.decode) return img.decode().catch(() => undefined);
    return new Promise(resolve => {
      img.addEventListener("load", resolve, { once:true });
      img.addEventListener("error", resolve, { once:true });
    });
  }));
}

async function savePng() {
  const area = document.getElementById("captureArea");
  const button = document.getElementById("savePngButton");
  if (!area) return;
  if (typeof html2canvas !== "function") {
    alert("PNG 저장 라이브러리를 아직 불러오지 못했어요. 인터넷 연결을 확인하고 잠시 후 다시 눌러 주세요.");
    return;
  }

  if (button) {
    button.disabled = true;
    button.textContent = "PNG 저장 중...";
  }
  document.body.classList.add("is-exporting");

  try {
    await waitForAssets(area);
    await waitFrame(3);

    const canvas = await html2canvas(area, {
      backgroundColor: null,
      scale: 2,
      width: 1280,
      height: 720,
      windowWidth: 1280,
      windowHeight: 720,
      scrollX: 0,
      scrollY: 0,
      useCORS: false,
      allowTaint: false,
      logging: false,
      removeContainer: true
    });

    canvas.toBlob(blob => {
      if (!blob) {
        alert("PNG 파일을 만들지 못했어요. 이미지 용량을 조금 줄인 뒤 다시 시도해 주세요.");
        return;
      }
      downloadBlob(blob, `${safeFileName(state.pairName || "loveme_desktop")}.png`);
    }, "image/png");
  } catch (error) {
    console.error(error);
    alert("PNG 저장에 실패했어요. 외부 이미지가 아니라 직접 업로드한 이미지만 사용했는지 확인해 주세요.");
  } finally {
    document.body.classList.remove("is-exporting");
    if (button) {
      button.disabled = false;
      button.textContent = "PNG 저장";
    }
  }
}

loadLocal();
render();
bindEditor();
