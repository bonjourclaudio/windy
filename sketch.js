let windDirectionDeg = 0;
let windCardinal = "N";
let characterPos;

function setup() {
  createCanvas(window.innerWidth, window.innerHeight);
  textFont("monospace");
  textAlign(CENTER, CENTER);
  textSize(22);

  characterPos = createVector(width / 2, height / 2);

  fetchWind();
  setInterval(fetchWind, 600000); // every 10 minutes
}

function draw() {
  background(10);
  fill(255);

  drawAsciiCompass();
  drawCharacter();
}

function fetchWind() {
  let url =
    "https://api.open-meteo.com/v1/forecast?latitude=46.948&longitude=7.447&current=wind_direction_10m";

  fetch(url)
    .then((res) => res.json())
    .then((data) => {
      windDirectionDeg = data.current.wind_direction_10m;
      windCardinal = degreesToCardinal(windDirectionDeg);
      updateCharacterPosition();
    })
    .catch((err) => console.error(err));
}

function degreesToCardinal(deg) {
  if (deg >= 315 || deg < 45) return "N";
  if (deg >= 45 && deg < 135) return "E";
  if (deg >= 135 && deg < 225) return "S";
  return "W";
}

function updateCharacterPosition() {
  let offset = 120;

  characterPos.set(width / 2, height / 2);

  if (windCardinal === "N") characterPos.y -= offset;
  if (windCardinal === "S") characterPos.y += offset;
  if (windCardinal === "E") characterPos.x += offset;
  if (windCardinal === "W") characterPos.x -= offset;
}

function drawAsciiCompass() {
  text("N", width / 2, height / 2 - 150);
  text("S", width / 2, height / 2 + 150);
  text("W", width / 2 - 200, height / 2);
  text("E", width / 2 + 200, height / 2);

  text(`Wind: ${windCardinal} (${windDirectionDeg}°)`, width / 2, 40);
}

function drawCharacter() {
  text("@", characterPos.x, characterPos.y);
}

function windowResized() {
  resizeCanvas(window.innerWidth, window.innerHeight);
}
