var d3 = require('d3');
var APDateTime = require('../../../common/js/APDateTime.js');
var colors = require('../../../common/js/colors.js');
var util = require('../../../common/js/util.js');

var Leaflet = require('leaflet');

function log(s) {
	console.log(JSON.stringify(s, null, 4));
}

function moveToFront(element) {
	element.parentNode.insertBefore(element, element.parentNode.firstChild);
}

var masterSelector = '.igraphic-graphic.graphic';
var master = $(masterSelector);

var annotationMarkerMargin = {
	left: 15,
	top: 10
};

function makePotholeClosuresPerDay() {

	var chartSelector = '.potholeClosuresPerDay';

	var outerWidth = $(chartSelector, master).width();
	var outerHeight = outerWidth/3;

	$(chartSelector, master).empty();

	var parseDate = d3.time.format('%Y-%m-%d').parse;
	var data = require('../../../data/output/potholeClosuresPerDay.csv')
		.map(function(datum) {
			return {
				date: parseDate(datum['DATE.CLOSED.R']),
				potholes: +datum.closures
			};
		});

	var margin = {top: 0, right: 0, bottom: 15, left: 0};
	var width = outerWidth - margin.left - margin.right;
	var height = outerHeight - margin.top - margin.bottom;

	var svg = d3.select(`${masterSelector} ${chartSelector}`).append('svg')
		.attr({
			width: outerWidth,
			height: outerHeight
		});

	var g = svg.append('g')
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

	g.append('path')
		.datum(data)
		.attr('class', 'area')
		.attr('d', area);

	var xAxis = d3.svg.axis()
		.scale(x)
		.orient('bottom')
		.ticks(d3.time.years, 1)
		.tickSize(margin.bottom - 2, margin.bottom - 2);

	g.append('g')
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

	var annotationPoints = _.chain(data).sortBy('potholes').reverse().take(1).value();

	g.append('g')
		.attr({
			'class': 'annotationMarkers'
		})
		.selectAll('.annotationMarker')
		.data(annotationPoints)
	.enter().append('line')
		.attr({
			'class': 'dotted',
			x1: d => x(d.date) + 5,
			x2: d => x(d.date) + annotationMarkerMargin.left,
			y1: d => y(d.potholes) + annotationMarkerMargin.top,
			y2: d => y(d.potholes) + annotationMarkerMargin.top
		});

	d3.select(`${masterSelector} ${chartSelector}`).append('div')
		.attr('class', 'annotations')
		.selectAll('.annotation')
		.data(annotationPoints)
	.enter().append('div')
		.attr({
			'class': 'annotation'
		})
		.style({
			left: d => `${100 * (x(d.date) + annotationMarkerMargin.left)/x.range()[1]}%`,
			top: d => `${100 * (y(d.potholes))/y.range()[0]}%`
		})
		.html(function(d) {
			return `<div><span class='date'>${APDateTime.date(d.date, true)}</span></div><div><span class='potholes'>${d.potholes} potholes</span></div>`;
		});
}

