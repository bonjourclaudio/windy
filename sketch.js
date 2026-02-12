let windDirectionDeg = 0;
let windCardinal = "N";
let lastUpdated = "loading...";
let useSliderControl = false;
let sliderWindDeg = 0;

let hudEl;
let avatarPhoto = null;
let shirtImg = null;
let pantsImg = null;
let outfitImg = null;
let uploadBtn, shirtSelect, pantsSelect;
let bgVideo;
let smokeParticles = [];
let trashImg = null;

const WIND_URL =
  "https://api.open-meteo.com/v1/forecast?latitude=47.3896&longitude=8.5200&current=wind_direction_10m";

function setup() {
  let canvas = createCanvas(window.innerWidth, window.innerHeight, WEBGL);
  canvas.style("z-index", "1");
  textFont("monospace");
  textSize(16);
  noFill();

  hudEl = document.getElementById("hud");

  // Load trash image
  trashImg = loadImage("trash.jpeg");

  // Load background video
  bgVideo = createVideo("bg.mp4");
  bgVideo.loop();
  bgVideo.hide();

  setupAvatarUI();

  // Setup wind direction slider
  const windSlider = document.getElementById("windSlider");
  const windValue = document.getElementById("windValue");
  if (windSlider && windValue) {
    windSlider.addEventListener("input", (e) => {
      sliderWindDeg = parseFloat(e.target.value);
      windValue.textContent = sliderWindDeg.toFixed(1);
      useSliderControl = true;
      windDirectionDeg = sliderWindDeg;
    });
  }

  fetchWind();
  setInterval(fetchWind, 10000);
}

function draw() {
  clear();

  const boxSize = getBoxSize();

  // Enable mouse/cursor control (replaces fixed camera)
  orbitControl();

  // Create new smoke particles from avatar position
  if (frameCount % 2 === 0) {
    const personHeight = boxSize;
    const groundY = boxSize / 2;
    const faceY = groundY - personHeight * 0.76032;
    const windRad = radians(windDirectionDeg);

    // Wind direction (smoke flows opposite to wind)
    const smokeVelX = -sin(windRad) * random(1, 2.5);
    const smokeVelZ = -cos(windRad) * random(1, 2.5);

    // Cigarette tip position: x: -5, z: 15 + 11 + 2 = 28
    smokeParticles.push({
      x: -5,
      y: faceY,
      z: 28,
      vx: smokeVelX,
      vy: random(0.5, 1.2),
      vz: smokeVelZ,
      life: 400,
      maxLife: 400,
      size: random(4, 10),
    });
  }

  // Update and draw smoke particles
  for (let i = smokeParticles.length - 1; i >= 0; i--) {
    const p = smokeParticles[i];

    // Update position
    p.x += p.vx;
    p.y += p.vy;
    p.z += p.vz;

    // Fade out
    p.life -= 2;

    if (p.life <= 0) {
      smokeParticles.splice(i, 1);
      continue;
    }

    // Draw smoke particle
    push();
    translate(p.x, p.y, p.z);

    // Smoke color: white to gray with transparency
    const alpha = map(p.life, p.maxLife, 0, 100, 0);
    fill(200, 200, 200, alpha);
    noStroke();
    sphere(p.size);

    pop();
  }

  drawGrid(boxSize);
  drawAxes(boxSize);
  drawBoxFrame(boxSize);
  drawWindIndicator(boxSize);
  drawCompassLabels(boxSize);
  drawAvatar(boxSize);
  drawCigarette(boxSize);
  drawTrash(boxSize);

  updateHud();
}

