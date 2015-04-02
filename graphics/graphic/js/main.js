var d3 = require('d3');
var APDateTime = require('../../../common/js/APDateTime.js');
var colors = require('../../../common/js/colors.js');
var util = require('../../../common/js/util.js');
var annotateMap = require('../../../common/js/annotateMap.js');
var latLngDistance = require('../../../common/js/latLngDistance.js');

var Leaflet = require('leaflet');

function log(s) {
	console.log(JSON.stringify(s, null, 4));
}

	// g_annotations.selectAll('line')
	// 	.data(annotationPoints)
	// 	.enter().append('line')
	// 	.attr({
	// 		'class': 'solid',
	// 		x1: d => getCoords(d, x, y, radius).x1,
	// 		x2: d => getCoords(d, x, y, radius).x2,
	// 		y1: d => getCoords(d, x, y, radius).y1,
	// 		y2: d => getCoords(d, x, y, radius).y2
	// 	})
	// 	.style({
	// 		'stroke-dasharray': function(d) {
	// 			var coords = getCoords(d, x, y, radius);
	// 			var stroke = `${coords.diff},${coords.h}`;
	// 			return stroke;
	// 		}
	// 	});

function getCoords(d, x, y, radius) {

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

var masterSelector = '.igraphic-graphic.graphic';
var master = $(masterSelector);

var annotationMarkerMargin = {
	left: 5,
	top: 10
};

function makePotholeClosuresPerDay() {

	var chartSelector = '.potholeClosuresPerDay';

	var outerWidth = $(chartSelector, master).width();
	var outerHeight = Math.min(outerWidth/2, 150);

	$(chartSelector, master).empty();

	var parseDate = d3.time.format('%Y-%m-%d').parse;

	var annotationData = [
		{
			date: '2013-03-14',
			annotation: {
				text: '. Highest day in Menino’s final year in office.',
				goRight: true,
				width: '4em'
			}
		},
		{
			date: '2014-01-30',
			annotation: {
				text: '. Highest day in 2014.',
				goRight: true,
				width: '6em'
			}
		},
		{
			date: '2014-01-06',
			annotation: {
				text: '. Walsh takes office.',
				width: '4em'
			}
		}
	];

	var data = require('../../../data/output/potholeClosuresPerDay.csv')
		.map(function(datum) {

			var result = {
				date: parseDate(datum['DATE.CLOSED.R']),
				potholes: +datum.closures
			};

			var match = _.find(annotationData, {date: datum['DATE.CLOSED.R']});

			if (match) {
				result.annotation = match.annotation;
			}

			return result;
		});

	var margin = {top: 30, right: 0, bottom: 15, left: 0};
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

	g.append('g')
		.selectAll('rect')
		.data(data)
		.enter().append('rect')
		.attr({
			x: d => x(d.date),
			y: d => y(d.potholes),
			width: x.range()[1]/data.length,
			height: d => height - y(d.potholes)
		});

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

	var annotationPoints = data.filter(d => d.annotation);

	var g_annotations = svg.append('g')
		.attr({
			'class': 'annotationMarkers',
			transform: `translate(${margin.left}, ${margin.top})`
		})
		.selectAll('.annotationMarker')
		.data(annotationPoints)
	.enter().append('g');

	g_annotations.append('line')
		.attr({
			'class': 'dotted',
			x1: d => x(d.date) + x.range()[1]/data.length/2,
			x2: d => x(d.date) + x.range()[1]/data.length/2,
			y1: d => y(d.potholes),
			y2: -1*margin.top + 2
		});

	g_annotations.append('line')
		.attr({
			'class': 'dotted',
			x1: d => x(d.date) + x.range()[1]/data.length/2,
			x2: d => x(d.date) + x.range()[1]/data.length/2 + (d.annotation.goRight ? 1 : -1)*annotationMarkerMargin.left,
			y1: -1*margin.top + 2,
			y2: -1*margin.top + 2
		});

	g_annotations.append('circle')
		.attr({
			cx: d => x(d.date) + x.range()[1]/data.length/2,
			cy: d => y(d.potholes),
			r: 2
		});

	d3.select(`${masterSelector} ${chartSelector}`).append('div')
		.attr('class', 'annotations')
		.selectAll('.annotation')
		.data(annotationPoints)
	.enter().append('div')
		.attr({
			'class': d => `annotation ${d.annotation.goRight ? '' : 'goLeft'}`
		})
		.style({
			left: d => `${100 * (x(d.date) + x.range()[1]/data.length/2 + (d.annotation.goRight ? 1 : -1)*annotationMarkerMargin.left)/x.range()[1]}%`,
			top: d => 0,
			width: d => d.annotation.width || 'auto'
		})
		.html(function(d) {
			return `<div><span class='date'>${APDateTime.date(d.date, true)}</span></div><div><span class='potholes'>${d.potholes} potholes${d.annotation.text}</span></div>`;
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
	var outerHeight = Math.min(outerWidth/2, 150);

	$(chartSelector, master).empty();

	var annotationData = [
		{
			date: '2014-06-15',
			annotation: {
				text: '. Highest week in 2014.',
				goRight: true,
				width: '5em'
			}
		},
		{
			date: '2014-03-30',
			annotation: {
				text: ', including 47 on a single day in a city-owned parking lot.',
				width: '9em'
			}
		}
	];

	var parseDate = d3.time.format('%Y-%m-%d').parse;
	var data = require('../../../data/output/weeklyClosuresForDistrict2.csv')
		.map(function(datum) {

			var result = {
				date: parseDate(datum.WEEK),
				potholes: +datum.n
			};

			var match = _.find(annotationData, {date: datum.WEEK});

			if (match) {
				result.annotation = match.annotation;
			}

			return result;

		});

	var margin = {top: 30, right: 0, bottom: 15, left: 0};
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
		.y1(d => y(d.potholes))
		.interpolate('step');

    var line = d3.svg.line()
    	.x(d => x(d.date))
		.y(d => y(d.potholes))
		.interpolate('step');

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

	var annotationPoints = data.filter(d => d.annotation);

	var g_annotations = svg.append('g')
		.attr({
			'class': 'annotationMarkers',
			transform: `translate(${margin.left}, ${margin.top})`
		})
		.selectAll('.annotationMarker')
		.data(annotationPoints)
	.enter().append('g');

	g_annotations.append('line')
		.attr({
			'class': 'dotted',
			x1: d => x(d.date),
			x2: d => x(d.date),
			y1: d => y(d.potholes),
			y2: -1*margin.top + 2
		});

	g_annotations.append('line')
		.attr({
			'class': 'dotted',
			x1: d => x(d.date),
			x2: d => x(d.date) + (d.annotation.goRight ? 1 : -1)*annotationMarkerMargin.left,
			y1: -1*margin.top + 2,
			y2: -1*margin.top + 2
		});

	d3.select(`${masterSelector} ${chartSelector}`).append('div')
		.attr('class', 'annotations')
		.selectAll('.annotation')
		.data(annotationPoints)
	.enter().append('div')
		.attr({
			'class': d => `annotation ${d.annotation.goRight ? '' : 'goLeft'}`
		})
		.style({
			left: d => `${100 * (x(d.date) + (d.annotation.goRight ? 1 : -1)*annotationMarkerMargin.left)/x.range()[1]}%`,
			top: d => 0,
			width: d => d.annotation.width || 'auto'
		})
		.html(function(d) {
			return `<div><span class='date'>Week of ${APDateTime.date(d.date, true)}</span></div><div><span class='potholes'>${d.potholes} potholes${d.annotation.text}</span></div>`;
		});
}

function makeBestDayForDistrict2() {

	var chartSelector = '.bestDayForDistrict2';

	var width = $(chartSelector, master).width();
	var height = 1464/1200*width;

	// create the map skeleton
	var skeleton = `
		<div class='baselayer'>
			<img src='http://cache.boston.com/multimedia/graphics/projectFiles/2015/potholes/img/district2_1200w.jpg' />
		</div>
		<div class='map-labels'></div>
		<svg class='map'></svg>
		<svg class='annotation-guides'></svg>
		<div class='annotation-texts'></div>
		<div class='map-distance-legend'></div>
	`;

	// clear container and rerender html
	$(chartSelector, master)
		.empty()
		.html(skeleton);

	var annotationData = [
		{
			row: 1,
			text: 'Intersection of Washington Street and Franklin Place',
            "breakpoints": {
                "1": {
                	"flip": true,
                    "width": 90,
                    "dx": -50,
                    "dy": -10
                }
            }
		},
		{
			row: 5,
			text: 'Stella Road is a private way worn through to dirt in many places. Abutting property owners are responsible for fixing the road, but the city often patches potholes on the street, which is off Hyde Park Avenue.',
            "breakpoints": {
                "1": {
                    "width": 90,
                    "dx": 0,
                    "dy": 0
                }
            }
		},
		{
			row: 20,
			text: 'Intersection of Centre Street and Pond Street',
            "breakpoints": {
                "1": {
                    "width": 90,
                    "dx": 0,
                    "dy": 0
                }
            }
		}
	];

	// make data
	var data = require('../../../data/output/bestDayForDistrict2_2014-06-20.csv')
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
		.reverse();

	// make map g
	var mapSelector = `${chartSelector} svg.map`;
	var g = d3.select(mapSelector)
		.attr({
			width: width,
			height: height
		})
		.append('g');

	var bounds = {W: -71.1419, E: -71.0921, S: 42.2823, N: 42.3249};

	// create circles scales
	var x = d3.scale.linear()
		.range([0, width])
		.domain([bounds.W, bounds.E]);

	var y = d3.scale.linear()
		.range([height, 0])
		.domain([bounds.S, bounds.N]);

	var radius = d3.scale.sqrt()
		.domain([0, d3.max(data, d => d.potholes)])
		.range([0, width/30]);

	// create circles
	g.selectAll('circle')
		.data(data)
		.enter().append('circle')
		.attr({
			cx: d => x(d.lng),
			cy: d => y(d.lat),
			r: d => radius(d.potholes),
		})
		.style({
			fill: colors.named.secondary.brick,
			'fill-opacity': 0.45,
			stroke: d3.rgb(colors.named.secondary.brick).darker()
		});

	// get the distance in feet
	var distanceInFeet = Math.floor(latLngDistance.getDistanceFromLatLonInKm(bounds.S, bounds.W, bounds.S, bounds.E) * 3280.84);

	// display the distance line and label
	$(`${chartSelector} .map-distance-legend`)
		.width(`${5280/2*100/distanceInFeet}%`)
		.html(`<span>1/2 mile</span>`);

	var mapLabels = [
		{
			html: '<span>Jamaica Plain</span>',
			lng: -71.1203,
			lat: 42.30985,
			rank: 1,
			dx: 0,
			dy: -4
		},
		{
			html: '<span>Forest Hills</span>',
			lng: -71.112,
			lat: 42.2968,
			rank: 1,
			dx: 10,
			dy: 0
		},
		{
			html: '<span>Roslindale</span>',
			lng: -71.1245,
			lat: 42.29125,
			rank: 1,
			dx: 0,
			dy: 3
		},
		{
			html: '<span>Roslindale Village</span>',
			lng: -71.1303,
			lat: 42.2875,
			rank: 2,
			dx: 0,
			dy: 3
		},
		{
			html: '<span>Arnold Arboretum</span>',
			lng: -71.1226,
			lat: 42.29945,
			rank: 2,
			dx: -5,
			dy: 0
		},
		{
			html: '<span>Olmsted Park</span>',
			lng: -71.1187,
			lat: 42.3225,
			rank: 2,
			dx: 0,
			dy: 0
		}
	];

	annotateMap.draw({
		bounds,
		data: data.filter(d => d.annotation),
		width,
		height,
		masterSelector: chartSelector,
		text: d => `<span class='title'>${d.potholes} potholes</span><span class='text'>${d.annotation.text}</span>`,
		mapLabels,
		datumRadiusScale: radius,
		datumRadiusProperty: 'potholes'
	});

}

function makeClusters() {

	var chartSelector = `.clusters`;

	var outerWidth = $(chartSelector, master).width();
	var outerHeight = 1316/1200*outerWidth;

	$(chartSelector, master).empty();

	var annotationData = [
		{
			row: 1,
			text: 'City-owned parking lot patched on April 3. “I think [47] is reasonable,” paver Scott Shea said, when asked about his work. “It’s a good-sized lot. Have you been in there when there are no cars?”',
			left: 1,
			top: 40,
			align: 'right',
			width: 32,
			topOffset: -10
		},
		{
			row: 13,
			text: 'One of several clusters District 3 patched on January 13, totalling over 60 potholes on tree-lined Grampian Way along Savin Hill Park.',
			left: 69,
			top: 60,
			align: 'left',
			width: 40,
			topOffset: 0,
			leftOffset: -12
		},
		{
			row: 35,
			text: 'District 4 fixed 11 potholes on July 5, 2013 at this Chinatown location, and 17 in the exact same spot on July 5, 2014.',
			left: 67,
			top: 18,
			align: 'left',
			width: 30,
			topOffset: -10,
			leftOffset: 0
		}
	];

	var data = require('../../../data/output/clustersIn2014.csv')
		.map(function(datum) {

			var result = {
				lat: +datum.LATITUDE,
				lng: +datum.LONGITUDE,
				potholes: +datum.n,
				row: +datum.row,
				district: datum.district
					.replace('Rest', 'Other districts')
					.replace(/^(\d)/, 'District $1')
			};

			var match = _.find(annotationData, {row: result.row});

			if (match) {
				result.annotation = match;
			}

			return result;
		})
		.reverse();

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
			})
			.on('mouseover', log);

		var labels = [
			{
				name: 'Chelsea',
				lng: -71.033,
				lat: 42.392,
				rank: 1,
				dx: -6,
				dy: 0
			},
			{
				name: 'Quincy',
				lng: -71.002,
				lat: 42.253,
				rank: 1,
				dx: -4,
				dy: 0
			},
			{
				name: 'Milton',
				lng: -71.066,
				lat: 42.25,
				rank: 1,
				dx: -5,
				dy: 0
			},
			{
				name: 'Dedham',
				lng: -71.166,
				lat: 42.242,
				rank: 1,
				dx: -6,
				dy: 0
			},
			{
				name: 'Watertown',
				lng: -71.183,
				lat: 42.371,
				rank: 1,
				dx: -8,
				dy: 4
			},
			{
				name: 'Brookline',
				lng: -71.121,
				lat: 42.332,
				rank: 1,
				dx: -15,
				dy: 0
			},
			{
				name: 'Cambridge',
				lng: -71.106,
				lat: 42.375,
				rank: 1,
				dx: -7,
				dy: 4
			}
		];

		d3.select(`${masterSelector} ${chartSelector}`).append('div')
			.attr('class', 'labels')
			.selectAll('div')
			.data(labels)
			.enter().append('div')
			.attr({
				'class': d=> `light label rank${d.rank}`
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

		g_annotations.selectAll('line')
			.data(annotationPoints)
			.enter().append('line')
			.attr({
				'class': 'solid',
				x1: d => getCoords(d, x, y, radius).x1,
				x2: d => getCoords(d, x, y, radius).x2,
				y1: d => getCoords(d, x, y, radius).y1,
				y2: d => getCoords(d, x, y, radius).y2
			})
			.style({
				'stroke-dasharray': function(d) {
					var coords = getCoords(d, x, y, radius);
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
				width: d => `${d.annotation.width}%`,
				'margin-left': d => d.annotation.leftOffset ? `${d.annotation.leftOffset}%` : 0,
				'margin-top': d => d.annotation.topOffset ? `${d.annotation.topOffset}%` : 0
			})
			.html(function(d) {
				return `<div><span class='number'>${d.potholes} potholes</span></div><div><span class='text'>${d.annotation.text}</span></div>`;
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
			.text((d,i) => `${util.numberWithCommas(d.count)}${!i ? ' clusters': ''}`);
	}
	makeBars();

}

function resize() {

	makePotholeClosuresPerDay();
	makeYearlyIncreaseByDistrict();
	makeWeeklyClosuresForDistrict2();
	makeBestDayForDistrict2();
	makeClusters();
}

$(window).on('resize', resize);
resize();