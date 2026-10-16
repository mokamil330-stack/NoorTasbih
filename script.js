
const $ = id => document.getElementById(id);

const dhikrs = [
  {name:"SubhanAllah",arabic:"سُبْحَانَ اللّٰهِ",meaning:"Glory be to Allah",target:33},
  {name:"Alhamdulillah",arabic:"الْحَمْدُ لِلّٰهِ",meaning:"All praise belongs to Allah",target:33},
  {name:"Allahu Akbar",arabic:"اللّٰهُ أَكْبَرُ",meaning:"Allah is the Greatest",target:33},
  {name:"Astaghfirullah",arabic:"أَسْتَغْفِرُ اللّٰهَ",meaning:"I seek Allah's forgiveness",target:100},
  {name:"La ilaha illallah",arabic:"لَا إِلٰهَ إِلَّا اللّٰهُ",meaning:"There is no god but Allah",target:100},
  {name:"SubhanAllahi wa bihamdihi",arabic:"سُبْحَانَ اللّٰهِ وَبِحَمْدِهِ",meaning:"Glory and praise be to Allah",target:100},
  {name:"SubhanAllahil Azeem",arabic:"سُبْحَانَ اللّٰهِ الْعَظِيمِ",meaning:"Glory be to Allah, the Magnificent",target:100},
  {name:"La hawla wa la quwwata illa billah",arabic:"لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللّٰهِ",meaning:"No power except through Allah",target:100},
  {name:"Allahumma salli ala Muhammad",arabic:"اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ",meaning:"Send blessings upon Muhammad",target:100},
  {name:"HasbunAllahu wa ni'mal wakeel",arabic:"حَسْبُنَا اللّٰهُ وَنِعْمَ الْوَكِيلُ",meaning:"Allah is sufficient for us",target:100},
  {name:"Ya Rahman",arabic:"يَا رَحْمَٰنُ",meaning:"O Most Merciful",target:33},
  {name:"Ya Raheem",arabic:"يَا رَحِيمُ",meaning:"O Especially Merciful",target:33},
  {name:"Ya Kareem",arabic:"يَا كَرِيمُ",meaning:"O Most Generous",target:33},
  {name:"Ya Latif",arabic:"يَا لَطِيفُ",meaning:"O Most Gentle",target:33},
  {name:"Ya Fattah",arabic:"يَا فَتَّاحُ",meaning:"O Opener",target:33},
  {name:"Ya Wahhab",arabic:"يَا وَهَّابُ",meaning:"O Bestower",target:33},
  {name:"Ya Razzaq",arabic:"يَا رَزَّاقُ",meaning:"O Provider",target:33},
  {name:"Ya Salam",arabic:"يَا سَلَامُ",meaning:"O Source of Peace",target:33},
  {name:"Ya Ghaffar",arabic:"يَا غَفَّارُ",meaning:"O Great Forgiver",target:33},
  {name:"Ya Wadud",arabic:"يَا وَدُودُ",meaning:"O Most Loving",target:33},
  {name:"Ya Noor",arabic:"يَا نُورُ",meaning:"O Light",target:33},
  {name:"Ya Ghani",arabic:"يَا غَنِيُّ",meaning:"O Self-Sufficient",target:33}
];

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
  const saved = JSON.parse(localStorage.getItem("noorTasbihState") || "null");
  if (saved) state = {...state, ...saved};
} catch (error) {}

let beadAudio = null;
let wakeLock = null;
let toastTimer = null;

function persist() {
  try {
    localStorage.setItem("noorTasbihState", JSON.stringify(state));
  } catch (error) {}
}

function toast(message) {
  $("toast").textContent = message;
  $("toast").classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => $("toast").classList.remove("show"), 1900);
}

function beadSound() {
  if (!state.sound) return;

  try {
    beadAudio = beadAudio || $("beadDropAudio");
    if (!beadAudio) return;

    beadAudio.pause();
    beadAudio.currentTime = 0;

    const playPromise = beadAudio.play();
    if (playPromise && playPromise.catch) {
      playPromise.catch(() => {});
    }
  } catch (error) {}
}

