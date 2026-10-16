
const $ = id => document.getElementById(id);

const dhikrs = [
  {name:"SubhanAllah", arabic:"سُبْحَانَ اللّٰهِ", meaning:"Glory be to Allah", target:33},
  {name:"Alhamdulillah", arabic:"الْحَمْدُ لِلّٰهِ", meaning:"All praise belongs to Allah", target:33},
  {name:"Allahu Akbar", arabic:"اللّٰهُ أَكْبَرُ", meaning:"Allah is the Greatest", target:33},
  {name:"Astaghfirullah", arabic:"أَسْتَغْفِرُ اللّٰهَ", meaning:"I seek Allah's forgiveness", target:100},
  {name:"La ilaha illallah", arabic:"لَا إِلٰهَ إِلَّا اللّٰهُ", meaning:"There is no god but Allah", target:100},
  {name:"SubhanAllahi wa bihamdihi", arabic:"سُبْحَانَ اللّٰهِ وَبِحَمْدِهِ", meaning:"Glory and praise be to Allah", target:100},
  {name:"SubhanAllahil Azeem", arabic:"سُبْحَانَ اللّٰهِ الْعَظِيمِ", meaning:"Glory be to Allah, the Magnificent", target:100},
  {name:"La hawla wa la quwwata illa billah", arabic:"لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللّٰهِ", meaning:"No power except through Allah", target:100},
  {name:"Durood", arabic:"اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ", meaning:"Send blessings upon Muhammad", target:100},
  {name:"HasbunAllahu", arabic:"حَسْبُنَا اللّٰهُ وَنِعْمَ الْوَكِيلُ", meaning:"Allah is sufficient for us", target:100},
  {name:"Ya Rahman", arabic:"يَا رَحْمَٰنُ", meaning:"O Most Merciful", target:33},
  {name:"Ya Raheem", arabic:"يَا رَحِيمُ", meaning:"O Especially Merciful", target:33},
  {name:"Ya Kareem", arabic:"يَا كَرِيمُ", meaning:"O Most Generous", target:33},
  {name:"Ya Latif", arabic:"يَا لَطِيفُ", meaning:"O Most Gentle", target:33},
  {name:"Ya Fattah", arabic:"يَا فَتَّاحُ", meaning:"O Opener", target:33},
  {name:"Ya Wahhab", arabic:"يَا وَهَّابُ", meaning:"O Bestower", target:33},
  {name:"Ya Razzaq", arabic:"يَا رَزَّاقُ", meaning:"O Provider", target:33},
  {name:"Ya Salam", arabic:"يَا سَلَامُ", meaning:"O Source of Peace", target:33},
  {name:"Ya Ghaffar", arabic:"يَا غَفَّارُ", meaning:"O Great Forgiver", target:33},
  {name:"Ya Wadud", arabic:"يَا وَدُودُ", meaning:"O Most Loving", target:33},
  {name:"Ya Noor", arabic:"يَا نُورُ", meaning:"O Light", target:33},
  {name:"Ya Ghani", arabic:"يَا غَنِيُّ", meaning:"O Self-Sufficient", target:33}
];

const STORAGE_KEY = "noortasbih-v2";

let state = {
  count: 0,
  selected: 0,
  target: 33,
  sound: true,
  vibration: false,
  dark: false,
  history: []
};

try {
  const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
  if (saved) state = { ...state, ...saved };
} catch (_) {}

state.count = Math.max(0, Number(state.count) || 0);
state.selected = Math.min(
  dhikrs.length - 1,
  Math.max(0, Number(state.selected) || 0)
);
state.target = Math.max(1, Number(state.target) || 33);
state.history = Array.isArray(state.history) ? state.history : [];

let toastTimer;
let beadAudio = $("beadAudio");
let lastMovedBead = -1;
let resizeFrame = 0;

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (_) {
    toast("Unable to save in this browser");
  }
}

function toast(message) {
  $("toast").textContent = message;
  $("toast").classList.add("show");

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    $("toast").classList.remove("show");
  }, 1900);
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

/* Build a smooth fixed curve and place every bead on it. */
function drawString(width, height) {
  const path = $("stringPath");
  const viewBoxWidth = 800;
  const viewBoxHeight = 220;

  const points = [];

  for (let i = 0; i <= 100; i++) {
    const t = i / 100;
    const x = -30 + t * 860;
    const y = 110 - Math.sin(t * Math.PI * 2) * 68;
    points.push(`${i === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`);
  }

  path.setAttribute("d", points.join(" "));
  path.setAttribute("stroke-width", "2.5");
}

