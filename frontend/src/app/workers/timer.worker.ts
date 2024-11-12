let currentProgressTime: number;
let lastUpdateTime: number;

self.onmessage = function (event) {
  if (event.data.currentProgressTime !== undefined) {
    currentProgressTime = event.data.currentProgressTime;
    lastUpdateTime = Date.now();
  }

  function updateTimer() {
    const now = Date.now();
    const elapsed = now - lastUpdateTime;
    currentProgressTime += elapsed;
    lastUpdateTime = now;

    postMessage({
      updatedProgressTime: currentProgressTime,
    });

    setTimeout(updateTimer, 1000);
  }

  updateTimer();
};
