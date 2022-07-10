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
		ctx = undefined,
		id,
		x, y,
		w, h,
		color = Obstacle.defaultValues.color,
		borderColor = Obstacle.defaultValues.borderColor,
		selected = Obstacle.defaultValues.selected,
		showing = Obstacle.defaultValues.showing,
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
		this.ctx = ctx;
	}

	show(ctx = this.ctx) {
		if(!this.isShowing()) {
			return;
		}

		ctx.push();
		ctx.rectMode(ctx.CORNER);
		ctx.noStroke();
		if(ctx === this.ctx && this.isSelected()) {
			ctx.stroke(this.borderColor);
			ctx.strokeWeight(5);
		}
		ctx.fill(ctx.color(this.color));
		ctx.rect(this.x, this.y, this.w, this.h);
		ctx.pop();
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