function renderDhikr() {
  $("dhikrGrid").innerHTML = dhikrs.map((dhikr, index) => `
    <button class="dhikr-card ${index === state.selected ? "active" : ""}"
      data-index="${index}">
      <div class="num">${String(index + 1).padStart(2, "0")}</div>
      <div class="arabic">${dhikr.arabic}</div>
      <div class="dhikr-name">${dhikr.name}</div>
      <div class="dhikr-meaning">${dhikr.meaning}</div>
    </button>
  `).join("");

  $("dhikrGrid").querySelectorAll("[data-index]").forEach(button => {
    button.addEventListener("click", () => {
      state.selected = Number(button.dataset.index);
      state.count = 0;
      state.target = dhikrs[state.selected].target || 33;
      $("customTarget").value = "";
      renderDhikr();
      render();
      persist();
      window.scrollTo({top: 0, behavior: "smooth"});
    });
  });
}

/* Moving beads on the strand */
function renderBeads(showDrop = false) {
  const wrap = $("beads");
  wrap.innerHTML = "";

  const total = 17;
  const width = $("beadTrack").clientWidth || 360;
  const height = $("beadTrack").clientHeight || 220;

  for (let i = 0; i < total; i++) {
    const bead = document.createElement("span");
    bead.className = "bead";

    const phase = (
      (i / total * 100) +
      (state.count % total) * (100 / total)
    ) % 100;

    const x = (phase / 100) * (width + 55) - 28;
    const y = height * 0.50 +
      Math.sin((phase / 100) * Math.PI * 2) * height * 0.31;

    bead.style.left = x + "px";
    bead.style.top = (y - 17) + "px";
    bead.style.zIndex =
      Math.sin((phase / 100) * Math.PI * 2) > 0 ? "1" : "0";

    wrap.appendChild(bead);
  }

  if (showDrop) {
    const falling = document.createElement("span");
    falling.className = "falling-bead";
    falling.setAttribute("aria-hidden", "true");
    falling.style.left = (38 + Math.random() * 24) + "%";
    wrap.appendChild(falling);

    falling.addEventListener("animationend", () => {
      falling.remove();
    }, {once: true});
  }
}

function render() {
  $("count").textContent = state.count.toLocaleString();

  $("soundToggle").checked = state.sound;
  $("vibrationToggle").checked = state.vibration;
  $("darkToggle").checked = state.dark;
  $("soundTop").textContent = state.sound ? "♫" : "♪";

  document.body.classList.toggle("dark", state.dark);

  document.querySelectorAll("[data-target]").forEach(button => {
    button.classList.toggle(
      "active",
      Number(button.dataset.target) === state.target
    );
  });

  const percent = Math.min(
    100,
    Math.round(state.count / Math.max(1, state.target) * 100)
  );

  $("progressFill").style.width = percent + "%";
  $("progressText").textContent =
    `${state.count.toLocaleString()} of ${state.target.toLocaleString()} completed`;
  $("percent").textContent = percent + "%";

  renderBeads();
}

function countBy(amount) {
  state.count = Math.max(0, state.count + amount);

  if (amount > 0) {
    beadSound();

    if (state.vibration && navigator.vibrate) {
      navigator.vibrate(15);
    }

    if (state.count === state.target) {
      toast("Target completed — Alhamdulillah!");
    }
  }

  render();
  if (amount > 0) renderBeads(true);
  persist();
}

$("plus").addEventListener("click", () => countBy(1));
$("minus").addEventListener("click", () => countBy(-1));

$("reset").addEventListener("click", () => {
  if (state.count > 0 && !confirm("Reset the current Dhikr count to zero?")) {
    return;
  }

  state.count = 0;
  render();
  persist();
  toast("Counter reset");
});

$("soundToggle").addEventListener("change", event => {
  state.sound = event.target.checked;
  persist();
  render();
});

$("soundTop").addEventListener("click", () => {
  state.sound = !state.sound;
  persist();
  render();
  toast(state.sound ? "Bead sound on" : "Bead sound off");
});

$("darkToggle").addEventListener("change", event => {
  state.dark = event.target.checked;
  persist();
  render();
});

$("themeBtn").addEventListener("click", () => {
  state.dark = !state.dark;
  persist();
  render();
});

$("vibrationToggle").addEventListener("change", event => {
  state.vibration = event.target.checked;
  persist();

  if (state.vibration && navigator.vibrate) {
    navigator.vibrate(20);
  }
});

document.querySelectorAll("[data-target]").forEach(button => {
  button.addEventListener("click", () => {
    state.target = Number(button.dataset.target);
    $("customTarget").value = "";
    persist();
    render();
  });
});

$("customTarget").addEventListener("change", event => {
  const target = Math.floor(Number(event.target.value));

  if (target > 0 && target <= 1000000) {
    state.target = target;
    persist();
    render();
  } else {
    toast("Enter a target from 1 to 1,000,000");
  }
});

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

