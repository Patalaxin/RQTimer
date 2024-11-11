self.onmessage = function (event) {
  const { currentProgressTime } = event.data;

  setInterval(() => {
    postMessage({
      updatedProgressTime: currentProgressTime + 1000,
    });
  }, 1000);
};