function makeYearlyIncreaseByDistrict() {

	var barMargin = 2;
	var barHeight = 20 + barMargin*2;
	var data = _.chain(require('../../../data/output/yearlyIncreaseByDistrict.csv'))
		.map(function(d) {
			return {
				district: d.district.replace('Rest', 'Other 9 districts combined'),
				increase: +d.increase
			};
		})
		.sortBy('district')
		.value();

	var chartSelector = '.yearlyIncreaseByDistrict';

	var margin = {top: 0, right: 0, bottom: 0, left: 155};

	var outerWidth = $(chartSelector, master).width();
	var outerHeight = data.length * barHeight + margin.top + margin.bottom;

	$(chartSelector, master).empty();

	var width = outerWidth - margin.left - margin.right;
	var height = outerHeight - margin.top - margin.bottom;

	var svg = d3.select(`${masterSelector} ${chartSelector}`).append('svg')
		.attr({
			width: outerWidth,
			height: outerHeight
		});

	var g = svg.append('g')
		.attr('transform', `translate(${margin.left}, ${margin.top})`);

	var x = d3.scale.linear()
		.range([0, width])
		.domain([0, d3.max(data, d => d.increase)]);

	var bars = g.append('g')
		.attr('class', 'bars')
		.selectAll('.bar')
		.data(data)
	.enter().append('g')
		.attr({
			'class': 'bar',
			'transform': (d, i) => `translate(0, ${i*barHeight})`
		});

	bars.append('rect')
		.attr({
			width: d => x(d.increase),
			height: barHeight - barMargin*2
		})
		.style({
			fill: (d, i) => colors.array.secondary[i]
		});

	bars.append('text')
		.attr({
			'class': 'name',
			x: -7,
			y: barHeight / 2,
			dy: '0.25em'
		})
		.style({
			'font-size': `${barHeight/2}px`,
			'text-anchor': 'end'
		})
		.text(d => d.district);

	bars.append('text')
		.attr({
			'class': 'number',
			x: d => x(d.increase),
			y: barHeight / 2,
			dx: '-0.25em',
			dy: '0.25em'
		})
		.style({
			'font-size': `${barHeight/2}px`,
			'text-anchor': 'end'
		})
		.text(d => util.numberWithCommas(d.increase));
}

function makeWeeklyClosuresForDistrict2() {

	var chartSelector = '.weeklyClosuresForDistrict2';

	var outerWidth = $(chartSelector, master).width();
	var outerHeight = outerWidth/3;

	$(chartSelector, master).empty();

	var parseDate = d3.time.format('%Y-%m-%d').parse;
	var data = require('../../../data/output/weeklyClosuresForDistrict2.csv')
		.map(function(datum) {
			return {
				date: parseDate(datum.WEEK),
				potholes: +datum.n
			};
		});

	var margin = {top: 0, right: 0, bottom: 15, left: 0};
	var width = outerWidth - margin.left - margin.right;
	var height = outerHeight - margin.top - margin.bottom;

	var svg = d3.select(`${masterSelector} ${chartSelector}`).append('svg')
		.attr({
			width: outerWidth,
			height: outerHeight
		});

	var g = svg.append('g')
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

    var line = d3.svg.line()
    	.x(d => x(d.date))
	    .y(d => y(d.potholes));

	var xAxis = d3.svg.axis()
		.scale(x)
		.orient('bottom')
		.ticks(d3.time.years, 1)
		.tickSize(margin.bottom - 2, margin.bottom - 2);

	var yTicks = [100, 200];

	var yAxis = d3.svg.axis()
		.scale(y)
		.orient('left')
		.tickValues(yTicks);

	g.append('path')
		.datum(data)
		.attr('class', 'area fill')
		.attr('d', area);

	g.append('g')
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

	g.append('g')
		.attr('class', 'gridlines')
		.selectAll('.line')
		.data(yTicks)
	.enter().append('line')
		.attr({
			x1: 0,
			x2: x.range()[1],
			y1: d => y(d),
			y2: d => y(d)
		});

	g.append('g')
		.attr('class', 'y axis')
		.call(yAxis)
	.selectAll('text')
		.style({
			'text-anchor': 'start'
		})
		.attr({
			y: 0,
			x: 0
		});

	g.append('path')
		.datum(data)
		.attr('class', 'area stroke')
		.attr('d', line);

	var annotationPoints = _.chain(data).sortBy('potholes').reverse().take(1).value();

	g.append('g')
		.attr({
			'class': 'annotationMarkers'
		})
		.selectAll('.annotationMarker')
		.data(annotationPoints)
	.enter().append('line')
		.attr({
			'class': 'dotted',
			x1: d => x(d.date) + 3,
			x2: d => x(d.date) + annotationMarkerMargin.left,
			y1: d => y(d.potholes) + annotationMarkerMargin.top,
			y2: d => y(d.potholes) + annotationMarkerMargin.top
		});

	d3.select(`${masterSelector} ${chartSelector}`).append('div')
		.attr('class', 'annotations')
		.selectAll('.annotation')
		.data(annotationPoints)
	.enter().append('div')
		.attr({
			'class': 'annotation'
		})
		.style({
			left: d => `${100 * (x(d.date) + annotationMarkerMargin.left)/x.range()[1]}%`,
			top: d => `${100 * (y(d.potholes))/y.range()[0]}%`
		})
		.html(function(d) {
			return `<div><span class='date'>${APDateTime.date(d.date, true)} - 21</span></div><div><span class='potholes'>${d.potholes} potholes</span></div>`;
		});
}

