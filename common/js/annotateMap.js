var d3 = require('d3');

function log(s) {
	console.log(JSON.stringify(s, null, 4));
}

module.exports = {

	getSettings(annotation, width) {

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

		// clear guides
		$(opts.annotationGuidesSelector).empty();

		// clear texts
		$(opts.annotationTextsSelector).empty();

		// resize guides
		this.svg = d3.select(opts.annotationGuidesSelector)
			.attr({
				width: opts.width,
				height: opts.height
			});

		this.drawCircles();

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
				cx: d => x(d.Longitude),
				cy: d => y(d.Latitude),
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

		var self = this;

		this.svg.append('g')
			.attr('class', 'lines')
			.selectAll('line')
			.data(this.opts.data)
			.enter().append('line')
			.attr({
				x1: d => x(d.Longitude),
				x2: function(d) {
					var settings = self.getSettings(d.annotation, self.opts.width);
					return x(d.Longitude) + settings.dx;
				},
				y1: d => y(d.Latitude),
				y2: d => y(d.Latitude)
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

		d3.select(this.opts.mapLabelsSelector)
			.selectAll('div')
			.data(this.opts.mapLabels)
			.enter().append('div')
			.attr({
				'class': 'map-label'
			})
			.style({
				top: d => `${y(d.lat)}%`,
				left: d => `${x(d.lng)}%`
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

		d3.select(this.opts.annotationTextsSelector)
			.selectAll('div')
			.data(this.opts.data)
			.enter().append('div')
			.attr('class', 'annotation')
			.style({
				'text-align': function(d) {
					var settings = self.getSettings(d.annotation, self.opts.width);
					return settings.flip ? 'right' : 'left';
				},
				width: function(d) {
					var settings = self.getSettings(d.annotation, self.opts.width);
					return `${settings.width}px`;
				},
				top: d => `${y(d.Latitude)}%`,
				left: d => `${x(d.Longitude)}%`,
				'margin-left': function(d) {
					var settings = self.getSettings(d.annotation, self.opts.width);
					return `${settings.dx - (settings.flip ? settings.width : 0)}px`;
				},
				'margin-top': function(d) {
					var settings = self.getSettings(d.annotation, self.opts.width);
					return `${settings.dy}px`;
				}
			})
			.html(self.opts.text);
	}

};







