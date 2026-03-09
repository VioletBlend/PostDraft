const opacityInput = document.getElementById("opacity");
const widthInput = document.getElementById("width");
const heightInput = document.getElementById("height");
const themeSelect = document.getElementById("theme");
const statusSpan = document.getElementById("status");

const DEFAULTS = {
  opacity: 0.85,
  width: 320,
  height: 300,
  theme: "dark"
};

chrome.storage.sync.get(DEFAULTS, (v) => {
  opacityInput.value = v.opacity;
  widthInput.value = v.width;
  heightInput.value = v.height;
  themeSelect.value = v.theme;
});

document.getElementById("save").onclick = () => {
  const opacity = parseFloat(opacityInput.value) || DEFAULTS.opacity;
  const width = parseInt(widthInput.value, 10) || DEFAULTS.width;
  const height = parseInt(heightInput.value, 10) || DEFAULTS.height;
  const theme = themeSelect.value || DEFAULTS.theme;

  chrome.storage.sync.set({ opacity, width, height, theme }, () => {
    statusSpan.textContent = "保存しました";
    setTimeout(() => (statusSpan.textContent = ""), 1500);
  });
};
