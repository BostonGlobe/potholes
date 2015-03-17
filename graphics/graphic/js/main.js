var d3 = require('d3');
var APDateTime = require('../../../common/js/APDateTime.js');

var Leaflet = require('leaflet');

function log(s) {
	console.log(JSON.stringify(s, null, 4));
}

var masterSelector = '.igraphic-graphic.graphic';
var master = $(masterSelector);

function make30dayRollingMean() {

	var outerWidth = $('._30dayRollingMean', master).width();
	var outerHeight = outerWidth/5;

	$('._30dayRollingMean', master).empty();

	var parseDate = d3.time.format('%Y-%m-%d').parse;
	var data = require('../../../data/output/30dayRollingMean.csv')
		.map(function(datum) {
			return {
				date: parseDate(datum['DATE.CLOSED.R']),
				moving: +datum.moving
			};
		});

	var margin = {top: 0, right: 0, bottom: 15, left: 0};
	var width = outerWidth - margin.left - margin.right;
	var height = outerHeight - margin.top - margin.bottom;

	var svg = d3.select(`${masterSelector} ._30dayRollingMean`).append('svg')
		.attr({
			width: outerWidth,
			height: outerHeight
		});

	var g = svg.append('g')
		.attr('transform', `translate(${margin.left}, ${margin.top})`);

	var x = d3.time.scale()
		.range([0, width])
		.domain(d3.extent(data, d => d.date));

	var y = d3.scale.linear()
		.range([height, 0])
		.domain([0, d3.max(data, d => d.moving)]);

	var area = d3.svg.area()
	    .x(d => x(d.date))
	    .y0(height)
	    .y1(d => y(d.moving));

	g.append('path')
		.datum(data)
		.attr('class', 'area')
		.attr('d', area);

	var xAxis = d3.svg.axis()
		.scale(x)
		.orient('bottom')
		.ticks(d3.time.months, 6)
		.tickSize(margin.bottom - 2, 0);

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

	var yTicks = [50, 100, 150];

	var yAxis = d3.svg.axis()
		.scale(y)
		.orient('left')
		.tickValues(yTicks)
		.tickSize(0);

	g.append('g')
		.attr('class', 'gridlines')
		.selectAll('line')
		.data(yTicks)
		.enter()
		.append('line')
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
}

function makePotholeClosuresPerDay() {

	var outerWidth = $('.potholeClosuresPerDay', master).width();
	var outerHeight = outerWidth/5;

	$('.potholeClosuresPerDay', master).empty();

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

	var svg = d3.select(`${masterSelector} .potholeClosuresPerDay`).append('svg')
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

	var annotationPoints = _.chain(data).sortBy('potholes').reverse().take(1).value();

	var annotationMarkerMargin = 25;

	g.append('path')
		.datum(data)
		.attr('class', 'area')
		.attr('d', area);

	var xAxis = d3.svg.axis()
		.scale(x)
		.orient('bottom')
		.ticks(d3.time.years, 1)
		.tickSize(margin.bottom - 2, margin.bottom - 2);

	var yTicks = [200, 400, 600];

	var yAxis = d3.svg.axis()
		.scale(y)
		.orient('left')
		.tickValues(yTicks)
		.tickSize(0);

	g.append('g')
		.attr('class', 'gridlines')
		.selectAll('line')
		.data(yTicks)
		.enter()
		.append('line')
		.attr({
			x1: 0,
			x2: x.range()[1],
			y1: d => y(d),
			y2: d => y(d)
		});

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

	g.append('g')
		.attr({
			'class': 'annotationMarkers'
		})
		.selectAll('.annotationMarker')
		.data(annotationPoints)
		.enter()
		.append('line')
		.attr({
			x1: d => x(d.date) + 5,
			x2: d => x(d.date) + annotationMarkerMargin,
			y1: d => y(d.potholes) + 10,
			y2: d => y(d.potholes) + 10
		});

	d3.select(`${masterSelector} .potholeClosuresPerDay`).append('div')
		.attr('class', 'annotations')
		.selectAll('.annotation')
		.data(annotationPoints)
		.enter()
		.append('div')
		.attr({
			'class': 'annotation'
		})
		.style({
			left: d => `${100 * (x(d.date) + annotationMarkerMargin)/x.range()[1]}%`
		})
		.html(function(d) {
			return `<span class='date'>${APDateTime.date(d.date)}</span><span class='potholes'>${d.potholes} potholes</span>`;
		});
}

function makeMaxDailyPotholeClosures() {

	// convert pothole data to leaflet circles array
	var circles = require('../../../data/output/maxDailyPotholeClosures.csv').map(d => 
		L.circle([+d.LATITUDE, +d.LONGITUDE], Math.sqrt(+d.count*50000/Math.PI), {
			weight: 1,
			opacity: 1,
			fillColor: '#ea212d',
			color: 'black'
		})
	);

	// add the circles to a layer
	var circlesLayer = L.featureGroup(circles);

	// make the leaflet map and fit it to the circle layer bounds
	var map = L.map($('.maxDailyPotholeClosures', master).get(0), {
		attributionControl: false,
		zoomControl: false,
		dragging: false,
		touchZoom: false,
		doubleClickZoom: false,
		scrollWheelZoom: false,
	}).fitBounds(circlesLayer.getBounds());

	// Add the MapBox baselayer to our map.
	L.tileLayer('http://{s}.tiles.mapbox.com/v3/gabriel-florit.e27e2f64/{z}/{x}/{y}.png').addTo(map);

	// add the circles layer to the map
	circlesLayer.addTo(map);
}

var thingsHaveBeenDrawn = false;

function resize() {

	makePotholeClosuresPerDay();

	if (!thingsHaveBeenDrawn) {
		makeMaxDailyPotholeClosures();
	}	
	make30dayRollingMean();

	thingsHaveBeenDrawn = true;
}

$(window).on('resize', resize);
resize();

// 2014-01-30










