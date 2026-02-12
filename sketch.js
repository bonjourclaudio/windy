let windDirectionDeg = 0;
let windCardinal = "N";

let camDistance = 600;
let targetRotation = 0;
let currentRotation = 0;

function setup() {
  createCanvas(window.innerWidth, window.innerHeight, WEBGL);
  textFont("monospace");

  fetchWind();
  setInterval(fetchWind, 600000);
}

function draw() {
  background(255);

  smoothCamera();

  drawScene();
}

//
// 🌬 FETCH WIND
//
function fetchWind() {
  let url =
    "https://api.open-meteo.com/v1/forecast?latitude=46.948&longitude=7.447&current=wind_direction_10m";

  fetch(url)
    .then((res) => res.json())
    .then((data) => {
      windDirectionDeg = data.current.wind_direction_10m;
      windCardinal = degreesToCardinal(windDirectionDeg);

      // update camera target
      targetRotation = radians(windDirectionDeg);
    })
    .catch((err) => console.error(err));
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
function smoothCamera() {
  // smooth transition
  currentRotation = lerp(currentRotation, targetRotation, 0.05);

  let camX = camDistance * sin(currentRotation);
  let camZ = camDistance * cos(currentRotation);
  let camY = 200; // slight elevation

  camera(
    camX,
    camY,
    camZ, // camera position
    0,
    0,
    0, // look at center
    0,
    1,
    0, // up vector
  );
}

//
// 🧱 SCENE
//
function drawScene() {
  // grid floor (like blender viewport)
  stroke(60);
  strokeWeight(1);

  let size = 1000;
  let step = 50;

  for (let x = -size; x <= size; x += step) {
    line(x, 0, -size, x, 0, size);
  }

  for (let z = -size; z <= size; z += step) {
    line(-size, 0, z, size, 0, z);
  }

  // origin marker
  push();
  noStroke();
  fill(255, 80, 80);
  box(40);
  pop();

  // axis lines
  strokeWeight(3);

  // X axis (red)
  stroke(255, 0, 0);
  line(0, 0, 0, 200, 0, 0);

  // Y axis (green)
  stroke(0, 255, 0);
  line(0, 0, 0, 0, -200, 0);

  // Z axis (blue)
  stroke(0, 0, 255);
  line(0, 0, 0, 0, 0, 200);
}

function windowResized() {
  resizeCanvas(window.innerWidth, window.innerHeight);
}
