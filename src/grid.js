class Grid {
	static FEET_PER_SQUARE = 5;

	constructor(
		ctx = undefined,
		x = 0,
		y = 0,
		width = 0,
		height = 0,
		squareSize = 50,
		snapToGrid = false,
		color = "#696969"
	) {
		this.x = x;
		this.y = y;
		this.width = width;
		this.height = height;
		this.squareSize = squareSize;
		this.snapToGrid = snapToGrid;
		this.color = color;
		this.ctx = ctx;
	}

	show(ctx = this.ctx) {
		if(this.width === 0 && this.height === 0) {
			return;
		}

		const limitH = this.width + this.x;
		const limitW = this.height + this.y;

		ctx.stroke(this.color);
		ctx.strokeWeight(1);
		// Horizontal lines
		for(let i = this.y; i < limitW && this.width !== 0; i += this.squareSize) {
			ctx.line(i, this.x, i, limitH);
		}
		ctx.line(limitW, this.x, limitW, limitH);

		// Vertical lines
		for(let i = this.x; i < limitH && this.height !== 0; i += this.squareSize) {
			ctx.line(this.y, i, limitW, i);
		}
		ctx.line(this.y, limitH, limitW, limitH);
	}

	squareAt(x, y) {
		return [this.ctx.int(x / this.squareSize), this.ctx.int(y / this.squareSize)];
	}

	xywhOfSquare(row, column) {
		return [
			row * this.squareSize,
			column * this.squareSize,
			this.squareSize,
			this.squareSize
		];
	}

	xywhOfSquareFromCoords(x, y) {
		return this.xywhOfSquare(...this.squareAt(x, y))
	}
}