const MAP_NAME = "map.jpg";
const DIM_MASK_NAME = "dim_mask.svg";
const CIRCLE_MASK_NAME = "circle_mask.svg";
const MAP_WALLS_NAME = "map_walls.png";
let map_bg;
let dim_mask;
let circle_mask;
let map_walls;

let W = 420;
let H = 380;

const BACKGROUND_COLOR = 0;

const PIXEL_PER_SQUARE = 42;  // Px/Sq
const FEET_PER_SQUARE = 5;  // Ft/Sq
const SIGHT = 120; // Ft
const RADIUS = PIXEL_PER_SQUARE * SIGHT / FEET_PER_SQUARE; // Px/Sq * Ft / Ft/Sq = Px 

let rayG;

let tokens = [];
let holding = undefined;

function preload() {
  loadImage(MAP_NAME, img => {
    map_bg = img
    W = img.width;
    H = img.height;
    resizeCanvas(W, H);
    Token.TERRAIN = map_bg
  });
  loadImage(DIM_MASK_NAME, img => {
    dim_mask = img;
    Token.DIM_MASK = dim_mask;
  });
  loadImage(CIRCLE_MASK_NAME, img => {
    circle_mask = img;
    Token.CIRCLE_MASK = circle_mask;
  });
  loadImage(MAP_WALLS_NAME, img => {
    map_walls = img;
    Token.WALLS = map_walls;
  });
}

function setup() {
  createCanvas(W, H);
  background(BACKGROUND_COLOR);
  // rayG = createGraphics(RADIUS * 2, RADIUS * 2);
  frameRate(15)

  tokens.push(new Token())
  tokens.push(new Token(500, 500, 5, '#ab572d', new Light(60, 60), false, true))
}

function draw() {
  clear();
  background(BACKGROUND_COLOR);

  showTerrains();

  showDarkness();

  showWalls();

  showTerrainsTrueSight();

  showTokens();

  showGrid();

  print(frameRate())

  if(!mouseIsPressed) {
    noLoop()
  }
}

function mousePressed() {
  for(tk of tokens) {
    if(tk.intersect(mouseX, mouseY)) {
      holding = tk;
      loop()
      break;
    }
  }
}

function mouseDragged() {
  if(holding) {
    // TODO: Only works correctly if the browser is at 100% zoom
    holding.move(movedX, movedY);
  }
}

function mouseReleased() {
  holding = undefined;
  noLoop()
}

function showTerrains() {
  for(tk of tokens) {
    tk.update();
    tk.showTerrain(false);
  }
}

function showDarkness() {
  // TODO: Implement darkness
}

function showTerrainsTrueSight() {
  for(tk of tokens) {
    if(tk.trueSight) {
      tk.showTerrain(true);
    }
  }
}

function showTokens() {
  for(tk of tokens) {
    tk.showSelf();
  }
}

function showGrid() {
  stroke(121);
  strokeWeight(1);
  for(let i = 0; i < W; i += PIXEL_PER_SQUARE) {
    line(0, i, H, i);
    line(i, 0, i, W);
  }
}

function showWalls() {
  imageMode(CORNER)
  image(map_walls, 0, 0);
}