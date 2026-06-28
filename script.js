const STORE_KEY = "loveme-desktop-pair-template-v2";

const defaultState = {
  pairName: "LOVE.exe",
  taskbarTime: "21:28",
  name1: "SUBJECT 01",
  name2: "SUBJECT 02",
  line1: "여기까지 와줬네.",
  line2: "계속 보고 있었어.",
  tag1: "saved memory",
  tag2: "locked file",
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
  colors: {}
};

const state = structuredClone(defaultState);

const imageTargets = {
  sd1: ["sdImage1"],
  sd2: ["sdImage2"],
  char1: ["charImage1"],
  char2: ["charImage2"],
  secret1: ["secretImage1"],
  secret2: ["secretImage2"],
  cover: ["musicCover"]
};

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value || "";
}

function clampPercent(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  return Math.max(0, Math.min(100, number));
}

function applyText() {
  setText("pairNameTop", state.pairName);
  setText("pairNameMain", state.pairName);
  setText("sdName1", state.name1);
  setText("sdName2", state.name2);
  setText("charName1", state.name1);
  setText("charName2", state.name2);
  setText("secretName1", state.name1);
  setText("secretName2", state.name2);
  setText("charLine1", state.line1);
  setText("charLine2", state.line2);
  setText("charTag1", state.tag1);
  setText("charTag2", state.tag2);
  setText("statLabel1", state.statLabel1);
  setText("statLabel2", state.statLabel2);
  setText("statLabel3", state.statLabel3);
  setText("statValue1", `${clampPercent(state.stat1)}%`);
  setText("statValue2", `${clampPercent(state.stat2)}%`);
  setText("statValue3", `${clampPercent(state.stat3)}%`);
  setText("songTitle", state.songTitle);
  setText("songArtist", state.songArtist);
  setText("songLyric", state.songLyric);
  setText("fakeClock", state.taskbarTime || "21:28");

  document.querySelectorAll(".meter").forEach((meter, index) => {
    const value = [state.stat1, state.stat2, state.stat3][index];
    meter.style.setProperty("--v", `${clampPercent(value)}%`);
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
        img.dataset.empty = "false";
      } else {
        img.removeAttribute("src");
        img.dataset.empty = "true";
      }
    });
  });
}

function applyColors() {
  const root = document.documentElement;
  Object.entries(state.colors || {}).forEach(([name, value]) => {
    root.style.setProperty(name, value);
  });
}

function applyInputs() {
  document.querySelectorAll("[data-bind]").forEach(input => {
    const key = input.dataset.bind;
    if (state[key] != null && input.value !== state[key]) input.value = state[key];
  });
  document.querySelectorAll("[data-color]").forEach(input => {
    const key = input.dataset.color;
    if (state.colors && state.colors[key]) input.value = state.colors[key];
  });
  document.querySelectorAll("[data-file-status]").forEach(status => {
    const key = status.dataset.fileStatus;
    status.textContent = state.images && state.images[key] ? "이미지 적용됨" : "선택된 이미지 없음";
  });
}

function render() {
  applyText();
  applyImages();
  applyColors();
  applyInputs();
}

function saveLocal() {
  localStorage.setItem(STORE_KEY, JSON.stringify(state));
}

function loadLocal() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORE_KEY) || "null");
    if (!saved || typeof saved !== "object") return;
    Object.assign(state, defaultState, saved);
    state.images = saved.images || {};
    state.colors = saved.colors || {};
  } catch (error) {
    console.warn(error);
  }
}

function resetAll() {
  localStorage.removeItem(STORE_KEY);
  location.reload();
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
    });
  });

  document.querySelectorAll("[data-image]").forEach(input => {
    input.addEventListener("change", async () => {
      const file = input.files && input.files[0];
      if (!file) return;
      state.images[input.dataset.image] = await readImage(file);
      input.value = "";
      render();
      saveLocal();
    });
  });

  document.querySelectorAll("[data-color]").forEach(input => {
    input.addEventListener("input", () => {
      state.colors[input.dataset.color] = input.value;
      render();
    });
  });
}

