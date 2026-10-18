const colors = [
  { name: "Coral", hex: "#f47763", colorBlindHex: "#d55e00" },
  { name: "Tangerine", hex: "#f39a43", colorBlindHex: "#e69f00" },
  { name: "Sunshine", hex: "#f3cf56", colorBlindHex: "#f0e442" },
  { name: "Leaf", hex: "#8fb85e", colorBlindHex: "#009e73" },
  { name: "Mint", hex: "#72b99b", colorBlindHex: "#56b4e9" },
  { name: "Lagoon", hex: "#5eb9bd", colorBlindHex: "#0072b2" },
  { name: "Sky", hex: "#76a9dc", colorBlindHex: "#88ccee" },
  { name: "Periwinkle", hex: "#9292d2", colorBlindHex: "#332288" },
  { name: "Lilac", hex: "#bf91c9", colorBlindHex: "#aa4499" },
  { name: "Rose", hex: "#e783a0", colorBlindHex: "#cc79a7" },
  { name: "Cherry", hex: "#d95c67", colorBlindHex: "#882255" },
  { name: "Apricot", hex: "#ecae82", colorBlindHex: "#ddcc77" },
];

const tileButtons = [...document.querySelectorAll(".color-tile")];
const targetName = document.querySelector("#target-name");
const targetHint = document.querySelector("#target-hint");
const targetSwatch = document.querySelector("#target-swatch");
const timerDisplay = document.querySelector("#timer");
const scoreDisplay = document.querySelector("#score");
const bestScoreDisplay = document.querySelector("#best-score");
const streakDisplay = document.querySelector("#streak");
const roundDisplay = document.querySelector("#round-number");
const gameMessage = document.querySelector("#game-message");
const startButton = document.querySelector("#start-button");
const themeToggle = document.querySelector("#theme-toggle");
const paletteToggle = document.querySelector("#palette-toggle");

function readSetting(key) {
  try {
    return localStorage.getItem(key) === "true";
  } catch {
    return false;
  }
}

function applyTheme(isDark) {
  document.documentElement.dataset.theme = isDark ? "dark" : "light";
  themeToggle.setAttribute("aria-pressed", String(isDark));
  themeToggle.textContent = isDark ? "Light mode" : "Dark mode";
  document.querySelector('meta[name="theme-color"]').content = isDark ? "#171c19" : "#f5f7f1";
}

let colorBlindPalette = false;

function colorHex(color) {
  return colorBlindPalette ? color.colorBlindHex : color.hex;
}

function applyColorBlindPalette(isEnabled) {
  colorBlindPalette = isEnabled;
  paletteToggle.setAttribute("aria-pressed", String(isEnabled));
  paletteToggle.textContent = isEnabled ? "Standard palette" : "Color-blind palette";
  if (targetColor) targetSwatch.style.backgroundColor = colorHex(targetColor);
  tileButtons.forEach((button) => {
    const color = colors.find((entry) => entry.name === button.dataset.colorName);
    if (color) button.style.backgroundColor = colorHex(color);
  });
}

applyTheme(readSetting("color-hunter-dark-mode"));

themeToggle.addEventListener("click", () => {
  const isDark = document.documentElement.dataset.theme !== "dark";
  applyTheme(isDark);
  try {
    localStorage.setItem("color-hunter-dark-mode", String(isDark));
  } catch {
    // The setting still applies for this page if storage is unavailable.
  }
});

paletteToggle.addEventListener("click", () => {
  const isEnabled = !colorBlindPalette;
  applyColorBlindPalette(isEnabled);
  try {
    localStorage.setItem("color-hunter-colorblind-palette", String(isEnabled));
  } catch {
    // The setting still applies for this page if storage is unavailable.
  }
});

const roundLength = 30;
let score = 0;
let streak = 0;
let round = 0;
let targetColor = null;
let gameActive = false;
let endTime = 0;
let timerInterval = null;
let feedbackTimeout = null;

applyColorBlindPalette(readSetting("color-hunter-colorblind-palette"));

