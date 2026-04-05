(function () {
  const CACHE = { data: null, promise: null };

  function normalizeCourseCode(title) {
    if (!title || typeof title !== "string") return "";
    const t = title.trim();
    const m = t.match(/^([A-Za-z]{2,4}\d{3})\b/);
    return m ? m[1].toUpperCase() : t.split(/\s+/)[0].toUpperCase();
  }

  function fallbackSuggestions(code) {
    if (!code) return [];
    const q = encodeURIComponent(code + " FPTU");
    return [
      {
        label: "Tìm trên Quizlet",
        url: "https://quizlet.com/search?query=" + q,
        kind: "quizlet",
      },
      {
        label: "Tìm trên Google",
        url: "https://www.google.com/search?q=" + encodeURIComponent(code + " FPTU quizlet"),
        kind: "search",
      },
    ];
  }

  function loadStudySources() {
    if (CACHE.data) return Promise.resolve(CACHE.data);
    if (CACHE.promise) return CACHE.promise;
    CACHE.promise = fetch(chrome.runtime.getURL("study-sources.json"))
      .then((r) => {
        if (!r.ok) throw new Error("study-sources: " + r.status);
        return r.json();
      })
      .then((raw) => {
        const map = {};
        Object.keys(raw).forEach((k) => {
          if (k.startsWith("$")) return;
          const code = String(k).toUpperCase();
          const arr = raw[k];
          if (Array.isArray(arr)) map[code] = arr;
        });
        CACHE.data = map;
        return CACHE.data;
      })
      .catch(() => {
        CACHE.data = {};
        return CACHE.data;
      });
    return CACHE.promise;
  }

  async function getStudySuggestions(courseTitle) {
    const code = normalizeCourseCode(courseTitle);
    const map = await loadStudySources();
    const curated = code && map[code] ? map[code].slice() : [];
    const fallbacks = fallbackSuggestions(code);
    const seen = new Set(curated.map((x) => x.url));
    fallbacks.forEach((f) => {
      if (!seen.has(f.url)) {
        curated.push(f);
        seen.add(f.url);
      }
    });
    return { code, items: curated };
  }

  window.FPTUStudySuggestions = {
    normalizeCourseCode,
    getStudySuggestions,
  };
})();
