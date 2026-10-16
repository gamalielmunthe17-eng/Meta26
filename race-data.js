(function (global) {
  "use strict";
  function time(value) {
    const s = String(value ?? "").trim().replace(/,/g, ".");
    let seconds;
    if (/^\d+(?:\.\d+)?$/.test(s)) seconds = Number(s);
    else if (/^\d+:\d{1,2}(?:\.\d+)?$/.test(s)) {
      const [m, sec] = s.split(":");
      seconds = Number(sec) < 60 ? Number(m) * 60 + Number(sec) : Infinity;
    } else if (/^\d+\.\d{1,2}\.\d+$/.test(s)) {
      const [m, sec, fraction] = s.split(".");
      seconds = Number(sec) < 60 ? Number(m) * 60 + Number(sec) + Number("0." + fraction) : Infinity;
    } else seconds = Infinity;
    return seconds > 0 && Number.isFinite(seconds) ? seconds : Infinity;
  }
  function normalize(raw) {
    if (!Array.isArray(raw)) throw new Error("Respons SheetBest bukan daftar baris.");
    const key = s => s.toUpperCase().replace(/[^A-Z0-9]/g, "");
    return raw.map((r, index) => {
      const values = Object.fromEntries(Object.entries(r).map(([k,v]) => [key(k), String(v ?? "").trim()]));
      const number = values.NOPESERTA || values.NOMORPESERTA || "";
      const driver = values.DRIVER || "";
      const klass = (values.KELAS || "").toUpperCase().replace(/[-_]/g," ").replace(/\s+/g," ").replace(/^(FWD|RWD)\s*([123])$/, "$1 $2");
      const result = values.RESULT || "";
      return {number, driver, klass, result, seconds: time(result), index};
    }).filter(r => r.number && r.driver);
  }
  function best(rows, klass = "") {
    const grouped = new Map();
    for (const r of rows) {
      if ((klass && r.klass !== klass) || !Number.isFinite(r.seconds)) continue;
      // Kelas: satu hasil per peserta di kelas itu. Overall: satu hasil per nomor peserta.
      const old = grouped.get(r.number);
      if (!old || r.seconds < old.seconds) grouped.set(r.number, r);
    }
    return [...grouped.values()].sort((a,b) => a.seconds - b.seconds || a.index - b.index);
  }
  global.RaceData = {time, normalize, best};
})(typeof window !== "undefined" ? window : globalThis);