function renderHistory() {
  const list = $("historyList");

  if (!state.history.length) {
    list.innerHTML = '<div class="empty">No saved progress yet.</div>';
    return;
  }

  list.innerHTML = state.history.map(session => `
    <div class="history-item">
      <span>
        <strong>${escapeHtml(session.name)}</strong><br>
        <small>${escapeHtml(session.date)}</small>
      </span>
      <strong>${Number(session.count).toLocaleString()} counts</strong>
    </div>
  `).join("");
}

$("save").addEventListener("click", () => {
  state.history.unshift({
    name: dhikrs[state.selected].name,
    count: state.count,
    selected: state.selected,
    dhikr: dhikrs[state.selected].name,
    date: new Date().toLocaleString()
  });

  state.history = state.history.slice(0, 50);
  persist();
  renderHistory();

  $("save").textContent = "PROGRESS SAVED ✓";
  toast("Progress saved on this device");

  setTimeout(() => {
    $("save").textContent = "SAVE PROGRESS";
  }, 1500);
});

function openSessionModal() {
  $("saveModal").classList.add("open");
  renderSessionManager();
}

function closeSessionModal() {
  $("saveModal").classList.remove("open");
}

function renderSessionManager() {
  const list = $("sessionManager");

  if (!state.history.length) {
    list.innerHTML = '<div class="empty">No saved sessions yet.</div>';
    return;
  }

  list.innerHTML = state.history.map((session, index) => `
    <div class="history-item">
      <span>
        <strong>${escapeHtml(session.name || session.dhikr || "Dhikr")}</strong><br>
        <small>${escapeHtml(session.date || "")}</small><br>
        ${Number(session.count || 0).toLocaleString()} counts
      </span>
      <span>
        <button class="target-chip" data-load="${index}">Load</button>
        <button class="target-chip" data-delete="${index}">×</button>
      </span>
    </div>
  `).join("");

  list.querySelectorAll("[data-load]").forEach(button => {
    button.addEventListener("click", () => {
      const session = state.history[Number(button.dataset.load)];
      state.count = Number(session.count || 0);

      if (session.selected != null) {
        state.selected = Number(session.selected);
      }

      state.target = dhikrs[state.selected].target || 33;
      renderDhikr();
      render();
      persist();
      closeSessionModal();
      toast("Saved session loaded");
    });
  });

  list.querySelectorAll("[data-delete]").forEach(button => {
    button.addEventListener("click", () => {
      state.history.splice(Number(button.dataset.delete), 1);
      persist();
      renderHistory();
      renderSessionManager();
    });
  });
}

$("openSessions").addEventListener("click", openSessionModal);
$("closeSessions").addEventListener("click", closeSessionModal);

$("saveModal").addEventListener("click", event => {
  if (event.target === $("saveModal")) closeSessionModal();
});

$("saveNamed").addEventListener("click", () => {
  const name = $("sessionName").value.trim();

  if (!name) {
    toast("Please enter a session name");
    return;
  }

  state.history.unshift({
    name,
    count: state.count,
    selected: state.selected,
    dhikr: dhikrs[state.selected].name,
    date: new Date().toLocaleString()
  });

  state.history = state.history.slice(0, 50);
  persist();
  renderHistory();
  renderSessionManager();

  $("sessionName").value = "";
  toast("Named session saved");
});

$("clearHistory").addEventListener("click", () => {
  if (!state.history.length) {
    toast("No saved history");
    return;
  }

  if (confirm("Clear all saved sessions?")) {
    state.history = [];
    persist();
    renderHistory();
    renderSessionManager();
    toast("History cleared");
  }
});

$("wakeToggle").addEventListener("change", async event => {
  if (event.target.checked) {
    try {
      if ("wakeLock" in navigator) {
        wakeLock = await navigator.wakeLock.request("screen");
        toast("Screen wake lock enabled");
      } else {
        event.target.checked = false;
        toast("Screen wake lock is not supported");
      }
    } catch (error) {
      event.target.checked = false;
      toast("Screen wake lock could not be enabled");
    }
  } else if (wakeLock) {
    try {
      await wakeLock.release();
    } catch (error) {}
    wakeLock = null;
  }
});

document.addEventListener("visibilitychange", async () => {
  if (
    document.visibilityState === "visible" &&
    $("wakeToggle").checked &&
    "wakeLock" in navigator
  ) {
    try {
      wakeLock = await navigator.wakeLock.request("screen");
    } catch (error) {}
  }
});

window.addEventListener("resize", () => renderBeads());

renderDhikr();
render();
renderHistory();