function readBestScore() {
  try {
    return Number.parseInt(localStorage.getItem("color-hunter-best") || "0", 10) || 0;
  } catch {
    return 0;
  }
}

let bestScore = readBestScore();
bestScoreDisplay.textContent = bestScore;

function shuffle(items) {
  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  return shuffled;
}

function startGame() {
  clearInterval(timerInterval);
  clearTimeout(feedbackTimeout);
  score = 0;
  streak = 0;
  round = 0;
  gameActive = true;
  endTime = Date.now() + roundLength * 1000;
  scoreDisplay.textContent = score;
  streakDisplay.textContent = streak;
  startButton.innerHTML = '<span aria-hidden="true">↻</span> Start a new round';
  gameMessage.textContent = "Find the matching color as fast as you can.";
  tileButtons.forEach((button) => { button.disabled = false; });
  nextTarget();
  updateTimer();
  timerInterval = setInterval(updateTimer, 100);
}

function nextTarget() {
  round += 1;
  roundDisplay.textContent = String(round).padStart(2, "0");
  targetColor = colors[Math.floor(Math.random() * colors.length)];
  targetName.textContent = targetColor.name;
  targetHint.textContent = "Find this color in the grid.";
  targetSwatch.style.backgroundColor = colorHex(targetColor);

  const distractors = colors.filter((color) => color !== targetColor);
  const tileColors = shuffle([
    targetColor,
    ...Array.from({ length: tileButtons.length - 1 }, () => distractors[Math.floor(Math.random() * distractors.length)]),
  ]);

  tileButtons.forEach((button, index) => {
    const color = tileColors[index];
    button.disabled = false;
    button.style.backgroundColor = colorHex(color);
    button.setAttribute("aria-label", `${color.name} color`);
    button.dataset.colorName = color.name;
    button.replaceChildren();
    button.classList.remove("is-correct", "is-wrong");
    button.dataset.matches = String(color === targetColor);
  });
}

function updateTimer() {
  const secondsLeft = Math.max(0, Math.ceil((endTime - Date.now()) / 1000));
  timerDisplay.textContent = `00:${String(secondsLeft).padStart(2, "0")}`;
  if (secondsLeft === 0) endGame();
}

function endGame() {
  gameActive = false;
  clearInterval(timerInterval);
  tileButtons.forEach((button) => { button.disabled = true; });
  targetName.textContent = "Time's up!";
  targetHint.textContent = `You found ${score / 10} ${score === 10 ? "color" : "colors"}.`;
  targetSwatch.style.backgroundColor = "";
  targetColor = null;
  gameMessage.textContent = score > 0 ? `Nice hunting. You scored ${score} points!` : "Good first hunt. Ready to try again?";
}

function chooseTile(event) {
  const button = event.currentTarget;
  if (!gameActive || button.disabled) return;

  if (button.dataset.matches === "true") {
    tileButtons.forEach((tile) => { tile.disabled = true; });
    score += 10;
    streak += 1;
    scoreDisplay.textContent = score;
    streakDisplay.textContent = streak;
    button.classList.add("is-correct");
    gameMessage.textContent = streak > 1 ? `Spot on! ${streak} in a row.` : "Spot on! Find the next one.";

    if (score > bestScore) {
      bestScore = score;
      bestScoreDisplay.textContent = bestScore;
      try {
        localStorage.setItem("color-hunter-best", String(bestScore));
      } catch {
        // Best score remains available for this round if storage is unavailable.
      }
    }

    feedbackTimeout = setTimeout(() => {
      if (gameActive) nextTarget();
    }, 180);
  } else {
    streak = 0;
    streakDisplay.textContent = streak;
    button.classList.remove("is-wrong");
    void button.offsetWidth;
    button.classList.add("is-wrong");
    gameMessage.textContent = "Not that one. Your streak starts fresh.";
  }
}

tileButtons.forEach((button) => button.addEventListener("click", chooseTile));
startButton.addEventListener("click", startGame);
