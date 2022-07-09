class Obstacle {
	static get defaultValues() {
		return {
			color: '#000',
			borderColor: '#F7F73DAA',
			selected: false,
			showing: true,
		};
	}

	constructor(
		id,
		x, y,
		w, h,
		color = Obstacle.defaultValues.color,
		borderColor = Obstacle.defaultValues.borderColor,
		selected = Obstacle.defaultValues.selected,
		showing = Obstacle.defaultValues.showing
	) {
		this.id = id;
		this.x = x;
		this.y = y;
		this.w = w;
		this.h = h;
		this.color = color;
		this.borderColor = borderColor;
		this.selected = selected;
		this.showing = showing;
	}

	show(graphics = ctx) {
		if(!this.isShowing()) {
			return;
		}

		graphics.push();
		graphics.rectMode(CORNER);
		graphics.noStroke();
		if(graphics === ctx && this.isSelected()) {
			graphics.stroke(this.borderColor);
			graphics.strokeWeight(5);
		}
		graphics.fill(color(this.color));
		graphics.rect(this.x, this.y, this.w, this.h);
		graphics.pop();
	}

	isSelected() {
		return this.selected;
	}

	select() {
		this.selected = true;
	}

	unselect() {
		this.selected = false;
	}

	isShowing() {
		return this.showing;
	}

	doShow() {
		this.showing = true;
	}

	doUnshow() {
		this.showing = false;
	}

	intersect(x, y) {
		return x >= this.x
			&& x <= this.x + this.w
			&& y >= this.y
			&& y <= this.y + this.h;
	}
}