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
	left: 20,
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
			return `<span class='date'>${APDateTime.date(d.date, true)}</span><span class='potholes'>${d.potholes} potholes</span>`;
		});
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

	var margin = {top: 0, right: 0, bottom: 0, left: 60};

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
			return `<span class='date'>${APDateTime.date(d.date, true)}</span><span class='potholes'>${d.potholes} potholes</span>`;
		});
}

function makeBestDayForDistrict2() {

	var chartSelector = '.bestDayForDistrict2';

	var outerWidth = $(chartSelector, master).width();
	var outerHeight = 2789/2411*outerWidth;

	$(chartSelector, master).empty();

	var data = require('../../../data/output/bestDayForDistrict2_2014-06-20.csv')
		.map(function(datum) {
			return {
				lat: +datum.LATITUDE,
				lng: +datum.LONGITUDE,
				potholes: +datum.n
			};
		});

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
			'src': 'http://private.boston.com/multimedia/graphics/projectFiles/2015/potholes/img/district2.jpg'
		});

	var g = svg.append('g')
		.attr('transform', `translate(${margin.left}, ${margin.top})`);

	var x = d3.scale.linear()
		.range([0, width])
		.domain([-71.1419, -71.0921]);

	var y = d3.scale.linear()
		.range([height, 0])
		.domain([42.2823, 42.3249]);

	var radius = d3.scale.sqrt()
		.domain([0, d3.max(data, d => d.potholes)])
		.range([0, width/30]);

	log(width);

	g.append('g')
		.attr('class', 'circles')
		.selectAll('circle')
		.data(data)
		.enter().append('circle')
		.attr({
			cx: d => x(d.lng),
			cy: d => y(d.lat),
			r: d => radius(d.potholes),
			fill: colors.named.primary.orange,
			'fill-opacity': 0.35,
			stroke: d3.rgb(colors.named.primary.orange).darker()
		});
}

var thingsHaveBeenDrawn = false;

function resize() {

	makePotholeClosuresPerDay();
	makeYearlyIncreaseByDistrict();
	makeWeeklyClosuresForDistrict2();
	makeBestDayForDistrict2();
}

$(window).on('resize', resize);
resize();