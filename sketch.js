let windDirectionDeg = 0;
let windCardinal = "N";
let lastUpdated = "loading...";

let camDistance = 700;
let targetRotation = 0;
let currentRotation = 0;
let camHeight = 220;
let hudEl;

const WIND_URL =
  "https://api.open-meteo.com/v1/forecast?latitude=47.3896&longitude=8.5200&current=wind_direction_10m";

function setup() {
  createCanvas(window.innerWidth, window.innerHeight, WEBGL);
  textFont("monospace");
  textSize(16);
  noFill();

  hudEl = document.getElementById("hud");

  fetchWind();
  setInterval(fetchWind, 10000);
}

function draw() {
  background(245);

  updateCamera();
  drawGrid();
  drawAxes();
  drawOrigin();

  updateHud();
}

//
// 🌬 FETCH WIND
//
function fetchWind() {
  fetch(WIND_URL)
    .then((res) => res.json())
    .then((data) => {
      const deg = data?.current?.wind_direction_10m;
      if (typeof deg === "number") {
        windDirectionDeg = deg;
        windCardinal = degreesToCardinal(windDirectionDeg);
        targetRotation = radians(180 - windDirectionDeg);
        lastUpdated = new Date().toLocaleTimeString();
      }
    })
    .catch(() => {
      lastUpdated = "fetch error";
    });
}

function degreesToCardinal(deg) {
  if (deg >= 315 || deg < 45) return "N";
  if (deg >= 45 && deg < 135) return "E";
  if (deg >= 135 && deg < 225) return "S";
  return "W";
}

//
// 🎥 CAMERA
//
function updateCamera() {
  currentRotation = lerp(currentRotation, targetRotation, 0.05);

  const camX = camDistance * sin(currentRotation);
  const camZ = camDistance * cos(currentRotation);

  camera(camX, camHeight, camZ, 0, 0, 0, 0, 1, 0);
}

//
// 🧱 SCENE
//
function drawGrid() {
  const size = 1200;
  const step = 50;

  stroke(180);
  strokeWeight(1);

  for (let x = -size; x <= size; x += step) {
    line(x, 0, -size, x, 0, size);
  }

  for (let z = -size; z <= size; z += step) {
    line(-size, 0, z, size, 0, z);
  }
}

function drawAxes() {
  strokeWeight(3);

  // X axis (red)
  stroke(255, 0, 0);
  line(0, 0, 0, 220, 0, 0);

  // Y axis (green)
  stroke(0, 200, 0);
  line(0, 0, 0, 0, -220, 0);

  // Z axis (blue)
  stroke(0, 90, 255);
  line(0, 0, 0, 0, 0, 220);
}

function drawOrigin() {
  push();
  noStroke();
  fill(255, 80, 80);
  box(30);
  pop();
}

//
//
// 🧾 HUD (DOM overlay)
//
function updateHud() {
  if (!hudEl) return;

  const cameraHeading = normalizeDeg(180 - degrees(currentRotation));
  hudEl.textContent =
    `Wind (ZHdK): ${windCardinal} (${windDirectionDeg.toFixed(1)}°)\n` +
    `Camera heading: ${cameraHeading.toFixed(1)}°\n` +
    `Updated: ${lastUpdated}`;
}

function windowResized() {
  resizeCanvas(window.innerWidth, window.innerHeight);
}

function normalizeDeg(deg) {
  return ((deg % 360) + 360) % 360;
}
