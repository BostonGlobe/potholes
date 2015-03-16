var d3 = require('d3');

function log(s) {
	console.log(JSON.stringify(s, null, 4));
}

var master = $('.igraphic-graphic.graphic');

function makePotholeClosuresPerDay() {

	var parseDate = d3.time.format('%Y-%m-%d').parse;
	var data = require('../../../data/output/potholeClosuresPerDay.csv')
		.map(function(datum) {
			return {
				date: parseDate(datum['DATE.CLOSED.R']),
				potholes: +datum.closures
			};
		});

	var outerWidth = 300;
	var outerHeight = 120;
	var margin = {top: 0, right: 0, bottom: 12, left: 0};
	var width = outerWidth - margin.left - margin.right;
	var height = outerHeight - margin.top - margin.bottom;

	var svg = d3.select('.igraphic-graphic.graphic .potholeClosuresPerDay').append('svg')
		.attr({
			width: outerWidth,
			height: outerHeight,
			viewBox: `0 0 ${outerWidth} ${outerHeight}`,
			preserveAspectRatio: 'xMidYMid'
		})
	.append('g')
		.attr('transform', `translate(${margin.left}, ${margin.top})`);

	var x = d3.time.scale()
		.range([0, width])
		.domain([new Date(2013, 0, 1), new Date(2015, 0, 3)]);

	var y = d3.scale.linear()
		.range([height, 0])
		.domain([0, d3.max(data, d => d.potholes)]);

	var area = d3.svg.area()
	    .x(d => x(d.date))
	    .y0(height)
	    .y1(d => y(d.potholes));

	svg.append('path')
		.datum(data)
		.attr('class', 'area')
		.attr('d', area);

	var xAxis = d3.svg.axis()
		.scale(x)
		.orient('bottom')
		.ticks(d3.time.years, 1)
		.tickSize(margin.bottom, margin.bottom);

	svg.append('g')
		.attr('class', 'x axis')
		.attr('transform', `translate(0,${height})`)
		.call(xAxis)
	.selectAll('text')
		.style({
			'text-anchor': 'start'
		})
		.attr({
			y: 5,
			x: 3
		});
}

makePotholeClosuresPerDay();

// function resize() {
// 	$('svg', master).each(function(index) {

// 		var viewBoxParts = this.getAttribute('viewBox').split(' ');
// 		var width = viewBoxParts[2];
// 		var height = viewBoxParts[3];
// 		var aspect = width/height;

// 		var targetWidth = $(this).parent().width();
// 		this.setAttribute('width', targetWidth);
// 		this.setAttribute('height', targetWidth/aspect);
// 	});
// }

// $(window).on('resize', resize);
// resize();












