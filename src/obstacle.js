class Obstacle {
	constructor(
		id,
		x, y,
		w, h,
		color = '#000'
	) {
		this.id = id;
		this.x = x;
		this.y = y;
		this.w = w;
		this.h = h;
		this.color = color;
	}

	show() {
		push();
		rectMode(CORNER);
		noStroke();
		fill(color(this.color));
		rect(this.x, this.y, this.w, this.h);
		pop();
	}
}