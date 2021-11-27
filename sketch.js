const SETTINGS_FILENAME = "./settings.json";

const CIRCLE_MASK_NAME = "./circle_mask.svg";
const DIM_MASK_NAME = "./dim_mask.svg";

let map_bg;
let dim_mask;
let circle_mask;
let map_walls;

let imgW = 0;
let imgH = 0;

let backgroundColor = 0;
let obfuscateOnMovement = true;

let tokens = [];
let holding = undefined;

let grid = undefined;

function preload() {
  grid = new Grid();
  loadJSON(SETTINGS_FILENAME, settings => {
    loadImage(settings['map'], img => {
      map_bg = img;
      imgW = img.width;
      imgH = img.height;
      Token.TERRAIN = map_bg;
    });
    loadImage(settings['map_walls'], img => {
      map_walls = img;
      Token.WALLS = map_walls;
    });

    if("grid" in settings) {
      let grid_x = settings['grid']['x'];
      let grid_y = settings['grid']['y'];
      let grid_width = settings['grid']['width'];
      let grid_height = settings['grid']['height'];
      let grid_squareSize = settings['grid']['square_size'];
      let grid_snapToGrid = settings['grid']['snap_to_grid'];
      let grid_color = settings['grid']['color'];

      if(grid_color === undefined) {
        grid = new Grid(grid_x, grid_y, grid_width, grid_height, grid_squareSize, grid_snapToGrid);
      } else {
        grid = new Grid(grid_x, grid_y, grid_width, grid_height, grid_squareSize, grid_snapToGrid, grid_color);
      }
      Token.PIXEL_PER_FEET = grid.squareSize / Grid.FEET_PER_SQUARE;
    }

    if("tokens" in settings) {
      for(const t of settings['tokens']) {
        const row = "x" in t ? t['x'] : 0;
        const col = "y" in t ? t['y'] : 0;
        const size = "size" in t ? t['size'] : "medium";
        const color = "color" in t ? t['color'] : "#0F53BA";
        const light = "light" in t ? t['light'] : [20, 20];
        const darkVision = "darkVision" in t ? t['darkVision'] : false;
        const trueSight = "trueSight" in t ? t['trueSight'] : false;

        // if(Token.SIZES[size] === undefined) {
        if(size !== "medium") {
          throw new TypeError(`Unexpected size '${size}'`);
        }
        const sizeFeet = Token.SIZES[size];
        const [x, y, w, h] = grid.xywhOfSquare(row, col);

        const newToken = new Token(x + w / 2 + grid.x, y + h / 2 + grid.y, sizeFeet, color, new Light(light[0], light[1], sizeFeet / 2), darkVision, trueSight);
        tokens.push(newToken);
      }
    }

    backgroundColor = settings['background_color'];

    if("obfuscate_on_movement" in settings) {
      obfuscateOnMovement = settings["obfuscate_on_movement"];
    }
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
  const [w, h] = getCanvasSize();
  createCanvas(w, h);
  background(backgroundColor);
  frameRate(30)
}

function draw() {
  translate(-grid.x, -grid.y);

  clear();
  background(backgroundColor);

  showTerrains();

  showDarkness();

  showTerrainsTrueSight();

  showWalls();

  showTokens();

  grid.show();

  if(!mouseIsPressed) {
    noLoop()
  }
}

function mousePressed() {
  if(mouseButton === LEFT) {
    for(tk of tokens) {
      if(tk.intersect(mouseX + grid.x, mouseY + grid.y)) {
        holding = tk;
        holding.recordLastKnownLocation();
        if(obfuscateOnMovement) {
          holding.pickUp()
        }
        loop()
        break;
      }
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
  if(mouseButton === LEFT) {
    if(holding && grid.snapToGrid) {
      const [x, y, w, h] = grid.xywhOfSquareFromCoords(mouseX, mouseY);
      holding.moveTo(x + w / 2 + grid.x, y + h / 2 + grid.y);
    }

    // if(holding && obfuscateOnMovement) {
    if(holding) {
      holding.putDown();
    }
    holding = undefined;
    noLoop()
  }
}

function keyPressed() {
  if(keyCode === ESCAPE && holding) {
    holding.restoreLastKnownPosition();
    holding.putDown();
    holding = undefined;
  }
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

function showWalls() {
  imageMode(CORNER)
  image(map_walls, 0, 0);
}

function getCanvasSize() {
  const w = (grid.width <= 0 ? imgW : grid.width) - grid.x
  const h = (grid.height <= 0 ? imgH : grid.height) - grid.y;

  return [w, h];
}