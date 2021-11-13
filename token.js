class Token {
	static RAYTRACE_POINTS = 50;

	static PIXEL_PER_FEET = 42 / 5;

	static CIRCLE_MASK = circle_mask;
	static DIM_MASK = dim_mask;
	static TERRAIN = map_bg;
	static WALLS = map_walls;

	static get defaultValues() {
		return {
			x: 400,
			y: 270,
			size: 5,
			color: '#0F53BA',
			light: new Light(22.5, 22.5),
			darkVision: false,
			trueSight: false,
			// Left out to prevent huge memory allocation if not needed
			//vision: new Vision(-1, -1, createGraphics(feet2Pixel(this.light.totalRadius * 2, Token.PIXEL_PER_FEET), feet2Pixel(this.light.totalRadius * 2, Token.PIXEL_PER_FEET)))
		}
	}

	// size, light have values expressed in feet
	constructor(x, y, size, color, light, darkVision, trueSight, vision) {
		this.x = x || Token.defaultValues.x;
		this.y = y || Token.defaultValues.y;
		this.size = feet2Pixel(size || Token.defaultValues.size, Token.PIXEL_PER_FEET);
		this.color = color || Token.defaultValues.color;
		this.light = light || new Light(Token.defaultValues.light.bright, Token.defaultValues.light.dim);
		this.darkVision = darkVision || Token.defaultValues.darkVision;
		this.trueSight = trueSight || Token.defaultValues.trueSight;
		this.vision = vision || new Vision(-1, -1, createGraphics(feet2Pixel(this.light.totalRadius * 2, Token.PIXEL_PER_FEET), feet2Pixel(this.light.totalRadius * 2, Token.PIXEL_PER_FEET)));
	}

	update() {
		if(this.x !== this.vision.x || this.y !== this.vision.y) {
			// Recreate vision
			let terrainVision = this.#generateTerrainView(feet2Pixel(this.light.totalRadius, Token.PIXEL_PER_FEET));

			this.vision.vision.imageMode(CENTER);
			this.vision.vision.image(terrainVision, this.vision.vision.width / 2, this.vision.vision.height / 2);

			this.vision.x = this.x;
			this.vision.y = this.y;
		}
	}

	showTerrain(trueSight) {
		blendMode(LIGHTEST);
		imageMode(CENTER);
		if(this.trueSight && trueSight) {
			image(this.vision.vision, this.x, this.y, this.vision.vision.width, this.vision.vision.height);
			return;
		} else if(this.trueSight && !trueSight) {
			return;
		}

		let brightSight = undefined;
		let dimSight = this.#obtainTerrainViewByCut(feet2Pixel(this.light.dimRadius, Token.PIXEL_PER_FEET));
		if(!this.darkVision) {
			brightSight = this.#obtainTerrainViewByCut(feet2Pixel(this.light.brightRadius, Token.PIXEL_PER_FEET));
			dimSight.mask(Token.DIM_MASK);
			dimSight.filter(GRAY)
		}
		image(dimSight, this.x, this.y);
		if(!this.darkVision) {
			image(brightSight, this.x, this.y);
		}
		blendMode(BLEND);
	}

	showSelf() {
		ellipseMode(CENTER);
		noStroke();
		fill(color(this.color));
		circle(this.x, this.y, this.size);
	}

	move(dx, dy) {
		this.x += dx;
		this.y += dy;
	}

	intersect(x, y) {
		return dist(this.x, this.y, x, y) <= this.size / 2;
	}

	get brightLightRadius() { return feet2Pixel(this.light.bright, Token.PIXEL_PER_FEET) }
	get dimLightRadius() { return feet2Pixel(this.light.dim, Token.PIXEL_PER_FEET) }

	#generateTerrainView(radius) {
		let gr = this.vision.vision;

		gr.clear();
		gr.push();
		imageMode(CORNER)
		gr.translate(radius, radius);
		gr.fill('rgba(0, 0, 0, 1)');

		gr.beginShape();
		Token.WALLS.loadPixels();
		for(let t = 0; t <= TWO_PI; t += (TWO_PI / Token.RAYTRACE_POINTS)) {
			let found = false;
			for(let r = 0; r <= 1; r += 0.001) {
				let [relX, relY] = toCartesian(r * radius, t);
				let index = toIndexInPixelArray(int(relX + this.x), int(relY + this.y));
				let red = Token.WALLS.pixels[index];
				let g = Token.WALLS.pixels[index + 1];
				let b = Token.WALLS.pixels[index + 2];
				let a = Token.WALLS.pixels[index + 3];
				if(red === undefined || g === undefined || b === undefined || a === undefined) {
					break;
				}
				if(a === 255) {
					gr.vertex(relX, relY);
					found = true;
					break;
				}
			}
			if(!found) {
				let [relX, relY] = toCartesian(radius, t);
				gr.vertex(relX, relY);
			}
		}
		gr.endShape(CLOSE);
		gr.pop()

		let rayImg = createImage(gr.width, gr.height)
		rayImg.copy(Token.TERRAIN, this.x - radius, this.y - radius, gr.width, gr.height, 0, 0, gr.width, gr.height);
		rayImg.mask(Token.CIRCLE_MASK);

		let rayMask = createImage(gr.width, gr.height);
		rayMask.copy(gr, 0, 0, gr.width, gr.height, 0, 0, gr.width, gr.height);
		rayImg.mask(rayMask);

		return rayImg;
	}

	#obtainTerrainViewByCut(radius) {
		let gr = this.vision.vision;

		// if(radius < gr.width) {
		let rayImg = createImage(radius * 2, radius * 2);
		rayImg.copy(gr, gr.width / 2 - radius, gr.height / 2 - radius, radius * 2, radius * 2, 0, 0, radius * 2, radius * 2);
		rayImg.mask(Token.CIRCLE_MASK);

		return rayImg;
		// }
	}
}

class Light {
	constructor(bright, dim) {
		this.bright = bright || 5;
		this.dim = dim || 0;
	}

	get brightRadius() { return this.bright; }
	get dimRadius() { return this.dim + this.bright; }
	get totalRadius() { return this.dimRadius; }
}

class Vision {
	constructor(x, y, vision) {
		this.x = x;
		this.y = y;
		this.vision = vision;
	}
}

const feet2Pixel = (feet, pixelPerFeet) => pixelPerFeet * feet;

const toPolar = (x, y) => [sqrt(x * x + y * y), atan2(y / x)];

const toCartesian = (r, t) => [r * cos(t), r * sin(t)];

function toIndexInPixelArray(x, y, w) {
	w = w || W
	return int((y * w + x) * pixelDensity() * 4)
}