function makeBestDayForDistrict2() {

	var chartSelector = '.bestDayForDistrict2';

	var outerWidth = $(chartSelector, master).width();
	var outerHeight = 1464/1200*outerWidth;

	$(chartSelector, master).empty();

	var annotationData = [
		{
			row: 1,
			text: 'Lorem ipsum Eu adipisicing proident voluptate dolor dolore veniam Ut.',
			left: 0,
			top: 63,
			align: 'right',
			width: 34
		},
		{
			row: 8,
			text: 'Lorem ipsum Culpa in in Ut laboris nostrud laboris et pariatur ut in sunt nostrud esse laborum.',
			left: 60,
			top: 78,
			align: 'left',
			width: 38
		}
	];

	var data = _.chain(require('../../../data/output/bestDayForDistrict2_2014-06-20.csv'))
		.map(function(datum) {

			var result = {
				lat: +datum.LATITUDE,
				lng: +datum.LONGITUDE,
				potholes: +datum.n,
				row: +datum.row
			};

			var match = _.find(annotationData, {row: result.row});

			if (match) {
				result.annotation = match;
			}

			return result;
		})
		.sortBy('potholes')
		.reverse()
		.value();

	var margin = {top: 0, right: 0, bottom: 0, left: 0};
	var width = outerWidth - margin.left - margin.right;
	var height = outerHeight - margin.top - margin.bottom;

	var svg = d3.select(`${masterSelector} ${chartSelector}`).append('svg')
		.attr({
			width: outerWidth,
			height: outerHeight
		});

	d3.select(`${masterSelector} ${chartSelector}`).append('img')
		.attr({
			'class': 'baselayer',
			'src': 'http://cache.boston.com/multimedia/graphics/projectFiles/2015/potholes/img/district2_1200w.jpg'
		});

	var g_circles = svg.append('g')
		.attr({
			'class': 'circles',
			transform: `translate(${margin.left}, ${margin.top})`
		});

	var x = d3.scale.linear()
		.range([0, width])
		.domain([-71.1419, -71.0921]);

	var y = d3.scale.linear()
		.range([height, 0])
		.domain([42.2823, 42.3249]);

	var radius = d3.scale.sqrt()
		.domain([0, d3.max(data, d => d.potholes)])
		.range([0, width/30]);

	var labels = [
		{
			name: 'Jamaica Plain',
			lng: -71.1203,
			lat: 42.30985,
			rank: 1,
			dx: 0,
			dy: -1
		},
		{
			name: 'Forest Hills',
			lng: -71.112,
			lat: 42.2968,
			rank: 1,
			dx: 0,
			dy: 0
		},
		{
			name: 'Roslindale',
			lng: -71.1245,
			lat: 42.29125,
			rank: 1,
			dx: 0,
			dy: 4.5
		},
		// {
		// 	name: 'Mount Hope',
		// 	lng: -71.1245,
		// 	lat: 42.283455,
		// 	rank: 1,
		// 	dx: 0,
		// 	dy: 0
		// },
		// {
		// 	name: 'Clarendon Hills',
		// 	lng: -71.1231,
		// 	lat: 42.2751,
		// 	rank: 1,
		// 	dx: 0,
		// 	dy: 0
		// },
		{
			name: 'Roslindale Village',
			lng: -71.1303,
			lat: 42.2875,
			rank: 2,
			dx: -0,
			dy: 3
		},
		{
			name: 'Arnold Arboretum',
			lng: -71.1226,
			lat: 42.29945,
			rank: 2,
			dx: -5,
			dy: 0
		},
		{
			name: 'Olmsted Park',
			lng: -71.1187,
			lat: 42.3225,
			rank: 2,
			dx: 0,
			dy: 0
		}
	];

	g_circles.selectAll('circle')
		.data(data)
		.enter().append('circle')
		.attr({
			cx: d => x(d.lng),
			cy: d => y(d.lat),
			r: d => radius(d.potholes),
			fill: colors.named.secondary.brick,
			'fill-opacity': 0.45,
			stroke: function(d) {
				return d.text ? 'black' : d3.rgb(colors.named.secondary.brick).darker();
			}
		})
		.on('mouseover', log);

	d3.select(`${masterSelector} ${chartSelector}`).append('div')
		.attr('class', 'labels')
		.selectAll('div')
		.data(labels)
		.enter().append('div')
		.attr({
			'class': d=> `label rank${d.rank}`
		})
		.style({
			left: d => `${(100 * x(d.lng)/x.range()[1]) + d.dx}%`,
			top: d => `${(100 * y(d.lat)/y.range()[0]) + d.dy}%`
		})
		.html(d => `<span>${d.name}</span>`);

	var annotationPoints = data.filter(d => d.annotation);

	var g_annotations = svg.append('g')
		.attr({
			'class': 'annotationMarkers',
			transform: `translate(${margin.left}, ${margin.top})`
		});

	function getCoords(d) {

		var origin = {
			x: x(d.lng),
			y: y(d.lat)
		};

		var width = x.range()[1]*d.annotation.width/100;

		var coords = {
			x1: x.range()[1]*d.annotation.left/100 + (d.annotation.align === 'right' ? width : 0),
			x2: origin.x,
			y1: y.range()[0]*d.annotation.top/100,
			y2: origin.y
		};

		var h = Math.sqrt(Math.pow(coords.x2-coords.x1,2) + Math.pow(coords.y2-coords.y1,2));
		var diff = h - radius(d.potholes);

		coords.h = h;
		coords.diff = diff;

		return coords;
	}

	g_annotations.selectAll('line')
		.data(annotationPoints)
		.enter().append('line')
		.attr({
			'class': 'solid',
			x1: d => getCoords(d).x1,
			x2: d => getCoords(d).x2,
			y1: d => getCoords(d).y1,
			y2: d => getCoords(d).y2
		})
		.style({
			'stroke-dasharray': function(d) {
				var coords = getCoords(d);
				var stroke = `${coords.diff},${coords.h}`;
				return stroke;
			}
		});

	d3.select(`${masterSelector} ${chartSelector}`).append('div')
		.attr('class', 'annotations')
		.selectAll('.annotation')
		.data(annotationPoints)
	.enter().append('div')
		.attr({
			'class': d => `annotation map ${d.annotation.align}`
		})
		.style({
			left: d => `${d.annotation.left}%`,
			top: d => `${d.annotation.top}%`,
			'text-align': d => d.annotation.align,
			width: d => `${d.annotation.width}%`
		})
		.html(function(d) {
			return `<div><span class='number'>${d.potholes} potholes</span></div><div><span class='text'>${d.annotation.text}</span></div>`;
		});
}

