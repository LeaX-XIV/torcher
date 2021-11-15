class Grid {
	static FEET_PER_SQUARE = 5;

	constructor(x = 0, y = 0, width = -1, height = -1, squareSize = 50, color = "#696969") {
		this.x = x;
		this.y = y;
		this.width = width;
		this.height = height;
		this.squareSize = squareSize;
		this.color = color;
	}

	show() {
		let limitH = this.height === -1 ? H : (this.height + this.x);
		let limitW = this.width === -1 ? W : (this.width + this.y);

		stroke(this.color);
		strokeWeight(1);
		// Horizontal lines
		for(let i = this.y; i < limitW; i += this.squareSize) {
			line(i, this.x, i, limitH);
		}
		line(limitW, this.x, limitW, limitH);

		// Vertical lines
		for(let i = this.x; i < limitH; i += this.squareSize) {
			line(this.y, i, limitW, i);
		}
		line(this.y, limitH, limitW, limitH);
	}
}