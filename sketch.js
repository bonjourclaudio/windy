let windDirectionDeg = 0;
let windCardinal = "N";

let cols, rows;
let resolution = 100;
let zoff = 0;

function setup() {
  createCanvas(window.innerWidth, window.innerHeight);
  textFont("monospace");
  textSize(16);
  textAlign(CENTER, CENTER);

  cols = floor(width / resolution);
  rows = floor(height / resolution);

  fetchWind();
  setInterval(fetchWind, 600000);
}

function draw() {
  background(0);
  fill(255);

  drawFlowField();

  zoff += 0.01;
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
// 🌊 PERLIN FLOW FIELD
//
function drawFlowField() {
  let yoff = 0;

  for (let y = 0; y < rows; y++) {
    let xoff = 0;

    for (let x = 0; x < cols; x++) {
      // 🌬 Base wind vector (real wind)
      let windVector = p5.Vector.fromAngle(radians(windDirectionDeg));

      // 🌊 Noise turbulence vector
      let noiseAngle = noise(xoff, yoff, zoff) * TWO_PI * 2;
      let noiseVector = p5.Vector.fromAngle(noiseAngle);

      // Blend them (wind dominant)
      windVector.mult(1.5); // strength of real wind
      noiseVector.mult(0.6); // turbulence strength

      let finalVector = p5.Vector.add(windVector, noiseVector);

      let angle = finalVector.heading();

      let char = angleToAscii(angle);

      let posX = x * resolution + resolution / 2;
      let posY = y * resolution + resolution / 2;

      textSize(126);
      text(char, posX, posY);

      xoff += 0.1;
    }
    yoff += 0.1;
  }
}

//
// 🔄 Convert angle → ASCII arrow
//
function angleToAscii(angle) {
  let a = angle % TWO_PI;
  if (a < 0) a += TWO_PI;

  let slice = TWO_PI / 8;

  if (a < slice) return "→";
  if (a < slice * 2) return "↘";
  if (a < slice * 3) return "↓";
  if (a < slice * 4) return "↙";
  if (a < slice * 5) return "←";
  if (a < slice * 6) return "↖";
  if (a < slice * 7) return "↑";
  return "↗";
}

function windowResized() {
  resizeCanvas(window.innerWidth, window.innerHeight);
  cols = floor(width / resolution);
  rows = floor(height / resolution);
}
