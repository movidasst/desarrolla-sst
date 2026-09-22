(() => {
  "use strict";

  const cache = new Map();

  function loadScript(key, sources, ready) {
    if (ready()) return Promise.resolve(ready());
    if (cache.has(key)) return cache.get(key);

    const promise = new Promise((resolve, reject) => {
      let sourceIndex = 0;

      const tryNext = () => {
        if (sourceIndex >= sources.length) {
          reject(new Error(`No fue posible cargar ${key}.`));
          return;
        }

        const script = document.createElement("script");
        script.async = true;
        script.dataset.desarrollaDependency = key;
        script.src = sources[sourceIndex++];
        script.onload = () => {
          const dependency = ready();
          if (dependency) resolve(dependency);
          else {
            script.remove();
            tryNext();
          }
        };
        script.onerror = () => {
          script.remove();
          tryNext();
        };
        document.head.appendChild(script);
      };

      tryNext();
    }).catch(error => {
      cache.delete(key);
      throw error;
    });

    cache.set(key, promise);
    return promise;
  }

  window.DesarrollaDeps = Object.freeze({
    loadJsPdf: () => loadScript(
      "jspdf",
      [
        "https://cdn.jsdelivr.net/npm/jspdf@2.5.2/dist/jspdf.umd.min.js",
        "https://unpkg.com/jspdf@2.5.2/dist/jspdf.umd.min.js"
      ],
      () => window.jspdf?.jsPDF || null
    ),
    loadQrCode: () => loadScript(
      "qrcode",
      [
        "https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js",
        "https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"
      ],
      () => window.QRCode || null
    )
  });
})();
