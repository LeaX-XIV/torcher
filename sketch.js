const SETTINGS_FILENAME = "./settings.json";

const CIRCLE_MASK_NAME = "./circle_mask.svg";
const DIM_MASK_NAME = "./dim_mask.svg";

let map_bg;
let dim_mask;
let circle_mask;
let map_walls;

let W = 420;
let H = 380;

let backgroundColor = 0;

let grid_dx = 0;
let grid_dy = 0;
let grid_w = -1;
let grid_h = -1;
let pixelPerSquare = 1;  // Px/Sq

const FEET_PER_SQUARE = 5;  // Ft/Sq

let tokens = [];
let holding = undefined;

function preload() {
  loadJSON(SETTINGS_FILENAME, settings => {
    loadImage(settings['map'], img => {
      map_bg = img;
      W = img.width;
      H = img.height;
      resizeCanvas(W, H);
      Token.TERRAIN = map_bg;
    });
    loadImage(settings['map_walls'], img => {
      map_walls = img;
      Token.WALLS = map_walls;
    });

    grid_dx = settings['grid_dy'];
    grid_dy = settings['grid_dx'];
    grid_w = settings['grid_w'];
    grid_h = settings['grid_h'];
    pixelPerSquare = settings['grid_step'];
    Token.PIXEL_PER_FEET = pixelPerSquare / FEET_PER_SQUARE;

    backgroundColor = settings['background_color'];
  });

  loadImage(CIRCLE_MASK_NAME, img => {
    circle_mask = img;
    Token.CIRCLE_MASK = circle_mask;
  });
  loadImage(DIM_MASK_NAME, img => {
    dim_mask = img;
    Token.DIM_MASK = dim_mask;
  });
}

function setup() {
  createCanvas(W, H);
  background(backgroundColor);
  frameRate(30)

  tokens.push(new Token())
  tokens.push(new Token(500, 500, 5, '#ab572d', new Light(60, 0, 2.5), false, true))
}

function draw() {
  clear();
  background(backgroundColor);

  showTerrains();

  showDarkness();

  showTerrainsTrueSight();

  showWalls();

  showTokens();

  showGrid();

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
  let limitH = grid_h === -1 ? H : (grid_h + grid_dx);
  let limitW = grid_w === -1 ? W : (grid_w + grid_dy);

  stroke(121);
  strokeWeight(1);
  // Horizontal lines
  for(let i = grid_dy; i < limitW; i += pixelPerSquare) {
    line(i, grid_dx, i, limitH);
  }
  line(limitW, grid_dx, limitW, limitH);
  // Vertical lines
  for(let i = grid_dx; i < limitH; i += pixelPerSquare) {
    line(grid_dy, i, limitW, i);
  }
  line(grid_dy, limitH, limitW, limitH);
}

function showWalls() {
  imageMode(CORNER)
  image(map_walls, 0, 0);
}