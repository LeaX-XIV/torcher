const SETTINGS_FILENAME = "./settings.json";

const CIRCLE_MASK_NAME = "./circle_mask.svg";
const DIM_MASK_NAME = "./dim_mask.svg";

let map_bg;
let dim_mask;
let circle_mask;
let map_walls;

let imgW = 0;
let imgH = 0;

let tokens = [];
let obstacles = [];

function sketch(p) {

  let backgroundColor = 0;
  let obfuscateOnMovement = true;

  let tokensData = [];
  let holding = undefined;

  let obstaclesData = [];
  let selected = undefined;

  let grid = undefined;

  p.preload = () => {
    grid = new Grid();
    p.loadJSON(SETTINGS_FILENAME, settings => {
      p.loadImage(settings['map'], img => {
        map_bg = img;
        imgW = img.width;
        imgH = img.height;
        Token.TERRAIN = map_bg;
      });
      p.loadImage(settings['map_walls'], img => {
        map_walls = img;
        Token.WALLS = map_walls;
      });

      backgroundColor = settings['background_color'];
      if("obfuscate_on_movement" in settings) {
        obfuscateOnMovement = settings["obfuscate_on_movement"];
      }

      if("grid" in settings) {
        let grid_x = settings['grid']['x'];
        let grid_y = settings['grid']['y'];
        let grid_width = settings['grid']['width'];
        let grid_height = settings['grid']['height'];
        let grid_squareSize = settings['grid']['square_size'];
        let grid_snapToGrid = settings['grid']['snap_to_grid'];
        let grid_color = settings['grid']['color'];

        if(grid_color === undefined) {
          grid = new Grid(p, grid_x, grid_y, grid_width, grid_height, grid_squareSize, grid_snapToGrid);
        } else {
          grid = new Grid(p, grid_x, grid_y, grid_width, grid_height, grid_squareSize, grid_snapToGrid, grid_color);
        }
        Token.PIXEL_PER_FEET = grid.squareSize / Grid.FEET_PER_SQUARE;
      }

      if("tokens" in settings) {
        for(const i in settings['tokens']) {
          const t = settings['tokens'][i];

          tokensData[i] = {};
          tokensData[i].row = "x" in t ? t['x'] : 0;
          tokensData[i].col = "y" in t ? t['y'] : 0;
          tokensData[i].size = "size" in t ? t['size'] : "medium";
          tokensData[i].color = "color" in t ? t['color'] : "#0F53BA";
          tokensData[i].borderColor = "borderColor" in t ? t['borderColor'] : undefined;
          tokensData[i].tokenImgPath = "image" in t ? t['image'] : undefined;
          tokensData[i].light = "light" in t ? t['light'] : [20, 20];
          tokensData[i].darkVision = "darkVision" in t ? t['darkVision'] : false;
          tokensData[i].trueSight = "trueSight" in t ? t['trueSight'] : false;

          if(Token.SIZES[tokensData[i].size] === undefined) {
          // if(size !== "medium") {
            throw new TypeError(`Unexpected size '${tokensData[i].size}'`);
          }
          if(tokensData[i].tokenImgPath !== undefined) {
            p.loadImage(tokensData[i].tokenImgPath, img => {
              tokensData[i].image = img;
            });
          }
          tokensData[i].sizeFeet = Token.SIZES[tokensData[i].size];
          [tokensData[i].x, tokensData[i].y, tokensData[i].w, tokensData[i].h] = grid.xywhOfSquare(tokensData[i].row, tokensData[i].col);
        }
      }

      if("obstacles" in settings) {
        for(const i in settings['obstacles']) {
          const o = settings['obstacles'][i];

          obstaclesData[i] = {};
          obstaclesData[i].id = i;
          obstaclesData[i].x = o['x'];
          obstaclesData[i].y = o['y'];
          obstaclesData[i].w = o['w'];
          obstaclesData[i].h = o['h'];
          obstaclesData[i].color = "color" in o ? o['color'] : backgroundColor;
          obstaclesData[i].borderColor = "borderColor" in o ? o['borderColor'] : undefined;
        }
      }
    });

    p.loadImage(CIRCLE_MASK_NAME, img => {
      circle_mask = img;
      Token.CIRCLE_MASK = circle_mask;
    });
    p.loadImage(DIM_MASK_NAME, img => {
      dim_mask = img;
      Token.DIM_MASK = dim_mask;
    });
  }

  p.setup = () => {
    for(const td of tokensData) {
      const newToken = new Token(p, td.i, td.x + grid.x, td.y + grid.y, td.sizeFeet, td.color, td.borderColor, td.image, new Light(td.light[0], td.light[1], td.sizeFeet / 2), td.darkVision, td.trueSight);
      tokens.push(newToken);
    }

    for(const od of obstaclesData) {
      const newObstacle = new Obstacle(p, od.id, od.x, od.y, od.w, od.h, od.color, od.borderColor);
      obstacles.push(newObstacle);
    }

    const [w, h] = getCanvasSize();
    p.createCanvas(w, h);
    p.background(backgroundColor);
    p.frameRate(30);
  }

  p.draw = () => {
    p.push();
    p.translate(-grid.x, -grid.y);

    p.clear();
    p.background(backgroundColor);

    showTerrains();

    showDarkness();

    showTerrainsTrueSight();

    showWalls();

    showObstacles();

    showTokens();

    grid.show(p);

    if(!p.mouseIsPressed) {
      p.noLoop()
    }
    p.pop();
  }

  p.mousePressed = () => {
    if(p.mouseButton === p.LEFT) {
      console.log(p.mouseX + grid.x, p.mouseY + grid.y);
      // Check tokens intersection
      for(let i = tokens.length - 1; i >= 0; --i) {
        const tk = tokens[i];
        if(tk.intersect(p.mouseX + grid.x, p.mouseY + grid.y)) {
          holding = tk;
          holding.recordLastKnownLocation();
          if(obfuscateOnMovement) {
            holding.pickUp();
          }
          if(selected) {
            console.log(`unselecting ${selected.id}`);
            selected.unselect();
            selected = undefined;
          }
          p.loop();
          // break;
          break;
        }
      }
      // Check obstacles intersection
      for(let i = obstacles.length - 1; i >= 0; --i) {
        const o = obstacles[i];
        if(o.isShowing() && o.intersect(p.mouseX + grid.x, p.mouseY + grid.y)) {
          if(!holding && !selected) {
            o.select();
            selected = o;
            p.redraw();
            return;
          }
        }
      }

      if(!holding && selected && selected.intersect(p.mouseX + grid.x, p.mouseY + grid.y)) {
        selected.doUnshow();
        selected.unselect();
        selected = undefined;
        // call update on all tokens
        for (const tk of tokens) {
          tk.update(true);
        }
        p.redraw();
      }
    }
  }

  p.mouseDragged = () => {
    if(holding) {
      // TODO: Only works correctly if the browser is at 100% zoom
      holding.move(p.movedX, p.movedY);
    }
  }

  p.mouseReleased = () => {
    if(p.mouseButton === p.LEFT) {
      if(holding && grid.snapToGrid) {
        const [x, y, w, h] = grid.xywhOfSquareFromCoords(p.mouseX, p.mouseY);
        holding.moveTo(x + grid.x, y + grid.y);
      }

      // if(holding && obfuscateOnMovement) {
      if(holding) {
        holding.putDown();
      }
      
      if(!holding && selected && !selected.intersect(p.mouseX + grid.x, p.mouseY + grid.y)) {
        selected.unselect();
        selected = undefined;
        p.redraw();
      
      }
      holding = undefined;
      p.noLoop()
    }
  }

  p.keyPressed = () => {
    if(p.keyCode === p.ESCAPE && holding) {
      holding.restoreLastKnownPosition();
      holding.putDown();
      holding = undefined;
    }
  }

  function showTerrains() {
    for(tk of tokens) {
      tk.update();
      tk.showTerrain(p, false);
    }
  }

  function showDarkness() {
    // TODO: Implement darkness
  }

  function showTerrainsTrueSight() {
    for(tk of tokens) {
      if(tk.trueSight) {
        tk.showTerrain(p, true);
      }
    }
  }

  function showTokens() {
    for(tk of tokens) {
      tk.showSelf(p);
    }
  }

  function showWalls() {
    p.imageMode(p.CORNER)
    p.image(map_walls, 0, 0);
  }

  function showObstacles() {
    for(const o of obstacles) {
      o.show(p);
    }
  }

  function getCanvasSize() {
    const w = (grid.width <= 0 ? imgW : grid.width);
    const h = (grid.height <= 0 ? imgH : grid.height);

    return [w, h];
  }
};

const myp5 = new p5(sketch);