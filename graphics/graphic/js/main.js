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

	var margin = {top: 20, right: 0, bottom: 15, left: 0};
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

	var annotationPoints = _.chain(data).sortBy('potholes').reverse().take(1).value();

	var annotationMarkerMargin = {
		left: 25,
		top: 10
	};

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

	g.append('g')
		.attr({
			'class': 'annotationMarkers'
		})
		.selectAll('.annotationMarker')
		.data(annotationPoints)
	.enter().append('line')
		.attr({
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
			top: d => `${100 * (y(d.potholes) + annotationMarkerMargin.top)/y.range()[0]}%`
		})
		.html(function(d) {
			return `<span class='date'>${APDateTime.date(d.date)}</span><span class='potholes'>${d.potholes} potholes</span>`;
		});

	d3.select(`${masterSelector} ${chartSelector}`).append('div')
		.attr('class', 'title')
		.html('<span>Pothole closures per day</span>');
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

function makeYearlyIncreaseByDistrict() {

	var barMargin = 2;
	var barHeight = 20 + barMargin*2;
	var data = _.chain(require('../../../data/output/yearlyIncreaseByDistrict.csv'))
		.map(function(d) {
			return {
				district: d.district,
				increase: +d.increase
			};
		})
		.sortBy('district')
		.value();

	var chartSelector = '.yearlyIncreaseByDistrict';

	var margin = {top: 30, right: 0, bottom: 0, left: 60};

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
			fill: (d, i) => colors.secondary[i]
		});

	bars.append('text')
		.attr({
			'class': 'name',
			x: -10,
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

	d3.select(`${masterSelector} ${chartSelector}`).append('div')
		.attr('class', 'title')
		.html('<span>Yearly increase in pothole closures</span>');
}

var thingsHaveBeenDrawn = false;

function resize() {

	makePotholeClosuresPerDay();
	makeYearlyIncreaseByDistrict();

	// if (!thingsHaveBeenDrawn) {
	// 	makeMaxDailyPotholeClosures();
	// }	

	thingsHaveBeenDrawn = true;
}

$(window).on('resize', resize);
resize();