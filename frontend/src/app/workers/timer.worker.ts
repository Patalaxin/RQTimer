let currentProgressTime: number;

self.onmessage = function (event) {
  if (event.data.currentProgressTime !== undefined) {
    currentProgressTime = event.data.currentProgressTime;
  }

  setInterval(() => {
    currentProgressTime += 1000;
    postMessage({
      updatedProgressTime: currentProgressTime,
    });
  }, 1000);
};
