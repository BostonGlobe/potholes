var d3 = require('d3');

function log(s) {
	console.log(JSON.stringify(s, null, 4));
}

var master = $('.igraphic-graphic.graphic');

function makePotholeClosuresPerDay() {

	var potholeClosuresPerDay = require('../../../data/output/potholeClosuresPerDay.csv');

	var width = 300;
	var height = 100;

	var svg = d3.select('.igraphic-graphic.graphic .potholeClosuresPerDay').append('svg')
		.attr({
			width: width,
			height: height,
			viewBox: `0 0 ${width} ${height}`,
			preserveAspectRatio: 'xMidYMid'
		});

	svg.selectAll('circle')
		.data(_.take(potholeClosuresPerDay, 3))
		.enter()
		.append('circle')
		.attr({
			cx: function(d, i) {
				return (i*5) + 25;
			},
			cy: height/2,
			r: function(d, i) {
				return i;
			}
		});
}

makePotholeClosuresPerDay();

function resize() {
	$('svg', master).each(function(index) {

		var viewBoxParts = this.getAttribute('viewBox').split(' ');
		var width = viewBoxParts[2];
		var height = viewBoxParts[3];
		var aspect = width/height;

		var targetWidth = $(this).parent().width();
		this.setAttribute('width', targetWidth);
		this.setAttribute('height', targetWidth/aspect);
	});
}

$(window).on('resize', resize);
resize();












