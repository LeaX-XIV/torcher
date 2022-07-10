class Token {
	static RAYTRACE_POINTS = 360;
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
		ctx = undefined,
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
		vision = undefined,
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
		this.ctx = ctx;
		this.vision = vision || new Vision(-1, -1, this.ctx.createGraphics(feet2Pixel(this.light.totalRadius * 2, Token.PIXEL_PER_FEET), feet2Pixel(this.light.totalRadius * 2, Token.PIXEL_PER_FEET)));

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

	update(force = false) {
		if(force || (this.updateTerrain && (this.x !== this.vision.x || this.y !== this.vision.y))) {
			// Recreate vision
			let terrainVision = this.#generateTerrainView(feet2Pixel(this.light.totalRadius, Token.PIXEL_PER_FEET));

			this.vision.vision.imageMode(this.vision.vision.CENTER);
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

	showTerrain(ctx = this.ctx, trueSight) {
		ctx.imageMode(ctx.CENTER);
		if(this.trueSight && trueSight) {
			ctx.blendMode(ctx.LIGHTEST);
			ctx.image(this.vision.vision, this.vision.x + this.size / 2, this.vision.y + this.size / 2, this.vision.vision.width, this.vision.vision.height);
			ctx.blendMode(ctx.BLEND);
			return;
		} else if(this.trueSight && !trueSight) {
			return;
		}

		ctx.blendMode(ctx.LIGHTEST);
		let brightSight = undefined;
		let dimSight = this.#obtainTerrainViewByCut(feet2Pixel(this.light.dimRadius, Token.PIXEL_PER_FEET));
		if(!this.darkVision) {
			brightSight = this.#obtainTerrainViewByCut(feet2Pixel(this.light.brightRadius, Token.PIXEL_PER_FEET));
			dimSight.mask(Token.DIM_MASK);
			dimSight.filter(ctx.GRAY)
		}
		ctx.image(dimSight, this.vision.x + this.size / 2, this.vision.y + this.size / 2);
		if(!this.darkVision) {
			ctx.image(brightSight, this.vision.x + this.size / 2, this.vision.y + this.size / 2);
		}
		ctx.blendMode(ctx.BLEND);
	}

	showSelf(ctx = this.ctx) {
		ctx.ellipseMode(ctx.CENTER);
		ctx.noStroke();
		if(this.borderColor !== undefined) {
			ctx.strokeWeight(1);
			ctx.stroke(ctx.color(this.borderColor));
		}
		ctx.fill(ctx.color(this.color));
		ctx.circle(this.x + this.size / 2, this.y + this.size / 2, this.size);
		if(this.image) {
			ctx.imageMode(ctx.CENTER);
			ctx.image(this.image, this.x + this.size / 2, this.y + this.size / 2, this.size * 0.9, this.size * 0.9);
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
		gr.imageMode(gr.CORNER)
		gr.translate(radius, radius);
		gr.fill('rgba(0, 0, 0, 1)');

		gr.beginShape();
		
		let wallsAndObstacles = this.ctx.createGraphics(Token.WALLS.width, Token.WALLS.height);
		wallsAndObstacles.copy(Token.WALLS, 0, 0, Token.WALLS.width, Token.WALLS.height, 0, 0, Token.WALLS.width, Token.WALLS.height);
		for(const o of obstacles) {
			o.show(wallsAndObstacles);
		}
		// Token.WALLS.loadPixels();
		wallsAndObstacles.loadPixels();

		for(let t = 0; t <= this.ctx.TWO_PI; t += (this.ctx.TWO_PI / Token.RAYTRACE_POINTS)) {
			let found = false;
			let increment = 1 / Token.RAYTRACE_STEPS
			for(let r = 0; r <= 1; r += increment) {
				let [relX, relY] = toCartesian(r * radius, t);
				let index = toIndexInPixelArray(this.ctx, this.ctx.int(relX + this.x + this.size / 2), this.ctx.int(relY + this.y + this.size / 2));
				let red = wallsAndObstacles.pixels[index];
				let g =   wallsAndObstacles.pixels[index + 1];
				let b =   wallsAndObstacles.pixels[index + 2];
				let a =   wallsAndObstacles.pixels[index + 3];
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
		gr.endShape(gr.CLOSE);
		gr.pop()

		let rayImg = gr.createImage(gr.width, gr.height)
		rayImg.copy(Token.TERRAIN, this.x + this.size / 2 - radius, this.y + this.size / 2 - radius, gr.width, gr.height, 0, 0, gr.width, gr.height);
		rayImg.mask(Token.CIRCLE_MASK);

		let rayMask = gr.createImage(gr.width, gr.height);
		rayMask.copy(gr, 0, 0, gr.width, gr.height, 0, 0, gr.width, gr.height);
		rayImg.mask(rayMask);

		return rayImg;
	}

	#obtainTerrainViewByCut(radius) {
		let gr = this.vision.vision;

		// if(radius < gr.width) {
		let rayImg = this.ctx.createImage(radius * 2, radius * 2);
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

const toPolar = (x, y) => [Math.sqrt(x * x + y * y), Math.atan2(y / x)];

const toCartesian = (r, t) => [r * Math.cos(t), r * Math.sin(t)];

const toIndexInPixelArray = (ctx, x, y, w = imgW) => ctx.int((y * w + x) * ctx.pixelDensity() * 4);