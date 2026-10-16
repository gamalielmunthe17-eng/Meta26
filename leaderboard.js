(() => {
  "use strict";
  const config = window.META_CONFIG;
  const klass = new URLSearchParams(location.search).get("class") || "";
  const allowed = ["FWD 1","FWD 2","FWD 3","RWD 1","RWD 2","RWD 3","FFA","EV"];
  const isResult = document.body.dataset.mode === "result";
  const invalid = klass && !allowed.includes(klass);
  let rows = [], currentPage = 1, hasLoaded = false, busy = false;
  const get = id => document.getElementById(id);
  const esc = value => String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  get("view-title").textContent = isResult ? "Result Keseluruhan" : klass || "Best Time Keseluruhan";
  const eventDate = get("event-date");
  if (eventDate) eventDate.textContent = klass ? "18 Oktober 2026" : "";
  document.title = "META 2026 - " + get("view-title").textContent;
  if (!isResult) document.querySelector(".pagination").hidden = true;
  function render() {
    const q = get("driver-search").value.trim().toLowerCase();
    const base = isResult ? rows : RaceData.best(rows, klass);
    const ranked = base.map((r,i) => ({...r, rank: i + 1}));
    const filtered = ranked.filter(r => `${r.number} ${r.driver} ${r.klass}`.toLowerCase().includes(q));
    const count = Math.max(1, isResult ? Math.ceil(filtered.length / config.pageSize) : 1);
    currentPage = Math.min(currentPage, count);
    const page = isResult ? filtered.slice((currentPage-1)*config.pageSize, currentPage*config.pageSize) : filtered;
    get("leaderboard-body").innerHTML = page.length ? page.map(r => `
      <div class="driver-row ${!isResult && r.rank <= 3 ? "rank-"+r.rank : ""}">
        <div class="rank">${r.rank}</div><div class="participant-number">${esc(r.number)}</div>
        <div class="driver-name" title="${esc(r.driver)}">${esc(r.driver)}</div>
        <div class="car">${esc(r.klass) || "—"}</div>
        <div class="time">${esc(r.result) || "—"}</div>
      </div>`).join("") : '<div class="loading">'+(q ? "Peserta tidak ditemukan." : isResult ? "Belum ada data peserta." : "Belum ada waktu valid yang tercatat.")+'</div>';
    get("page-status").textContent = `Page ${currentPage} of ${count}`;
    get("previous-page").disabled = currentPage <= 1;
    get("next-page").disabled = currentPage >= count;
  }
  async function load() {
    if (busy || invalid) return;
    busy = true; get("refresh-data").disabled = true;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(),15000);
    try {
      const response = await fetch(config.sheetUrl, {cache:"no-store", signal:controller.signal});
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      rows = RaceData.normalize(await response.json());
      hasLoaded = true; render();
      get("data-status").textContent = "Diperbarui " + new Date().toLocaleTimeString("id-ID");
    } catch (e) {
      get("data-status").textContent = "Gagal memperbarui data. " + (hasLoaded ? "Data terakhir tetap ditampilkan." : "Periksa URL SheetBest dan header kolom.");
      if (!hasLoaded) get("leaderboard-body").innerHTML = '<div class="error">Data belum dapat dimuat.</div>';
    } finally {clearTimeout(timeout); busy = false; get("refresh-data").disabled = false;}
  }
  get("driver-search").addEventListener("input", () => {currentPage=1; render();});
  get("previous-page").addEventListener("click", () => {currentPage--; render();});
  get("next-page").addEventListener("click", () => {currentPage++; render();});
  get("refresh-data").addEventListener("click", load);
  if (invalid) {
    get("leaderboard-body").innerHTML = '<div class="error">Kelas tidak dikenal. Pilih kelas dari menu utama.</div>';
  } else {load(); setInterval(load, config.refreshMs);}
})();