function renderBeads(movedIndex = -1) {
  const stage = $("beadStage");
  const container = $("beads");
  const width = stage.clientWidth;
  const height = stage.clientHeight;

  if (!width || !height) return;

  drawString(width, height);

  const beadCount = width < 420 ? 19 : 25;
  const beadSize = Math.min(43, Math.max(29, width * 0.075));
  const centerY = height / 2;
  const amplitude = height * (68 / 220);
  const containerWidth = width;

  container.innerHTML = "";

  for (let i = 0; i < beadCount; i++) {
    /*
      Every tap shifts the beads by one position along the curve.
      The strand stays fixed; only the beads move.
    */
    const phase = (
      i / (beadCount - 1) +
      (state.count % beadCount) / (beadCount - 1)
    );

    const t = ((phase % 1) + 1) % 1;
    const x = t * (containerWidth + beadSize) - beadSize / 2;
    const y = centerY - Math.sin(t * Math.PI * 2) * amplitude;

    const bead = document.createElement("span");
    bead.className = "bead";
    bead.style.width = beadSize + "px";
    bead.style.height = beadSize + "px";
    bead.style.left = x + "px";
    bead.style.top = y + "px";

    if (i === movedIndex) bead.classList.add("moving");

    container.appendChild(bead);
  }
}

function playBeadSound() {
  if (!state.sound || !beadAudio) return;

  try {
    beadAudio.pause();
    beadAudio.currentTime = 0;

    const result = beadAudio.play();
    if (result && result.catch) result.catch(() => {});
  } catch (_) {}
}