function makeClusters() {

	var chartSelector = `.clusters`;

	var outerWidth = $(chartSelector, master).width();
	var outerHeight = 1316/1200*outerWidth;

	$(chartSelector, master).empty();

	var data = require('../../../data/output/clustersIn2014.csv')
		.map(function(datum) {
			return {
				lat: +datum.LATITUDE,
				lng: +datum.LONGITUDE,
				potholes: +datum.n,
				district: datum.district
					.replace('Rest', 'Other districts')
					.replace(/^(\d)/, 'District $1')
			};
		});

	var districtsAndCount = _.chain(data)
		.pluck('district')
		.countBy()
		.map(function(v, i) {
			return {
				district: i,
				count: v
			};
		})
		.sortBy('count')
		.reverse()
		.value();

	var orderedDistricts = _.pluck(districtsAndCount, 'district');

	var margin = {top: 0, right: 0, bottom: 0, left: 0};
	var width = outerWidth - margin.left - margin.right;
	var height = outerHeight - margin.top - margin.bottom;

	var svg = d3.select(`${masterSelector} ${chartSelector}`).append('svg')
		.attr({
			width: outerWidth,
			height: outerHeight
		});

	d3.select(`${masterSelector} ${chartSelector}`).append('img')
		.attr({
			'class': 'baselayer',
			'src': 'http://cache.boston.com/multimedia/graphics/projectFiles/2015/potholes/img/boston_1200w.jpg'
		});

	function makeCircles() {
	
		var x = d3.scale.linear()
			.range([0, width])
			.domain([-71.201, -70.9779]);

		var y = d3.scale.linear()
			.range([height, 0])
			.domain([42.2211, 42.4022]);

		var radius = d3.scale.sqrt()
			.range([0, width/30])
			.domain([0, d3.max(data, d => d.potholes)]);

		svg.append('g')
			.attr({
				'class': 'circles',
				transform: `translate(${margin.left}, ${margin.top})`
			})
			.selectAll('circle')
			.data(data)
			.enter().append('circle')
			.attr({
				cx: d => x(d.lng),
				cy: d => y(d.lat),
				r: d => radius(d.potholes),
				fill: d => colors.array.secondary[_.indexOf(orderedDistricts, d.district)],
				'fill-opacity': 0.45,
				stroke: d => d3.rgb(colors.array.secondary[_.indexOf(orderedDistricts, d.district)]).darker()
			});
	}
	makeCircles();

	function makeBars() {

		var outerWidthExtent = [300, 600];

		// Make the text size based on the outer width
		var textScale = d3.scale.linear()
			.range([11, 12])
			.domain(outerWidthExtent);
		var textSize = textScale(outerWidth);

		// Make the bar margin based on text size
		var barMargin = textSize/8;

		// Make the bar height based on text size
		var barHeight = textSize * 1.2 + barMargin*2;

		// Make the top margin based on text size
		var topMarginScale = d3.scale.linear().range([5, 15]).domain(outerWidthExtent);
		var topMargin = topMarginScale(outerWidth);

		var leftMarginScale = d3.scale.linear().range([80, 100]).domain(outerWidthExtent);
		var leftMargin = leftMarginScale(outerWidth);

		var maxBarWidth = width*0.55 - leftMargin;

		var x = d3.scale.linear()
			.range([0, maxBarWidth])
			.domain([0, d3.max(districtsAndCount, d => d.count)]);

		var bars = svg.append('g')
			.attr({
				'class': 'bars',
				transform: `translate(${leftMargin}, ${topMargin})`
			})
			.selectAll('rect')
			.data(districtsAndCount)
			.enter().append('g')
			.attr({
				'class': 'bar',
				transform: (d,i) => `translate(0, ${i*barHeight})`
			});

		bars.append('rect')
			.attr({
				width: d => x(d.count),
				height: barHeight - barMargin*2
			})
			.style({
				fill: d => colors.array.secondary[_.indexOf(orderedDistricts, d.district)]
			});

		bars.append('text')
			.attr({
				'class': 'name',
				x: -7,
				y: textSize
			})
			.style({
				'font-size': `${textSize}px`,
				'text-anchor': 'end'
			})
			.text(d => d.district);

		bars.append('text')
			.attr({
				'class': 'number',
				x: d => x(d.count),
				y: textSize,
				dx: '-0.25em'
			})
			.style({
				'font-size': `${textSize}px`,
				'text-anchor': 'end'
			})
			.text(d => util.numberWithCommas(d.count));	
	}
	makeBars();

}

var thingsHaveBeenDrawn = false;

function resize() {

	makePotholeClosuresPerDay();
	makeYearlyIncreaseByDistrict();
	makeWeeklyClosuresForDistrict2();
	makeBestDayForDistrict2();
	makeClusters();
}

$(window).on('resize', resize);
resize();