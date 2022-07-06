class Token {
	static RAYTRACE_POINTS = 50;
	static RAYTRACE_STEPS = 20;

	static PIXEL_PER_FEET = 50 / Grid.FEET_PER_SQUARE;

	static CIRCLE_MASK = circle_mask;
	static DIM_MASK = dim_mask;
	static TERRAIN = map_bg;
	static WALLS = map_walls;

	static SIZES = {
		tiny: 2.5,
		small: 5,
		medium: 5,
		large: 10,
		huge: 15,
		gargantuan: 20
	};

	static get defaultValues() {
		return {
			x: 400,
			y: 270,
			size: 5,
			color: '#0F53BA',
			borderColor: undefined,
			image: undefined,
			light: new Light(20, 20),
			darkVision: false,
			trueSight: false,
			// Left out to prevent huge memory allocation if not needed
			//vision: new Vision(-1, -1, createGraphics(feet2Pixel(this.light.totalRadius * 2, Token.PIXEL_PER_FEET), feet2Pixel(this.light.totalRadius * 2, Token.PIXEL_PER_FEET)))
		}
	}

	// size, light have values expressed in feet
	constructor(
		id,
		x = Token.defaultValues.x,
		y = Token.defaultValues.y,
		size = Token.defaultValues.size,
		color = Token.defaultValues.color,
		borderColor = Token.defaultValues.borderColor,
		image = Token.defaultValues.image,
		light = new Light(Token.defaultValues.light.bright, Token.defaultValues.light.dim, Token.defaultValues.size / 2),
		darkVision = Token.defaultValues.darkVision,
		trueSight = Token.defaultValues.trueSight,
		vision = undefined
	) {
		this.id = id;
		this.x = x;
		this.y = y;
		this.size = feet2Pixel(size, Token.PIXEL_PER_FEET);
		this.color = color;
		this.image = image;
		this.light = light;
		// Make the light be cast from the edge of the token.
		// this.light.bright += size / 2;
		// this.light.dim += size / 2;

		this.darkVision = darkVision;
		this.trueSight = trueSight;
		this.vision = vision || new Vision(-1, -1, createGraphics(feet2Pixel(this.light.totalRadius * 2, Token.PIXEL_PER_FEET), feet2Pixel(this.light.totalRadius * 2, Token.PIXEL_PER_FEET)));

		this.updateTerrain = true;
		this.lastKnownPos = undefined;

		if(borderColor === undefined) {
			let [r, g, b] = hexToRgb(this.color.substring(1));
			let [h, s, l] = rgbToHsl(r, g, b);
			if(l < 0.25) {
				l += 0.25;
			} else {
				l -= 0.25;
			}

			[r, g, b] = hslToRgb(h, s, l);
			this.borderColor = '#' + rgbToHex(r, g, b);
		} else {
			this.borderColor = borderColor;
		}
	}

	update() {
		if(this.updateTerrain && (this.x !== this.vision.x || this.y !== this.vision.y)) {
			// Recreate vision
			let terrainVision = this.#generateTerrainView(feet2Pixel(this.light.totalRadius, Token.PIXEL_PER_FEET));

			this.vision.vision.imageMode(CENTER);
			this.vision.vision.image(terrainVision, this.vision.vision.width / 2, this.vision.vision.height / 2);

			this.vision.x = this.x;
			this.vision.y = this.y;
		}
	}

	pickUp() {
		this.updateTerrain = false;
	}

	putDown() {
		this.updateTerrain = true;
		this.lastKnownPos = undefined;
	}

	recordLastKnownLocation() {
		this.lastKnownPos = [this.x, this.y];
	}

	restoreLastKnownPosition() {
		this.moveTo(...this.lastKnownPos);
		this.lastKnownPos = undefined;
	}

	showTerrain(trueSight) {
		imageMode(CENTER);
		if(this.trueSight && trueSight) {
			blendMode(LIGHTEST);
			image(this.vision.vision, this.vision.x + this.size / 2, this.vision.y + this.size / 2, this.vision.vision.width, this.vision.vision.height);
			blendMode(BLEND);
			return;
		} else if(this.trueSight && !trueSight) {
			return;
		}

		blendMode(LIGHTEST);
		let brightSight = undefined;
		let dimSight = this.#obtainTerrainViewByCut(feet2Pixel(this.light.dimRadius, Token.PIXEL_PER_FEET));
		if(!this.darkVision) {
			brightSight = this.#obtainTerrainViewByCut(feet2Pixel(this.light.brightRadius, Token.PIXEL_PER_FEET));
			dimSight.mask(Token.DIM_MASK);
			dimSight.filter(GRAY)
		}
		image(dimSight, this.vision.x + this.size / 2, this.vision.y + this.size / 2);
		if(!this.darkVision) {
			image(brightSight, this.vision.x + this.size / 2, this.vision.y + this.size / 2);
		}
		blendMode(BLEND);
	}

	showSelf() {
		ellipseMode(CENTER);
		noStroke();
		if(this.borderColor !== undefined) {
			strokeWeight(1);
			stroke(color(this.borderColor));
		}
		fill(color(this.color));
		circle(this.x + this.size / 2, this.y + this.size / 2, this.size);
		if(this.image) {
			imageMode(CENTER);
			image(this.image, this.x + this.size / 2, this.y + this.size / 2, this.size * 0.9, this.size * 0.9);
			// rectMode(CENTER);
			// noFill();
			// rect(this.x + this.size / 2, this.y + this.size / 2, this.size * 0.9, this.size * 0.9);
		}
	}

	move(dx, dy) {
		this.moveTo(this.x + dx, this.y + dy);
	}

	moveTo(x, y) {
		this.x = x;
		this.y = y;
	}

	intersect(x, y) {
		return dist(this.x + this.size / 2, this.y + this.size / 2, x, y) <= this.size / 2;
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
			let increment = 1 / Token.RAYTRACE_STEPS
			for(let r = 0; r <= 1; r += increment) {
				let [relX, relY] = toCartesian(r * radius, t);
				let index = toIndexInPixelArray(int(relX + this.x + this.size / 2), int(relY + this.y + this.size / 2));
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
		rayImg.copy(Token.TERRAIN, this.x + this.size / 2 - radius, this.y + this.size / 2 - radius, gr.width, gr.height, 0, 0, gr.width, gr.height);
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
	constructor(bright = 5, dim = 0, size = 0) {
		this.bright = bright;
		this.dim = dim;
		this.size = size;
	}

	get brightRadius() { return this.bright + this.size; }
	get dimRadius() { return this.dim + this.brightRadius; }
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

const toIndexInPixelArray = (x, y, w = imgW) => int((y * w + x) * pixelDensity() * 4);