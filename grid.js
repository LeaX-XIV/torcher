class Grid {
	static FEET_PER_SQUARE = 5;

	constructor(x = 0, y = 0, width = 0, height = 0, squareSize = 50, color = "#696969") {
		this.x = x;
		this.y = y;
		this.width = width;
		this.height = height;
		this.squareSize = squareSize;
		this.color = color;
	}

	show() {
		if(this.width === 0 && this.height === 0) {
			return;
		}

		const limitH = width + this.x;
		const limitW = height + this.y;

		stroke(this.color);
		strokeWeight(1);
		// Horizontal lines
		for(let i = this.y; i < limitW && this.width !== 0; i += this.squareSize) {
			line(i, this.x, i, limitH);
		}
		line(limitW, this.x, limitW, limitH);

		// Vertical lines
		for(let i = this.x; i < limitH && this.height !== 0; i += this.squareSize) {
			line(this.y, i, limitW, i);
		}
		line(this.y, limitH, limitW, limitH);

	}
}