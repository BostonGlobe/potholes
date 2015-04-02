var d3 = require('d3');

function log(s) {
	console.log(JSON.stringify(s, null, 4));
}

module.exports = {

	getCoords(d, x, y, radius) {

		var origin = {
			x: x(d.lng),
			y: y(d.lat)
		};

		var settings = this.getAnnotationBreakpointSettings(d.annotation, this.opts.width);

		var coords = {
			x1: origin.x + settings.dx,
			x2: origin.x,
			y1: origin.y,
			y2: origin.y
		};

		var h = Math.sqrt(Math.pow(coords.x2-coords.x1,2) + Math.pow(coords.y2-coords.y1,2));
		var diff = h - radius(d[this.opts.datumRadiusProperty]);

		coords.h = h;
		coords.diff = diff;

		return coords;
	},

	getAnnotationBreakpointSettings(annotation, width) {

		var match = _.chain(annotation.breakpoints)
			.keys()
			.map(d => +d)
			.filter(d => d <= width)
			.sortBy()
			.reverse()
			.first()
			.value();

		return annotation.breakpoints[match];
	},

	draw(opts) {

		this.opts = opts;

		var annotationGuidesSelector = `${this.opts.masterSelector} .annotation-guides`;

		// clear guides
		$(annotationGuidesSelector).empty();

		// clear texts
		$(`${this.opts.masterSelector} .annotation-texts`).empty();

		// resize guides
		this.svg = d3.select(annotationGuidesSelector)
			.attr({
				width: opts.width,
				height: opts.height
			});

		if (!this.opts.datumRadiusScale) {
			this.drawCircles();
		}

		this.drawLines();

		this.drawText();

		this.drawMapLabels();

	},

	drawCircles() {

		var x = d3.scale.linear()
			.range([0, this.opts.width])
			.domain([this.opts.bounds.W, this.opts.bounds.E]);

		var y = d3.scale.linear()
			.range([this.opts.height, 0])
			.domain([this.opts.bounds.S, this.opts.bounds.N]);

		this.svg.append('g')
			.attr('class', 'circles')
			.selectAll('circle')
			.data(this.opts.data)
			.enter().append('circle')
			.attr({
				cx: d => x(d.lng),
				cy: d => y(d.lat),
				r: 3
			});
	},

	drawLines() {

		var x = d3.scale.linear()
			.range([0, this.opts.width])
			.domain([this.opts.bounds.W, this.opts.bounds.E]);

		var y = d3.scale.linear()
			.range([this.opts.height, 0])
			.domain([this.opts.bounds.S, this.opts.bounds.N]);

		var radius = this.opts.datumRadiusScale;

		var self = this;

		this.svg.append('g')
			.attr('class', 'lines')
			.selectAll('line')
			.data(this.opts.data)
			.enter().append('line')
			.attr({
				x1: d => self.getCoords(d, x, y, radius).x1,
				x2: d => self.getCoords(d, x, y, radius).x2,
				y1: d => self.getCoords(d, x, y, radius).y1,
				y2: d => self.getCoords(d, x, y, radius).y2
			})
			.style({
				'stroke-dasharray': function(d) {
					var coords = self.getCoords(d, x, y, radius);
					var stroke = `${coords.diff},${coords.h}`;
					return stroke;
				}
			});

	},

	drawMapLabels() {

		var x = d3.scale.linear()
			.range([0, 100])
			.domain([this.opts.bounds.W, this.opts.bounds.E]);

		var y = d3.scale.linear()
			.range([100, 0])
			.domain([this.opts.bounds.S, this.opts.bounds.N]);

		var self = this;

		d3.select(`${self.opts.masterSelector} .map-labels`)
			.selectAll('div')
			.data(this.opts.mapLabels)
			.enter().append('div')
			.attr({
				'class': d => `map-label rank${d.rank}`
			})
			.style({
				top: d => `${y(d.lat) + d.dy}%`,
				left: d => `${x(d.lng) + d.dx}%`
			})
			.append('span')
			.attr('class', 'label')
			.html(d => d.html);

	},

	drawText() {

		var x = d3.scale.linear()
			.range([0, 100])
			.domain([this.opts.bounds.W, this.opts.bounds.E]);

		var y = d3.scale.linear()
			.range([100, 0])
			.domain([this.opts.bounds.S, this.opts.bounds.N]);

		var self = this;

		d3.select(`${self.opts.masterSelector} .annotation-texts`)
			.selectAll('div')
			.data(this.opts.data)
			.enter().append('div')
			.attr('class', 'annotation')
			.style({
				'text-align': function(d) {
					var settings = self.getAnnotationBreakpointSettings(d.annotation, self.opts.width);
					return settings.flip ? 'right' : 'left';
				},
				width: function(d) {
					var settings = self.getAnnotationBreakpointSettings(d.annotation, self.opts.width);
					return `${settings.width}px`;
				},
				top: d => `${y(d.lat)}%`,
				left: d => `${x(d.lng)}%`,
				'margin-left': function(d) {
					var settings = self.getAnnotationBreakpointSettings(d.annotation, self.opts.width);
					return `${settings.dx - (settings.flip ? settings.width : 0)}px`;
				},
				'margin-top': function(d) {
					var settings = self.getAnnotationBreakpointSettings(d.annotation, self.opts.width);
					return `${settings.dy}px`;
				}
			})
			.html(self.opts.text);
	}

};