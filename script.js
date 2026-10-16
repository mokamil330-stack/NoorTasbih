
function renderBeads(movedIndex = -1) {
  const stage = document.getElementById("beadStage");
  const container = document.getElementById("beads");
  const path = document.getElementById("stringPath");

  if (!stage || !container || !path) {
    console.error("Tasbih bead elements missing");
    return;
  }

  const width = stage.clientWidth;
  const height = stage.clientHeight;

  if (width <= 0 || height <= 0) return;

  const beadCount = width < 420 ? 19 : 25;
  const beadSize = Math.min(43, Math.max(29, width * 0.075));
  const centerY = height / 2;
  const amplitude = height * 0.30;

  // Fixed curved string.
  const curve = [];
  for (let i = 0; i <= 100; i++) {
    const t = i / 100;
    const x = -30 + t * 860;
    const y = 110 - Math.sin(t * Math.PI * 2) * 68;
    curve.push(`${i === 0 ? "M" : "L"} ${x} ${y}`);
  }
  path.setAttribute("d", curve.join(" "));

  // Keep bead elements instead of deleting them on every update.
  let beads = Array.from(container.querySelectorAll(".bead"));

  if (beads.length !== beadCount) {
    container.replaceChildren();

    for (let i = 0; i < beadCount; i++) {
      const bead = document.createElement("span");
      bead.className = "bead";
      bead.style.width = `${beadSize}px`;
      bead.style.height = `${beadSize}px`;
      container.appendChild(bead);
    }

    beads = Array.from(container.querySelectorAll(".bead"));
  }

  beads.forEach((bead, i) => {
    const t = (
      i / beadCount +
      (state.count % beadCount) / beadCount
    ) % 1;

    const x = t * (width + beadSize) - beadSize / 2;
    const y = centerY - Math.sin(t * Math.PI * 2) * amplitude;

    bead.style.left = `${x}px`;
    bead.style.top = `${y}px`;
    bead.classList.toggle("moving", i === movedIndex);
  });
}
