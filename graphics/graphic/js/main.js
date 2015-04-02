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

	var annotationData = require('./district2annotations.json');

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
		.range([0, width/30])
		.domain([0, d3.max(data, d => d.potholes)]);

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

	annotateMap.draw({
		bounds,
		data: data.filter(d => d.annotation),
		width,
		height,
		masterSelector: chartSelector,
		text: d => `<span class='title'>${d.potholes} potholes</span><span class='text'>${d.annotation.text}</span>`,
		mapLabels: require('./district2labels.json'),
		datumRadiusScale: radius,
		datumRadiusProperty: 'potholes'
	});

}

function makeClusters() {

	var chartSelector = `.clusters`;

	var width = $(chartSelector, master).width();
	var height = 1316/1200*width;

	$(chartSelector, master).empty();

	// create the map skeleton
	var skeleton = `
		<div class='baselayer'>
			<img src='http://cache.boston.com/multimedia/graphics/projectFiles/2015/potholes/img/boston_1200w.jpg' />
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

	var annotationData = require('./clustersAnnotations.json');

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

	// make map g
	var mapSelector = `${chartSelector} svg.map`;
	var g = d3.select(mapSelector)
		.attr({
			width: width,
			height: height
		})
		.append('g');

	var bounds = {W: -71.201, E: -70.9779, S: 42.2211, N: 42.4022};

	// create circles scales
	var x = d3.scale.linear()
		.range([0, width])
		.domain([bounds.W, bounds.E]);

	var y = d3.scale.linear()
		.range([height, 0])
		.domain([bounds.S, bounds.N]);

	var radius = d3.scale.sqrt()
		.range([0, width/30])
		.domain([0, d3.max(data, d => d.potholes)]);

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
			fill: d => colors.array.secondary[_.indexOf(orderedDistricts, d.district)],
			'fill-opacity': 0.45,
			stroke: d => d3.rgb(colors.array.secondary[_.indexOf(orderedDistricts, d.district)]).darker()
		});

	// get the distance in feet
	var distanceInFeet = Math.floor(latLngDistance.getDistanceFromLatLonInKm(bounds.S, bounds.W, bounds.S, bounds.E) * 3280.84);

	// display the distance line and label
	$(`${chartSelector} .map-distance-legend`)
		.width(`${5280*2*100/distanceInFeet}%`)
		.html(`<span>2 miles</span>`);

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

		var bars = d3.select(chartSelector).append('svg')
			.attr({
				'class': 'annotatedBarChart',
				width: width,
				height: height
			})
			.append('g')
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

	annotateMap.draw({
		bounds,
		data: data.filter(d => d.annotation),
		width,
		height,
		masterSelector: chartSelector,
		text: d => `<span class='title'>${d.potholes} potholes</span><span class='text'>${d.annotation.text}</span>`,
		mapLabels: require('./clustersLabels.json'),
		datumRadiusScale: radius,
		datumRadiusProperty: 'potholes'
	});

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