//
// 🌬 FETCH WIND
//
function fetchWind() {
  // Skip fetch if user is manually controlling with slider
  if (useSliderControl) return;
  fetch(WIND_URL)
    .then((res) => res.json())
    .then((data) => {
      const deg = data?.current?.wind_direction_10m;
      if (typeof deg === "number") {
        windDirectionDeg = deg;
        windCardinal = degreesToCardinal(windDirectionDeg);
        lastUpdated = new Date().toLocaleTimeString();
        // Clear old smoke when wind changes direction
        smokeParticles = smokeParticles.filter((p) => p.life > 150);
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
  // Fixed 3/4 isometric view from above
  const angle = radians(45);
  const distance = 700;
  const height = -400; // Negative Y = above (looking down)

  const camX = distance * sin(angle);
  const camZ = distance * cos(angle);

  camera(camX, height, camZ, 0, 0, 0, 0, 1, 0);
}

//
// 🧱 SCENE
//
function drawGrid(size) {
  const step = 40;
  const half = size / 2;
  const y = half; // Bottom of the box

  stroke(255);
  strokeWeight(1);

  for (let x = -half; x <= half; x += step) {
    line(x, y, -half, x, y, half);
  }

  for (let z = -half; z <= half; z += step) {
    line(-half, y, z, half, y, z);
  }
}

function drawAxes(size) {
  const axisLen = size * 0.45;
  strokeWeight(3);

  push();
  translate(0, 0, 10); // Move axes behind person

  // X axis (red)
  stroke(255, 0, 0);
  line(0, 0, 0, axisLen, 0, 0);

  // Y axis (green)
  stroke(0, 200, 0);
  line(0, 0, 0, 0, -axisLen, 0);

  // Z axis (blue)
  stroke(0, 90, 255);
  line(0, 0, 0, 0, 0, axisLen);

  pop();
}

function drawBoxFrame(size) {
  push();
  noFill();
  stroke(40);
  strokeWeight(1.5);
  box(size);
  pop();
}

function drawWindIndicator(boxSize) {
  push();

  // Position arrow outside the box at wind direction
  const distance = boxSize * 2.0;
  const windRad = radians(windDirectionDeg);
  const arrowX = distance * sin(windRad);
  const arrowZ = distance * cos(windRad);

  // Animated pulse effect
  const pulse = sin(frameCount * 0.08) * 0.15 + 1;
  const bounce = sin(frameCount * 0.1) * 30;

  // Move to arrow position with bounce
  translate(arrowX, 0, arrowZ + bounce);

  // Point directly back toward center (opposite of wind direction)
  rotateY(windRad + PI);

  // Rotate to horizontal
  rotateX(HALF_PI);

  // 90's style animated arrow
  const arrowLen = boxSize * 1.2;
  const shaftWidth = 18 * pulse;
  const headWidth = 60 * pulse;
  const headLen = 50;

  push();

  // Cycling colors (90's neon style)
  const hue = (frameCount * 2) % 360;
  colorMode(HSB);

  // Outer glow layers
  for (let i = 3; i > 0; i--) {
    const glowSize = i * 8;
    fill(hue, 80, 100, 0.2);
    noStroke();

    // Shaft glow
    rect(
      -shaftWidth / 2 - glowSize / 2,
      0,
      shaftWidth + glowSize,
      arrowLen - headLen / 2,
    );

    // Head glow
    triangle(
      0,
      arrowLen + glowSize,
      -(headWidth / 2 + glowSize),
      arrowLen - headLen,
      headWidth / 2 + glowSize,
      arrowLen - headLen,
    );
  }

  // Main arrow with gradient effect
  fill(hue, 90, 100);
  stroke(hue + 30, 100, 100);
  strokeWeight(3 * pulse);

  // Shaft
  rect(-shaftWidth / 2, 0, shaftWidth, arrowLen - headLen / 2);

  // Arrow head
  fill(hue + 30, 100, 100);
  triangle(
    0,
    arrowLen,
    -headWidth / 2,
    arrowLen - headLen,
    headWidth / 2,
    arrowLen - headLen,
  );

  // Add text "WIND!" in 90's style
  fill(hue + 60, 100, 100);
  stroke(0);
  strokeWeight(2);
  textSize(24 * pulse);
  textAlign(CENTER, CENTER);
  text("WIND!", 0, arrowLen / 2);

  colorMode(RGB);

  pop();

  pop();
}

function drawCompassLabels(boxSize) {
  const distance = boxSize / 2 + 1;

  textFont("monospace");

  // North: "Mehrspuhr"
  push();
  translate(0, 0, -distance);
  fill(40);
  noStroke();
  textAlign(CENTER, CENTER);
  textSize(16);
  text("Mehrspuhr", 0, 0);
  pop();

  // South: "El Tonino"
  push();
  translate(0, 0, distance);
  rotateY(PI);
  fill(40);
  noStroke();
  textAlign(CENTER, CENTER);
  textSize(16);
  text("El Tonino", 0, 0);
  pop();

  // West: "Werkstatt"
  push();
  translate(-distance, 0, 0);
  rotateY(HALF_PI);
  fill(40);
  noStroke();
  textAlign(CENTER, CENTER);
  textSize(16);
  text("Werkstatt", 0, 0);
  pop();

  // East: "Leihs"
  push();
  translate(distance, 0, 0);
  rotateY(-HALF_PI);
  fill(40);
  noStroke();
  textAlign(CENTER, CENTER);
  textSize(16);
  text("Leihs", 0, 0);
  pop();
}

//
// 🧾 HUD (DOM overlay)
//
function updateHud() {
  if (!hudEl) return;

  hudEl.textContent =
    `Wind (ZHdK): ${windCardinal} (${windDirectionDeg.toFixed(1)}°)\n` +
    `Updated: ${lastUpdated}`;
}

function windowResized() {
  resizeCanvas(window.innerWidth, window.innerHeight);
}

function normalizeDeg(deg) {
  return ((deg % 360) + 360) % 360;
}

function getBoxSize() {
  return min(width, height) * 0.5;
}

//
// 🧍 AVATAR
//
function setupAvatarUI() {
  // Photo upload
  uploadBtn = createFileInput(handlePhotoUpload);
  uploadBtn.position(20, height - 120);
  uploadBtn.attribute("accept", "image/*");

  // Shirt selection
  shirtSelect = createSelect();
  shirtSelect.position(20, height - 90);
  shirtSelect.option("No shirt");
  shirtSelect.option("tshirt_01");
  shirtSelect.option("tshirt_02");
  shirtSelect.option("tshirt_03");
  shirtSelect.option("tshirt_04");
  shirtSelect.changed(() => loadClothing("shirt", shirtSelect.value()));

  // Pants selection
  pantsSelect = createSelect();
  pantsSelect.position(20, height - 60);
  pantsSelect.option("No pants");
  pantsSelect.option("pants_01");
  pantsSelect.option("pants_02");
  pantsSelect.option("pants_03");
  pantsSelect.option("pants_04");
  pantsSelect.changed(() => loadClothing("pants", pantsSelect.value()));
}

function handlePhotoUpload(file) {
  if (file.type === "image") {
    avatarPhoto = loadImage(file.data);
  }
}

function loadClothing(type, value) {
  if (type === "shirt") {
    if (value === "No shirt") {
      shirtImg = null;
    } else {
      shirtImg = loadImage(`clothes/tshirt/${value}.png`);
    }
  } else if (type === "pants") {
    if (value === "No pants") {
      pantsImg = null;
    } else {
      pantsImg = loadImage(`clothes/pants/${value}.png`);
    }
  }
}

function drawAvatar(boxSize) {
  push();

  // Person stays fixed facing forward - no wind rotation

  const personHeight = boxSize; // Full height of box
  const personWidth = personHeight * 0.4;
  const layerSpacing = 5; // Small spacing between layers for depth

  // Draw as stacked 2D planes (billboards)

  // Full outfit layer (shirt + pants combined)
  // Pants (height: 0.4) - bottom
  push();
  translate(0, personHeight * 0.2375, 0);
  if (pantsImg) {
    texture(pantsImg);
  } else {
    fill(40, 60, 100);
  }
  noStroke();
  plane(personWidth * 0.8, personHeight * 0.4);
  pop();

  // Shirt (height: 0.35) - middle, directly above pants
  push();
  translate(0, -personHeight * 0.062, -2);
  if (shirtImg) {
    texture(shirtImg);
  } else {
    fill(200, 80, 80);
  }
  noStroke();
  plane(personWidth, personHeight * 0.35);
  pop();

  // Head layer (height: ~0.2) - top, directly above shirt
  push();
  translate(0, -personHeight * 0.33, 0);
  if (avatarPhoto) {
    texture(avatarPhoto);
  } else {
    fill(220, 180, 140); // Default skin tone
  }
  noStroke();
  plane(personWidth * 0.5, personWidth * 0.5);
  pop();
}

function drawCigarette(boxSize) {
  push();

  // Cigarette stays fixed - no wind rotation
  const personHeight = boxSize;
  const groundY = boxSize / 2;

  // Position at mouth area (same as smoke exit point)
  const faceY = groundY - personHeight * 0.76032;
  translate(0, faceY, 0);

  // Cigarette stick
  push();
  translate(-5, 0, 15); // Offset to the side of mouth

  // Cigarette body (cream/tan color)
  fill(220, 210, 180);
  noStroke();
  box(2, 2, 23);

  // Glowing tip (orange/red)
  translate(0, 0, 11);
  fill(255, 100, 30);
  box(4, 4, 6);

  // Glow effect
  fill(255, 150, 50, 100);
  sphere(6);

  pop();

  pop();
}

function drawTrash(boxSize) {
  push();

  const half = boxSize / 2;
  const trashSize = boxSize * 0.3;

  // Place trash in bottom-right corner of box
  translate(half - trashSize / 2, half - trashSize / 2, -half + trashSize / 2);

  if (trashImg) {
    texture(trashImg);
    noStroke();
    plane(trashSize, trashSize);
  }

  pop();
}