function renderDhikrs() {
  $("dhikrList").innerHTML = dhikrs.map((item, index) => `
    <button class="dhikr-card ${index === state.selected ? "active" : ""}"
      data-dhikr="${index}">
      <div class="dhikr-num">${String(index + 1).padStart(2, "0")}</div>
      <div class="dhikr-arabic">${item.arabic}</div>
      <div class="dhikr-name">${item.name}</div>
      <div class="dhikr-meaning">${item.meaning}</div>
    </button>
  `).join("");

  $("dhikrList").querySelectorAll("[data-dhikr]").forEach(button => {
    button.addEventListener("click", () => {
      state.selected = Number(button.dataset.dhikr);
      state.count = 0;
      state.target = dhikrs[state.selected].target;
      $("customTarget").value = "";

      renderDhikrs();
      render();
      persist();

      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  });
}

function render() {
  $("count").textContent = state.count.toLocaleString();
  $("targetLabel").textContent = state.target.toLocaleString();
  $("progressLabel").textContent =
    `${state.count.toLocaleString()} / ${state.target.toLocaleString()}`;

  const percentage = Math.min(
    100,
    state.count / Math.max(1, state.target) * 100
  );

  $("progressFill").style.width = percentage + "%";

  $("soundToggle").checked = state.sound;
  $("vibrationToggle").checked = state.vibration;
  $("darkToggle").checked = state.dark;
  $("soundBtn").textContent = state.sound ? "♫" : "♪";

  document.body.classList.toggle("dark", state.dark);

  document.querySelectorAll("[data-target]").forEach(button => {
    button.classList.toggle(
      "active",
      Number(button.dataset.target) === state.target
    );
  });

  renderBeads();
}

/* Increase count: animate the beads along the fixed curve. */
function increment() {
  state.count += 1;

  playBeadSound();

  if (state.vibration && navigator.vibrate) {
    navigator.vibrate(15);
  }

  render();
  persist();

  if (state.count === state.target) {
    toast("Target complete — Alhamdulillah!");
  }
}

function decrement() {
  if (state.count <= 0) {
    toast("Counter is already at zero");
    return;
  }

  state.count -= 1;
  render();
  persist();
}

$("plus").addEventListener("click", increment);
$("minus").addEventListener("click", decrement);

$("reset").addEventListener("click", () => {
  if (
    state.count > 0 &&
    !confirm("Reset this Dhikr counter to zero?")
  ) return;

  state.count = 0;
  render();
  persist();
  toast("Counter reset");
});

$("soundToggle").addEventListener("change", event => {
  state.sound = event.target.checked;
  render();
  persist();
});

$("soundBtn").addEventListener("click", () => {
  state.sound = !state.sound;
  render();
  persist();
  toast(state.sound ? "Bead sound enabled" : "Bead sound disabled");
});

$("vibrationToggle").addEventListener("change", event => {
  state.vibration = event.target.checked;
  persist();

  if (state.vibration && navigator.vibrate) {
    navigator.vibrate(15);
  }
});

$("darkToggle").addEventListener("change", event => {
  state.dark = event.target.checked;
  render();
  persist();
});

document.querySelectorAll("[data-target]").forEach(button => {
  button.addEventListener("click", () => {
    state.target = Number(button.dataset.target);
    $("customTarget").value = "";
    render();
    persist();
  });
});

$("customTarget").addEventListener("change", event => {
  const target = Math.floor(Number(event.target.value));

  if (target < 1 || target > 1000000 || !Number.isFinite(target)) {
    toast("Enter a target between 1 and 1,000,000");
    event.target.value = "";
    return;
  }

  state.target = target;
  render();
  persist();
});

function saveSession(name) {
  state.history.unshift({
    name: name || dhikrs[state.selected].name,
    count: state.count,
    selected: state.selected,
    target: state.target,
    date: new Date().toLocaleString()
  });

  state.history = state.history.slice(0, 50);
  persist();
  renderSaved();
  renderSessions();
}

function renderSaved() {
  const list = $("savedList");

  if (!state.history.length) {
    list.innerHTML = '<div class="empty">No saved progress yet.</div>';
    return;
  }

  list.innerHTML = state.history.map(session => `
    <div class="saved-item">
      <div>
        <strong>${escapeHTML(session.name)}</strong>
        <small>${escapeHTML(session.date || "")}</small>
      </div>
      <span>${Number(session.count || 0).toLocaleString()}</span>
    </div>
  `).join("");
}

$("saveBtn").addEventListener("click", () => {
  saveSession(dhikrs[state.selected].name);
  toast("Progress saved on this device");
});

function openModal() {
  $("modal").classList.add("open");
  renderSessions();
}

function closeModal() {
  $("modal").classList.remove("open");
}

$("loadBtn").addEventListener("click", openModal);
$("closeModal").addEventListener("click", closeModal);

$("modal").addEventListener("click", event => {
  if (event.target === $("modal")) closeModal();
});

$("saveNamed").addEventListener("click", () => {
  const name = $("sessionName").value.trim();

  if (!name) {
    toast("Enter a session name first");
    return;
  }

  saveSession(name);
  $("sessionName").value = "";
  toast("Named session saved");
});

function renderSessions() {
  const list = $("sessionList");

  if (!state.history.length) {
    list.innerHTML = '<div class="empty">No saved sessions yet.</div>';
    return;
  }

  list.innerHTML = state.history.map((session, index) => `
    <div class="saved-item">
      <div>
        <strong>${escapeHTML(session.name)}</strong>
        <small>${escapeHTML(session.date || "")}</small><br>
        <small>${Number(session.count || 0).toLocaleString()} counts</small>
      </div>
      <div>
        <button data-load="${index}">Load</button>
        <button data-delete="${index}">×</button>
      </div>
    </div>
  `).join("");

  list.querySelectorAll("[data-load]").forEach(button => {
    button.addEventListener("click", () => {
      const session = state.history[Number(button.dataset.load)];

      state.count = Math.max(0, Number(session.count) || 0);
      state.selected = Math.max(
        0,
        Math.min(dhikrs.length - 1, Number(session.selected) || 0)
      );
      state.target = Math.max(1, Number(session.target) || 33);

      $("customTarget").value = "";
      renderDhikrs();
      render();
      persist();
      closeModal();
      toast("Saved session loaded");
    });
  });

  list.querySelectorAll("[data-delete]").forEach(button => {
    button.addEventListener("click", () => {
      state.history.splice(Number(button.dataset.delete), 1);
      persist();
      renderSaved();
      renderSessions();
      toast("Session deleted");
    });
  });
}

$("clearBtn").addEventListener("click", () => {
  if (!state.history.length) {
    toast("No saved progress");
    return;
  }

  if (confirm("Delete all saved progress?")) {
    state.history = [];
    persist();
    renderSaved();
    renderSessions();
    toast("Saved progress cleared");
  }
});

window.addEventListener("resize", () => {
  cancelAnimationFrame(resizeFrame);
  resizeFrame = requestAnimationFrame(() => renderBeads());
});

renderDhikrs();
render();
renderSaved();
