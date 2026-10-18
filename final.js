(() => {
  "use strict";

  const classes = ["FWD 1", "FWD 2", "FWD 3", "RWD 2", "RWD 3", "FFA"];
  const params = new URLSearchParams(location.search);
  const selectedClass = params.get("class") || classes[0];
  const body = document.getElementById("final-results");
  const search = document.getElementById("driver-search");
  const esc = value => String(value ?? "").replace(/[&<>"']/g, char => ({
    "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;"
  }[char]));
  const seconds = value => {
    const match = /^(\d+)\.(\d{2})\.(\d{2,3})$/.exec(value);
    if (!match || Number(match[2]) >= 60) return Infinity;
    return Number(match[1]) * 60 + Number(match[2]) + Number(`0.${match[3]}`);
  };

  document.title = `META 2026 - Final ${selectedClass}`;
  document.getElementById("class-title").textContent = `Final ${selectedClass}`;
  document.getElementById("class-nav").innerHTML = classes.map(klass =>
    `<a href="?class=${encodeURIComponent(klass)}" ${klass === selectedClass ? 'aria-current="page"' : ""}>Final ${esc(klass)}</a>`
  ).join("");

  if (!classes.includes(selectedClass)) {
    body.innerHTML = '<div class="message error">Kelas final tidak ditemukan.</div>';
    return;
  }

  const rows = window.META_FINAL_DATA
    .filter(row => row.klass === selectedClass)
    .map((row, index) => ({...row, index, seconds: seconds(row.final)}))
    .sort((a, b) => a.seconds - b.seconds || a.index - b.index)
    .map((row, index, sorted) => ({
      ...row,
      rank: Number.isFinite(row.seconds)
        ? sorted.slice(0, index + 1).filter(item => Number.isFinite(item.seconds)).length
        : null
    }));

  function render() {
    const query = search.value.trim().toLowerCase();
    const filtered = rows.filter(row =>
      `${row.number} ${row.driver} ${row.car}`.toLowerCase().includes(query)
    );
    body.innerHTML = filtered.length ? filtered.map(row => `
      <div class="result-row${row.rank && row.rank <= 3 ? ` rank-${row.rank}` : ""}">
        <div class="rank">${row.rank || "—"}</div>
        <div class="number">${esc(row.number)}</div>
        <div class="driver" title="${esc(row.driver)}">${esc(row.driver)}</div>
        <div class="car" title="${esc(row.car)}">${esc(row.car)}</div>
        <div class="time">${esc(row.final) || "—"}</div>
        <div class="elimination">${esc(row.elimination) || "—"}</div>
      </div>`).join("") : '<div class="message">Peserta tidak ditemukan.</div>';
  }

  search.addEventListener("input", render);
  render();
})();