function focusWindow(key) {
  const target = document.querySelector(`[data-window="${key}"]`);
  if (!target) return;
  document.querySelectorAll(".window").forEach(item => item.classList.remove("is-front"));
  target.classList.add("is-front");
}

function bindWindows() {
  document.querySelectorAll(".window").forEach(win => {
    win.addEventListener("pointerdown", () => focusWindow(win.dataset.window));
  });

  document.querySelectorAll("[data-open-char]").forEach(button => {
    button.addEventListener("click", () => focusWindow(`char${button.dataset.openChar}`));
  });

  document.querySelectorAll("[data-focus]").forEach(button => {
    button.addEventListener("click", () => focusWindow(button.dataset.focus));
  });
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

async function waitForExportAssets(area) {
  if (document.fonts && document.fonts.ready) {
    try { await document.fonts.ready; } catch (error) { console.warn(error); }
  }

  const images = Array.from(area.querySelectorAll("img")).filter(img => img.src && img.dataset.empty !== "true");
  await Promise.all(images.map(img => {
    if (img.complete && img.naturalWidth) return Promise.resolve();
    if (typeof img.decode === "function") return img.decode().catch(() => undefined);
    return new Promise(resolve => {
      img.addEventListener("load", resolve, { once:true });
      img.addEventListener("error", resolve, { once:true });
    });
  }));
}

async function savePng() {
  const area = document.getElementById("captureArea");
  if (!area || typeof html2canvas !== "function") {
    alert("PNG 저장 라이브러리를 불러오지 못했어요. 새로고침 후 다시 시도해 주세요.");
    return;
  }

  document.body.classList.add("is-exporting");

  try {
    await waitForExportAssets(area);
    await waitFrame(2);

    const rect = area.getBoundingClientRect();
    const canvas = await html2canvas(area, {
      backgroundColor: null,
      scale: Math.max(2, Math.min(3, window.devicePixelRatio || 2)),
      width: Math.round(rect.width),
      height: Math.round(rect.height),
      windowWidth: document.documentElement.clientWidth,
      windowHeight: document.documentElement.clientHeight,
      scrollX: 0,
      scrollY: 0,
      useCORS: true,
      allowTaint: true,
      logging: false
    });

    const safeName = (state.pairName || "pair").replace(/[\\/:*?\"<>|]/g, "_").trim() || "pair";
    canvas.toBlob(blob => {
      if (!blob) {
        alert("PNG 파일을 만들지 못했어요. 이미지를 한 번 다시 저장해 보고 시도해 주세요.");
        return;
      }
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.download = `${safeName}_loveme_desktop.png`;
      link.href = url;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1200);
    }, "image/png");
  } catch (error) {
    console.error(error);
    alert("PNG 저장 중 오류가 났어요. 새로고침 후 다시 시도해 주세요.");
  } finally {
    document.body.classList.remove("is-exporting");
  }
}

function downloadJson() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const link = document.createElement("a");
  link.download = "loveme-desktop-data.json";
  link.href = URL.createObjectURL(blob);
  link.click();
  URL.revokeObjectURL(link.href);
}

function bindBackup() {
  document.getElementById("savePngBtn")?.addEventListener("click", savePng);
  document.getElementById("saveDataBtn")?.addEventListener("click", () => {
    saveLocal();
    alert("브라우저에 저장했어요.");
  });
  document.getElementById("resetBtn")?.addEventListener("click", resetAll);
  document.getElementById("downloadJsonBtn")?.addEventListener("click", downloadJson);
  document.getElementById("uploadJsonInput")?.addEventListener("change", async event => {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      Object.assign(state, defaultState, data);
      state.images = data.images || {};
      state.colors = data.colors || {};
      render();
      saveLocal();
      event.target.value = "";
    } catch (error) {
      alert("JSON 파일을 불러오지 못했어요.");
    }
  });
}

loadLocal();
bindEditor();
bindWindows();
bindBackup();
render();
