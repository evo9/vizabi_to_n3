// Chart design based on the recommendations of Stephen Few. Implementation
// based on the work of Clint Ivy, Jamie Love, and Jason Davies.
// http://projects.instantcognition.com/protovis/bulletchart/

nv.models.bullet = function () {
    "use strict";

    //============================================================
    // Public Variables with Default Settings
    //------------------------------------------------------------

    var margin = {top: 0, right: 0, bottom: 0, left: 0}
        , orient = 'left' // TODO top & bottom
        , reverse = false
        , ranges = function (d) {
            return d.ranges
        }
        , markers = function (d) {
            return d.markers ? d.markers : [0]
        }
        , measures = function (d) {
            return d.measures
        }
        , rangeLabels = function (d) {
            return d.rangeLabels ? d.rangeLabels : []
        }
        , markerLabels = function (d) {
            return d.markerLabels ? d.markerLabels : []
        }
        , measureLabels = function (d) {
            return d.measureLabels ? d.measureLabels : []
        }
        , forceX = [0] // List of numbers to Force into the X scale (ie. 0, or a max / min, etc.)
        , width = 380
        , height = 30
        , tickFormat = null
        , color = nv.utils.getColor(['#1f77b4'])
        , dispatch = d3.dispatch('elementMouseover', 'elementMouseout')
        ;

    function chart(selection) {
        selection.each(function (d, i) {
            var availableWidth = width - margin.left - margin.right,
                availableHeight = height - margin.top - margin.bottom,
                container = d3.select(this);
            nv.utils.initSVG(container);

            var rangez = ranges.call(this, d, i).slice().sort(d3.descending),
                markerz = markers.call(this, d, i).slice().sort(d3.descending),
                measurez = measures.call(this, d, i).slice().sort(d3.descending),
                rangeLabelz = rangeLabels.call(this, d, i).slice(),
                markerLabelz = markerLabels.call(this, d, i).slice(),
                measureLabelz = measureLabels.call(this, d, i).slice();

            // Setup Scales
            // Compute the new x-scale.
            var x1 = d3.scale.linear()
                .domain(d3.extent(d3.merge([forceX, rangez])))
                .range(reverse ? [availableWidth, 0] : [0, availableWidth]);

            // Retrieve the old x-scale, if this is an update.
            var x0 = this.__chart__ || d3.scale.linear()
                    .domain([0, Infinity])
                    .range(x1.range());

            // Stash the new scale.
            this.__chart__ = x1;

            var rangeMin = d3.min(rangez), //rangez[2]
                rangeMax = d3.max(rangez), //rangez[0]
                rangeAvg = rangez[1];

            // Setup containers and skeleton of chart
            var wrap = container.selectAll('g.nv-wrap.nv-bullet').data([d]);
            var wrapEnter = wrap.enter().append('g').attr('class', 'nvd3 nv-wrap nv-bullet');
            var gEnter = wrapEnter.append('g');
            var g = wrap.select('g');

            gEnter.append('rect').attr('class', 'nv-range nv-rangeMax');
            gEnter.append('rect').attr('class', 'nv-range nv-rangeAvg');
            gEnter.append('rect').attr('class', 'nv-range nv-rangeMin');
            gEnter.append('rect').attr('class', 'nv-measure');
            gEnter.append('path').attr('class', 'nv-markerTriangle');

            wrap.attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

            var w0 = function (d) {
                    return Math.abs(x0(d) - x0(0))
                }, // TODO: could optimize by precalculating x0(0) and x1(0)
                w1 = function (d) {
                    return Math.abs(x1(d) - x1(0))
                };
            var xp0 = function (d) {
                    return d < 0 ? x0(d) : x0(0)
                },
                xp1 = function (d) {
                    return d < 0 ? x1(d) : x1(0)
                };

            g.select('rect.nv-rangeMax')
                .attr('height', availableHeight)
                .attr('width', w1(rangeMax > 0 ? rangeMax : rangeMin))
                .attr('x', xp1(rangeMax > 0 ? rangeMax : rangeMin))
                .datum(rangeMax > 0 ? rangeMax : rangeMin)

            g.select('rect.nv-rangeAvg')
                .attr('height', availableHeight)
                .attr('width', w1(rangeAvg))
                .attr('x', xp1(rangeAvg))
                .datum(rangeAvg)

            g.select('rect.nv-rangeMin')
                .attr('height', availableHeight)
                .attr('width', w1(rangeMax))
                .attr('x', xp1(rangeMax))
                .attr('width', w1(rangeMax > 0 ? rangeMin : rangeMax))
                .attr('x', xp1(rangeMax > 0 ? rangeMin : rangeMax))
                .datum(rangeMax > 0 ? rangeMin : rangeMax)

            g.select('rect.nv-measure')
                .style('fill', color)
                .attr('height', availableHeight / 3)
                .attr('y', availableHeight / 3)
                .attr('width', measurez < 0 ?
                x1(0) - x1(measurez[0])
                    : x1(measurez[0]) - x1(0))
                .attr('x', xp1(measurez))
                .on('mouseover', function () {
                    dispatch.elementMouseover({
                        value: measurez[0],
                        label: measureLabelz[0] || 'Current',
                        pos: [x1(measurez[0]), availableHeight / 2]
                    })
                })
                .on('mouseout', function () {
                    dispatch.elementMouseout({
                        value: measurez[0],
                        label: measureLabelz[0] || 'Current'
                    })
                });

            var h3 = availableHeight / 6;
            if (markerz[0]) {
                g.selectAll('path.nv-markerTriangle')
                    .attr('transform', function (d) {
                        return 'translate(' + x1(markerz[0]) + ',' + (availableHeight / 2) + ')'
                    })
                    .attr('d', 'M0,' + h3 + 'L' + h3 + ',' + (-h3) + ' ' + (-h3) + ',' + (-h3) + 'Z')
                    .on('mouseover', function () {
                        dispatch.elementMouseover({
                            value: markerz[0],
                            label: markerLabelz[0] || 'Previous',
                            pos: [x1(markerz[0]), availableHeight / 2]
                        })
                    })
                    .on('mouseout', function () {
                        dispatch.elementMouseout({
                            value: markerz[0],
                            label: markerLabelz[0] || 'Previous'
                        })
                    });
            }
            else {
                g.selectAll('path.nv-markerTriangle').remove();
            }

            wrap.selectAll('.nv-range')
                .on('mouseover', function (d, i) {
                    var label = rangeLabelz[i] || (!i ? "Maximum" : i == 1 ? "Mean" : "Minimum");

                    dispatch.elementMouseover({
                        value: d,
                        label: label,
                        pos: [x1(d), availableHeight / 2]
                    })
                })
                .on('mouseout', function (d, i) {
                    var label = rangeLabelz[i] || (!i ? "Maximum" : i == 1 ? "Mean" : "Minimum");

                    dispatch.elementMouseout({
                        value: d,
                        label: label
                    })
                });
        });

        return chart;
    }

    //============================================================
    // Expose Public Variables
    //------------------------------------------------------------

    chart.dispatch = dispatch;
    chart.options = nv.utils.optionsFunc.bind(chart);

    chart._options = Object.create({}, {
        // simple options, just get/set the necessary values
        ranges: {
            get: function () {
                return ranges;
            }, set: function (_) {
                ranges = _;
            }
        }, // ranges (bad, satisfactory, good)
        markers: {
            get: function () {
                return markers;
            }, set: function (_) {
                markers = _;
            }
        }, // markers (previous, goal)
        measures: {
            get: function () {
                return measures;
            }, set: function (_) {
                measures = _;
            }
        }, // measures (actual, forecast)
        forceX: {
            get: function () {
                return forceX;
            }, set: function (_) {
                forceX = _;
            }
        },
        width: {
            get: function () {
                return width;
            }, set: function (_) {
                width = _;
            }
        },
        height: {
            get: function () {
                return height;
            }, set: function (_) {
                height = _;
            }
        },
        tickFormat: {
            get: function () {
                return tickFormat;
            }, set: function (_) {
                tickFormat = _;
            }
        },

        // options that require extra logic in the setter
        margin: {
            get: function () {
                return margin;
            }, set: function (_) {
                margin.top = _.top !== undefined ? _.top : margin.top;
                margin.right = _.right !== undefined ? _.right : margin.right;
                margin.bottom = _.bottom !== undefined ? _.bottom : margin.bottom;
                margin.left = _.left !== undefined ? _.left : margin.left;
            }
        },
        orient: {
            get: function () {
                return orient;
            }, set: function (_) { // left, right, top, bottom
                orient = _;
                reverse = orient == 'right' || orient == 'bottom';
            }
        },
        color: {
            get: function () {
                return color;
            }, set: function (_) {
                color = nv.utils.getColor(_);
            }
        }
    });

    nv.utils.initOptions(chart);
    return chart;
};


// Chart design based on the recommendations of Stephen Few. Implementation
// based on the work of Clint Ivy, Jamie Love, and Jason Davies.
// http://projects.instantcognition.com/protovis/bulletchart/
nv.models.bulletChart = function () {
    "use strict";

    //============================================================
    // Public Variables with Default Settings
    //------------------------------------------------------------

    var bullet = nv.models.bullet()
        ;

    var orient = 'left' // TODO top & bottom
        , reverse = false
        , margin = {top: 5, right: 40, bottom: 20, left: 120}
        , ranges = function (d) {
            return d.ranges
        }
        , markers = function (d) {
            return d.markers ? d.markers : [0]
        }
        , measures = function (d) {
            return d.measures
        }
        , width = null
        , height = 55
        , tickFormat = null
        , tooltips = true
        , tooltip = function (key, x, y, e, graph) {
            return '<h3>' + x + '</h3>' +
                '<p>' + y + '</p>'
        }
        , noData = 'No Data Available.'
        , dispatch = d3.dispatch('tooltipShow', 'tooltipHide')
        ;

    //============================================================
    // Private Variables
    //------------------------------------------------------------

    var showTooltip = function (e, offsetElement) {
        var left = e.pos[0] + ( offsetElement.offsetLeft || 0 ) + margin.left,
            top = e.pos[1] + ( offsetElement.offsetTop || 0) + margin.top,
            content = tooltip(e.key, e.label, e.value, e, chart);

        nv.tooltip.show([left, top], content, e.value < 0 ? 'e' : 'w', null, offsetElement);
    };

    function chart(selection) {
        selection.each(function (d, i) {
            var container = d3.select(this);
            nv.utils.initSVG(container);

            var availableWidth = (width || parseInt(container.style('width')) || 960)
                    - margin.left - margin.right,
                availableHeight = height - margin.top - margin.bottom,
                that = this;

            chart.update = function () {
                chart(selection)
            };
            chart.container = this;

            // Display No Data message if there's nothing to show.
            if (!d || !ranges.call(this, d, i)) {
                var noDataText = container.selectAll('.nv-noData').data([noData]);

                noDataText.enter().append('text')
                    .attr('class', 'nvd3 nv-noData')
                    .attr('dy', '-.7em')
                    .style('text-anchor', 'middle');

                noDataText
                    .attr('x', margin.left + availableWidth / 2)
                    .attr('y', 18 + margin.top + availableHeight / 2)
                    .text(function (d) {
                        return d
                    });

                return chart;
            }
            else {
                container.selectAll('.nv-noData').remove();
            }

            var rangez = ranges.call(this, d, i).slice().sort(d3.descending),
                markerz = markers.call(this, d, i).slice().sort(d3.descending),
                measurez = measures.call(this, d, i).slice().sort(d3.descending);

            // Setup containers and skeleton of chart
            var wrap = container.selectAll('g.nv-wrap.nv-bulletChart').data([d]);
            var wrapEnter = wrap.enter().append('g').attr('class', 'nvd3 nv-wrap nv-bulletChart');
            var gEnter = wrapEnter.append('g');
            var g = wrap.select('g');

            gEnter.append('g').attr('class', 'nv-bulletWrap');
            gEnter.append('g').attr('class', 'nv-titles');

            wrap.attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

            // Compute the new x-scale.
            var x1 = d3.scale.linear()
                .domain([0, Math.max(rangez[0], markerz[0], measurez[0])])  // TODO: need to allow forceX and forceY, and xDomain, yDomain
                .range(reverse ? [availableWidth, 0] : [0, availableWidth]);

            // Retrieve the old x-scale, if this is an update.
            var x0 = this.__chart__ || d3.scale.linear()
                    .domain([0, Infinity])
                    .range(x1.range());

            // Stash the new scale.
            this.__chart__ = x1;

            var w0 = function (d) {
                    return Math.abs(x0(d) - x0(0))
                }, // TODO: could optimize by precalculating x0(0) and x1(0)
                w1 = function (d) {
                    return Math.abs(x1(d) - x1(0))
                };

            var title = gEnter.select('.nv-titles').append('g')
                .attr('text-anchor', 'end')
                .attr('transform', 'translate(-6,' + (height - margin.top - margin.bottom) / 2 + ')');
            title.append('text')
                .attr('class', 'nv-title')
                .text(function (d) {
                    return d.title;
                });

            title.append('text')
                .attr('class', 'nv-subtitle')
                .attr('dy', '1em')
                .text(function (d) {
                    return d.subtitle;
                });

            bullet
                .width(availableWidth)
                .height(availableHeight)

            var bulletWrap = g.select('.nv-bulletWrap');
            d3.transition(bulletWrap).call(bullet);

            // Compute the tick format.
            var format = tickFormat || x1.tickFormat(availableWidth / 100);

            // Update the tick groups.
            var tick = g.selectAll('g.nv-tick')
                .data(x1.ticks(availableWidth / 50), function (d) {
                    return this.textContent || format(d);
                });

            // Initialize the ticks with the old scale, x0.
            var tickEnter = tick.enter().append('g')
                .attr('class', 'nv-tick')
                .attr('transform', function (d) {
                    return 'translate(' + x0(d) + ',0)'
                })
                .style('opacity', 1e-6);

            tickEnter.append('line')
                .attr('y1', availableHeight)
                .attr('y2', availableHeight * 7 / 6);

            tickEnter.append('text')
                .attr('text-anchor', 'middle')
                .attr('dy', '1em')
                .attr('y', availableHeight * 7 / 6)
                .text(format);

            // Transition the updating ticks to the new scale, x1.
            var tickUpdate = d3.transition(tick)
                .attr('transform', function (d) {
                    return 'translate(' + x1(d) + ',0)'
                })
                .style('opacity', 1);

            tickUpdate.select('line')
                .attr('y1', availableHeight)
                .attr('y2', availableHeight * 7 / 6);

            tickUpdate.select('text')
                .attr('y', availableHeight * 7 / 6);

            // Transition the exiting ticks to the new scale, x1.
            d3.transition(tick.exit())
                .attr('transform', function (d) {
                    return 'translate(' + x1(d) + ',0)'
                })
                .style('opacity', 1e-6)
                .remove();

            //============================================================
            // Event Handling/Dispatching (in chart's scope)
            //------------------------------------------------------------

            dispatch.on('tooltipShow', function (e) {
                e.key = d.title;
                if (tooltips) showTooltip(e, that.parentNode);
            });

        });

        d3.timer.flush();
        return chart;
    }

    //============================================================
    // Event Handling/Dispatching (out of chart's scope)
    //------------------------------------------------------------

    bullet.dispatch.on('elementMouseover.tooltip', function (e) {
        dispatch.tooltipShow(e);
    });

    bullet.dispatch.on('elementMouseout.tooltip', function (e) {
        dispatch.tooltipHide(e);
    });

    dispatch.on('tooltipHide', function () {
        if (tooltips) nv.tooltip.cleanup();
    });

    //============================================================
    // Expose Public Variables
    //------------------------------------------------------------

    chart.bullet = bullet;
    chart.dispatch = dispatch;
    chart.options = nv.utils.optionsFunc.bind(chart);

    chart._options = Object.create({}, {
        // simple options, just get/set the necessary values
        ranges: {
            get: function () {
                return ranges;
            }, set: function (_) {
                ranges = _;
            }
        }, // ranges (bad, satisfactory, good)
        markers: {
            get: function () {
                return markers;
            }, set: function (_) {
                markers = _;
            }
        }, // markers (previous, goal)
        measures: {
            get: function () {
                return measures;
            }, set: function (_) {
                measures = _;
            }
        }, // measures (actual, forecast)
        width: {
            get: function () {
                return width;
            }, set: function (_) {
                width = _;
            }
        },
        height: {
            get: function () {
                return height;
            }, set: function (_) {
                height = _;
            }
        },
        tickFormat: {
            get: function () {
                return tickFormat;
            }, set: function (_) {
                tickFormat = _;
            }
        },
        tooltips: {
            get: function () {
                return tooltips;
            }, set: function (_) {
                tooltips = _;
            }
        },
        tooltipContent: {
            get: function () {
                return tooltip;
            }, set: function (_) {
                tooltip = _;
            }
        },
        noData: {
            get: function () {
                return noData;
            }, set: function (_) {
                noData = _;
            }
        },

        // options that require extra logic in the setter
        margin: {
            get: function () {
                return margin;
            }, set: function (_) {
                margin.top = _.top !== undefined ? _.top : margin.top;
                margin.right = _.right !== undefined ? _.right : margin.right;
                margin.bottom = _.bottom !== undefined ? _.bottom : margin.bottom;
                margin.left = _.left !== undefined ? _.left : margin.left;
            }
        },
        orient: {
            get: function () {
                return orient;
            }, set: function (_) { // left, right, top, bottom
                orient = _;
                reverse = orient == 'right' || orient == 'bottom';
            }
        }
    });

    nv.utils.inheritOptions(chart, bullet);
    nv.utils.initOptions(chart);

    return chart;
};


nv.models.cumulativeLineChart = function () {
    "use strict";

    //============================================================
    // Public Variables with Default Settings
    //------------------------------------------------------------

    var lines = nv.models.line()
        , xAxis = nv.models.axis()
        , yAxis = nv.models.axis()
        , legend = nv.models.legend()
        , controls = nv.models.legend()
        , interactiveLayer = nv.interactiveGuideline()
        ;

    var margin = {top: 30, right: 30, bottom: 50, left: 60}
        , color = nv.utils.defaultColor()
        , width = null
        , height = null
        , showLegend = true
        , showXAxis = true
        , showYAxis = true
        , rightAlignYAxis = false
        , tooltips = true
        , showControls = true
        , useInteractiveGuideline = false
        , rescaleY = true
        , tooltip = function (key, x, y, e, graph) {
            return '<h3>' + key + '</h3>' +
                '<p>' + y + ' at ' + x + '</p>'
        }
        , x //can be accessed via chart.xScale()
        , y //can be accessed via chart.yScale()
        , id = lines.id()
        , state = nv.utils.state()
        , defaultState = null
        , noData = 'No Data Available.'
        , average = function (d) {
            return d.average
        }
        , dispatch = d3.dispatch('tooltipShow', 'tooltipHide', 'stateChange', 'changeState', 'renderEnd')
        , transitionDuration = 250
        , duration = 250
        , noErrorCheck = false  //if set to TRUE, will bypass an error check in the indexify function.
        ;

    state.index = 0;
    state.rescaleY = rescaleY;

    xAxis
        .orient('bottom')
        .tickPadding(7)
    ;
    yAxis
        .orient((rightAlignYAxis) ? 'right' : 'left')
    ;

    controls.updateState(false);

    //============================================================
    // Private Variables
    //------------------------------------------------------------

    var dx = d3.scale.linear()
        , index = {i: 0, x: 0}
        , renderWatch = nv.utils.renderWatch(dispatch, duration)
        ;

    var showTooltip = function (e, offsetElement) {
        var left = e.pos[0] + ( offsetElement.offsetLeft || 0 ),
            top = e.pos[1] + ( offsetElement.offsetTop || 0),
            x = xAxis.tickFormat()(lines.x()(e.point, e.pointIndex)),
            y = yAxis.tickFormat()(lines.y()(e.point, e.pointIndex)),
            content = tooltip(e.series.key, x, y, e, chart);

        nv.tooltip.show([left, top], content, null, null, offsetElement);
    };

    var stateGetter = function (data) {
        return function () {
            return {
                active: data.map(function (d) {
                    return !d.disabled
                }),
                index: index.i,
                rescaleY: rescaleY
            };
        }
    };

    var stateSetter = function (data) {
        return function (state) {
            if (state.index !== undefined)
                index.i = state.index;
            if (state.rescaleY !== undefined)
                rescaleY = state.rescaleY;
            if (state.active !== undefined)
                data.forEach(function (series, i) {
                    series.disabled = !state.active[i];
                });
        }
    };

    function chart(selection) {
        renderWatch.reset();
        renderWatch.models(lines);
        if (showXAxis) renderWatch.models(xAxis);
        if (showYAxis) renderWatch.models(yAxis);
        selection.each(function (data) {
            var container = d3.select(this);
            nv.utils.initSVG(container);
            container.classed('nv-chart-' + id, true);
            var that = this;

            var availableWidth = (width || parseInt(container.style('width')) || 960)
                    - margin.left - margin.right,
                availableHeight = (height || parseInt(container.style('height')) || 400)
                    - margin.top - margin.bottom;

            chart.update = function () {
                if (duration === 0)
                    container.call(chart);
                else
                    container.transition().duration(duration).call(chart)
            };
            chart.container = this;

            state
                .setter(stateSetter(data), chart.update)
                .getter(stateGetter(data))
                .update();

            // DEPRECATED set state.disableddisabled
            state.disabled = data.map(function (d) {
                return !!d.disabled
            });

            if (!defaultState) {
                var key;
                defaultState = {};
                for (key in state) {
                    if (state[key] instanceof Array)
                        defaultState[key] = state[key].slice(0);
                    else
                        defaultState[key] = state[key];
                }
            }

            var indexDrag = d3.behavior.drag()
                .on('dragstart', dragStart)
                .on('drag', dragMove)
                .on('dragend', dragEnd);


            function dragStart(d, i) {
                d3.select(chart.container)
                    .style('cursor', 'ew-resize');
            }

            function dragMove(d, i) {
                index.x = d3.event.x;
                index.i = Math.round(dx.invert(index.x));
                updateZero();
            }

            function dragEnd(d, i) {
                d3.select(chart.container)
                    .style('cursor', 'auto');

                // update state and send stateChange with new index
                state.index = index.i;
                dispatch.stateChange(state);
            }

            // Display No Data message if there's nothing to show.
            if (!data || !data.length || !data.filter(function (d) {
                    return d.values.length
                }).length) {
                var noDataText = container.selectAll('.nv-noData').data([noData]);

                noDataText.enter().append('text')
                    .attr('class', 'nvd3 nv-noData')
                    .attr('dy', '-.7em')
                    .style('text-anchor', 'middle');

                noDataText
                    .attr('x', margin.left + availableWidth / 2)
                    .attr('y', margin.top + availableHeight / 2)
                    .text(function (d) {
                        return d
                    });

                return chart;
            }
            else {
                container.selectAll('.nv-noData').remove();
            }

            // Setup Scales
            x = lines.xScale();
            y = lines.yScale();

            if (!rescaleY) {
                var seriesDomains = data
                    .filter(function (series) {
                        return !series.disabled
                    })
                    .map(function (series, i) {
                        var initialDomain = d3.extent(series.values, lines.y());

                        //account for series being disabled when losing 95% or more
                        if (initialDomain[0] < -.95) initialDomain[0] = -.95;

                        return [
                            (initialDomain[0] - initialDomain[1]) / (1 + initialDomain[1]),
                            (initialDomain[1] - initialDomain[0]) / (1 + initialDomain[0])
                        ];
                    });

                var completeDomain = [
                    d3.min(seriesDomains, function (d) {
                        return d[0]
                    }),
                    d3.max(seriesDomains, function (d) {
                        return d[1]
                    })
                ];

                lines.yDomain(completeDomain);
            }
            else {
                lines.yDomain(null);
            }

            dx.domain([0, data[0].values.length - 1]) //Assumes all series have same length
                .range([0, availableWidth])
                .clamp(true);

            var data = indexify(index.i, data);

            // Setup containers and skeleton of chart
            var interactivePointerEvents = (useInteractiveGuideline) ? "none" : "all";
            var wrap = container.selectAll('g.nv-wrap.nv-cumulativeLine').data([data]);
            var gEnter = wrap.enter().append('g').attr('class', 'nvd3 nv-wrap nv-cumulativeLine').append('g');
            var g = wrap.select('g');

            gEnter.append('g').attr('class', 'nv-interactive');
            gEnter.append('g').attr('class', 'nv-x nv-axis').style("pointer-events", "none");
            gEnter.append('g').attr('class', 'nv-y nv-axis');
            gEnter.append('g').attr('class', 'nv-background');
            gEnter.append('g').attr('class', 'nv-linesWrap').style("pointer-events", interactivePointerEvents);
            gEnter.append('g').attr('class', 'nv-avgLinesWrap').style("pointer-events", "none");
            gEnter.append('g').attr('class', 'nv-legendWrap');
            gEnter.append('g').attr('class', 'nv-controlsWrap');

            // Legend
            if (showLegend) {
                legend.width(availableWidth);

                g.select('.nv-legendWrap')
                    .datum(data)
                    .call(legend);

                if (margin.top != legend.height()) {
                    margin.top = legend.height();
                    availableHeight = (height || parseInt(container.style('height')) || 400)
                    - margin.top - margin.bottom;
                }

                g.select('.nv-legendWrap')
                    .attr('transform', 'translate(0,' + (-margin.top) + ')')
            }

            // Controls
            if (showControls) {
                var controlsData = [
                    {key: 'Re-scale y-axis', disabled: !rescaleY}
                ];

                controls
                    .width(140)
                    .color(['#444', '#444', '#444'])
                    .rightAlign(false)
                    .margin({top: 5, right: 0, bottom: 5, left: 20})
                ;

                g.select('.nv-controlsWrap')
                    .datum(controlsData)
                    .attr('transform', 'translate(0,' + (-margin.top) + ')')
                    .call(controls);
            }

            wrap.attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

            if (rightAlignYAxis) {
                g.select(".nv-y.nv-axis")
                    .attr("transform", "translate(" + availableWidth + ",0)");
            }

            // Show error if series goes below 100%
            var tempDisabled = data.filter(function (d) {
                return d.tempDisabled
            });

            wrap.select('.tempDisabled').remove(); //clean-up and prevent duplicates
            if (tempDisabled.length) {
                wrap.append('text').attr('class', 'tempDisabled')
                    .attr('x', availableWidth / 2)
                    .attr('y', '-.71em')
                    .style('text-anchor', 'end')
                    .text(tempDisabled.map(function (d) {
                        return d.key
                    }).join(', ') + ' values cannot be calculated for this time period.');
            }

            //Set up interactive layer
            if (useInteractiveGuideline) {
                interactiveLayer
                    .width(availableWidth)
                    .height(availableHeight)
                    .margin({left: margin.left, top: margin.top})
                    .svgContainer(container)
                    .xScale(x);
                wrap.select(".nv-interactive").call(interactiveLayer);
            }

            gEnter.select('.nv-background')
                .append('rect');

            g.select('.nv-background rect')
                .attr('width', availableWidth)
                .attr('height', availableHeight);

            lines
                //.x(function(d) { return d.x })
                .y(function (d) {
                    return d.display.y
                })
                .width(availableWidth)
                .height(availableHeight)
                .color(data.map(function (d, i) {
                    return d.color || color(d, i);
                }).filter(function (d, i) {
                    return !data[i].disabled && !data[i].tempDisabled;
                }));

            var linesWrap = g.select('.nv-linesWrap')
                .datum(data.filter(function (d) {
                    return !d.disabled && !d.tempDisabled
                }));

            linesWrap.call(lines);

            //Store a series index number in the data array.
            data.forEach(function (d, i) {
                d.seriesIndex = i;
            });

            var avgLineData = data.filter(function (d) {
                return !d.disabled && !!average(d);
            });

            var avgLines = g.select(".nv-avgLinesWrap").selectAll("line")
                .data(avgLineData, function (d) {
                    return d.key;
                });

            var getAvgLineY = function (d) {
                //If average lines go off the svg element, clamp them to the svg bounds.
                var yVal = y(average(d));
                if (yVal < 0) return 0;
                if (yVal > availableHeight) return availableHeight;
                return yVal;
            };

            avgLines.enter()
                .append('line')
                .style('stroke-width', 2)
                .style('stroke-dasharray', '10,10')
                .style('stroke', function (d, i) {
                    return lines.color()(d, d.seriesIndex);
                })
                .attr('x1', 0)
                .attr('x2', availableWidth)
                .attr('y1', getAvgLineY)
                .attr('y2', getAvgLineY);

            avgLines
                .style('stroke-opacity', function (d) {
                    //If average lines go offscreen, make them transparent
                    var yVal = y(average(d));
                    if (yVal < 0 || yVal > availableHeight) return 0;
                    return 1;
                })
                .attr('x1', 0)
                .attr('x2', availableWidth)
                .attr('y1', getAvgLineY)
                .attr('y2', getAvgLineY);

            avgLines.exit().remove();

            //Create index line
            var indexLine = linesWrap.selectAll('.nv-indexLine')
                .data([index]);
            indexLine.enter().append('rect').attr('class', 'nv-indexLine')
                .attr('width', 3)
                .attr('x', -2)
                .attr('fill', 'red')
                .attr('fill-opacity', .5)
                .style("pointer-events", "all")
                .call(indexDrag);

            indexLine
                .attr('transform', function (d) {
                    return 'translate(' + dx(d.i) + ',0)'
                })
                .attr('height', availableHeight);

            // Setup Axes
            if (showXAxis) {
                xAxis
                    .scale(x)
                    .ticks(nv.utils.calcTicksX(availableWidth / 70, data))
                    .tickSize(-availableHeight, 0);

                g.select('.nv-x.nv-axis')
                    .attr('transform', 'translate(0,' + y.range()[0] + ')');
                g.select('.nv-x.nv-axis')
                    .call(xAxis);
            }

            if (showYAxis) {
                yAxis
                    .scale(y)
                    .ticks(nv.utils.calcTicksY(availableHeight / 36, data))
                    .tickSize(-availableWidth, 0);

                g.select('.nv-y.nv-axis')
                    .call(yAxis);
            }

            //============================================================
            // Event Handling/Dispatching (in chart's scope)
            //------------------------------------------------------------

            function updateZero() {
                indexLine
                    .data([index]);

                //When dragging the index line, turn off line transitions.
                // Then turn them back on when done dragging.
                var oldDuration = chart.duration();
                chart.duration(0);
                chart.update();
                chart.duration(oldDuration);
            }

            g.select('.nv-background rect')
                .on('click', function () {
                    index.x = d3.mouse(this)[0];
                    index.i = Math.round(dx.invert(index.x));

                    // update state and send stateChange with new index
                    state.index = index.i;
                    dispatch.stateChange(state);

                    updateZero();
                });

            lines.dispatch.on('elementClick', function (e) {
                index.i = e.pointIndex;
                index.x = dx(index.i);

                // update state and send stateChange with new index
                state.index = index.i;
                dispatch.stateChange(state);

                updateZero();
            });

            controls.dispatch.on('legendClick', function (d, i) {
                d.disabled = !d.disabled;
                rescaleY = !d.disabled;

                state.rescaleY = rescaleY;
                dispatch.stateChange(state);
                chart.update();
            });

            legend.dispatch.on('stateChange', function (newState) {
                for (var key in newState)
                    state[key] = newState[key];
                dispatch.stateChange(state);
                chart.update();
            });

            interactiveLayer.dispatch.on('elementMousemove', function (e) {
                lines.clearHighlights();
                var singlePoint, pointIndex, pointXLocation, allData = [];

                data
                    .filter(function (series, i) {
                        series.seriesIndex = i;
                        return !series.disabled;
                    })
                    .forEach(function (series, i) {
                        pointIndex = nv.interactiveBisect(series.values, e.pointXValue, chart.x());
                        lines.highlightPoint(i, pointIndex, true);
                        var point = series.values[pointIndex];
                        if (typeof point === 'undefined') return;
                        if (typeof singlePoint === 'undefined') singlePoint = point;
                        if (typeof pointXLocation === 'undefined') pointXLocation = chart.xScale()(chart.x()(point, pointIndex));
                        allData.push({
                            key: series.key,
                            value: chart.y()(point, pointIndex),
                            color: color(series, series.seriesIndex)
                        });
                    });

                //Highlight the tooltip entry based on which point the mouse is closest to.
                if (allData.length > 2) {
                    var yValue = chart.yScale().invert(e.mouseY);
                    var domainExtent = Math.abs(chart.yScale().domain()[0] - chart.yScale().domain()[1]);
                    var threshold = 0.03 * domainExtent;
                    var indexToHighlight = nv.nearestValueIndex(allData.map(function (d) {
                        return d.value
                    }), yValue, threshold);
                    if (indexToHighlight !== null)
                        allData[indexToHighlight].highlight = true;
                }

                var xValue = xAxis.tickFormat()(chart.x()(singlePoint, pointIndex), pointIndex);
                interactiveLayer.tooltip
                    .position({left: pointXLocation + margin.left, top: e.mouseY + margin.top})
                    .chartContainer(that.parentNode)
                    .enabled(tooltips)
                    .valueFormatter(function (d, i) {
                        return yAxis.tickFormat()(d);
                    })
                    .data(
                    {
                        value: xValue,
                        series: allData
                    }
                )();

                interactiveLayer.renderGuideLine(pointXLocation);
            });

            interactiveLayer.dispatch.on("elementMouseout", function (e) {
                dispatch.tooltipHide();
                lines.clearHighlights();
            });

            dispatch.on('tooltipShow', function (e) {
                if (tooltips) showTooltip(e, that.parentNode);
            });

            // Update chart from a state object passed to event handler
            dispatch.on('changeState', function (e) {

                if (typeof e.disabled !== 'undefined') {
                    data.forEach(function (series, i) {
                        series.disabled = e.disabled[i];
                    });

                    state.disabled = e.disabled;
                }

                if (typeof e.index !== 'undefined') {
                    index.i = e.index;
                    index.x = dx(index.i);

                    state.index = e.index;

                    indexLine
                        .data([index]);
                }

                if (typeof e.rescaleY !== 'undefined') {
                    rescaleY = e.rescaleY;
                }

                chart.update();
            });

        });

        renderWatch.renderEnd('cumulativeLineChart immediate');

        return chart;
    }

    //============================================================
    // Event Handling/Dispatching (out of chart's scope)
    //------------------------------------------------------------

    lines.dispatch.on('elementMouseover.tooltip', function (e) {
        e.pos = [e.pos[0] + margin.left, e.pos[1] + margin.top];
        dispatch.tooltipShow(e);
    });

    lines.dispatch.on('elementMouseout.tooltip', function (e) {
        dispatch.tooltipHide(e);
    });

    dispatch.on('tooltipHide', function () {
        if (tooltips) nv.tooltip.cleanup();
    });

    //============================================================
    // Functions
    //------------------------------------------------------------

    var indexifyYGetter = null;
    /* Normalize the data according to an index point. */
    function indexify(idx, data) {
        if (!indexifyYGetter) indexifyYGetter = lines.y();
        return data.map(function (line, i) {
            if (!line.values) {
                return line;
            }
            var indexValue = line.values[idx];
            if (indexValue == null) {
                return line;
            }
            var v = indexifyYGetter(indexValue, idx);

            //TODO: implement check below, and disable series if series loses 100% or more cause divide by 0 issue
            if (v < -.95 && !noErrorCheck) {
                //if a series loses more than 100%, calculations fail.. anything close can cause major distortion (but is mathematically correct till it hits 100)

                line.tempDisabled = true;
                return line;
            }

            line.tempDisabled = false;

            line.values = line.values.map(function (point, pointIndex) {
                point.display = {'y': (indexifyYGetter(point, pointIndex) - v) / (1 + v)};
                return point;
            });

            return line;
        })
    }

    //============================================================
    // Expose Public Variables
    //------------------------------------------------------------

    // expose chart's sub-components
    chart.dispatch = dispatch;
    chart.lines = lines;
    chart.legend = legend;
    chart.xAxis = xAxis;
    chart.yAxis = yAxis;
    chart.interactiveLayer = interactiveLayer;
    chart.state = state;

    chart.options = nv.utils.optionsFunc.bind(chart);

    chart._options = Object.create({}, {
        // simple options, just get/set the necessary values
        width: {
            get: function () {
                return width;
            }, set: function (_) {
                width = _;
            }
        },
        height: {
            get: function () {
                return height;
            }, set: function (_) {
                height = _;
            }
        },
        rescaleY: {
            get: function () {
                return rescaleY;
            }, set: function (_) {
                rescaleY = _;
            }
        },
        showControls: {
            get: function () {
                return showControls;
            }, set: function (_) {
                showControls = _;
            }
        },
        showLegend: {
            get: function () {
                return showLegend;
            }, set: function (_) {
                showLegend = _;
            }
        },
        average: {
            get: function () {
                return average;
            }, set: function (_) {
                average = _;
            }
        },
        tooltips: {
            get: function () {
                return tooltips;
            }, set: function (_) {
                tooltips = _;
            }
        },
        tooltipContent: {
            get: function () {
                return tooltip;
            }, set: function (_) {
                tooltip = _;
            }
        },
        defaultState: {
            get: function () {
                return defaultState;
            }, set: function (_) {
                defaultState = _;
            }
        },
        noData: {
            get: function () {
                return noData;
            }, set: function (_) {
                noData = _;
            }
        },
        showXAxis: {
            get: function () {
                return showXAxis;
            }, set: function (_) {
                showXAxis = _;
            }
        },
        showYAxis: {
            get: function () {
                return showYAxis;
            }, set: function (_) {
                showYAxis = _;
            }
        },
        noErrorCheck: {
            get: function () {
                return noErrorCheck;
            }, set: function (_) {
                noErrorCheck = _;
            }
        },

        // options that require extra logic in the setter
        margin: {
            get: function () {
                return margin;
            }, set: function (_) {
                margin.top = _.top !== undefined ? _.top : margin.top;
                margin.right = _.right !== undefined ? _.right : margin.right;
                margin.bottom = _.bottom !== undefined ? _.bottom : margin.bottom;
                margin.left = _.left !== undefined ? _.left : margin.left;
            }
        },
        color: {
            get: function () {
                return color;
            }, set: function (_) {
                color = nv.utils.getColor(_);
                legend.color(color);
            }
        },
        useInteractiveGuideline: {
            get: function () {
                return useInteractiveGuideline;
            }, set: function (_) {
                useInteractiveGuideline = _;
                if (_ === true) {
                    chart.interactive(false);
                    chart.useVoronoi(false);
                }
            }
        },
        rightAlignYAxis: {
            get: function () {
                return rightAlignYAxis;
            }, set: function (_) {
                rightAlignYAxis = _;
                yAxis.orient((_) ? 'right' : 'left');
            }
        },
        duration: {
            get: function () {
                return duration;
            }, set: function (_) {
                duration = _;
                lines.duration(duration);
                xAxis.duration(duration);
                yAxis.duration(duration);
                renderWatch.reset(duration);
            }
        }
    });

    nv.utils.inheritOptions(chart, lines);
    nv.utils.initOptions(chart);

    return chart;
};//TODO: consider deprecating by adding necessary features to multiBar model
nv.models.discreteBar = function () {
    "use strict";

    //============================================================
    // Public Variables with Default Settings
    //------------------------------------------------------------

    var margin = {top: 0, right: 0, bottom: 0, left: 0}
        , width = 960
        , height = 500
        , id = Math.floor(Math.random() * 10000) //Create semi-unique ID in case user doesn't select one
        , x = d3.scale.ordinal()
        , y = d3.scale.linear()
        , getX = function (d) {
            return d.x
        }
        , getY = function (d) {
            return d.y
        }
        , forceY = [0] // 0 is forced by default.. this makes sense for the majority of bar graphs... user can always do chart.forceY([]) to remove
        , color = nv.utils.defaultColor()
        , showValues = false
        , valueFormat = d3.format(',.2f')
        , xDomain
        , yDomain
        , xRange
        , yRange
        , dispatch = d3.dispatch('chartClick', 'elementClick', 'elementDblClick', 'elementMouseover', 'elementMouseout', 'renderEnd')
        , rectClass = 'discreteBar'
        , duration = 250
        ;

    //============================================================
    // Private Variables
    //------------------------------------------------------------

    var x0, y0;
    var renderWatch = nv.utils.renderWatch(dispatch, duration);

    function chart(selection) {
        renderWatch.reset();
        selection.each(function (data) {
            var availableWidth = width - margin.left - margin.right,
                availableHeight = height - margin.top - margin.bottom,
                container = d3.select(this);
            nv.utils.initSVG(container);

            //add series index to each data point for reference
            data.forEach(function (series, i) {
                series.values.forEach(function (point) {
                    point.series = i;
                });
            });

            // Setup Scales
            // remap and flatten the data for use in calculating the scales' domains
            var seriesData = (xDomain && yDomain) ? [] : // if we know xDomain and yDomain, no need to calculate
                data.map(function (d) {
                    return d.values.map(function (d, i) {
                        return {x: getX(d, i), y: getY(d, i), y0: d.y0}
                    })
                });

            x.domain(xDomain || d3.merge(seriesData).map(function (d) {
                return d.x
            }))
                .rangeBands(xRange || [0, availableWidth], .1);
            y.domain(yDomain || d3.extent(d3.merge(seriesData).map(function (d) {
                return d.y
            }).concat(forceY)));

            // If showValues, pad the Y axis range to account for label height
            if (showValues) y.range(yRange || [availableHeight - (y.domain()[0] < 0 ? 12 : 0), y.domain()[1] > 0 ? 12 : 0]);
            else y.range(yRange || [availableHeight, 0]);

            //store old scales if they exist
            x0 = x0 || x;
            y0 = y0 || y.copy().range([y(0), y(0)]);

            // Setup containers and skeleton of chart
            var wrap = container.selectAll('g.nv-wrap.nv-discretebar').data([data]);
            var wrapEnter = wrap.enter().append('g').attr('class', 'nvd3 nv-wrap nv-discretebar');
            var gEnter = wrapEnter.append('g');
            var g = wrap.select('g');

            gEnter.append('g').attr('class', 'nv-groups');
            wrap.attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

            //TODO: by definition, the discrete bar should not have multiple groups, will modify/remove later
            var groups = wrap.select('.nv-groups').selectAll('.nv-group')
                .data(function (d) {
                    return d
                }, function (d) {
                    return d.key
                });
            groups.enter().append('g')
                .style('stroke-opacity', 1e-6)
                .style('fill-opacity', 1e-6);
            groups.exit()
                .watchTransition(renderWatch, 'discreteBar: exit groups')
                .style('stroke-opacity', 1e-6)
                .style('fill-opacity', 1e-6)
                .remove();
            groups
                .attr('class', function (d, i) {
                    return 'nv-group nv-series-' + i
                })
                .classed('hover', function (d) {
                    return d.hover
                });
            groups
                .watchTransition(renderWatch, 'discreteBar: groups')
                .style('stroke-opacity', 1)
                .style('fill-opacity', .75);

            var bars = groups.selectAll('g.nv-bar')
                .data(function (d) {
                    return d.values
                });
            bars.exit().remove();

            var barsEnter = bars.enter().append('g')
                .attr('transform', function (d, i, j) {
                    return 'translate(' + (x(getX(d, i)) + x.rangeBand() * .05 ) + ', ' + y(0) + ')'
                })
                .on('mouseover', function (d, i) { //TODO: figure out why j works above, but not here
                    d3.select(this).classed('hover', true);
                    dispatch.elementMouseover({
                        value: getY(d, i),
                        point: d,
                        series: data[d.series],
                        pos: [x(getX(d, i)) + (x.rangeBand() * (d.series + .5) / data.length), y(getY(d, i))],  // TODO: Figure out why the value appears to be shifted
                        pointIndex: i,
                        seriesIndex: d.series,
                        e: d3.event
                    });
                })
                .on('mouseout', function (d, i) {
                    d3.select(this).classed('hover', false);
                    dispatch.elementMouseout({
                        value: getY(d, i),
                        point: d,
                        series: data[d.series],
                        pointIndex: i,
                        seriesIndex: d.series,
                        e: d3.event
                    });
                })
                .on('click', function (d, i) {
                    dispatch.elementClick({
                        value: getY(d, i),
                        point: d,
                        series: data[d.series],
                        pos: [x(getX(d, i)) + (x.rangeBand() * (d.series + .5) / data.length), y(getY(d, i))],  // TODO: Figure out why the value appears to be shifted
                        pointIndex: i,
                        seriesIndex: d.series,
                        e: d3.event
                    });
                    d3.event.stopPropagation();
                })
                .on('dblclick', function (d, i) {
                    dispatch.elementDblClick({
                        value: getY(d, i),
                        point: d,
                        series: data[d.series],
                        pos: [x(getX(d, i)) + (x.rangeBand() * (d.series + .5) / data.length), y(getY(d, i))],  // TODO: Figure out why the value appears to be shifted
                        pointIndex: i,
                        seriesIndex: d.series,
                        e: d3.event
                    });
                    d3.event.stopPropagation();
                });

            barsEnter.append('rect')
                .attr('height', 0)
                .attr('width', x.rangeBand() * .9 / data.length)

            if (showValues) {
                barsEnter.append('text')
                    .attr('text-anchor', 'middle')
                ;

                bars.select('text')
                    .text(function (d, i) {
                        return valueFormat(getY(d, i))
                    })
                    .watchTransition(renderWatch, 'discreteBar: bars text')
                    .attr('x', x.rangeBand() * .9 / 2)
                    .attr('y', function (d, i) {
                        return getY(d, i) < 0 ? y(getY(d, i)) - y(0) + 12 : -4
                    })

                ;
            }
            else {
                bars.selectAll('text').remove();
            }

            bars
                .attr('class', function (d, i) {
                    return getY(d, i) < 0 ? 'nv-bar negative' : 'nv-bar positive'
                })
                .style('fill', function (d, i) {
                    return d.color || color(d, i)
                })
                .style('stroke', function (d, i) {
                    return d.color || color(d, i)
                })
                .select('rect')
                .attr('class', rectClass)
                .watchTransition(renderWatch, 'discreteBar: bars rect')
                .attr('width', x.rangeBand() * .9 / data.length);
            bars.watchTransition(renderWatch, 'discreteBar: bars')
                //.delay(function(d,i) { return i * 1200 / data[0].values.length })
                .attr('transform', function (d, i) {
                    var left = x(getX(d, i)) + x.rangeBand() * .05,
                        top = getY(d, i) < 0 ?
                            y(0) :
                            y(0) - y(getY(d, i)) < 1 ?
                            y(0) - 1 : //make 1 px positive bars show up above y=0
                                y(getY(d, i));

                    return 'translate(' + left + ', ' + top + ')'
                })
                .select('rect')
                .attr('height', function (d, i) {
                    return Math.max(Math.abs(y(getY(d, i)) - y((yDomain && yDomain[0]) || 0)) || 1)
                });


            //store old scales for use in transitions on update
            x0 = x.copy();
            y0 = y.copy();

        });

        renderWatch.renderEnd('discreteBar immediate');
        return chart;
    }

    //============================================================
    // Expose Public Variables
    //------------------------------------------------------------

    chart.dispatch = dispatch;
    chart.options = nv.utils.optionsFunc.bind(chart);

    chart._options = Object.create({}, {
        // simple options, just get/set the necessary values
        width: {
            get: function () {
                return width;
            }, set: function (_) {
                width = _;
            }
        },
        height: {
            get: function () {
                return height;
            }, set: function (_) {
                height = _;
            }
        },
        forceY: {
            get: function () {
                return forceY;
            }, set: function (_) {
                forceY = _;
            }
        },
        showValues: {
            get: function () {
                return showValues;
            }, set: function (_) {
                showValues = _;
            }
        },
        x: {
            get: function () {
                return getX;
            }, set: function (_) {
                getX = _;
            }
        },
        y: {
            get: function () {
                return getY;
            }, set: function (_) {
                getY = _;
            }
        },
        xScale: {
            get: function () {
                return x;
            }, set: function (_) {
                x = _;
            }
        },
        yScale: {
            get: function () {
                return y;
            }, set: function (_) {
                y = _;
            }
        },
        xDomain: {
            get: function () {
                return xDomain;
            }, set: function (_) {
                xDomain = _;
            }
        },
        yDomain: {
            get: function () {
                return yDomain;
            }, set: function (_) {
                yDomain = _;
            }
        },
        xRange: {
            get: function () {
                return xRange;
            }, set: function (_) {
                xRange = _;
            }
        },
        yRange: {
            get: function () {
                return yRange;
            }, set: function (_) {
                yRange = _;
            }
        },
        valueFormat: {
            get: function () {
                return valueFormat;
            }, set: function (_) {
                valueFormat = _;
            }
        },
        id: {
            get: function () {
                return id;
            }, set: function (_) {
                id = _;
            }
        },
        rectClass: {
            get: function () {
                return rectClass;
            }, set: function (_) {
                rectClass = _;
            }
        },

        // options that require extra logic in the setter
        margin: {
            get: function () {
                return margin;
            }, set: function (_) {
                margin.top = _.top !== undefined ? _.top : margin.top;
                margin.right = _.right !== undefined ? _.right : margin.right;
                margin.bottom = _.bottom !== undefined ? _.bottom : margin.bottom;
                margin.left = _.left !== undefined ? _.left : margin.left;
            }
        },
        color: {
            get: function () {
                return color;
            }, set: function (_) {
                color = nv.utils.getColor(_);
            }
        },
        duration: {
            get: function () {
                return duration;
            }, set: function (_) {
                duration = _;
                renderWatch.reset(duration);
            }
        }
    });

    nv.utils.initOptions(chart);

    return chart;
};

nv.models.discreteBarChart = function () {
    "use strict";

    //============================================================
    // Public Variables with Default Settings
    //------------------------------------------------------------

    var discretebar = nv.models.discreteBar()
        , xAxis = nv.models.axis()
        , yAxis = nv.models.axis()
        ;

    var margin = {top: 15, right: 10, bottom: 50, left: 60}
        , width = null
        , height = null
        , color = nv.utils.getColor()
        , showXAxis = true
        , showYAxis = true
        , rightAlignYAxis = false
        , staggerLabels = false
        , tooltips = true
        , tooltip = function (key, x, y, e, graph) {
            return '<h3>' + x + '</h3>' +
                '<p>' + y + '</p>'
        }
        , x
        , y
        , noData = "No Data Available."
        , dispatch = d3.dispatch('tooltipShow', 'tooltipHide', 'beforeUpdate', 'renderEnd')
        , duration = 250
        ;

    xAxis
        .orient('bottom')
        .highlightZero(false)
        .showMaxMin(false)
        .tickFormat(function (d) {
            return d
        })
    ;
    yAxis
        .orient((rightAlignYAxis) ? 'right' : 'left')
        .tickFormat(d3.format(',.1f'))
    ;

    //============================================================
    // Private Variables
    //------------------------------------------------------------

    var showTooltip = function (e, offsetElement) {
        var left = e.pos[0] + ( offsetElement.offsetLeft || 0 ),
            top = e.pos[1] + ( offsetElement.offsetTop || 0),
            x = xAxis.tickFormat()(discretebar.x()(e.point, e.pointIndex)),
            y = yAxis.tickFormat()(discretebar.y()(e.point, e.pointIndex)),
            content = tooltip(e.series.key, x, y, e, chart);

        nv.tooltip.show([left, top], content, e.value < 0 ? 'n' : 's', null, offsetElement);
    };

    var renderWatch = nv.utils.renderWatch(dispatch, duration);

    function chart(selection) {
        renderWatch.reset();
        renderWatch.models(discretebar);
        if (showXAxis) renderWatch.models(xAxis);
        if (showYAxis) renderWatch.models(yAxis);

        selection.each(function (data) {
            var container = d3.select(this),
                that = this;
            nv.utils.initSVG(container);
            var availableWidth = (width || parseInt(container.style('width')) || 960)
                    - margin.left - margin.right,
                availableHeight = (height || parseInt(container.style('height')) || 400)
                    - margin.top - margin.bottom;

            chart.update = function () {
                dispatch.beforeUpdate();
                container.transition().duration(duration).call(chart);
            };
            chart.container = this;

            // Display No Data message if there's nothing to show.
            if (!data || !data.length || !data.filter(function (d) {
                    return d.values.length
                }).length) {
                var noDataText = container.selectAll('.nv-noData').data([noData]);

                noDataText.enter().append('text')
                    .attr('class', 'nvd3 nv-noData')
                    .attr('dy', '-.7em')
                    .style('text-anchor', 'middle');

                noDataText
                    .attr('x', margin.left + availableWidth / 2)
                    .attr('y', margin.top + availableHeight / 2)
                    .text(function (d) {
                        return d
                    });

                return chart;
            }
            else {
                container.selectAll('.nv-noData').remove();
            }

            // Setup Scales
            x = discretebar.xScale();
            y = discretebar.yScale().clamp(true);

            // Setup containers and skeleton of chart
            var wrap = container.selectAll('g.nv-wrap.nv-discreteBarWithAxes').data([data]);
            var gEnter = wrap.enter().append('g').attr('class', 'nvd3 nv-wrap nv-discreteBarWithAxes').append('g');
            var defsEnter = gEnter.append('defs');
            var g = wrap.select('g');

            gEnter.append('g').attr('class', 'nv-x nv-axis');
            gEnter.append('g').attr('class', 'nv-y nv-axis')
                .append('g').attr('class', 'nv-zeroLine')
                .append('line');

            gEnter.append('g').attr('class', 'nv-barsWrap');

            g.attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

            if (rightAlignYAxis) {
                g.select(".nv-y.nv-axis")
                    .attr("transform", "translate(" + availableWidth + ",0)");
            }

            // Main Chart Component(s)
            discretebar
                .width(availableWidth)
                .height(availableHeight);

            var barsWrap = g.select('.nv-barsWrap')
                .datum(data.filter(function (d) {
                    return !d.disabled
                }))

            barsWrap.transition().call(discretebar);


            defsEnter.append('clipPath')
                .attr('id', 'nv-x-label-clip-' + discretebar.id())
                .append('rect');

            g.select('#nv-x-label-clip-' + discretebar.id() + ' rect')
                .attr('width', x.rangeBand() * (staggerLabels ? 2 : 1))
                .attr('height', 16)
                .attr('x', -x.rangeBand() / (staggerLabels ? 1 : 2 ));

            // Setup Axes
            if (showXAxis) {
                xAxis
                    .scale(x)
                    .ticks(nv.utils.calcTicksX(availableWidth / 100, data))
                    .tickSize(-availableHeight, 0);

                g.select('.nv-x.nv-axis')
                    .attr('transform', 'translate(0,' + (y.range()[0] + ((discretebar.showValues() && y.domain()[0] < 0) ? 16 : 0)) + ')');
                g.select('.nv-x.nv-axis').call(xAxis);

                var xTicks = g.select('.nv-x.nv-axis').selectAll('g');
                if (staggerLabels) {
                    xTicks
                        .selectAll('text')
                        .attr('transform', function (d, i, j) {
                            return 'translate(0,' + (j % 2 == 0 ? '5' : '17') + ')'
                        })
                }
            }

            if (showYAxis) {
                yAxis
                    .scale(y)
                    .ticks(nv.utils.calcTicksY(availableHeight / 36, data))
                    .tickSize(-availableWidth, 0);

                g.select('.nv-y.nv-axis').call(yAxis);
            }

            // Zero line
            g.select(".nv-zeroLine line")
                .attr("x1", 0)
                .attr("x2", availableWidth)
                .attr("y1", y(0))
                .attr("y2", y(0))
            ;

            //============================================================
            // Event Handling/Dispatching (in chart's scope)
            //------------------------------------------------------------

            dispatch.on('tooltipShow', function (e) {
                if (tooltips) showTooltip(e, that.parentNode);
            });

        });

        renderWatch.renderEnd('discreteBar chart immediate');
        return chart;
    }

    //============================================================
    // Event Handling/Dispatching (out of chart's scope)
    //------------------------------------------------------------

    discretebar.dispatch.on('elementMouseover.tooltip', function (e) {
        e.pos = [e.pos[0] + margin.left, e.pos[1] + margin.top];
        dispatch.tooltipShow(e);
    });

    discretebar.dispatch.on('elementMouseout.tooltip', function (e) {
        dispatch.tooltipHide(e);
    });

    dispatch.on('tooltipHide', function () {
        if (tooltips) nv.tooltip.cleanup();
    });

    //============================================================
    // Expose Public Variables
    //------------------------------------------------------------

    chart.dispatch = dispatch;
    chart.discretebar = discretebar;
    chart.xAxis = xAxis;
    chart.yAxis = yAxis;

    chart.options = nv.utils.optionsFunc.bind(chart);

    chart._options = Object.create({}, {
        // simple options, just get/set the necessary values
        width: {
            get: function () {
                return width;
            }, set: function (_) {
                width = _;
            }
        },
        height: {
            get: function () {
                return height;
            }, set: function (_) {
                height = _;
            }
        },
        staggerLabels: {
            get: function () {
                return staggerLabels;
            }, set: function (_) {
                staggerLabels = _;
            }
        },
        showXAxis: {
            get: function () {
                return showXAxis;
            }, set: function (_) {
                showXAxis = _;
            }
        },
        showYAxis: {
            get: function () {
                return showYAxis;
            }, set: function (_) {
                showYAxis = _;
            }
        },
        tooltips: {
            get: function () {
                return tooltips;
            }, set: function (_) {
                tooltips = _;
            }
        },
        tooltipContent: {
            get: function () {
                return tooltip;
            }, set: function (_) {
                tooltip = _;
            }
        },
        noData: {
            get: function () {
                return noData;
            }, set: function (_) {
                noData = _;
            }
        },

        // options that require extra logic in the setter
        margin: {
            get: function () {
                return margin;
            }, set: function (_) {
                margin.top = _.top !== undefined ? _.top : margin.top;
                margin.right = _.right !== undefined ? _.right : margin.right;
                margin.bottom = _.bottom !== undefined ? _.bottom : margin.bottom;
                margin.left = _.left !== undefined ? _.left : margin.left;
            }
        },
        duration: {
            get: function () {
                return duration;
            }, set: function (_) {
                duration = _;
                renderWatch.reset(duration);
                discretebar.duration(duration);
                xAxis.duration(duration);
                yAxis.duration(duration);
            }
        },
        color: {
            get: function () {
                return color;
            }, set: function (_) {
                color = nv.utils.getColor(_);
                discretebar.color(color);
            }
        },
        rightAlignYAxis: {
            get: function () {
                return rightAlignYAxis;
            }, set: function (_) {
                rightAlignYAxis = _;
                yAxis.orient((_) ? 'right' : 'left');
            }
        }
    });

    nv.utils.inheritOptions(chart, discretebar);
    nv.utils.initOptions(chart);

    return chart;
};


//TODO: consider deprecating and using multibar with single series for this
nv.models.historicalBar = function () {
    "use strict";

    //============================================================
    // Public Variables with Default Settings
    //------------------------------------------------------------

    var margin = {top: 0, right: 0, bottom: 0, left: 0}
        , width = null
        , height = null
        , id = Math.floor(Math.random() * 10000) //Create semi-unique ID in case user doesn't select one
        , x = d3.scale.linear()
        , y = d3.scale.linear()
        , getX = function (d) {
            return d.x
        }
        , getY = function (d) {
            return d.y
        }
        , forceX = []
        , forceY = [0]
        , padData = false
        , clipEdge = true
        , color = nv.utils.defaultColor()
        , xDomain
        , yDomain
        , xRange
        , yRange
        , dispatch = d3.dispatch('chartClick', 'elementClick', 'elementDblClick', 'elementMouseover', 'elementMouseout', 'renderEnd')
        , interactive = true
        ;

    var renderWatch = nv.utils.renderWatch(dispatch, 0);

    function chart(selection) {
        selection.each(function (data) {
            renderWatch.reset();

            var container = d3.select(this);
            var availableWidth = (width || parseInt(container.style('width')) || 960)
                - margin.left - margin.right;
            var availableHeight = (height || parseInt(container.style('height')) || 400)
                - margin.top - margin.bottom;

            nv.utils.initSVG(container);

            // Setup Scales
            x.domain(xDomain || d3.extent(data[0].values.map(getX).concat(forceX)));

            if (padData)
                x.range(xRange || [availableWidth * .5 / data[0].values.length, availableWidth * (data[0].values.length - .5) / data[0].values.length]);
            else
                x.range(xRange || [0, availableWidth]);

            y.domain(yDomain || d3.extent(data[0].values.map(getY).concat(forceY)))
                .range(yRange || [availableHeight, 0]);

            // If scale's domain don't have a range, slightly adjust to make one... so a chart can show a single data point
            if (x.domain()[0] === x.domain()[1])
                x.domain()[0] ?
                    x.domain([x.domain()[0] - x.domain()[0] * 0.01, x.domain()[1] + x.domain()[1] * 0.01])
                    : x.domain([-1, 1]);

            if (y.domain()[0] === y.domain()[1])
                y.domain()[0] ?
                    y.domain([y.domain()[0] + y.domain()[0] * 0.01, y.domain()[1] - y.domain()[1] * 0.01])
                    : y.domain([-1, 1]);

            // Setup containers and skeleton of chart
            var wrap = container.selectAll('g.nv-wrap.nv-historicalBar-' + id).data([data[0].values]);
            var wrapEnter = wrap.enter().append('g').attr('class', 'nvd3 nv-wrap nv-historicalBar-' + id);
            var defsEnter = wrapEnter.append('defs');
            var gEnter = wrapEnter.append('g');
            var g = wrap.select('g');

            gEnter.append('g').attr('class', 'nv-bars');
            wrap.attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

            container
                .on('click', function (d, i) {
                    dispatch.chartClick({
                        data: d,
                        index: i,
                        pos: d3.event,
                        id: id
                    });
                });

            defsEnter.append('clipPath')
                .attr('id', 'nv-chart-clip-path-' + id)
                .append('rect');

            wrap.select('#nv-chart-clip-path-' + id + ' rect')
                .attr('width', availableWidth)
                .attr('height', availableHeight);

            g.attr('clip-path', clipEdge ? 'url(#nv-chart-clip-path-' + id + ')' : '');

            var bars = wrap.select('.nv-bars').selectAll('.nv-bar')
                .data(function (d) {
                    return d
                }, function (d, i) {
                    return getX(d, i)
                });
            bars.exit().remove();

            var barsEnter = bars.enter().append('rect')
                .attr('x', 0)
                .attr('y', function (d, i) {
                    return nv.utils.NaNtoZero(y(Math.max(0, getY(d, i))))
                })
                .attr('height', function (d, i) {
                    return nv.utils.NaNtoZero(Math.abs(y(getY(d, i)) - y(0)))
                })
                .attr('transform', function (d, i) {
                    return 'translate(' + (x(getX(d, i)) - availableWidth / data[0].values.length * .45) + ',0)';
                })
                .on('mouseover', function (d, i) {
                    if (!interactive) return;
                    d3.select(this).classed('hover', true);
                    dispatch.elementMouseover({
                        point: d,
                        series: data[0],
                        pos: [x(getX(d, i)), y(getY(d, i))],  // TODO: Figure out why the value appears to be shifted
                        pointIndex: i,
                        seriesIndex: 0,
                        e: d3.event
                    });

                })
                .on('mouseout', function (d, i) {
                    if (!interactive) return;
                    d3.select(this).classed('hover', false);
                    dispatch.elementMouseout({
                        point: d,
                        series: data[0],
                        pointIndex: i,
                        seriesIndex: 0,
                        e: d3.event
                    });
                })
                .on('click', function (d, i) {
                    if (!interactive) return;
                    dispatch.elementClick({
                        //label: d[label],
                        value: getY(d, i),
                        data: d,
                        index: i,
                        pos: [x(getX(d, i)), y(getY(d, i))],
                        e: d3.event,
                        id: id
                    });
                    d3.event.stopPropagation();
                })
                .on('dblclick', function (d, i) {
                    if (!interactive) return;
                    dispatch.elementDblClick({
                        //label: d[label],
                        value: getY(d, i),
                        data: d,
                        index: i,
                        pos: [x(getX(d, i)), y(getY(d, i))],
                        e: d3.event,
                        id: id
                    });
                    d3.event.stopPropagation();
                });

            bars
                .attr('fill', function (d, i) {
                    return color(d, i);
                })
                .attr('class', function (d, i, j) {
                    return (getY(d, i) < 0 ? 'nv-bar negative' : 'nv-bar positive') + ' nv-bar-' + j + '-' + i
                })
                .watchTransition(renderWatch, 'bars')
                .attr('transform', function (d, i) {
                    return 'translate(' + (x(getX(d, i)) - availableWidth / data[0].values.length * .45) + ',0)';
                })
                //TODO: better width calculations that don't assume always uniform data spacing;w
                .attr('width', (availableWidth / data[0].values.length) * .9);

            bars.watchTransition(renderWatch, 'bars')
                .attr('y', function (d, i) {
                    var rval = getY(d, i) < 0 ?
                        y(0) :
                        y(0) - y(getY(d, i)) < 1 ?
                        y(0) - 1 :
                            y(getY(d, i));
                    return nv.utils.NaNtoZero(rval);
                })
                .attr('height', function (d, i) {
                    return nv.utils.NaNtoZero(Math.max(Math.abs(y(getY(d, i)) - y(0)), 1))
                });

        });

        renderWatch.renderEnd('historicalBar immediate');
        return chart;
    }

    //Create methods to allow outside functions to highlight a specific bar.
    chart.highlightPoint = function (pointIndex, isHoverOver) {
        d3.select(".nv-historicalBar-" + id)
            .select(".nv-bars .nv-bar-0-" + pointIndex)
            .classed("hover", isHoverOver)
        ;
    };

    chart.clearHighlights = function () {
        d3.select(".nv-historicalBar-" + id)
            .select(".nv-bars .nv-bar.hover")
            .classed("hover", false)
        ;
    };

    //============================================================
    // Expose Public Variables
    //------------------------------------------------------------

    chart.dispatch = dispatch;
    chart.options = nv.utils.optionsFunc.bind(chart);

    chart._options = Object.create({}, {
        // simple options, just get/set the necessary values
        width: {
            get: function () {
                return width;
            }, set: function (_) {
                width = _;
            }
        },
        height: {
            get: function () {
                return height;
            }, set: function (_) {
                height = _;
            }
        },
        forceX: {
            get: function () {
                return forceX;
            }, set: function (_) {
                forceX = _;
            }
        },
        forceY: {
            get: function () {
                return forceY;
            }, set: function (_) {
                forceY = _;
            }
        },
        padData: {
            get: function () {
                return padData;
            }, set: function (_) {
                padData = _;
            }
        },
        x: {
            get: function () {
                return getX;
            }, set: function (_) {
                getX = _;
            }
        },
        y: {
            get: function () {
                return getY;
            }, set: function (_) {
                getY = _;
            }
        },
        xScale: {
            get: function () {
                return x;
            }, set: function (_) {
                x = _;
            }
        },
        yScale: {
            get: function () {
                return y;
            }, set: function (_) {
                y = _;
            }
        },
        xDomain: {
            get: function () {
                return xDomain;
            }, set: function (_) {
                xDomain = _;
            }
        },
        yDomain: {
            get: function () {
                return yDomain;
            }, set: function (_) {
                yDomain = _;
            }
        },
        xRange: {
            get: function () {
                return xRange;
            }, set: function (_) {
                xRange = _;
            }
        },
        yRange: {
            get: function () {
                return yRange;
            }, set: function (_) {
                yRange = _;
            }
        },
        clipEdge: {
            get: function () {
                return clipEdge;
            }, set: function (_) {
                clipEdge = _;
            }
        },
        id: {
            get: function () {
                return id;
            }, set: function (_) {
                id = _;
            }
        },
        interactive: {
            get: function () {
                return interactive;
            }, set: function (_) {
                interactive = _;
            }
        },

        // options that require extra logic in the setter
        margin: {
            get: function () {
                return margin;
            }, set: function (_) {
                margin.top = _.top !== undefined ? _.top : margin.top;
                margin.right = _.right !== undefined ? _.right : margin.right;
                margin.bottom = _.bottom !== undefined ? _.bottom : margin.bottom;
                margin.left = _.left !== undefined ? _.left : margin.left;
            }
        },
        color: {
            get: function () {
                return color;
            }, set: function (_) {
                color = nv.utils.getColor(_);
            }
        }
    });

    nv.utils.initOptions(chart);

    return chart;
};

nv.models.historicalBarChart = function (bar_model) {
    "use strict";

    //============================================================
    // Public Variables with Default Settings
    //------------------------------------------------------------

    var bars = bar_model || nv.models.historicalBar()
        , xAxis = nv.models.axis()
        , yAxis = nv.models.axis()
        , legend = nv.models.legend()
        , interactiveLayer = nv.interactiveGuideline()
        ;


    var margin = {top: 30, right: 90, bottom: 50, left: 90}
        , color = nv.utils.defaultColor()
        , width = null
        , height = null
        , showLegend = false
        , showXAxis = true
        , showYAxis = true
        , rightAlignYAxis = false
        , useInteractiveGuideline = false
        , tooltips = true
        , tooltip = function (key, x, y, e, graph) {
            return '<h3>' + key + '</h3>' +
                '<p>' + y + ' at ' + x + '</p>'
        }
        , x
        , y
        , state = {}
        , defaultState = null
        , noData = 'No Data Available.'
        , dispatch = d3.dispatch('tooltipShow', 'tooltipHide', 'stateChange', 'changeState', 'renderEnd')
        , transitionDuration = 250
        ;

    xAxis
        .orient('bottom')
        .tickPadding(7)
    ;
    yAxis
        .orient((rightAlignYAxis) ? 'right' : 'left')
    ;

    //============================================================
    // Private Variables
    //------------------------------------------------------------

    var showTooltip = function (e, offsetElement) {

        // New addition to calculate position if SVG is scaled with viewBox, may move TODO: consider implementing everywhere else
        if (offsetElement) {
            var svg = d3.select(offsetElement).select('svg');
            var viewBox = (svg.node()) ? svg.attr('viewBox') : null;
            if (viewBox) {
                viewBox = viewBox.split(' ');
                var ratio = parseInt(svg.style('width')) / viewBox[2];
                e.pos[0] = e.pos[0] * ratio;
                e.pos[1] = e.pos[1] * ratio;
            }
        }

        var left = e.pos[0] + ( offsetElement.offsetLeft || 0 ),
            top = e.pos[1] + ( offsetElement.offsetTop || 0),
            x = xAxis.tickFormat()(bars.x()(e.point, e.pointIndex)),
            y = yAxis.tickFormat()(bars.y()(e.point, e.pointIndex)),
            content = tooltip(e.series.key, x, y, e, chart);

        nv.tooltip.show([left, top], content, null, null, offsetElement);
    };
    var renderWatch = nv.utils.renderWatch(dispatch, 0);

    function chart(selection) {
        selection.each(function (data) {
            renderWatch.reset();
            renderWatch.models(bars);
            if (showXAxis) renderWatch.models(xAxis);
            if (showYAxis) renderWatch.models(yAxis);

            var container = d3.select(this),
                that = this;
            nv.utils.initSVG(container);
            var availableWidth = (width || parseInt(container.style('width')) || 960)
                    - margin.left - margin.right,
                availableHeight = (height || parseInt(container.style('height')) || 400)
                    - margin.top - margin.bottom;


            chart.update = function () {
                container.transition().duration(transitionDuration).call(chart)
            };
            chart.container = this;

            //set state.disabled
            state.disabled = data.map(function (d) {
                return !!d.disabled
            });

            if (!defaultState) {
                var key;
                defaultState = {};
                for (key in state) {
                    if (state[key] instanceof Array)
                        defaultState[key] = state[key].slice(0);
                    else
                        defaultState[key] = state[key];
                }
            }

            // Display noData message if there's nothing to show.
            if (!data || !data.length || !data.filter(function (d) {
                    return d.values.length
                }).length) {
                var noDataText = container.selectAll('.nv-noData').data([noData]);

                noDataText.enter().append('text')
                    .attr('class', 'nvd3 nv-noData')
                    .attr('dy', '-.7em')
                    .style('text-anchor', 'middle');

                noDataText
                    .attr('x', margin.left + availableWidth / 2)
                    .attr('y', margin.top + availableHeight / 2)
                    .text(function (d) {
                        return d
                    });

                return chart;
            }
            else {
                container.selectAll('.nv-noData').remove();
            }

            // Setup Scales
            x = bars.xScale();
            y = bars.yScale();

            // Setup containers and skeleton of chart
            var wrap = container.selectAll('g.nv-wrap.nv-historicalBarChart').data([data]);
            var gEnter = wrap.enter().append('g').attr('class', 'nvd3 nv-wrap nv-historicalBarChart').append('g');
            var g = wrap.select('g');

            gEnter.append('g').attr('class', 'nv-x nv-axis');
            gEnter.append('g').attr('class', 'nv-y nv-axis');
            gEnter.append('g').attr('class', 'nv-barsWrap');
            gEnter.append('g').attr('class', 'nv-legendWrap');
            gEnter.append('g').attr('class', 'nv-interactive');

            // Legend
            if (showLegend) {
                legend.width(availableWidth);

                g.select('.nv-legendWrap')
                    .datum(data)
                    .call(legend);

                if (margin.top != legend.height()) {
                    margin.top = legend.height();
                    availableHeight = (height || parseInt(container.style('height')) || 400)
                    - margin.top - margin.bottom;
                }

                wrap.select('.nv-legendWrap')
                    .attr('transform', 'translate(0,' + (-margin.top) + ')')
            }
            wrap.attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

            if (rightAlignYAxis) {
                g.select(".nv-y.nv-axis")
                    .attr("transform", "translate(" + availableWidth + ",0)");
            }

            //Set up interactive layer
            if (useInteractiveGuideline) {
                interactiveLayer
                    .width(availableWidth)
                    .height(availableHeight)
                    .margin({left: margin.left, top: margin.top})
                    .svgContainer(container)
                    .xScale(x);
                wrap.select(".nv-interactive").call(interactiveLayer);
            }
            bars
                .width(availableWidth)
                .height(availableHeight)
                .color(data.map(function (d, i) {
                    return d.color || color(d, i);
                }).filter(function (d, i) {
                    return !data[i].disabled
                }));

            var barsWrap = g.select('.nv-barsWrap')
                .datum(data.filter(function (d) {
                    return !d.disabled
                }));
            barsWrap.transition().call(bars);

            // Setup Axes
            if (showXAxis) {
                xAxis
                    .scale(x)
                    .tickSize(-availableHeight, 0);

                g.select('.nv-x.nv-axis')
                    .attr('transform', 'translate(0,' + y.range()[0] + ')');
                g.select('.nv-x.nv-axis')
                    .transition()
                    .call(xAxis);
            }

            if (showYAxis) {
                yAxis
                    .scale(y)
                    .ticks(nv.utils.calcTicksY(availableHeight / 36, data))
                    .tickSize(-availableWidth, 0);

                g.select('.nv-y.nv-axis')
                    .transition()
                    .call(yAxis);
            }

            //============================================================
            // Event Handling/Dispatching (in chart's scope)
            //------------------------------------------------------------

            interactiveLayer.dispatch.on('elementMousemove', function (e) {
                bars.clearHighlights();

                var singlePoint, pointIndex, pointXLocation, allData = [];
                data
                    .filter(function (series, i) {
                        series.seriesIndex = i;
                        return !series.disabled;
                    })
                    .forEach(function (series, i) {
                        pointIndex = nv.interactiveBisect(series.values, e.pointXValue, chart.x());
                        bars.highlightPoint(pointIndex, true);
                        var point = series.values[pointIndex];
                        if (typeof point === 'undefined') return;
                        if (typeof singlePoint === 'undefined') singlePoint = point;
                        if (typeof pointXLocation === 'undefined') pointXLocation = chart.xScale()(chart.x()(point, pointIndex));
                        allData.push({
                            key: series.key,
                            value: chart.y()(point, pointIndex),
                            color: color(series, series.seriesIndex),
                            data: series.values[pointIndex]
                        });
                    });

                var xValue = xAxis.tickFormat()(chart.x()(singlePoint, pointIndex));
                interactiveLayer.tooltip
                    .position({left: pointXLocation + margin.left, top: e.mouseY + margin.top})
                    .chartContainer(that.parentNode)
                    .enabled(tooltips)
                    .valueFormatter(function (d, i) {
                        return yAxis.tickFormat()(d);
                    })
                    .data(
                    {
                        value: xValue,
                        series: allData
                    }
                )();

                interactiveLayer.renderGuideLine(pointXLocation);

            });

            interactiveLayer.dispatch.on("elementMouseout", function (e) {
                dispatch.tooltipHide();
                bars.clearHighlights();
            });

            legend.dispatch.on('legendClick', function (d, i) {
                d.disabled = !d.disabled;

                if (!data.filter(function (d) {
                        return !d.disabled
                    }).length) {
                    data.map(function (d) {
                        d.disabled = false;
                        wrap.selectAll('.nv-series').classed('disabled', false);
                        return d;
                    });
                }

                state.disabled = data.map(function (d) {
                    return !!d.disabled
                });
                dispatch.stateChange(state);

                selection.transition().call(chart);
            });

            legend.dispatch.on('legendDblclick', function (d) {
                //Double clicking should always enable current series, and disabled all others.
                data.forEach(function (d) {
                    d.disabled = true;
                });
                d.disabled = false;

                state.disabled = data.map(function (d) {
                    return !!d.disabled
                });
                dispatch.stateChange(state);
                chart.update();
            });

            dispatch.on('tooltipShow', function (e) {
                if (tooltips) showTooltip(e, that.parentNode);
            });

            dispatch.on('changeState', function (e) {

                if (typeof e.disabled !== 'undefined') {
                    data.forEach(function (series, i) {
                        series.disabled = e.disabled[i];
                    });

                    state.disabled = e.disabled;
                }

                chart.update();
            });
        });

        renderWatch.renderEnd('historicalBarChart immediate');
        return chart;
    }

    //============================================================
    // Event Handling/Dispatching (out of chart's scope)
    //------------------------------------------------------------

    bars.dispatch.on('elementMouseover.tooltip', function (e) {
        e.pos = [e.pos[0] + margin.left, e.pos[1] + margin.top];
        dispatch.tooltipShow(e);
    });

    bars.dispatch.on('elementMouseout.tooltip', function (e) {
        dispatch.tooltipHide(e);
    });

    dispatch.on('tooltipHide', function () {
        if (tooltips) nv.tooltip.cleanup();
    });

    //============================================================
    // Expose Public Variables
    //------------------------------------------------------------

    // expose chart's sub-components
    chart.dispatch = dispatch;
    chart.bars = bars;
    chart.legend = legend;
    chart.xAxis = xAxis;
    chart.yAxis = yAxis;
    chart.interactiveLayer = interactiveLayer;

    chart.options = nv.utils.optionsFunc.bind(chart);

    chart._options = Object.create({}, {
        // simple options, just get/set the necessary values
        width: {
            get: function () {
                return width;
            }, set: function (_) {
                width = _;
            }
        },
        height: {
            get: function () {
                return height;
            }, set: function (_) {
                height = _;
            }
        },
        showLegend: {
            get: function () {
                return showLegend;
            }, set: function (_) {
                showLegend = _;
            }
        },
        showXAxis: {
            get: function () {
                return showXAxis;
            }, set: function (_) {
                showXAxis = _;
            }
        },
        showYAxis: {
            get: function () {
                return showYAxis;
            }, set: function (_) {
                showYAxis = _;
            }
        },
        tooltips: {
            get: function () {
                return tooltips;
            }, set: function (_) {
                tooltips = _;
            }
        },
        tooltipContent: {
            get: function () {
                return tooltip;
            }, set: function (_) {
                tooltip = _;
            }
        },
        defaultState: {
            get: function () {
                return defaultState;
            }, set: function (_) {
                defaultState = _;
            }
        },
        noData: {
            get: function () {
                return noData;
            }, set: function (_) {
                noData = _;
            }
        },

        // options that require extra logic in the setter
        margin: {
            get: function () {
                return margin;
            }, set: function (_) {
                margin.top = _.top !== undefined ? _.top : margin.top;
                margin.right = _.right !== undefined ? _.right : margin.right;
                margin.bottom = _.bottom !== undefined ? _.bottom : margin.bottom;
                margin.left = _.left !== undefined ? _.left : margin.left;
            }
        },
        color: {
            get: function () {
                return color;
            }, set: function (_) {
                color = nv.utils.getColor(_);
                legend.color(color);
                bars.color(color);
            }
        },
        duration: {
            get: function () {
                return transitionDuration;
            }, set: function (_) {
                transitionDuration = _;
                renderWatch.reset(transitionDuration);
                yAxis.duration(transitionDuration);
                xAxis.duration(transitionDuration);
            }
        },
        rightAlignYAxis: {
            get: function () {
                return rightAlignYAxis;
            }, set: function (_) {
                rightAlignYAxis = _;
                yAxis.orient((_) ? 'right' : 'left');
            }
        },
        useInteractiveGuideline: {
            get: function () {
                return useInteractiveGuideline;
            }, set: function (_) {
                useInteractiveGuideline = _;
                if (_ === true) {
                    chart.interactive(false);
                }
            }
        }
    });

    nv.utils.inheritOptions(chart, bars);
    nv.utils.initOptions(chart);

    return chart;
};


// ohlcChart is just a historical chart with oclc bars and some tweaks
nv.models.ohlcBarChart = function () {
    var chart = nv.models.historicalBarChart(nv.models.ohlcBar());

    // special default tooltip since we show multiple values per x
    chart.useInteractiveGuideline(true);
    chart.interactiveLayer.tooltip.contentGenerator(function (data) {
        // we assume only one series exists for this chart
        var d = data.series[0].data;
        // match line colors as defined in nv.d3.css
        var color = d.open < d.close ? "2ca02c" : "d62728";
        return '' +
            '<h3 style="color: #' + color + '">' + data.value + '</h3>' +
            '<table>' +
            '<tr><td>open:</td><td>' + chart.yAxis.tickFormat()(d.open) + '</td></tr>' +
            '<tr><td>close:</td><td>' + chart.yAxis.tickFormat()(d.close) + '</td></tr>' +
            '<tr><td>high</td><td>' + chart.yAxis.tickFormat()(d.high) + '</td></tr>' +
            '<tr><td>low:</td><td>' + chart.yAxis.tickFormat()(d.low) + '</td></tr>' +
            '</table>';
    });
    return chart;
};


nv.models.line = function () {
    "use strict";
    //============================================================
    // Public Variables with Default Settings
    //------------------------------------------------------------

    var scatter = nv.models.scatter()
        ;

    var margin = {top: 0, right: 0, bottom: 0, left: 0}
        , width = 960
        , height = 500
        , color = nv.utils.defaultColor() // a function that returns a color
        , getX = function (d) {
            return d.x
        } // accessor to get the x value from a data point
        , getY = function (d) {
            return d.y
        } // accessor to get the y value from a data point
        , defined = function (d, i) {
            return !isNaN(getY(d, i)) && getY(d, i) !== null
        } // allows a line to be not continuous when it is not defined
        , isArea = function (d) {
            return d.area
        } // decides if a line is an area or just a line
        , clipEdge = false // if true, masks lines within x and y scale
        , x //can be accessed via chart.xScale()
        , y //can be accessed via chart.yScale()
        , interpolate = "linear" // controls the line interpolation
        , duration = 250
        , dispatch = d3.dispatch('elementClick', 'elementMouseover', 'elementMouseout', 'renderEnd')
        ;

    scatter
        .pointSize(16) // default size
        .pointDomain([16, 256]) //set to speed up calculation, needs to be unset if there is a custom size accessor
    ;

    //============================================================


    //============================================================
    // Private Variables
    //------------------------------------------------------------

    var x0, y0 //used to store previous scales
        , renderWatch = nv.utils.renderWatch(dispatch, duration)
        ;

    //============================================================


    function chart(selection) {
        renderWatch.reset();
        renderWatch.models(scatter);
        selection.each(function (data) {
            var availableWidth = width - margin.left - margin.right,
                availableHeight = height - margin.top - margin.bottom,
                container = d3.select(this);
            nv.utils.initSVG(container);

            // Setup Scales
            x = scatter.xScale();
            y = scatter.yScale();

            x0 = x0 || x;
            y0 = y0 || y;

            // Setup containers and skeleton of chart
            var wrap = container.selectAll('g.nv-wrap.nv-line').data([data]);
            var wrapEnter = wrap.enter().append('g').attr('class', 'nvd3 nv-wrap nv-line');
            var defsEnter = wrapEnter.append('defs');
            var gEnter = wrapEnter.append('g');
            var g = wrap.select('g');

            gEnter.append('g').attr('class', 'nv-groups');
            gEnter.append('g').attr('class', 'nv-scatterWrap');

            wrap.attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

            scatter
                .width(availableWidth)
                .height(availableHeight);

            var scatterWrap = wrap.select('.nv-scatterWrap');
            scatterWrap.call(scatter);

            defsEnter.append('clipPath')
                .attr('id', 'nv-edge-clip-' + scatter.id())
                .append('rect');

            wrap.select('#nv-edge-clip-' + scatter.id() + ' rect')
                .attr('width', availableWidth)
                .attr('height', (availableHeight > 0) ? availableHeight : 0);

            g.attr('clip-path', clipEdge ? 'url(#nv-edge-clip-' + scatter.id() + ')' : '');
            scatterWrap
                .attr('clip-path', clipEdge ? 'url(#nv-edge-clip-' + scatter.id() + ')' : '');

            var groups = wrap.select('.nv-groups').selectAll('.nv-group')
                .data(function (d) {
                    return d
                }, function (d) {
                    return d.key
                });
            groups.enter().append('g')
                .style('stroke-opacity', 1e-6)
                .style('fill-opacity', 1e-6);

            groups.exit().remove();

            groups
                .attr('class', function (d, i) {
                    return 'nv-group nv-series-' + i
                })
                .classed('hover', function (d) {
                    return d.hover
                })
                .style('fill', function (d, i) {
                    return color(d, i)
                })
                .style('stroke', function (d, i) {
                    return color(d, i)
                });
            groups.watchTransition(renderWatch, 'line: groups')
                .style('stroke-opacity', 1)
                .style('fill-opacity', .5);

            var areaPaths = groups.selectAll('path.nv-area')
                .data(function (d) {
                    return isArea(d) ? [d] : []
                }); // this is done differently than lines because I need to check if series is an area
            areaPaths.enter().append('path')
                .attr('class', 'nv-area')
                .attr('d', function (d) {
                    return d3.svg.area()
                        .interpolate(interpolate)
                        .defined(defined)
                        .x(function (d, i) {
                            return nv.utils.NaNtoZero(x0(getX(d, i)))
                        })
                        .y0(function (d, i) {
                            return nv.utils.NaNtoZero(y0(getY(d, i)))
                        })
                        .y1(function (d, i) {
                            return y0(y.domain()[0] <= 0 ? y.domain()[1] >= 0 ? 0 : y.domain()[1] : y.domain()[0])
                        })
                        //.y1(function(d,i) { return y0(0) }) //assuming 0 is within y domain.. may need to tweak this
                        .apply(this, [d.values])
                });
            groups.exit().selectAll('path.nv-area')
                .remove();

            areaPaths.watchTransition(renderWatch, 'line: areaPaths')
                .attr('d', function (d) {
                    return d3.svg.area()
                        .interpolate(interpolate)
                        .defined(defined)
                        .x(function (d, i) {
                            return nv.utils.NaNtoZero(x(getX(d, i)))
                        })
                        .y0(function (d, i) {
                            return nv.utils.NaNtoZero(y(getY(d, i)))
                        })
                        .y1(function (d, i) {
                            return y(y.domain()[0] <= 0 ? y.domain()[1] >= 0 ? 0 : y.domain()[1] : y.domain()[0])
                        })
                        //.y1(function(d,i) { return y0(0) }) //assuming 0 is within y domain.. may need to tweak this
                        .apply(this, [d.values])
                });

            var linePaths = groups.selectAll('path.nv-line')
                .data(function (d) {
                    return [d.values]
                });
            linePaths.enter().append('path')
                .attr('class', 'nv-line')
                .attr('d',
                d3.svg.line()
                    .interpolate(interpolate)
                    .defined(defined)
                    .x(function (d, i) {
                        return nv.utils.NaNtoZero(x0(getX(d, i)))
                    })
                    .y(function (d, i) {
                        return nv.utils.NaNtoZero(y0(getY(d, i)))
                    })
            );

            linePaths.watchTransition(renderWatch, 'line: linePaths')
                .attr('d',
                d3.svg.line()
                    .interpolate(interpolate)
                    .defined(defined)
                    .x(function (d, i) {
                        return nv.utils.NaNtoZero(x(getX(d, i)))
                    })
                    .y(function (d, i) {
                        return nv.utils.NaNtoZero(y(getY(d, i)))
                    })
            );

            //store old scales for use in transitions on update
            x0 = x.copy();
            y0 = y.copy();
        });
        renderWatch.renderEnd('line immediate');
        return chart;
    }


    //============================================================
    // Expose Public Variables
    //------------------------------------------------------------

    chart.dispatch = dispatch;
    chart.scatter = scatter;
    // Pass through events
    scatter.dispatch.on('elementClick', function () {
        dispatch.elementClick.apply(this, arguments);
    })
    scatter.dispatch.on('elementMouseover', function () {
        dispatch.elementMouseover.apply(this, arguments);
    })
    scatter.dispatch.on('elementMouseout', function () {
        dispatch.elementMouseout.apply(this, arguments);
    })

    chart.options = nv.utils.optionsFunc.bind(chart);

    chart._options = Object.create({}, {
        // simple options, just get/set the necessary values
        width: {
            get: function () {
                return width;
            }, set: function (_) {
                width = _;
            }
        },
        height: {
            get: function () {
                return height;
            }, set: function (_) {
                height = _;
            }
        },
        defined: {
            get: function () {
                return defined;
            }, set: function (_) {
                defined = _;
            }
        },
        interpolate: {
            get: function () {
                return interpolate;
            }, set: function (_) {
                interpolate = _;
            }
        },
        clipEdge: {
            get: function () {
                return clipEdge;
            }, set: function (_) {
                clipEdge = _;
            }
        },

        // options that require extra logic in the setter
        margin: {
            get: function () {
                return margin;
            }, set: function (_) {
                margin.top = _.top !== undefined ? _.top : margin.top;
                margin.right = _.right !== undefined ? _.right : margin.right;
                margin.bottom = _.bottom !== undefined ? _.bottom : margin.bottom;
                margin.left = _.left !== undefined ? _.left : margin.left;
            }
        },
        duration: {
            get: function () {
                return duration;
            }, set: function (_) {
                duration = _;
                renderWatch.reset(duration);
                scatter.duration(duration);
            }
        },
        isArea: {
            get: function () {
                return isArea;
            }, set: function (_) {
                isArea = d3.functor(_);
            }
        },
        x: {
            get: function () {
                return getX;
            }, set: function (_) {
                getX = _;
                scatter.x(_);
            }
        },
        y: {
            get: function () {
                return getY;
            }, set: function (_) {
                getY = _;
                scatter.y(_);
            }
        },
        color: {
            get: function () {
                return color;
            }, set: function (_) {
                color = nv.utils.getColor(_);
                scatter.color(color);
            }
        }
    });

    nv.utils.inheritOptions(chart, scatter);
    nv.utils.initOptions(chart);

    return chart;
};
nv.models.lineChart = function () {
    "use strict";

    //============================================================
    // Public Variables with Default Settings
    //------------------------------------------------------------

    var lines = nv.models.line()
        , xAxis = nv.models.axis()
        , yAxis = nv.models.axis()
        , legend = nv.models.legend()
        , interactiveLayer = nv.interactiveGuideline()
        ;

    var margin = {top: 30, right: 20, bottom: 50, left: 60}
        , color = nv.utils.defaultColor()
        , width = null
        , height = null
        , showLegend = true
        , showXAxis = true
        , showYAxis = true
        , rightAlignYAxis = false
        , useInteractiveGuideline = false
        , tooltips = true
        , tooltip = function (key, x, y, e, graph) {
            return '<h3>' + key + '</h3>' +
                '<p>' + y + ' at ' + x + '</p>'
        }
        , x
        , y
        , state = nv.utils.state()
        , defaultState = null
        , noData = 'No Data Available.'
        , dispatch = d3.dispatch('tooltipShow', 'tooltipHide', 'stateChange', 'changeState', 'renderEnd')
        , duration = 250
        ;

    xAxis
        .orient('bottom')
        .tickPadding(7)
    ;
    yAxis
        .orient((rightAlignYAxis) ? 'right' : 'left')
    ;

    //============================================================
    // Private Variables
    //------------------------------------------------------------

    var showTooltip = function (e, offsetElement) {
        var left = e.pos[0] + ( offsetElement.offsetLeft || 0 ),
            top = e.pos[1] + ( offsetElement.offsetTop || 0),
            x = xAxis.tickFormat()(lines.x()(e.point, e.pointIndex)),
            y = yAxis.tickFormat()(lines.y()(e.point, e.pointIndex)),
            content = tooltip(e.series.key, x, y, e, chart);

        nv.tooltip.show([left, top], content, null, null, offsetElement);
    };

    var renderWatch = nv.utils.renderWatch(dispatch, duration);

    var stateGetter = function (data) {
        return function () {
            return {
                active: data.map(function (d) {
                    return !d.disabled
                })
            };
        }
    };

    var stateSetter = function (data) {
        return function (state) {
            if (state.active !== undefined)
                data.forEach(function (series, i) {
                    series.disabled = !state.active[i];
                });
        }
    };

    function chart(selection) {
        renderWatch.reset();
        renderWatch.models(lines);
        if (showXAxis) renderWatch.models(xAxis);
        if (showYAxis) renderWatch.models(yAxis);

        selection.each(function (data) {
            var container = d3.select(this),
                that = this;
            nv.utils.initSVG(container);
            var availableWidth = (width || parseInt(container.style('width')) || 960)
                    - margin.left - margin.right,
                availableHeight = (height || parseInt(container.style('height')) || 400)
                    - margin.top - margin.bottom;


            chart.update = function () {
                if (duration === 0)
                    container.call(chart);
                else
                    container.transition().duration(duration).call(chart)
            };
            chart.container = this;

            state
                .setter(stateSetter(data), chart.update)
                .getter(stateGetter(data))
                .update();

            // DEPRECATED set state.disableddisabled
            state.disabled = data.map(function (d) {
                return !!d.disabled
            });

            if (!defaultState) {
                var key;
                defaultState = {};
                for (key in state) {
                    if (state[key] instanceof Array)
                        defaultState[key] = state[key].slice(0);
                    else
                        defaultState[key] = state[key];
                }
            }

            // Display noData message if there's nothing to show.
            if (!data || !data.length || !data.filter(function (d) {
                    return d.values.length
                }).length) {
                var noDataText = container.selectAll('.nv-noData').data([noData]);

                noDataText.enter().append('text')
                    .attr('class', 'nvd3 nv-noData')
                    .attr('dy', '-.7em')
                    .style('text-anchor', 'middle');

                noDataText
                    .attr('x', margin.left + availableWidth / 2)
                    .attr('y', margin.top + availableHeight / 2)
                    .text(function (d) {
                        return d
                    });

                return chart;
            }
            else {
                container.selectAll('.nv-noData').remove();
            }


            // Setup Scales
            x = lines.xScale();
            y = lines.yScale();

            // Setup containers and skeleton of chart
            var wrap = container.selectAll('g.nv-wrap.nv-lineChart').data([data]);
            var gEnter = wrap.enter().append('g').attr('class', 'nvd3 nv-wrap nv-lineChart').append('g');
            var g = wrap.select('g');

            gEnter.append("rect").style("opacity", 0);
            gEnter.append('g').attr('class', 'nv-x nv-axis');
            gEnter.append('g').attr('class', 'nv-y nv-axis');
            gEnter.append('g').attr('class', 'nv-linesWrap');
            gEnter.append('g').attr('class', 'nv-legendWrap');
            gEnter.append('g').attr('class', 'nv-interactive');

            g.select("rect")
                .attr("width", availableWidth)
                .attr("height", (availableHeight > 0) ? availableHeight : 0);

            // Legend
            if (showLegend) {
                legend.width(availableWidth);

                g.select('.nv-legendWrap')
                    .datum(data)
                    .call(legend);

                if (margin.top != legend.height()) {
                    margin.top = legend.height();
                    availableHeight = (height || parseInt(container.style('height')) || 400)
                    - margin.top - margin.bottom;
                }

                wrap.select('.nv-legendWrap')
                    .attr('transform', 'translate(0,' + (-margin.top) + ')')
            }

            wrap.attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

            if (rightAlignYAxis) {
                g.select(".nv-y.nv-axis")
                    .attr("transform", "translate(" + availableWidth + ",0)");
            }

            //Set up interactive layer
            if (useInteractiveGuideline) {
                interactiveLayer
                    .width(availableWidth)
                    .height(availableHeight)
                    .margin({left: margin.left, top: margin.top})
                    .svgContainer(container)
                    .xScale(x);
                wrap.select(".nv-interactive").call(interactiveLayer);
            }

            lines
                .width(availableWidth)
                .height(availableHeight)
                .color(data.map(function (d, i) {
                    return d.color || color(d, i);
                }).filter(function (d, i) {
                    return !data[i].disabled
                }));


            var linesWrap = g.select('.nv-linesWrap')
                .datum(data.filter(function (d) {
                    return !d.disabled
                }));

            linesWrap.call(lines);

            // Setup Axes
            if (showXAxis) {
                xAxis
                    .scale(x)
                    .ticks(nv.utils.calcTicksX(availableWidth / 100, data))
                    .tickSize(-availableHeight, 0);

                g.select('.nv-x.nv-axis')
                    .attr('transform', 'translate(0,' + y.range()[0] + ')');
                g.select('.nv-x.nv-axis')
                    .call(xAxis);
            }

            if (showYAxis) {
                yAxis
                    .scale(y)
                    .ticks(nv.utils.calcTicksY(availableHeight / 36, data))
                    .tickSize(-availableWidth, 0);

                g.select('.nv-y.nv-axis')
                    .call(yAxis);
            }

            //============================================================
            // Event Handling/Dispatching (in chart's scope)
            //------------------------------------------------------------

            legend.dispatch.on('stateChange', function (newState) {
                for (var key in newState)
                    state[key] = newState[key];
                dispatch.stateChange(state);
                chart.update();
            });

            interactiveLayer.dispatch.on('elementMousemove', function (e) {
                lines.clearHighlights();
                var singlePoint, pointIndex, pointXLocation, allData = [];
                data
                    .filter(function (series, i) {
                        series.seriesIndex = i;
                        return !series.disabled;
                    })
                    .forEach(function (series, i) {
                        pointIndex = nv.interactiveBisect(series.values, e.pointXValue, chart.x());
                        lines.highlightPoint(i, pointIndex, true);
                        var point = series.values[pointIndex];
                        if (typeof point === 'undefined') return;
                        if (typeof singlePoint === 'undefined') singlePoint = point;
                        if (typeof pointXLocation === 'undefined') pointXLocation = chart.xScale()(chart.x()(point, pointIndex));
                        allData.push({
                            key: series.key,
                            value: chart.y()(point, pointIndex),
                            color: color(series, series.seriesIndex)
                        });
                    });
                //Highlight the tooltip entry based on which point the mouse is closest to.
                if (allData.length > 2) {
                    var yValue = chart.yScale().invert(e.mouseY);
                    var domainExtent = Math.abs(chart.yScale().domain()[0] - chart.yScale().domain()[1]);
                    var threshold = 0.03 * domainExtent;
                    var indexToHighlight = nv.nearestValueIndex(allData.map(function (d) {
                        return d.value
                    }), yValue, threshold);
                    if (indexToHighlight !== null)
                        allData[indexToHighlight].highlight = true;
                }

                var xValue = xAxis.tickFormat()(chart.x()(singlePoint, pointIndex));
                interactiveLayer.tooltip
                    .position({left: pointXLocation + margin.left, top: e.mouseY + margin.top})
                    .chartContainer(that.parentNode)
                    .enabled(tooltips)
                    .valueFormatter(function (d, i) {
                        return yAxis.tickFormat()(d);
                    })
                    .data(
                    {
                        value: xValue,
                        series: allData
                    }
                )();

                interactiveLayer.renderGuideLine(pointXLocation);

            });

            interactiveLayer.dispatch.on('elementClick', function (e) {
                var pointXLocation, allData = [];

                data.filter(function (series, i) {
                    series.seriesIndex = i;
                    return !series.disabled;
                }).forEach(function (series) {
                    var pointIndex = nv.interactiveBisect(series.values, e.pointXValue, chart.x());
                    var point = series.values[pointIndex];
                    if (typeof point === 'undefined') return;
                    if (typeof pointXLocation === 'undefined') pointXLocation = chart.xScale()(chart.x()(point, pointIndex));
                    var yPos = chart.yScale()(chart.y()(point, pointIndex));
                    allData.push({
                        point: point,
                        pointIndex: pointIndex,
                        pos: [pointXLocation, yPos],
                        seriesIndex: series.seriesIndex,
                        series: series
                    });
                });

                lines.dispatch.elementClick(allData);
            });

            interactiveLayer.dispatch.on("elementMouseout", function (e) {
                dispatch.tooltipHide();
                lines.clearHighlights();
            });

            dispatch.on('tooltipShow', function (e) {
                if (tooltips) showTooltip(e, that.parentNode);
            });

            dispatch.on('changeState', function (e) {

                if (typeof e.disabled !== 'undefined' && data.length === e.disabled.length) {
                    data.forEach(function (series, i) {
                        series.disabled = e.disabled[i];
                    });

                    state.disabled = e.disabled;
                }

                chart.update();
            });

        });

        renderWatch.renderEnd('lineChart immediate');
        return chart;
    }

    //============================================================
    // Event Handling/Dispatching (out of chart's scope)
    //------------------------------------------------------------

    lines.dispatch.on('elementMouseover.tooltip', function (e) {
        e.pos = [e.pos[0] + margin.left, e.pos[1] + margin.top];
        dispatch.tooltipShow(e);
    });

    lines.dispatch.on('elementMouseout.tooltip', function (e) {
        dispatch.tooltipHide(e);
    });

    dispatch.on('tooltipHide', function () {
        if (tooltips) nv.tooltip.cleanup();
    });

    //============================================================
    // Expose Public Variables
    //------------------------------------------------------------

    // expose chart's sub-components
    chart.dispatch = dispatch;
    chart.lines = lines;
    chart.legend = legend;
    chart.xAxis = xAxis;
    chart.yAxis = yAxis;
    chart.interactiveLayer = interactiveLayer;

    chart.dispatch = dispatch;
    chart.options = nv.utils.optionsFunc.bind(chart);

    chart._options = Object.create({}, {
        // simple options, just get/set the necessary values
        width: {
            get: function () {
                return width;
            }, set: function (_) {
                width = _;
            }
        },
        height: {
            get: function () {
                return height;
            }, set: function (_) {
                height = _;
            }
        },
        showLegend: {
            get: function () {
                return showLegend;
            }, set: function (_) {
                showLegend = _;
            }
        },
        showXAxis: {
            get: function () {
                return showXAxis;
            }, set: function (_) {
                showXAxis = _;
            }
        },
        showYAxis: {
            get: function () {
                return showYAxis;
            }, set: function (_) {
                showYAxis = _;
            }
        },
        tooltips: {
            get: function () {
                return tooltips;
            }, set: function (_) {
                tooltips = _;
            }
        },
        tooltipContent: {
            get: function () {
                return tooltip;
            }, set: function (_) {
                tooltip = _;
            }
        },
        defaultState: {
            get: function () {
                return defaultState;
            }, set: function (_) {
                defaultState = _;
            }
        },
        noData: {
            get: function () {
                return noData;
            }, set: function (_) {
                noData = _;
            }
        },

        // options that require extra logic in the setter
        margin: {
            get: function () {
                return margin;
            }, set: function (_) {
                margin.top = _.top !== undefined ? _.top : margin.top;
                margin.right = _.right !== undefined ? _.right : margin.right;
                margin.bottom = _.bottom !== undefined ? _.bottom : margin.bottom;
                margin.left = _.left !== undefined ? _.left : margin.left;
            }
        },
        duration: {
            get: function () {
                return duration;
            }, set: function (_) {
                duration = _;
                renderWatch.reset(duration);
                lines.duration(duration);
                xAxis.duration(duration);
                yAxis.duration(duration);
            }
        },
        color: {
            get: function () {
                return color;
            }, set: function (_) {
                color = nv.utils.getColor(_);
                legend.color(color);
                lines.color(color);
            }
        },
        rightAlignYAxis: {
            get: function () {
                return rightAlignYAxis;
            }, set: function (_) {
                rightAlignYAxis = _;
                yAxis.orient(rightAlignYAxis ? 'right' : 'left');
            }
        },
        useInteractiveGuideline: {
            get: function () {
                return useInteractiveGuideline;
            }, set: function (_) {
                useInteractiveGuideline = _;
                if (useInteractiveGuideline) {
                    lines.interactive(false);
                    lines.useVoronoi(false);
                }
            }
        }
    });

    nv.utils.inheritOptions(chart, lines);
    nv.utils.initOptions(chart);

    return chart;
};
nv.models.linePlusBarChart = function () {
    "use strict";

    //============================================================
    // Public Variables with Default Settings
    //------------------------------------------------------------

    var lines = nv.models.line()
        , lines2 = nv.models.line()
        , bars = nv.models.historicalBar()
        , bars2 = nv.models.historicalBar()
        , xAxis = nv.models.axis()
        , x2Axis = nv.models.axis()
        , y1Axis = nv.models.axis()
        , y2Axis = nv.models.axis()
        , y3Axis = nv.models.axis()
        , y4Axis = nv.models.axis()
        , legend = nv.models.legend()
        , brush = d3.svg.brush()
        ;

    var margin = {top: 30, right: 30, bottom: 30, left: 60}
        , margin2 = {top: 0, right: 30, bottom: 20, left: 60}
        , width = null
        , height = null
        , getX = function (d) {
            return d.x
        }
        , getY = function (d) {
            return d.y
        }
        , color = nv.utils.defaultColor()
        , showLegend = true
        , focusEnable = true
        , focusShowAxisY = false
        , focusShowAxisX = true
        , focusHeight = 50
        , extent
        , brushExtent = null
        , tooltips = true
        , tooltip = function (key, x, y, e, graph) {
            return '<h3>' + key + '</h3>' +
                '<p>' + y + ' at ' + x + '</p>';
        }
        , x
        , x2
        , y1
        , y2
        , y3
        , y4
        , noData = "No Data Available."
        , dispatch = d3.dispatch('tooltipShow', 'tooltipHide', 'brush', 'stateChange', 'changeState')
        , transitionDuration = 0
        , state = nv.utils.state()
        , defaultState = null
        , legendLeftAxisHint = ' (left axis)'
        , legendRightAxisHint = ' (right axis)'
        ;

    lines
        .clipEdge(true)
    ;
    lines2
        .interactive(false)
    ;
    xAxis
        .orient('bottom')
        .tickPadding(5)
    ;
    y1Axis
        .orient('left')
    ;
    y2Axis
        .orient('right')
    ;
    x2Axis
        .orient('bottom')
        .tickPadding(5)
    ;
    y3Axis
        .orient('left')
    ;
    y4Axis
        .orient('right')
    ;

    //============================================================
    // Private Variables
    //------------------------------------------------------------

    var showTooltip = function (e, offsetElement) {
        if (extent) {
            e.pointIndex += Math.ceil(extent[0]);
        }
        var left = e.pos[0] + ( offsetElement.offsetLeft || 0 ),
            top = e.pos[1] + ( offsetElement.offsetTop || 0),
            x = xAxis.tickFormat()(lines.x()(e.point, e.pointIndex)),
            y = (e.series.bar ? y1Axis : y2Axis).tickFormat()(lines.y()(e.point, e.pointIndex)),
            content = tooltip(e.series.key, x, y, e, chart);

        nv.tooltip.show([left, top], content, e.value < 0 ? 'n' : 's', null, offsetElement);
    };

    var stateGetter = function (data) {
        return function () {
            return {
                active: data.map(function (d) {
                    return !d.disabled
                })
            };
        }
    };

    var stateSetter = function (data) {
        return function (state) {
            if (state.active !== undefined)
                data.forEach(function (series, i) {
                    series.disabled = !state.active[i];
                });
        }
    };

    function chart(selection) {
        selection.each(function (data) {
            var container = d3.select(this),
                that = this;
            nv.utils.initSVG(container);
            var availableWidth = (width || parseInt(container.style('width')) || 960)
                    - margin.left - margin.right,
                availableHeight1 = (height || parseInt(container.style('height')) || 400)
                    - margin.top - margin.bottom - (focusEnable ? focusHeight : 0),
                availableHeight2 = focusHeight - margin2.top - margin2.bottom;

            chart.update = function () {
                container.transition().duration(transitionDuration).call(chart);
            };
            chart.container = this;

            state
                .setter(stateSetter(data), chart.update)
                .getter(stateGetter(data))
                .update();

            // DEPRECATED set state.disableddisabled
            state.disabled = data.map(function (d) {
                return !!d.disabled
            });

            if (!defaultState) {
                var key;
                defaultState = {};
                for (key in state) {
                    if (state[key] instanceof Array)
                        defaultState[key] = state[key].slice(0);
                    else
                        defaultState[key] = state[key];
                }
            }

            // Display No Data message if there's nothing to show.
            if (!data || !data.length || !data.filter(function (d) {
                    return d.values.length
                }).length) {
                var noDataText = container.selectAll('.nv-noData').data([noData]);

                noDataText.enter().append('text')
                    .attr('class', 'nvd3 nv-noData')
                    .attr('dy', '-.7em')
                    .style('text-anchor', 'middle');

                noDataText
                    .attr('x', margin.left + availableWidth / 2)
                    .attr('y', margin.top + availableHeight1 / 2)
                    .text(function (d) {
                        return d
                    });

                return chart;
            }
            else {
                container.selectAll('.nv-noData').remove();
            }

            // Setup Scales
            var dataBars = data.filter(function (d) {
                return !d.disabled && d.bar
            });
            var dataLines = data.filter(function (d) {
                return !d.bar
            }); // removed the !d.disabled clause here to fix Issue #240

            x = bars.xScale();
            x2 = x2Axis.scale();
            y1 = bars.yScale();
            y2 = lines.yScale();
            y3 = bars2.yScale();
            y4 = lines2.yScale();

            var series1 = data
                .filter(function (d) {
                    return !d.disabled && d.bar
                })
                .map(function (d) {
                    return d.values.map(function (d, i) {
                        return {x: getX(d, i), y: getY(d, i)}
                    })
                });

            var series2 = data
                .filter(function (d) {
                    return !d.disabled && !d.bar
                })
                .map(function (d) {
                    return d.values.map(function (d, i) {
                        return {x: getX(d, i), y: getY(d, i)}
                    })
                });

            x.range([0, availableWidth]);

            x2.domain(d3.extent(d3.merge(series1.concat(series2)), function (d) {
                return d.x
            }))
                .range([0, availableWidth]);

            // Setup containers and skeleton of chart
            var wrap = container.selectAll('g.nv-wrap.nv-linePlusBar').data([data]);
            var gEnter = wrap.enter().append('g').attr('class', 'nvd3 nv-wrap nv-linePlusBar').append('g');
            var g = wrap.select('g');

            gEnter.append('g').attr('class', 'nv-legendWrap');

            // this is the main chart
            var focusEnter = gEnter.append('g').attr('class', 'nv-focus');
            focusEnter.append('g').attr('class', 'nv-x nv-axis');
            focusEnter.append('g').attr('class', 'nv-y1 nv-axis');
            focusEnter.append('g').attr('class', 'nv-y2 nv-axis');
            focusEnter.append('g').attr('class', 'nv-barsWrap');
            focusEnter.append('g').attr('class', 'nv-linesWrap');

            // context chart is where you can focus in
            var contextEnter = gEnter.append('g').attr('class', 'nv-context');
            contextEnter.append('g').attr('class', 'nv-x nv-axis');
            contextEnter.append('g').attr('class', 'nv-y1 nv-axis');
            contextEnter.append('g').attr('class', 'nv-y2 nv-axis');
            contextEnter.append('g').attr('class', 'nv-barsWrap');
            contextEnter.append('g').attr('class', 'nv-linesWrap');
            contextEnter.append('g').attr('class', 'nv-brushBackground');
            contextEnter.append('g').attr('class', 'nv-x nv-brush');

            //============================================================
            // Legend
            //------------------------------------------------------------

            if (showLegend) {
                legend.width(availableWidth / 2);

                g.select('.nv-legendWrap')
                    .datum(data.map(function (series) {
                        series.originalKey = series.originalKey === undefined ? series.key : series.originalKey;
                        series.key = series.originalKey + (series.bar ? legendLeftAxisHint : legendRightAxisHint);
                        return series;
                    }))
                    .call(legend);

                if (margin.top != legend.height()) {
                    margin.top = legend.height();
                    availableHeight1 = (height || parseInt(container.style('height')) || 400)
                    - margin.top - margin.bottom - focusHeight;
                }

                g.select('.nv-legendWrap')
                    .attr('transform', 'translate(' + ( availableWidth / 2 ) + ',' + (-margin.top) + ')');
            }

            wrap.attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

            //============================================================
            // Context chart (focus chart) components
            //------------------------------------------------------------

            // hide or show the focus context chart
            g.select('.nv-context').style('display', focusEnable ? 'initial' : 'none');

            bars2
                .width(availableWidth)
                .height(availableHeight2)
                .color(data.map(function (d, i) {
                    return d.color || color(d, i);
                }).filter(function (d, i) {
                    return !data[i].disabled && data[i].bar
                }));
            lines2
                .width(availableWidth)
                .height(availableHeight2)
                .color(data.map(function (d, i) {
                    return d.color || color(d, i);
                }).filter(function (d, i) {
                    return !data[i].disabled && !data[i].bar
                }));

            var bars2Wrap = g.select('.nv-context .nv-barsWrap')
                .datum(dataBars.length ? dataBars : [
                    {values: []}
                ]);
            var lines2Wrap = g.select('.nv-context .nv-linesWrap')
                .datum(!dataLines[0].disabled ? dataLines : [
                    {values: []}
                ]);

            g.select('.nv-context')
                .attr('transform', 'translate(0,' + ( availableHeight1 + margin.bottom + margin2.top) + ')');

            bars2Wrap.transition().call(bars2);
            lines2Wrap.transition().call(lines2);

            // context (focus chart) axis controls
            if (focusShowAxisX) {
                x2Axis
                    .ticks(nv.utils.calcTicksX(availableWidth / 100, data))
                    .tickSize(-availableHeight2, 0);
                g.select('.nv-context .nv-x.nv-axis')
                    .attr('transform', 'translate(0,' + y3.range()[0] + ')');
                g.select('.nv-context .nv-x.nv-axis').transition()
                    .call(x2Axis);
            }

            if (focusShowAxisY) {
                y3Axis
                    .scale(y3)
                    .ticks(availableHeight2 / 36)
                    .tickSize(-availableWidth, 0);
                y4Axis
                    .scale(y4)
                    .ticks(availableHeight2 / 36)
                    .tickSize(dataBars.length ? 0 : -availableWidth, 0); // Show the y2 rules only if y1 has none

                g.select('.nv-context .nv-y3.nv-axis')
                    .style('opacity', dataBars.length ? 1 : 0)
                    .attr('transform', 'translate(0,' + x2.range()[0] + ')');
                g.select('.nv-context .nv-y2.nv-axis')
                    .style('opacity', dataLines.length ? 1 : 0)
                    .attr('transform', 'translate(' + x2.range()[1] + ',0)');

                g.select('.nv-context .nv-y1.nv-axis').transition()
                    .call(y3Axis);
                g.select('.nv-context .nv-y2.nv-axis').transition()
                    .call(y4Axis);
            }

            // Setup Brush
            brush.x(x2).on('brush', onBrush);

            if (brushExtent) brush.extent(brushExtent);

            var brushBG = g.select('.nv-brushBackground').selectAll('g')
                .data([brushExtent || brush.extent()]);

            var brushBGenter = brushBG.enter()
                .append('g');

            brushBGenter.append('rect')
                .attr('class', 'left')
                .attr('x', 0)
                .attr('y', 0)
                .attr('height', availableHeight2);

            brushBGenter.append('rect')
                .attr('class', 'right')
                .attr('x', 0)
                .attr('y', 0)
                .attr('height', availableHeight2);

            var gBrush = g.select('.nv-x.nv-brush')
                .call(brush);
            gBrush.selectAll('rect')
                //.attr('y', -5)
                .attr('height', availableHeight2);
            gBrush.selectAll('.resize').append('path').attr('d', resizePath);

            //============================================================
            // Event Handling/Dispatching (in chart's scope)
            //------------------------------------------------------------

            legend.dispatch.on('stateChange', function (newState) {
                for (var key in newState)
                    state[key] = newState[key];
                dispatch.stateChange(state);
                chart.update();
            });

            dispatch.on('tooltipShow', function (e) {
                if (tooltips) showTooltip(e, that.parentNode);
            });

            // Update chart from a state object passed to event handler
            dispatch.on('changeState', function (e) {
                if (typeof e.disabled !== 'undefined') {
                    data.forEach(function (series, i) {
                        series.disabled = e.disabled[i];
                    });
                    state.disabled = e.disabled;
                }
                chart.update();
            });

            //============================================================
            // Functions
            //------------------------------------------------------------

            // Taken from crossfilter (http://square.github.com/crossfilter/)
            function resizePath(d) {
                var e = +(d == 'e'),
                    x = e ? 1 : -1,
                    y = availableHeight2 / 3;
                return 'M' + (.5 * x) + ',' + y
                    + 'A6,6 0 0 ' + e + ' ' + (6.5 * x) + ',' + (y + 6)
                    + 'V' + (2 * y - 6)
                    + 'A6,6 0 0 ' + e + ' ' + (.5 * x) + ',' + (2 * y)
                    + 'Z'
                    + 'M' + (2.5 * x) + ',' + (y + 8)
                    + 'V' + (2 * y - 8)
                    + 'M' + (4.5 * x) + ',' + (y + 8)
                    + 'V' + (2 * y - 8);
            }


            function updateBrushBG() {
                if (!brush.empty()) brush.extent(brushExtent);
                brushBG
                    .data([brush.empty() ? x2.domain() : brushExtent])
                    .each(function (d, i) {
                        var leftWidth = x2(d[0]) - x2.range()[0],
                            rightWidth = x2.range()[1] - x2(d[1]);
                        d3.select(this).select('.left')
                            .attr('width', leftWidth < 0 ? 0 : leftWidth);

                        d3.select(this).select('.right')
                            .attr('x', x2(d[1]))
                            .attr('width', rightWidth < 0 ? 0 : rightWidth);
                    });
            }

            function onBrush() {
                brushExtent = brush.empty() ? null : brush.extent();
                extent = brush.empty() ? x2.domain() : brush.extent();
                dispatch.brush({extent: extent, brush: brush});
                updateBrushBG();

                // Prepare Main (Focus) Bars and Lines
                bars
                    .width(availableWidth)
                    .height(availableHeight1)
                    .color(data.map(function (d, i) {
                        return d.color || color(d, i);
                    }).filter(function (d, i) {
                        return !data[i].disabled && data[i].bar
                    }));

                lines
                    .width(availableWidth)
                    .height(availableHeight1)
                    .color(data.map(function (d, i) {
                        return d.color || color(d, i);
                    }).filter(function (d, i) {
                        return !data[i].disabled && !data[i].bar
                    }));

                var focusBarsWrap = g.select('.nv-focus .nv-barsWrap')
                    .datum(!dataBars.length ? [{values: []}] :
                        dataBars
                            .map(function (d, i) {
                                return {
                                    key: d.key,
                                    values: d.values.filter(function (d, i) {
                                        return bars.x()(d, i) >= extent[0] && bars.x()(d, i) <= extent[1];
                                    })
                                }
                            })
                );

                var focusLinesWrap = g.select('.nv-focus .nv-linesWrap')
                    .datum(dataLines[0].disabled ? [{values: []}] :
                        dataLines
                            .map(function (d, i) {
                                return {
                                    key: d.key,
                                    values: d.values.filter(function (d, i) {
                                        return lines.x()(d, i) >= extent[0] && lines.x()(d, i) <= extent[1];
                                    })
                                }
                            })
                );

                // Update Main (Focus) X Axis
                if (dataBars.length) {
                    x = bars.xScale();
                }
                else {
                    x = lines.xScale();
                }

                xAxis
                    .scale(x)
                    .ticks(nv.utils.calcTicksX(availableWidth / 100, data))
                    .tickSize(-availableHeight1, 0);

                xAxis.domain([Math.ceil(extent[0]), Math.floor(extent[1])]);

                g.select('.nv-x.nv-axis').transition().duration(transitionDuration)
                    .call(xAxis);

                // Update Main (Focus) Bars and Lines
                focusBarsWrap.transition().duration(transitionDuration).call(bars);
                focusLinesWrap.transition().duration(transitionDuration).call(lines);

                // Setup and Update Main (Focus) Y Axes
                g.select('.nv-focus .nv-x.nv-axis')
                    .attr('transform', 'translate(0,' + y1.range()[0] + ')');

                y1Axis
                    .scale(y1)
                    .ticks(nv.utils.calcTicksY(availableHeight1 / 36, data))
                    .tickSize(-availableWidth, 0);
                y2Axis
                    .scale(y2)
                    .ticks(nv.utils.calcTicksY(availableHeight1 / 36, data))
                    .tickSize(dataBars.length ? 0 : -availableWidth, 0); // Show the y2 rules only if y1 has none

                g.select('.nv-focus .nv-y1.nv-axis')
                    .style('opacity', dataBars.length ? 1 : 0);
                g.select('.nv-focus .nv-y2.nv-axis')
                    .style('opacity', dataLines.length && !dataLines[0].disabled ? 1 : 0)
                    .attr('transform', 'translate(' + x.range()[1] + ',0)');

                g.select('.nv-focus .nv-y1.nv-axis').transition().duration(transitionDuration)
                    .call(y1Axis);
                g.select('.nv-focus .nv-y2.nv-axis').transition().duration(transitionDuration)
                    .call(y2Axis);
            }

            onBrush();

        });

        return chart;
    }

    //============================================================
    // Event Handling/Dispatching (out of chart's scope)
    //------------------------------------------------------------

    lines.dispatch.on('elementMouseover.tooltip', function (e) {
        e.pos = [e.pos[0] + margin.left, e.pos[1] + margin.top];
        dispatch.tooltipShow(e);
    });

    lines.dispatch.on('elementMouseout.tooltip', function (e) {
        dispatch.tooltipHide(e);
    });

    bars.dispatch.on('elementMouseover.tooltip', function (e) {
        e.pos = [e.pos[0] + margin.left, e.pos[1] + margin.top];
        dispatch.tooltipShow(e);
    });

    bars.dispatch.on('elementMouseout.tooltip', function (e) {
        dispatch.tooltipHide(e);
    });

    dispatch.on('tooltipHide', function () {
        if (tooltips) nv.tooltip.cleanup();
    });

    //============================================================


    //============================================================
    // Expose Public Variables
    //------------------------------------------------------------

    // expose chart's sub-components
    chart.dispatch = dispatch;
    chart.legend = legend;
    chart.lines = lines;
    chart.lines2 = lines2;
    chart.bars = bars;
    chart.bars2 = bars2;
    chart.xAxis = xAxis;
    chart.x2Axis = x2Axis;
    chart.y1Axis = y1Axis;
    chart.y2Axis = y2Axis;
    chart.y3Axis = y3Axis;
    chart.y4Axis = y4Axis;

    chart.options = nv.utils.optionsFunc.bind(chart);

    chart._options = Object.create({}, {
        // simple options, just get/set the necessary values
        width: {
            get: function () {
                return width;
            }, set: function (_) {
                width = _;
            }
        },
        height: {
            get: function () {
                return height;
            }, set: function (_) {
                height = _;
            }
        },
        showLegend: {
            get: function () {
                return showLegend;
            }, set: function (_) {
                showLegend = _;
            }
        },
        tooltips: {
            get: function () {
                return tooltips;
            }, set: function (_) {
                tooltips = _;
            }
        },
        tooltipContent: {
            get: function () {
                return tooltip;
            }, set: function (_) {
                tooltip = _;
            }
        },
        brushExtent: {
            get: function () {
                return brushExtent;
            }, set: function (_) {
                brushExtent = _;
            }
        },
        noData: {
            get: function () {
                return noData;
            }, set: function (_) {
                noData = _;
            }
        },
        focusEnable: {
            get: function () {
                return focusEnable;
            }, set: function (_) {
                focusEnable = _;
            }
        },
        focusHeight: {
            get: function () {
                return focusHeight;
            }, set: function (_) {
                focusHeight = _;
            }
        },
        focusShowAxisX: {
            get: function () {
                return focusShowAxisX;
            }, set: function (_) {
                focusShowAxisX = _;
            }
        },
        focusShowAxisY: {
            get: function () {
                return focusShowAxisY;
            }, set: function (_) {
                focusShowAxisY = _;
            }
        },
        legendLeftAxisHint: {
            get: function () {
                return legendLeftAxisHint;
            }, set: function (_) {
                legendLeftAxisHint = _;
            }
        },
        legendRightAxisHint: {
            get: function () {
                return legendRightAxisHint;
            }, set: function (_) {
                legendRightAxisHint = _;
            }
        },

        // options that require extra logic in the setter
        margin: {
            get: function () {
                return margin;
            }, set: function (_) {
                margin.top = _.top !== undefined ? _.top : margin.top;
                margin.right = _.right !== undefined ? _.right : margin.right;
                margin.bottom = _.bottom !== undefined ? _.bottom : margin.bottom;
                margin.left = _.left !== undefined ? _.left : margin.left;
            }
        },
        duration: {
            get: function () {
                return transitionDuration;
            }, set: function (_) {
                transitionDuration = _;
            }
        },
        color: {
            get: function () {
                return color;
            }, set: function (_) {
                color = nv.utils.getColor(_);
                legend.color(color);
            }
        },
        x: {
            get: function () {
                return getX;
            }, set: function (_) {
                getX = _;
                lines.x(_);
                lines2.x(_);
                bars.x(_);
                bars2.x(_);
            }
        },
        y: {
            get: function () {
                return getY;
            }, set: function (_) {
                getY = _;
                lines.y(_);
                lines2.y(_);
                bars.y(_);
                bars2.y(_);
            }
        }
    });

    nv.utils.inheritOptions(chart, lines);
    nv.utils.initOptions(chart);

    return chart;
};
nv.models.lineWithFocusChart = function () {
    "use strict";

    //============================================================
    // Public Variables with Default Settings
    //------------------------------------------------------------

    var lines = nv.models.line()
        , lines2 = nv.models.line()
        , xAxis = nv.models.axis()
        , yAxis = nv.models.axis()
        , x2Axis = nv.models.axis()
        , y2Axis = nv.models.axis()
        , legend = nv.models.legend()
        , brush = d3.svg.brush()
        ;

    var margin = {top: 30, right: 30, bottom: 30, left: 60}
        , margin2 = {top: 0, right: 30, bottom: 20, left: 60}
        , color = nv.utils.defaultColor()
        , width = null
        , height = null
        , height2 = 100
        , x
        , y
        , x2
        , y2
        , showLegend = true
        , brushExtent = null
        , tooltips = true
        , tooltip = function (key, x, y, e, graph) {
            return '<h3>' + key + '</h3>' +
                '<p>' + y + ' at ' + x + '</p>'
        }
        , noData = "No Data Available."
        , dispatch = d3.dispatch('tooltipShow', 'tooltipHide', 'brush', 'stateChange', 'changeState')
        , transitionDuration = 250
        , state = nv.utils.state()
        , defaultState = null
        ;

    lines
        .clipEdge(true)
    ;
    lines2
        .interactive(false)
    ;
    xAxis
        .orient('bottom')
        .tickPadding(5)
    ;
    yAxis
        .orient('left')
    ;
    x2Axis
        .orient('bottom')
        .tickPadding(5)
    ;
    y2Axis
        .orient('left')
    ;

    //============================================================
    // Private Variables
    //------------------------------------------------------------

    var showTooltip = function (e, offsetElement) {
        var left = e.pos[0] + ( offsetElement.offsetLeft || 0 ),
            top = e.pos[1] + ( offsetElement.offsetTop || 0),
            x = xAxis.tickFormat()(lines.x()(e.point, e.pointIndex)),
            y = yAxis.tickFormat()(lines.y()(e.point, e.pointIndex)),
            content = tooltip(e.series.key, x, y, e, chart);

        nv.tooltip.show([left, top], content, null, null, offsetElement);
    };

    var stateGetter = function (data) {
        return function () {
            return {
                active: data.map(function (d) {
                    return !d.disabled
                })
            };
        }
    };

    var stateSetter = function (data) {
        return function (state) {
            if (state.active !== undefined)
                data.forEach(function (series, i) {
                    series.disabled = !state.active[i];
                });
        }
    };

    function chart(selection) {
        selection.each(function (data) {
            var container = d3.select(this),
                that = this;
            nv.utils.initSVG(container);
            var availableWidth = (width || parseInt(container.style('width')) || 960)
                    - margin.left - margin.right,
                availableHeight1 = (height || parseInt(container.style('height')) || 400)
                    - margin.top - margin.bottom - height2,
                availableHeight2 = height2 - margin2.top - margin2.bottom;

            chart.update = function () {
                container.transition().duration(transitionDuration).call(chart)
            };
            chart.container = this;

            state
                .setter(stateSetter(data), chart.update)
                .getter(stateGetter(data))
                .update();

            // DEPRECATED set state.disableddisabled
            state.disabled = data.map(function (d) {
                return !!d.disabled
            });

            if (!defaultState) {
                var key;
                defaultState = {};
                for (key in state) {
                    if (state[key] instanceof Array)
                        defaultState[key] = state[key].slice(0);
                    else
                        defaultState[key] = state[key];
                }
            }

            // Display No Data message if there's nothing to show.
            if (!data || !data.length || !data.filter(function (d) {
                    return d.values.length
                }).length) {
                var noDataText = container.selectAll('.nv-noData').data([noData]);

                noDataText.enter().append('text')
                    .attr('class', 'nvd3 nv-noData')
                    .attr('dy', '-.7em')
                    .style('text-anchor', 'middle');

                noDataText
                    .attr('x', margin.left + availableWidth / 2)
                    .attr('y', margin.top + availableHeight1 / 2)
                    .text(function (d) {
                        return d
                    });

                return chart;
            }
            else {
                container.selectAll('.nv-noData').remove();
            }

            // Setup Scales
            x = lines.xScale();
            y = lines.yScale();
            x2 = lines2.xScale();
            y2 = lines2.yScale();

            // Setup containers and skeleton of chart
            var wrap = container.selectAll('g.nv-wrap.nv-lineWithFocusChart').data([data]);
            var gEnter = wrap.enter().append('g').attr('class', 'nvd3 nv-wrap nv-lineWithFocusChart').append('g');
            var g = wrap.select('g');

            gEnter.append('g').attr('class', 'nv-legendWrap');

            var focusEnter = gEnter.append('g').attr('class', 'nv-focus');
            focusEnter.append('g').attr('class', 'nv-x nv-axis');
            focusEnter.append('g').attr('class', 'nv-y nv-axis');
            focusEnter.append('g').attr('class', 'nv-linesWrap');

            var contextEnter = gEnter.append('g').attr('class', 'nv-context');
            contextEnter.append('g').attr('class', 'nv-x nv-axis');
            contextEnter.append('g').attr('class', 'nv-y nv-axis');
            contextEnter.append('g').attr('class', 'nv-linesWrap');
            contextEnter.append('g').attr('class', 'nv-brushBackground');
            contextEnter.append('g').attr('class', 'nv-x nv-brush');

            // Legend
            if (showLegend) {
                legend.width(availableWidth);

                g.select('.nv-legendWrap')
                    .datum(data)
                    .call(legend);

                if (margin.top != legend.height()) {
                    margin.top = legend.height();
                    availableHeight1 = (height || parseInt(container.style('height')) || 400)
                    - margin.top - margin.bottom - height2;
                }

                g.select('.nv-legendWrap')
                    .attr('transform', 'translate(0,' + (-margin.top) + ')')
            }

            wrap.attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

            // Main Chart Component(s)
            lines
                .width(availableWidth)
                .height(availableHeight1)
                .color(
                data
                    .map(function (d, i) {
                        return d.color || color(d, i);
                    })
                    .filter(function (d, i) {
                        return !data[i].disabled;
                    })
            );

            lines2
                .defined(lines.defined())
                .width(availableWidth)
                .height(availableHeight2)
                .color(
                data
                    .map(function (d, i) {
                        return d.color || color(d, i);
                    })
                    .filter(function (d, i) {
                        return !data[i].disabled;
                    })
            );

            g.select('.nv-context')
                .attr('transform', 'translate(0,' + ( availableHeight1 + margin.bottom + margin2.top) + ')')

            var contextLinesWrap = g.select('.nv-context .nv-linesWrap')
                .datum(data.filter(function (d) {
                    return !d.disabled
                }))

            d3.transition(contextLinesWrap).call(lines2);

            // Setup Main (Focus) Axes
            xAxis
                .scale(x)
                .ticks(nv.utils.calcTicksX(availableWidth / 100, data))
                .tickSize(-availableHeight1, 0);

            yAxis
                .scale(y)
                .ticks(nv.utils.calcTicksY(availableHeight1 / 36, data))
                .tickSize(-availableWidth, 0);

            g.select('.nv-focus .nv-x.nv-axis')
                .attr('transform', 'translate(0,' + availableHeight1 + ')');

            // Setup Brush
            brush
                .x(x2)
                .on('brush', function () {
                    //When brushing, turn off transitions because chart needs to change immediately.
                    var oldTransition = chart.duration();
                    chart.duration(0);
                    onBrush();
                    chart.duration(oldTransition);
                });

            if (brushExtent) brush.extent(brushExtent);

            var brushBG = g.select('.nv-brushBackground').selectAll('g')
                .data([brushExtent || brush.extent()])

            var brushBGenter = brushBG.enter()
                .append('g');

            brushBGenter.append('rect')
                .attr('class', 'left')
                .attr('x', 0)
                .attr('y', 0)
                .attr('height', availableHeight2);

            brushBGenter.append('rect')
                .attr('class', 'right')
                .attr('x', 0)
                .attr('y', 0)
                .attr('height', availableHeight2);

            var gBrush = g.select('.nv-x.nv-brush')
                .call(brush);
            gBrush.selectAll('rect')
                //.attr('y', -5)
                .attr('height', availableHeight2);
            gBrush.selectAll('.resize').append('path').attr('d', resizePath);

            onBrush();

            // Setup Secondary (Context) Axes
            x2Axis
                .scale(x2)
                .ticks(nv.utils.calcTicksX(availableWidth / 100, data))
                .tickSize(-availableHeight2, 0);

            g.select('.nv-context .nv-x.nv-axis')
                .attr('transform', 'translate(0,' + y2.range()[0] + ')');
            d3.transition(g.select('.nv-context .nv-x.nv-axis'))
                .call(x2Axis);

            y2Axis
                .scale(y2)
                .ticks(nv.utils.calcTicksY(availableHeight2 / 36, data))
                .tickSize(-availableWidth, 0);

            d3.transition(g.select('.nv-context .nv-y.nv-axis'))
                .call(y2Axis);

            g.select('.nv-context .nv-x.nv-axis')
                .attr('transform', 'translate(0,' + y2.range()[0] + ')');

            //============================================================
            // Event Handling/Dispatching (in chart's scope)
            //------------------------------------------------------------

            legend.dispatch.on('stateChange', function (newState) {
                for (var key in newState)
                    state[key] = newState[key];
                dispatch.stateChange(state);
                chart.update();
            });

            dispatch.on('tooltipShow', function (e) {
                if (tooltips) showTooltip(e, that.parentNode);
            });

            dispatch.on('changeState', function (e) {
                if (typeof e.disabled !== 'undefined') {
                    data.forEach(function (series, i) {
                        series.disabled = e.disabled[i];
                    });
                }
                chart.update();
            });

            //============================================================
            // Functions
            //------------------------------------------------------------

            // Taken from crossfilter (http://square.github.com/crossfilter/)
            function resizePath(d) {
                var e = +(d == 'e'),
                    x = e ? 1 : -1,
                    y = availableHeight2 / 3;
                return 'M' + (.5 * x) + ',' + y
                    + 'A6,6 0 0 ' + e + ' ' + (6.5 * x) + ',' + (y + 6)
                    + 'V' + (2 * y - 6)
                    + 'A6,6 0 0 ' + e + ' ' + (.5 * x) + ',' + (2 * y)
                    + 'Z'
                    + 'M' + (2.5 * x) + ',' + (y + 8)
                    + 'V' + (2 * y - 8)
                    + 'M' + (4.5 * x) + ',' + (y + 8)
                    + 'V' + (2 * y - 8);
            }


            function updateBrushBG() {
                if (!brush.empty()) brush.extent(brushExtent);
                brushBG
                    .data([brush.empty() ? x2.domain() : brushExtent])
                    .each(function (d, i) {
                        var leftWidth = x2(d[0]) - x.range()[0],
                            rightWidth = x.range()[1] - x2(d[1]);
                        d3.select(this).select('.left')
                            .attr('width', leftWidth < 0 ? 0 : leftWidth);

                        d3.select(this).select('.right')
                            .attr('x', x2(d[1]))
                            .attr('width', rightWidth < 0 ? 0 : rightWidth);
                    });
            }


            function onBrush() {
                brushExtent = brush.empty() ? null : brush.extent();
                var extent = brush.empty() ? x2.domain() : brush.extent();

                //The brush extent cannot be less than one.  If it is, don't update the line chart.
                if (Math.abs(extent[0] - extent[1]) <= 1) {
                    return;
                }

                dispatch.brush({extent: extent, brush: brush});


                updateBrushBG();

                // Update Main (Focus)
                var focusLinesWrap = g.select('.nv-focus .nv-linesWrap')
                    .datum(
                    data
                        .filter(function (d) {
                            return !d.disabled
                        })
                        .map(function (d, i) {
                            return {
                                key: d.key,
                                area: d.area,
                                values: d.values.filter(function (d, i) {
                                    return lines.x()(d, i) >= extent[0] && lines.x()(d, i) <= extent[1];
                                })
                            }
                        })
                );
                focusLinesWrap.transition().duration(transitionDuration).call(lines);


                // Update Main (Focus) Axes
                g.select('.nv-focus .nv-x.nv-axis').transition().duration(transitionDuration)
                    .call(xAxis);
                g.select('.nv-focus .nv-y.nv-axis').transition().duration(transitionDuration)
                    .call(yAxis);
            }
        });

        return chart;
    }

    //============================================================
    // Event Handling/Dispatching (out of chart's scope)
    //------------------------------------------------------------

    lines.dispatch.on('elementMouseover.tooltip', function (e) {
        e.pos = [e.pos[0] + margin.left, e.pos[1] + margin.top];
        dispatch.tooltipShow(e);
    });

    lines.dispatch.on('elementMouseout.tooltip', function (e) {
        dispatch.tooltipHide(e);
    });

    dispatch.on('tooltipHide', function () {
        if (tooltips) nv.tooltip.cleanup();
    });

    //============================================================
    // Expose Public Variables
    //------------------------------------------------------------

    // expose chart's sub-components
    chart.dispatch = dispatch;
    chart.legend = legend;
    chart.lines = lines;
    chart.lines2 = lines2;
    chart.xAxis = xAxis;
    chart.yAxis = yAxis;
    chart.x2Axis = x2Axis;
    chart.y2Axis = y2Axis;

    chart.options = nv.utils.optionsFunc.bind(chart);

    chart._options = Object.create({}, {
        // simple options, just get/set the necessary values
        width: {
            get: function () {
                return width;
            }, set: function (_) {
                width = _;
            }
        },
        height: {
            get: function () {
                return height;
            }, set: function (_) {
                height = _;
            }
        },
        focusHeight: {
            get: function () {
                return height2;
            }, set: function (_) {
                height2 = _;
            }
        },
        showLegend: {
            get: function () {
                return showLegend;
            }, set: function (_) {
                showLegend = _;
            }
        },
        brushExtent: {
            get: function () {
                return brushExtent;
            }, set: function (_) {
                brushExtent = _;
            }
        },
        tooltips: {
            get: function () {
                return tooltips;
            }, set: function (_) {
                tooltips = _;
            }
        },
        tooltipContent: {
            get: function () {
                return tooltip;
            }, set: function (_) {
                tooltip = _;
            }
        },
        defaultState: {
            get: function () {
                return defaultState;
            }, set: function (_) {
                defaultState = _;
            }
        },
        noData: {
            get: function () {
                return noData;
            }, set: function (_) {
                noData = _;
            }
        },

        // options that require extra logic in the setter
        margin: {
            get: function () {
                return margin;
            }, set: function (_) {
                margin.top = _.top !== undefined ? _.top : margin.top;
                margin.right = _.right !== undefined ? _.right : margin.right;
                margin.bottom = _.bottom !== undefined ? _.bottom : margin.bottom;
                margin.left = _.left !== undefined ? _.left : margin.left;
            }
        },
        color: {
            get: function () {
                return color;
            }, set: function (_) {
                color = nv.utils.getColor(_);
                legend.color(color);
                // line color is handled above?
            }
        },
        interpolate: {
            get: function () {
                return lines.interpolate();
            }, set: function (_) {
                lines.interpolate(_);
                lines2.interpolate(_);
            }
        },
        xTickFormat: {
            get: function () {
                return xAxis.xTickFormat();
            }, set: function (_) {
                xAxis.xTickFormat(_);
                x2Axis.xTickFormat(_);
            }
        },
        yTickFormat: {
            get: function () {
                return yAxis.yTickFormat();
            }, set: function (_) {
                yAxis.yTickFormat(_);
                y2Axis.yTickFormat(_);
            }
        },
        duration: {
            get: function () {
                return transitionDuration;
            }, set: function (_) {
                transitionDuration = _;
                yAxis.duration(transitionDuration);
                xAxis.duration(transitionDuration);
            }
        },
        x: {
            get: function () {
                return lines.x();
            }, set: function (_) {
                lines.x(_);
                lines2.x(_);
            }
        },
        y: {
            get: function () {
                return lines.y();
            }, set: function (_) {
                lines.y(_);
                lines2.y(_);
            }
        }
    });

    nv.utils.inheritOptions(chart, lines);
    nv.utils.initOptions(chart);

    return chart;
};

nv.models.multiBar = function () {
    "use strict";

    //============================================================
    // Public Variables with Default Settings
    //------------------------------------------------------------

    var margin = {top: 0, right: 0, bottom: 0, left: 0}
        , width = 960
        , height = 500
        , x = d3.scale.ordinal()
        , y = d3.scale.linear()
        , id = Math.floor(Math.random() * 10000) //Create semi-unique ID in case user doesn't select one
        , getX = function (d) {
            return d.x
        }
        , getY = function (d) {
            return d.y
        }
        , forceY = [0] // 0 is forced by default.. this makes sense for the majority of bar graphs... user can always do chart.forceY([]) to remove
        , clipEdge = true
        , stacked = false
        , stackOffset = 'zero' // options include 'silhouette', 'wiggle', 'expand', 'zero', or a custom function
        , color = nv.utils.defaultColor()
        , hideable = false
        , barColor = null // adding the ability to set the color for each rather than the whole group
        , disabled // used in conjunction with barColor to communicate from multiBarHorizontalChart what series are disabled
        , duration = 500
        , xDomain
        , yDomain
        , xRange
        , yRange
        , groupSpacing = 0.1
        , dispatch = d3.dispatch('chartClick', 'elementClick', 'elementDblClick', 'elementMouseover', 'elementMouseout', 'renderEnd')
        ;

    //============================================================
    // Private Variables
    //------------------------------------------------------------

    var x0, y0 //used to store previous scales
        , renderWatch = nv.utils.renderWatch(dispatch, duration)
        ;

    var last_datalength = 0;

    function chart(selection) {
        renderWatch.reset();
        selection.each(function (data) {
            var availableWidth = width - margin.left - margin.right,
                availableHeight = height - margin.top - margin.bottom,
                container = d3.select(this);
            nv.utils.initSVG(container);

            // This function defines the requirements for render complete
            var endFn = function (d, i) {
                if (d.series === data.length - 1 && i === data[0].values.length - 1)
                    return true;
                return false;
            };

            if (hideable && data.length) hideable = [{
                values: data[0].values.map(function (d) {
                        return {
                            x: d.x,
                            y: 0,
                            series: d.series,
                            size: 0.01
                        };
                    }
                )
            }];

            if (stacked)
                data = d3.layout.stack()
                    .offset(stackOffset)
                    .values(function (d) {
                        return d.values
                    })
                    .y(getY)
                (!data.length && hideable ? hideable : data);


            //add series index to each data point for reference
            data.forEach(function (series, i) {
                series.values.forEach(function (point) {
                    point.series = i;
                });
            });

            // HACK for negative value stacking
            if (stacked)
                data[0].values.map(function (d, i) {
                    var posBase = 0, negBase = 0;
                    data.map(function (d) {
                        var f = d.values[i]
                        f.size = Math.abs(f.y);
                        if (f.y < 0) {
                            f.y1 = negBase;
                            negBase = negBase - f.size;
                        }
                        else {
                            f.y1 = f.size + posBase;
                            posBase = posBase + f.size;
                        }
                    });
                });

            // Setup Scales
            // remap and flatten the data for use in calculating the scales' domains
            var seriesData = (xDomain && yDomain) ? [] : // if we know xDomain and yDomain, no need to calculate
                data.map(function (d) {
                    return d.values.map(function (d, i) {
                        return {x: getX(d, i), y: getY(d, i), y0: d.y0, y1: d.y1}
                    })
                });

            x.domain(xDomain || d3.merge(seriesData).map(function (d) {
                return d.x
            }))
                .rangeBands(xRange || [0, availableWidth], groupSpacing);

            y.domain(yDomain || d3.extent(d3.merge(seriesData).map(function (d) {
                return stacked ? (d.y > 0 ? d.y1 : d.y1 + d.y ) : d.y
            }).concat(forceY)))
                .range(yRange || [availableHeight, 0]);

            // If scale's domain don't have a range, slightly adjust to make one... so a chart can show a single data point
            if (x.domain()[0] === x.domain()[1])
                x.domain()[0] ?
                    x.domain([x.domain()[0] - x.domain()[0] * 0.01, x.domain()[1] + x.domain()[1] * 0.01])
                    : x.domain([-1, 1]);

            if (y.domain()[0] === y.domain()[1])
                y.domain()[0] ?
                    y.domain([y.domain()[0] + y.domain()[0] * 0.01, y.domain()[1] - y.domain()[1] * 0.01])
                    : y.domain([-1, 1]);

            x0 = x0 || x;
            y0 = y0 || y;

            // Setup containers and skeleton of chart
            var wrap = container.selectAll('g.nv-wrap.nv-multibar').data([data]);
            var wrapEnter = wrap.enter().append('g').attr('class', 'nvd3 nv-wrap nv-multibar');
            var defsEnter = wrapEnter.append('defs');
            var gEnter = wrapEnter.append('g');
            var g = wrap.select('g')

            gEnter.append('g').attr('class', 'nv-groups');
            wrap.attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

            defsEnter.append('clipPath')
                .attr('id', 'nv-edge-clip-' + id)
                .append('rect');
            wrap.select('#nv-edge-clip-' + id + ' rect')
                .attr('width', availableWidth)
                .attr('height', availableHeight);

            g.attr('clip-path', clipEdge ? 'url(#nv-edge-clip-' + id + ')' : '');

            var groups = wrap.select('.nv-groups').selectAll('.nv-group')
                .data(function (d) {
                    return d
                }, function (d, i) {
                    return i
                });
            groups.enter().append('g')
                .style('stroke-opacity', 1e-6)
                .style('fill-opacity', 1e-6);

            var exitTransition = renderWatch
                .transition(groups.exit().selectAll('rect.nv-bar'), 'multibarExit', Math.min(100, duration))
                .attr('y', function (d) {
                    return (stacked ? y0(d.y0) : y0(0)) || 0
                })
                .attr('height', 0)
                .remove();
            if (exitTransition.delay)
                exitTransition.delay(function (d, i) {
                    var delay = i * (duration / (last_datalength + 1)) - i;
                    return delay;
                });
            groups
                .attr('class', function (d, i) {
                    return 'nv-group nv-series-' + i
                })
                .classed('hover', function (d) {
                    return d.hover
                })
                .style('fill', function (d, i) {
                    return color(d, i)
                })
                .style('stroke', function (d, i) {
                    return color(d, i)
                });
            groups
                .style('stroke-opacity', 1)
                .style('fill-opacity', 0.75);

            var bars = groups.selectAll('rect.nv-bar')
                .data(function (d) {
                    return (hideable && !data.length) ? hideable.values : d.values
                });
            bars.exit().remove();

            var barsEnter = bars.enter().append('rect')
                    .attr('class', function (d, i) {
                        return getY(d, i) < 0 ? 'nv-bar negative' : 'nv-bar positive'
                    })
                    .attr('x', function (d, i, j) {
                        return stacked ? 0 : (j * x.rangeBand() / data.length )
                    })
                    .attr('y', function (d) {
                        return y0(stacked ? d.y0 : 0) || 0
                    })
                    .attr('height', 0)
                    .attr('width', x.rangeBand() / (stacked ? 1 : data.length))
                    .attr('transform', function (d, i) {
                        return 'translate(' + x(getX(d, i)) + ',0)';
                    })
                ;
            bars
                .style('fill', function (d, i, j) {
                    return color(d, j, i);
                })
                .style('stroke', function (d, i, j) {
                    return color(d, j, i);
                })
                .on('mouseover', function (d, i) { //TODO: figure out why j works above, but not here
                    d3.select(this).classed('hover', true);
                    dispatch.elementMouseover({
                        value: getY(d, i),
                        point: d,
                        series: data[d.series],
                        pos: [x(getX(d, i)) + (x.rangeBand() * (stacked ? data.length / 2 : d.series + .5) / data.length), y(getY(d, i) + (stacked ? d.y0 : 0))],  // TODO: Figure out why the value appears to be shifted
                        pointIndex: i,
                        seriesIndex: d.series,
                        e: d3.event
                    });
                })
                .on('mouseout', function (d, i) {
                    d3.select(this).classed('hover', false);
                    dispatch.elementMouseout({
                        value: getY(d, i),
                        point: d,
                        series: data[d.series],
                        pointIndex: i,
                        seriesIndex: d.series,
                        e: d3.event
                    });
                })
                .on('click', function (d, i) {
                    dispatch.elementClick({
                        value: getY(d, i),
                        point: d,
                        series: data[d.series],
                        pos: [x(getX(d, i)) + (x.rangeBand() * (stacked ? data.length / 2 : d.series + .5) / data.length), y(getY(d, i) + (stacked ? d.y0 : 0))],  // TODO: Figure out why the value appears to be shifted
                        pointIndex: i,
                        seriesIndex: d.series,
                        e: d3.event
                    });
                    d3.event.stopPropagation();
                })
                .on('dblclick', function (d, i) {
                    dispatch.elementDblClick({
                        value: getY(d, i),
                        point: d,
                        series: data[d.series],
                        pos: [x(getX(d, i)) + (x.rangeBand() * (stacked ? data.length / 2 : d.series + .5) / data.length), y(getY(d, i) + (stacked ? d.y0 : 0))],  // TODO: Figure out why the value appears to be shifted
                        pointIndex: i,
                        seriesIndex: d.series,
                        e: d3.event
                    });
                    d3.event.stopPropagation();
                });
            bars
                .attr('class', function (d, i) {
                    return getY(d, i) < 0 ? 'nv-bar negative' : 'nv-bar positive'
                })
                .attr('transform', function (d, i) {
                    return 'translate(' + x(getX(d, i)) + ',0)';
                })

            if (barColor) {
                if (!disabled) disabled = data.map(function () {
                    return true
                });
                bars
                    .style('fill', function (d, i, j) {
                        return d3.rgb(barColor(d, i)).darker(disabled.map(function (d, i) {
                            return i
                        }).filter(function (d, i) {
                            return !disabled[i]
                        })[j]).toString();
                    })
                    .style('stroke', function (d, i, j) {
                        return d3.rgb(barColor(d, i)).darker(disabled.map(function (d, i) {
                            return i
                        }).filter(function (d, i) {
                            return !disabled[i]
                        })[j]).toString();
                    });
            }

            var barSelection =
                bars.watchTransition(renderWatch, 'multibar', Math.min(250, duration))
                    .delay(function (d, i) {
                        return i * duration / data[0].values.length;
                    });
            if (stacked)
                barSelection
                    .attr('y', function (d, i) {
                        return y((stacked ? d.y1 : 0));
                    })
                    .attr('height', function (d, i) {
                        return Math.max(Math.abs(y(d.y + (stacked ? d.y0 : 0)) - y((stacked ? d.y0 : 0))), 1);
                    })
                    .attr('x', function (d, i) {
                        return stacked ? 0 : (d.series * x.rangeBand() / data.length )
                    })
                    .attr('width', x.rangeBand() / (stacked ? 1 : data.length));
            else
                barSelection
                    .attr('x', function (d, i) {
                        return d.series * x.rangeBand() / data.length
                    })
                    .attr('width', x.rangeBand() / data.length)
                    .attr('y', function (d, i) {
                        return getY(d, i) < 0 ?
                            y(0) :
                            y(0) - y(getY(d, i)) < 1 ?
                            y(0) - 1 :
                            y(getY(d, i)) || 0;
                    })
                    .attr('height', function (d, i) {
                        return Math.max(Math.abs(y(getY(d, i)) - y(0)), 1) || 0;
                    });

            //store old scales for use in transitions on update
            x0 = x.copy();
            y0 = y.copy();

            // keep track of the last data value length for transition calculations
            if (data[0] && data[0].values) {
                last_datalength = data[0].values.length;
            }

        });

        renderWatch.renderEnd('multibar immediate');

        return chart;
    }

    //============================================================
    // Expose Public Variables
    //------------------------------------------------------------

    chart.dispatch = dispatch;

    chart.options = nv.utils.optionsFunc.bind(chart);

    chart._options = Object.create({}, {
        // simple options, just get/set the necessary values
        width: {
            get: function () {
                return width;
            }, set: function (_) {
                width = _;
            }
        },
        height: {
            get: function () {
                return height;
            }, set: function (_) {
                height = _;
            }
        },
        x: {
            get: function () {
                return getX;
            }, set: function (_) {
                getX = _;
            }
        },
        y: {
            get: function () {
                return getY;
            }, set: function (_) {
                getY = _;
            }
        },
        xScale: {
            get: function () {
                return x;
            }, set: function (_) {
                x = _;
            }
        },
        yScale: {
            get: function () {
                return y;
            }, set: function (_) {
                y = _;
            }
        },
        xDomain: {
            get: function () {
                return xDomain;
            }, set: function (_) {
                xDomain = _;
            }
        },
        yDomain: {
            get: function () {
                return yDomain;
            }, set: function (_) {
                yDomain = _;
            }
        },
        xRange: {
            get: function () {
                return xRange;
            }, set: function (_) {
                xRange = _;
            }
        },
        yRange: {
            get: function () {
                return yRange;
            }, set: function (_) {
                yRange = _;
            }
        },
        forceY: {
            get: function () {
                return forceY;
            }, set: function (_) {
                forceY = _;
            }
        },
        stacked: {
            get: function () {
                return stacked;
            }, set: function (_) {
                stacked = _;
            }
        },
        stackOffset: {
            get: function () {
                return stackOffset;
            }, set: function (_) {
                stackOffset = _;
            }
        },
        clipEdge: {
            get: function () {
                return clipEdge;
            }, set: function (_) {
                clipEdge = _;
            }
        },
        disabled: {
            get: function () {
                return disabled;
            }, set: function (_) {
                disabled = _;
            }
        },
        id: {
            get: function () {
                return id;
            }, set: function (_) {
                id = _;
            }
        },
        hideable: {
            get: function () {
                return hideable;
            }, set: function (_) {
                hideable = _;
            }
        },
        groupSpacing: {
            get: function () {
                return groupSpacing;
            }, set: function (_) {
                groupSpacing = _;
            }
        },

        // options that require extra logic in the setter
        margin: {
            get: function () {
                return margin;
            }, set: function (_) {
                margin.top = _.top !== undefined ? _.top : margin.top;
                margin.right = _.right !== undefined ? _.right : margin.right;
                margin.bottom = _.bottom !== undefined ? _.bottom : margin.bottom;
                margin.left = _.left !== undefined ? _.left : margin.left;
            }
        },
        duration: {
            get: function () {
                return duration;
            }, set: function (_) {
                duration = _;
                renderWatch.reset(duration);
            }
        },
        color: {
            get: function () {
                return color;
            }, set: function (_) {
                color = nv.utils.getColor(_);
            }
        },
        barColor: {
            get: function () {
                return barColor;
            }, set: function (_) {
                barColor = nv.utils.getColor(_);
            }
        }
    });

    nv.utils.initOptions(chart);

    return chart;
};

nv.models.multiBarChart = function () {
    "use strict";

    //============================================================
    // Public Variables with Default Settings
    //------------------------------------------------------------

    var multibar = nv.models.multiBar()
        , xAxis = nv.models.axis()
        , yAxis = nv.models.axis()
        , legend = nv.models.legend()
        , controls = nv.models.legend()
        ;

    var margin = {top: 30, right: 20, bottom: 50, left: 60}
        , width = null
        , height = null
        , color = nv.utils.defaultColor()
        , showControls = true
        , controlLabels = {}
        , showLegend = true
        , showXAxis = true
        , showYAxis = true
        , rightAlignYAxis = false
        , reduceXTicks = true // if false a tick will show for every data point
        , staggerLabels = false
        , rotateLabels = 0
        , tooltips = true
        , tooltip = function (key, x, y, e, graph) {
            return '<h3>' + key + '</h3>' +
                '<p>' + y + ' on ' + x + '</p>'
        }
        , x //can be accessed via chart.xScale()
        , y //can be accessed via chart.yScale()
        , state = nv.utils.state()
        , defaultState = null
        , noData = "No Data Available."
        , dispatch = d3.dispatch('tooltipShow', 'tooltipHide', 'stateChange', 'changeState', 'renderEnd')
        , controlWidth = function () {
            return showControls ? 180 : 0
        }
        , duration = 250
        ;

    state.stacked = false // DEPRECATED Maintained for backward compatibility

    multibar
        .stacked(false)
    ;
    xAxis
        .orient('bottom')
        .tickPadding(7)
        .highlightZero(true)
        .showMaxMin(false)
        .tickFormat(function (d) {
            return d
        })
    ;
    yAxis
        .orient((rightAlignYAxis) ? 'right' : 'left')
        .tickFormat(d3.format(',.1f'))
    ;

    controls.updateState(false);

    //============================================================
    // Private Variables
    //------------------------------------------------------------

    var renderWatch = nv.utils.renderWatch(dispatch);
    var stacked = false;

    var showTooltip = function (e, offsetElement) {
        var left = e.pos[0] + ( offsetElement.offsetLeft || 0 ),
            top = e.pos[1] + ( offsetElement.offsetTop || 0),
            x = xAxis.tickFormat()(multibar.x()(e.point, e.pointIndex)),
            y = yAxis.tickFormat()(multibar.y()(e.point, e.pointIndex)),
            content = tooltip(e.series.key, x, y, e, chart);

        nv.tooltip.show([left, top], content, e.value < 0 ? 'n' : 's', null, offsetElement);
    };

    var stateGetter = function (data) {
        return function () {
            return {
                active: data.map(function (d) {
                    return !d.disabled
                }),
                stacked: stacked
            };
        }
    };

    var stateSetter = function (data) {
        return function (state) {
            if (state.stacked !== undefined)
                stacked = state.stacked;
            if (state.active !== undefined)
                data.forEach(function (series, i) {
                    series.disabled = !state.active[i];
                });
        }
    };

    function chart(selection) {
        renderWatch.reset();
        renderWatch.models(multibar);
        if (showXAxis) renderWatch.models(xAxis);
        if (showYAxis) renderWatch.models(yAxis);

        selection.each(function (data) {
            var container = d3.select(this),
                that = this;
            nv.utils.initSVG(container);
            var availableWidth = (width || parseInt(container.style('width')) || 960)
                    - margin.left - margin.right,
                availableHeight = (height || parseInt(container.style('height')) || 400)
                    - margin.top - margin.bottom;

            chart.update = function () {
                if (duration === 0)
                    container.call(chart);
                else
                    container.transition()
                        .duration(duration)
                        .call(chart);
            };
            chart.container = this;

            state
                .setter(stateSetter(data), chart.update)
                .getter(stateGetter(data))
                .update();

            // DEPRECATED set state.disableddisabled
            state.disabled = data.map(function (d) {
                return !!d.disabled
            });

            if (!defaultState) {
                var key;
                defaultState = {};
                for (key in state) {
                    if (state[key] instanceof Array)
                        defaultState[key] = state[key].slice(0);
                    else
                        defaultState[key] = state[key];
                }
            }

            // Display noData message if there's nothing to show.
            if (!data || !data.length || !data.filter(function (d) {
                    return d.values.length
                }).length) {
                var noDataText = container.selectAll('.nv-noData').data([noData]);

                noDataText.enter().append('text')
                    .attr('class', 'nvd3 nv-noData')
                    .attr('dy', '-.7em')
                    .style('text-anchor', 'middle');

                noDataText
                    .attr('x', margin.left + availableWidth / 2)
                    .attr('y', margin.top + availableHeight / 2)
                    .text(function (d) {
                        return d
                    });

                return chart;
            }
            else {
                container.selectAll('.nv-noData').remove();
            }

            // Setup Scales
            x = multibar.xScale();
            y = multibar.yScale();

            // Setup containers and skeleton of chart
            var wrap = container.selectAll('g.nv-wrap.nv-multiBarWithLegend').data([data]);
            var gEnter = wrap.enter().append('g').attr('class', 'nvd3 nv-wrap nv-multiBarWithLegend').append('g');
            var g = wrap.select('g');

            gEnter.append('g').attr('class', 'nv-x nv-axis');
            gEnter.append('g').attr('class', 'nv-y nv-axis');
            gEnter.append('g').attr('class', 'nv-barsWrap');
            gEnter.append('g').attr('class', 'nv-legendWrap');
            gEnter.append('g').attr('class', 'nv-controlsWrap');

            // Legend
            if (showLegend) {
                legend.width(availableWidth - controlWidth());

                if (multibar.barColor())
                    data.forEach(function (series, i) {
                        series.color = d3.rgb('#ccc').darker(i * 1.5).toString();
                    });

                g.select('.nv-legendWrap')
                    .datum(data)
                    .call(legend);

                if (margin.top != legend.height()) {
                    margin.top = legend.height();
                    availableHeight = (height || parseInt(container.style('height')) || 400)
                    - margin.top - margin.bottom;
                }

                g.select('.nv-legendWrap')
                    .attr('transform', 'translate(' + controlWidth() + ',' + (-margin.top) + ')');
            }

            // Controls
            if (showControls) {
                var controlsData = [
                    {key: controlLabels.grouped || 'Grouped', disabled: multibar.stacked()},
                    {key: controlLabels.stacked || 'Stacked', disabled: !multibar.stacked()}
                ];

                controls.width(controlWidth()).color(['#444', '#444', '#444']);
                g.select('.nv-controlsWrap')
                    .datum(controlsData)
                    .attr('transform', 'translate(0,' + (-margin.top) + ')')
                    .call(controls);
            }

            wrap.attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');
            if (rightAlignYAxis) {
                g.select(".nv-y.nv-axis")
                    .attr("transform", "translate(" + availableWidth + ",0)");
            }

            // Main Chart Component(s)
            multibar
                .disabled(data.map(function (series) {
                    return series.disabled
                }))
                .width(availableWidth)
                .height(availableHeight)
                .color(data.map(function (d, i) {
                    return d.color || color(d, i);
                }).filter(function (d, i) {
                    return !data[i].disabled
                }));


            var barsWrap = g.select('.nv-barsWrap')
                .datum(data.filter(function (d) {
                    return !d.disabled
                }));

            barsWrap.call(multibar);

            // Setup Axes
            if (showXAxis) {
                xAxis
                    .scale(x)
                    .ticks(nv.utils.calcTicksX(availableWidth / 100, data))
                    .tickSize(-availableHeight, 0);

                g.select('.nv-x.nv-axis')
                    .attr('transform', 'translate(0,' + y.range()[0] + ')');
                g.select('.nv-x.nv-axis')
                    .call(xAxis);

                var xTicks = g.select('.nv-x.nv-axis > g').selectAll('g');

                xTicks
                    .selectAll('line, text')
                    .style('opacity', 1)

                if (staggerLabels) {
                    var getTranslate = function (x, y) {
                        return "translate(" + x + "," + y + ")";
                    };

                    var staggerUp = 5, staggerDown = 17;  //pixels to stagger by
                    // Issue #140
                    xTicks
                        .selectAll("text")
                        .attr('transform', function (d, i, j) {
                            return getTranslate(0, (j % 2 == 0 ? staggerUp : staggerDown));
                        });

                    var totalInBetweenTicks = d3.selectAll(".nv-x.nv-axis .nv-wrap g g text")[0].length;
                    g.selectAll(".nv-x.nv-axis .nv-axisMaxMin text")
                        .attr("transform", function (d, i) {
                            return getTranslate(0, (i === 0 || totalInBetweenTicks % 2 !== 0) ? staggerDown : staggerUp);
                        });
                }

                if (reduceXTicks)
                    xTicks
                        .filter(function (d, i) {
                            return i % Math.ceil(data[0].values.length / (availableWidth / 100)) !== 0;
                        })
                        .selectAll('text, line')
                        .style('opacity', 0);

                if (rotateLabels)
                    xTicks
                        .selectAll('.tick text')
                        .attr('transform', 'rotate(' + rotateLabels + ' 0,0)')
                        .style('text-anchor', rotateLabels > 0 ? 'start' : 'end');

                g.select('.nv-x.nv-axis').selectAll('g.nv-axisMaxMin text')
                    .style('opacity', 1);
            }

            if (showYAxis) {
                yAxis
                    .scale(y)
                    .ticks(nv.utils.calcTicksY(availableHeight / 36, data))
                    .tickSize(-availableWidth, 0);

                g.select('.nv-y.nv-axis')
                    .call(yAxis);
            }

            //============================================================
            // Event Handling/Dispatching (in chart's scope)
            //------------------------------------------------------------

            legend.dispatch.on('stateChange', function (newState) {
                for (var key in newState)
                    state[key] = newState[key];
                dispatch.stateChange(state);
                chart.update();
            });

            controls.dispatch.on('legendClick', function (d, i) {
                if (!d.disabled) return;
                controlsData = controlsData.map(function (s) {
                    s.disabled = true;
                    return s;
                });
                d.disabled = false;

                switch (d.key) {
                    case 'Grouped':
                        multibar.stacked(false);
                        break;
                    case 'Stacked':
                        multibar.stacked(true);
                        break;
                }

                state.stacked = multibar.stacked();
                dispatch.stateChange(state);

                chart.update();
            });

            dispatch.on('tooltipShow', function (e) {
                if (tooltips) showTooltip(e, that.parentNode)
            });

            // Update chart from a state object passed to event handler
            dispatch.on('changeState', function (e) {

                if (typeof e.disabled !== 'undefined') {
                    data.forEach(function (series, i) {
                        series.disabled = e.disabled[i];
                    });

                    state.disabled = e.disabled;
                }

                if (typeof e.stacked !== 'undefined') {
                    multibar.stacked(e.stacked);
                    state.stacked = e.stacked;
                    stacked = e.stacked;
                }

                chart.update();
            });
        });

        renderWatch.renderEnd('multibarchart immediate');
        return chart;
    }

    //============================================================
    // Event Handling/Dispatching (out of chart's scope)
    //------------------------------------------------------------

    multibar.dispatch.on('elementMouseover.tooltip', function (e) {
        e.pos = [e.pos[0] + margin.left, e.pos[1] + margin.top];
        dispatch.tooltipShow(e);
    });

    multibar.dispatch.on('elementMouseout.tooltip', function (e) {
        dispatch.tooltipHide(e);
    });
    dispatch.on('tooltipHide', function () {
        if (tooltips) nv.tooltip.cleanup();
    });

    //============================================================
    // Expose Public Variables
    //------------------------------------------------------------

    // expose chart's sub-components
    chart.dispatch = dispatch;
    chart.multibar = multibar;
    chart.legend = legend;
    chart.xAxis = xAxis;
    chart.yAxis = yAxis;
    chart.state = state;

    chart.options = nv.utils.optionsFunc.bind(chart);

    chart._options = Object.create({}, {
        // simple options, just get/set the necessary values
        width: {
            get: function () {
                return width;
            }, set: function (_) {
                width = _;
            }
        },
        height: {
            get: function () {
                return height;
            }, set: function (_) {
                height = _;
            }
        },
        showLegend: {
            get: function () {
                return showLegend;
            }, set: function (_) {
                showLegend = _;
            }
        },
        showControls: {
            get: function () {
                return showControls;
            }, set: function (_) {
                showControls = _;
            }
        },
        controlLabels: {
            get: function () {
                return controlLabels;
            }, set: function (_) {
                controlLabels = _;
            }
        },
        showXAxis: {
            get: function () {
                return showXAxis;
            }, set: function (_) {
                showXAxis = _;
            }
        },
        showYAxis: {
            get: function () {
                return showYAxis;
            }, set: function (_) {
                showYAxis = _;
            }
        },
        tooltips: {
            get: function () {
                return tooltips;
            }, set: function (_) {
                tooltips = _;
            }
        },
        tooltipContent: {
            get: function () {
                return tooltip;
            }, set: function (_) {
                tooltip = _;
            }
        },
        defaultState: {
            get: function () {
                return defaultState;
            }, set: function (_) {
                defaultState = _;
            }
        },
        noData: {
            get: function () {
                return noData;
            }, set: function (_) {
                noData = _;
            }
        },
        reduceXTicks: {
            get: function () {
                return reduceXTicks;
            }, set: function (_) {
                reduceXTicks = _;
            }
        },
        rotateLabels: {
            get: function () {
                return rotateLabels;
            }, set: function (_) {
                rotateLabels = _;
            }
        },
        staggerLabels: {
            get: function () {
                return staggerLabels;
            }, set: function (_) {
                staggerLabels = _;
            }
        },

        // options that require extra logic in the setter
        margin: {
            get: function () {
                return margin;
            }, set: function (_) {
                margin.top = _.top !== undefined ? _.top : margin.top;
                margin.right = _.right !== undefined ? _.right : margin.right;
                margin.bottom = _.bottom !== undefined ? _.bottom : margin.bottom;
                margin.left = _.left !== undefined ? _.left : margin.left;
            }
        },
        duration: {
            get: function () {
                return duration;
            }, set: function (_) {
                duration = _;
                multibar.duration(duration);
                xAxis.duration(duration);
                yAxis.duration(duration);
                renderWatch.reset(duration);
            }
        },
        color: {
            get: function () {
                return color;
            }, set: function (_) {
                color = nv.utils.getColor(_);
                legend.color(color);
            }
        },
        rightAlignYAxis: {
            get: function () {
                return rightAlignYAxis;
            }, set: function (_) {
                rightAlignYAxis = _;
                yAxis.orient(rightAlignYAxis ? 'right' : 'left');
            }
        }
    });

    nv.utils.inheritOptions(chart, multibar);
    nv.utils.initOptions(chart);

    return chart;
};

nv.models.multiBarHorizontal = function () {
    "use strict";

    //============================================================
    // Public Variables with Default Settings
    //------------------------------------------------------------

    var margin = {top: 0, right: 0, bottom: 0, left: 0}
        , width = 960
        , height = 500
        , id = Math.floor(Math.random() * 10000) //Create semi-unique ID in case user doesn't select one
        , x = d3.scale.ordinal()
        , y = d3.scale.linear()
        , getX = function (d) {
            return d.x
        }
        , getY = function (d) {
            return d.y
        }
        , getYerr = function (d) {
            return d.yErr
        }
        , forceY = [0] // 0 is forced by default.. this makes sense for the majority of bar graphs... user can always do chart.forceY([]) to remove
        , color = nv.utils.defaultColor()
        , barColor = null // adding the ability to set the color for each rather than the whole group
        , disabled // used in conjunction with barColor to communicate from multiBarHorizontalChart what series are disabled
        , stacked = false
        , showValues = false
        , showBarLabels = false
        , valuePadding = 60
        , valueFormat = d3.format(',.2f')
        , delay = 1200
        , xDomain
        , yDomain
        , xRange
        , yRange
        , duration = 250
        , dispatch = d3.dispatch('chartClick', 'elementClick', 'elementDblClick', 'elementMouseover', 'elementMouseout', 'renderEnd')
        ;

    //============================================================
    // Private Variables
    //------------------------------------------------------------

    var x0, y0; //used to store previous scales
    var renderWatch = nv.utils.renderWatch(dispatch, duration);

    function chart(selection) {
        renderWatch.reset();
        selection.each(function (data) {
            var availableWidth = width - margin.left - margin.right,
                availableHeight = height - margin.top - margin.bottom,
                container = d3.select(this);
            nv.utils.initSVG(container);

            if (stacked)
                data = d3.layout.stack()
                    .offset('zero')
                    .values(function (d) {
                        return d.values
                    })
                    .y(getY)
                (data);

            //add series index to each data point for reference
            data.forEach(function (series, i) {
                series.values.forEach(function (point) {
                    point.series = i;
                });
            });

            // HACK for negative value stacking
            if (stacked)
                data[0].values.map(function (d, i) {
                    var posBase = 0, negBase = 0;
                    data.map(function (d) {
                        var f = d.values[i]
                        f.size = Math.abs(f.y);
                        if (f.y < 0) {
                            f.y1 = negBase - f.size;
                            negBase = negBase - f.size;
                        }
                        else {
                            f.y1 = posBase;
                            posBase = posBase + f.size;
                        }
                    });
                });

            // Setup Scales
            // remap and flatten the data for use in calculating the scales' domains
            var seriesData = (xDomain && yDomain) ? [] : // if we know xDomain and yDomain, no need to calculate
                data.map(function (d) {
                    return d.values.map(function (d, i) {
                        return {x: getX(d, i), y: getY(d, i), y0: d.y0, y1: d.y1}
                    })
                });

            x.domain(xDomain || d3.merge(seriesData).map(function (d) {
                return d.x
            }))
                .rangeBands(xRange || [0, availableHeight], .1);

            y.domain(yDomain || d3.extent(d3.merge(seriesData).map(function (d) {
                return stacked ? (d.y > 0 ? d.y1 + d.y : d.y1 ) : d.y
            }).concat(forceY)))

            if (showValues && !stacked)
                y.range(yRange || [(y.domain()[0] < 0 ? valuePadding : 0), availableWidth - (y.domain()[1] > 0 ? valuePadding : 0)]);
            else
                y.range(yRange || [0, availableWidth]);

            x0 = x0 || x;
            y0 = y0 || d3.scale.linear().domain(y.domain()).range([y(0), y(0)]);

            // Setup containers and skeleton of chart
            var wrap = d3.select(this).selectAll('g.nv-wrap.nv-multibarHorizontal').data([data]);
            var wrapEnter = wrap.enter().append('g').attr('class', 'nvd3 nv-wrap nv-multibarHorizontal');
            var defsEnter = wrapEnter.append('defs');
            var gEnter = wrapEnter.append('g');
            var g = wrap.select('g');

            gEnter.append('g').attr('class', 'nv-groups');
            wrap.attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

            var groups = wrap.select('.nv-groups').selectAll('.nv-group')
                .data(function (d) {
                    return d
                }, function (d, i) {
                    return i
                });
            groups.enter().append('g')
                .style('stroke-opacity', 1e-6)
                .style('fill-opacity', 1e-6);
            groups.exit().watchTransition(renderWatch, 'multibarhorizontal: exit groups')
                .style('stroke-opacity', 1e-6)
                .style('fill-opacity', 1e-6)
                .remove();
            groups
                .attr('class', function (d, i) {
                    return 'nv-group nv-series-' + i
                })
                .classed('hover', function (d) {
                    return d.hover
                })
                .style('fill', function (d, i) {
                    return color(d, i)
                })
                .style('stroke', function (d, i) {
                    return color(d, i)
                });
            groups.watchTransition(renderWatch, 'multibarhorizontal: groups')
                .style('stroke-opacity', 1)
                .style('fill-opacity', .75);

            var bars = groups.selectAll('g.nv-bar')
                .data(function (d) {
                    return d.values
                });
            bars.exit().remove();

            var barsEnter = bars.enter().append('g')
                .attr('transform', function (d, i, j) {
                    return 'translate(' + y0(stacked ? d.y0 : 0) + ',' + (stacked ? 0 : (j * x.rangeBand() / data.length ) + x(getX(d, i))) + ')'
                });

            barsEnter.append('rect')
                .attr('width', 0)
                .attr('height', x.rangeBand() / (stacked ? 1 : data.length))

            bars
                .on('mouseover', function (d, i) { //TODO: figure out why j works above, but not here
                    d3.select(this).classed('hover', true);
                    dispatch.elementMouseover({
                        value: getY(d, i),
                        point: d,
                        series: data[d.series],
                        pos: [y(getY(d, i) + (stacked ? d.y0 : 0)), x(getX(d, i)) + (x.rangeBand() * (stacked ? data.length / 2 : d.series + .5) / data.length)],
                        pointIndex: i,
                        seriesIndex: d.series,
                        e: d3.event
                    });
                })
                .on('mouseout', function (d, i) {
                    d3.select(this).classed('hover', false);
                    dispatch.elementMouseout({
                        value: getY(d, i),
                        point: d,
                        series: data[d.series],
                        pointIndex: i,
                        seriesIndex: d.series,
                        e: d3.event
                    });
                })
                .on('click', function (d, i) {
                    dispatch.elementClick({
                        value: getY(d, i),
                        point: d,
                        series: data[d.series],
                        pos: [x(getX(d, i)) + (x.rangeBand() * (stacked ? data.length / 2 : d.series + .5) / data.length), y(getY(d, i) + (stacked ? d.y0 : 0))],  // TODO: Figure out why the value appears to be shifted
                        pointIndex: i,
                        seriesIndex: d.series,
                        e: d3.event
                    });
                    d3.event.stopPropagation();
                })
                .on('dblclick', function (d, i) {
                    dispatch.elementDblClick({
                        value: getY(d, i),
                        point: d,
                        series: data[d.series],
                        pos: [x(getX(d, i)) + (x.rangeBand() * (stacked ? data.length / 2 : d.series + .5) / data.length), y(getY(d, i) + (stacked ? d.y0 : 0))],  // TODO: Figure out why the value appears to be shifted
                        pointIndex: i,
                        seriesIndex: d.series,
                        e: d3.event
                    });
                    d3.event.stopPropagation();
                });

            if (getYerr(data[0], 0)) {
                barsEnter.append('polyline');

                bars.select('polyline')
                    .attr('fill', 'none')
                    .attr('points', function (d, i) {
                        var xerr = getYerr(d, i)
                            , mid = 0.8 * x.rangeBand() / ((stacked ? 1 : data.length) * 2);
                        xerr = xerr.length ? xerr : [-Math.abs(xerr), Math.abs(xerr)];
                        xerr = xerr.map(function (e) {
                            return y(e) - y(0);
                        });
                        var a = [[xerr[0], -mid], [xerr[0], mid], [xerr[0], 0], [xerr[1], 0], [xerr[1], -mid], [xerr[1], mid]];
                        return a.map(function (path) {
                            return path.join(',')
                        }).join(' ');
                    })
                    .attr('transform', function (d, i) {
                        var mid = x.rangeBand() / ((stacked ? 1 : data.length) * 2);
                        return 'translate(' + (getY(d, i) < 0 ? 0 : y(getY(d, i)) - y(0)) + ', ' + mid + ')'
                    });
            }

            barsEnter.append('text');

            if (showValues && !stacked) {
                bars.select('text')
                    .attr('text-anchor', function (d, i) {
                        return getY(d, i) < 0 ? 'end' : 'start'
                    })
                    .attr('y', x.rangeBand() / (data.length * 2))
                    .attr('dy', '.32em')
                    .html(function (d, i) {
                        var t = valueFormat(getY(d, i))
                            , yerr = getYerr(d, i);
                        if (yerr === undefined)
                            return t;
                        if (!yerr.length)
                            return t + '&plusmn;' + valueFormat(Math.abs(yerr));
                        return t + '+' + valueFormat(Math.abs(yerr[1])) + '-' + valueFormat(Math.abs(yerr[0]));
                    });
                bars.watchTransition(renderWatch, 'multibarhorizontal: bars')
                    .select('text')
                    .attr('x', function (d, i) {
                        return getY(d, i) < 0 ? -4 : y(getY(d, i)) - y(0) + 4
                    })
            }
            else {
                bars.selectAll('text').text('');
            }

            if (showBarLabels && !stacked) {
                barsEnter.append('text').classed('nv-bar-label', true);
                bars.select('text.nv-bar-label')
                    .attr('text-anchor', function (d, i) {
                        return getY(d, i) < 0 ? 'start' : 'end'
                    })
                    .attr('y', x.rangeBand() / (data.length * 2))
                    .attr('dy', '.32em')
                    .text(function (d, i) {
                        return getX(d, i)
                    });
                bars.watchTransition(renderWatch, 'multibarhorizontal: bars')
                    .select('text.nv-bar-label')
                    .attr('x', function (d, i) {
                        return getY(d, i) < 0 ? y(0) - y(getY(d, i)) + 4 : -4
                    });
            }
            else {
                bars.selectAll('text.nv-bar-label').text('');
            }

            bars
                .attr('class', function (d, i) {
                    return getY(d, i) < 0 ? 'nv-bar negative' : 'nv-bar positive'
                })

            if (barColor) {
                if (!disabled) disabled = data.map(function () {
                    return true
                });
                bars
                    .style('fill', function (d, i, j) {
                        return d3.rgb(barColor(d, i)).darker(disabled.map(function (d, i) {
                            return i
                        }).filter(function (d, i) {
                            return !disabled[i]
                        })[j]).toString();
                    })
                    .style('stroke', function (d, i, j) {
                        return d3.rgb(barColor(d, i)).darker(disabled.map(function (d, i) {
                            return i
                        }).filter(function (d, i) {
                            return !disabled[i]
                        })[j]).toString();
                    });
            }

            if (stacked)
                bars.watchTransition(renderWatch, 'multibarhorizontal: bars')
                    .attr('transform', function (d, i) {
                        return 'translate(' + y(d.y1) + ',' + x(getX(d, i)) + ')'
                    })
                    .select('rect')
                    .attr('width', function (d, i) {
                        return Math.abs(y(getY(d, i) + d.y0) - y(d.y0))
                    })
                    .attr('height', x.rangeBand());
            else
                bars.watchTransition(renderWatch, 'multibarhorizontal: bars')
                    .attr('transform', function (d, i) {
                        //TODO: stacked must be all positive or all negative, not both?
                        return 'translate(' +
                            (getY(d, i) < 0 ? y(getY(d, i)) : y(0))
                            + ',' +
                            (d.series * x.rangeBand() / data.length
                            +
                            x(getX(d, i)) )
                            + ')'
                    })
                    .select('rect')
                    .attr('height', x.rangeBand() / data.length)
                    .attr('width', function (d, i) {
                        return Math.max(Math.abs(y(getY(d, i)) - y(0)), 1)
                    });

            //store old scales for use in transitions on update
            x0 = x.copy();
            y0 = y.copy();

        });

        renderWatch.renderEnd('multibarHorizontal immediate');
        return chart;
    }

    //============================================================
    // Expose Public Variables
    //------------------------------------------------------------

    chart.dispatch = dispatch;

    chart.options = nv.utils.optionsFunc.bind(chart);

    chart._options = Object.create({}, {
        // simple options, just get/set the necessary values
        width: {
            get: function () {
                return width;
            }, set: function (_) {
                width = _;
            }
        },
        height: {
            get: function () {
                return height;
            }, set: function (_) {
                height = _;
            }
        },
        x: {
            get: function () {
                return getX;
            }, set: function (_) {
                getX = _;
            }
        },
        y: {
            get: function () {
                return getY;
            }, set: function (_) {
                getY = _;
            }
        },
        yErr: {
            get: function () {
                return getYerr;
            }, set: function (_) {
                getYerr = _;
            }
        },
        xScale: {
            get: function () {
                return x;
            }, set: function (_) {
                x = _;
            }
        },
        yScale: {
            get: function () {
                return y;
            }, set: function (_) {
                y = _;
            }
        },
        xDomain: {
            get: function () {
                return xDomain;
            }, set: function (_) {
                xDomain = _;
            }
        },
        yDomain: {
            get: function () {
                return yDomain;
            }, set: function (_) {
                yDomain = _;
            }
        },
        xRange: {
            get: function () {
                return xRange;
            }, set: function (_) {
                xRange = _;
            }
        },
        yRange: {
            get: function () {
                return yRange;
            }, set: function (_) {
                yRange = _;
            }
        },
        forceY: {
            get: function () {
                return forceY;
            }, set: function (_) {
                forceY = _;
            }
        },
        stacked: {
            get: function () {
                return stacked;
            }, set: function (_) {
                stacked = _;
            }
        },
        showValues: {
            get: function () {
                return showValues;
            }, set: function (_) {
                showValues = _;
            }
        },
        // this shows the group name, seems pointless?
        //showBarLabels:    {get: function(){return showBarLabels;}, set: function(_){showBarLabels=_;}},
        disabled: {
            get: function () {
                return disabled;
            }, set: function (_) {
                disabled = _;
            }
        },
        id: {
            get: function () {
                return id;
            }, set: function (_) {
                id = _;
            }
        },
        valueFormat: {
            get: function () {
                return valueFormat;
            }, set: function (_) {
                valueFormat = _;
            }
        },
        valuePadding: {
            get: function () {
                return valuePadding;
            }, set: function (_) {
                valuePadding = _;
            }
        },

        // options that require extra logic in the setter
        margin: {
            get: function () {
                return margin;
            }, set: function (_) {
                margin.top = _.top !== undefined ? _.top : margin.top;
                margin.right = _.right !== undefined ? _.right : margin.right;
                margin.bottom = _.bottom !== undefined ? _.bottom : margin.bottom;
                margin.left = _.left !== undefined ? _.left : margin.left;
            }
        },
        duration: {
            get: function () {
                return duration;
            }, set: function (_) {
                duration = _;
                renderWatch.reset(duration);
            }
        },
        color: {
            get: function () {
                return color;
            }, set: function (_) {
                color = nv.utils.getColor(_);
            }
        },
        barColor: {
            get: function () {
                return color;
            }, set: function (_) {
                barColor = nv.utils.getColor(_);
            }
        }
    });

    nv.utils.initOptions(chart);

    return chart;
};
nv.models.multiBarHorizontalChart = function () {
    "use strict";

    //============================================================
    // Public Variables with Default Settings
    //------------------------------------------------------------

    var multibar = nv.models.multiBarHorizontal()
        , xAxis = nv.models.axis()
        , yAxis = nv.models.axis()
        , legend = nv.models.legend().height(30)
        , controls = nv.models.legend().height(30)
        ;

    var margin = {top: 30, right: 20, bottom: 50, left: 60}
        , width = null
        , height = null
        , color = nv.utils.defaultColor()
        , showControls = true
        , controlLabels = {}
        , showLegend = true
        , showXAxis = true
        , showYAxis = true
        , stacked = false
        , tooltips = true
        , tooltip = function (key, x, y, e, graph) {
            return '<h3>' + key + ' - ' + x + '</h3>' +
                '<p>' + y + '</p>'
        }
        , x //can be accessed via chart.xScale()
        , y //can be accessed via chart.yScale()
        , state = nv.utils.state()
        , defaultState = null
        , noData = 'No Data Available.'
        , dispatch = d3.dispatch('tooltipShow', 'tooltipHide', 'stateChange', 'changeState', 'renderEnd')
        , controlWidth = function () {
            return showControls ? 180 : 0
        }
        , duration = 250
        ;

    state.stacked = false; // DEPRECATED Maintained for backward compatibility

    multibar
        .stacked(stacked)
    ;
    xAxis
        .orient('left')
        .tickPadding(5)
        .highlightZero(false)
        .showMaxMin(false)
        .tickFormat(function (d) {
            return d
        })
    ;
    yAxis
        .orient('bottom')
        .tickFormat(d3.format(',.1f'))
    ;

    controls.updateState(false);

    //============================================================
    // Private Variables
    //------------------------------------------------------------

    var showTooltip = function (e, offsetElement) {
        var left = e.pos[0] + ( offsetElement.offsetLeft || 0 ),
            top = e.pos[1] + ( offsetElement.offsetTop || 0),
            x = xAxis.tickFormat()(multibar.x()(e.point, e.pointIndex)),
            y = yAxis.tickFormat()(multibar.y()(e.point, e.pointIndex)),
            content = tooltip(e.series.key, x, y, e, chart);

        nv.tooltip.show([left, top], content, e.value < 0 ? 'e' : 'w', null, offsetElement);
    };

    var stateGetter = function (data) {
        return function () {
            return {
                active: data.map(function (d) {
                    return !d.disabled
                }),
                stacked: stacked
            };
        }
    };

    var stateSetter = function (data) {
        return function (state) {
            if (state.stacked !== undefined)
                stacked = state.stacked;
            if (state.active !== undefined)
                data.forEach(function (series, i) {
                    series.disabled = !state.active[i];
                });
        }
    };

    var renderWatch = nv.utils.renderWatch(dispatch, duration);

    function chart(selection) {
        renderWatch.reset();
        renderWatch.models(multibar);
        if (showXAxis) renderWatch.models(xAxis);
        if (showYAxis) renderWatch.models(yAxis);

        selection.each(function (data) {
            var container = d3.select(this),
                that = this;
            nv.utils.initSVG(container);
            var availableWidth = (width || parseInt(container.style('width')) || 960)
                    - margin.left - margin.right,
                availableHeight = (height || parseInt(container.style('height')) || 400)
                    - margin.top - margin.bottom;

            chart.update = function () {
                container.transition().duration(duration).call(chart)
            };
            chart.container = this;

            stacked = multibar.stacked();

            state
                .setter(stateSetter(data), chart.update)
                .getter(stateGetter(data))
                .update();

            // DEPRECATED set state.disableddisabled
            state.disabled = data.map(function (d) {
                return !!d.disabled
            });

            if (!defaultState) {
                var key;
                defaultState = {};
                for (key in state) {
                    if (state[key] instanceof Array)
                        defaultState[key] = state[key].slice(0);
                    else
                        defaultState[key] = state[key];
                }
            }

            // Display No Data message if there's nothing to show.
            if (!data || !data.length || !data.filter(function (d) {
                    return d.values.length
                }).length) {
                var noDataText = container.selectAll('.nv-noData').data([noData]);

                noDataText.enter().append('text')
                    .attr('class', 'nvd3 nv-noData')
                    .attr('dy', '-.7em')
                    .style('text-anchor', 'middle');

                noDataText
                    .attr('x', margin.left + availableWidth / 2)
                    .attr('y', margin.top + availableHeight / 2)
                    .text(function (d) {
                        return d
                    });

                return chart;
            }
            else {
                container.selectAll('.nv-noData').remove();
            }

            // Setup Scales
            x = multibar.xScale();
            y = multibar.yScale();

            // Setup containers and skeleton of chart
            var wrap = container.selectAll('g.nv-wrap.nv-multiBarHorizontalChart').data([data]);
            var gEnter = wrap.enter().append('g').attr('class', 'nvd3 nv-wrap nv-multiBarHorizontalChart').append('g');
            var g = wrap.select('g');

            gEnter.append('g').attr('class', 'nv-x nv-axis');
            gEnter.append('g').attr('class', 'nv-y nv-axis')
                .append('g').attr('class', 'nv-zeroLine')
                .append('line');
            gEnter.append('g').attr('class', 'nv-barsWrap');
            gEnter.append('g').attr('class', 'nv-legendWrap');
            gEnter.append('g').attr('class', 'nv-controlsWrap');

            // Legend
            if (showLegend) {
                legend.width(availableWidth - controlWidth());

                if (multibar.barColor())
                    data.forEach(function (series, i) {
                        series.color = d3.rgb('#ccc').darker(i * 1.5).toString();
                    });

                g.select('.nv-legendWrap')
                    .datum(data)
                    .call(legend);

                if (margin.top != legend.height()) {
                    margin.top = legend.height();
                    availableHeight = (height || parseInt(container.style('height')) || 400)
                    - margin.top - margin.bottom;
                }

                g.select('.nv-legendWrap')
                    .attr('transform', 'translate(' + controlWidth() + ',' + (-margin.top) + ')');
            }

            // Controls
            if (showControls) {
                var controlsData = [
                    {key: controlLabels.grouped || 'Grouped', disabled: multibar.stacked()},
                    {key: controlLabels.stacked || 'Stacked', disabled: !multibar.stacked()}
                ];

                controls.width(controlWidth()).color(['#444', '#444', '#444']);
                g.select('.nv-controlsWrap')
                    .datum(controlsData)
                    .attr('transform', 'translate(0,' + (-margin.top) + ')')
                    .call(controls);
            }

            wrap.attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

            // Main Chart Component(s)
            multibar
                .disabled(data.map(function (series) {
                    return series.disabled
                }))
                .width(availableWidth)
                .height(availableHeight)
                .color(data.map(function (d, i) {
                    return d.color || color(d, i);
                }).filter(function (d, i) {
                    return !data[i].disabled
                }));

            var barsWrap = g.select('.nv-barsWrap')
                .datum(data.filter(function (d) {
                    return !d.disabled
                }));

            barsWrap.transition().call(multibar);

            // Setup Axes
            if (showXAxis) {
                xAxis
                    .scale(x)
                    .ticks(nv.utils.calcTicksY(availableHeight / 24, data))
                    .tickSize(-availableWidth, 0);

                g.select('.nv-x.nv-axis').call(xAxis);

                var xTicks = g.select('.nv-x.nv-axis').selectAll('g');

                xTicks
                    .selectAll('line, text');
            }

            if (showYAxis) {
                yAxis
                    .scale(y)
                    .ticks(nv.utils.calcTicksX(availableWidth / 100, data))
                    .tickSize(-availableHeight, 0);

                g.select('.nv-y.nv-axis')
                    .attr('transform', 'translate(0,' + availableHeight + ')');
                g.select('.nv-y.nv-axis').call(yAxis);
            }

            // Zero line
            g.select(".nv-zeroLine line")
                .attr("x1", y(0))
                .attr("x2", y(0))
                .attr("y1", 0)
                .attr("y2", -availableHeight)
            ;

            //============================================================
            // Event Handling/Dispatching (in chart's scope)
            //------------------------------------------------------------

            legend.dispatch.on('stateChange', function (newState) {
                for (var key in newState)
                    state[key] = newState[key];
                dispatch.stateChange(state);
                chart.update();
            });

            controls.dispatch.on('legendClick', function (d, i) {
                if (!d.disabled) return;
                controlsData = controlsData.map(function (s) {
                    s.disabled = true;
                    return s;
                });
                d.disabled = false;

                switch (d.key) {
                    case 'Grouped':
                        multibar.stacked(false);
                        break;
                    case 'Stacked':
                        multibar.stacked(true);
                        break;
                }

                state.stacked = multibar.stacked();
                dispatch.stateChange(state);
                stacked = multibar.stacked();

                chart.update();
            });

            dispatch.on('tooltipShow', function (e) {
                if (tooltips) showTooltip(e, that.parentNode);
            });

            // Update chart from a state object passed to event handler
            dispatch.on('changeState', function (e) {

                if (typeof e.disabled !== 'undefined') {
                    data.forEach(function (series, i) {
                        series.disabled = e.disabled[i];
                    });

                    state.disabled = e.disabled;
                }

                if (typeof e.stacked !== 'undefined') {
                    multibar.stacked(e.stacked);
                    state.stacked = e.stacked;
                    stacked = e.stacked;
                }

                chart.update();
            });
        });
        renderWatch.renderEnd('multibar horizontal chart immediate');
        return chart;
    }

    //============================================================
    // Event Handling/Dispatching (out of chart's scope)
    //------------------------------------------------------------

    multibar.dispatch.on('elementMouseover.tooltip', function (e) {
        e.pos = [e.pos[0] + margin.left, e.pos[1] + margin.top];
        dispatch.tooltipShow(e);
    });

    multibar.dispatch.on('elementMouseout.tooltip', function (e) {
        dispatch.tooltipHide(e);
    });
    dispatch.on('tooltipHide', function () {
        if (tooltips) nv.tooltip.cleanup();
    });

    //============================================================
    // Expose Public Variables
    //------------------------------------------------------------

    // expose chart's sub-components
    chart.dispatch = dispatch;
    chart.multibar = multibar;
    chart.legend = legend;
    chart.xAxis = xAxis;
    chart.yAxis = yAxis;
    chart.state = state;

    chart.options = nv.utils.optionsFunc.bind(chart);

    chart._options = Object.create({}, {
        // simple options, just get/set the necessary values
        width: {
            get: function () {
                return width;
            }, set: function (_) {
                width = _;
            }
        },
        height: {
            get: function () {
                return height;
            }, set: function (_) {
                height = _;
            }
        },
        showLegend: {
            get: function () {
                return showLegend;
            }, set: function (_) {
                showLegend = _;
            }
        },
        showControls: {
            get: function () {
                return showControls;
            }, set: function (_) {
                showControls = _;
            }
        },
        controlLabels: {
            get: function () {
                return controlLabels;
            }, set: function (_) {
                controlLabels = _;
            }
        },
        showXAxis: {
            get: function () {
                return showXAxis;
            }, set: function (_) {
                showXAxis = _;
            }
        },
        showYAxis: {
            get: function () {
                return showYAxis;
            }, set: function (_) {
                showYAxis = _;
            }
        },
        tooltips: {
            get: function () {
                return tooltips;
            }, set: function (_) {
                tooltips = _;
            }
        },
        tooltipContent: {
            get: function () {
                return tooltip;
            }, set: function (_) {
                tooltip = _;
            }
        },
        defaultState: {
            get: function () {
                return defaultState;
            }, set: function (_) {
                defaultState = _;
            }
        },
        noData: {
            get: function () {
                return noData;
            }, set: function (_) {
                noData = _;
            }
        },

        // options that require extra logic in the setter
        margin: {
            get: function () {
                return margin;
            }, set: function (_) {
                margin.top = _.top !== undefined ? _.top : margin.top;
                margin.right = _.right !== undefined ? _.right : margin.right;
                margin.bottom = _.bottom !== undefined ? _.bottom : margin.bottom;
                margin.left = _.left !== undefined ? _.left : margin.left;
            }
        },
        duration: {
            get: function () {
                return duration;
            }, set: function (_) {
                duration = _;
                renderWatch.reset(duration);
                multibar.duration(duration);
                xAxis.duration(duration);
                yAxis.duration(duration);
            }
        },
        color: {
            get: function () {
                return color;
            }, set: function (_) {
                color = nv.utils.getColor(_);
                legend.color(color);
            }
        }
    });

    nv.utils.inheritOptions(chart, multibar);
    nv.utils.initOptions(chart);

    return chart;
};
nv.models.multiChart = function () {
    "use strict";

    //============================================================
    // Public Variables with Default Settings
    //------------------------------------------------------------

    var margin = {top: 30, right: 20, bottom: 50, left: 60},
        color = nv.utils.defaultColor(),
        width = null,
        height = null,
        showLegend = true,
        tooltips = true,
        tooltip = function (key, x, y, e, graph) {
            return '<h3>' + key + '</h3>' +
                '<p>' + y + ' at ' + x + '</p>'
        },
        x,
        y,
        noData = 'No Data Available.',
        yDomain1,
        yDomain2,
        getX = function (d) {
            return d.x
        },
        getY = function (d) {
            return d.y
        },
        interpolate = 'monotone'
        ;

    //============================================================
    // Private Variables
    //------------------------------------------------------------

    var x = d3.scale.linear(),
        yScale1 = d3.scale.linear(),
        yScale2 = d3.scale.linear(),

        lines1 = nv.models.line().yScale(yScale1),
        lines2 = nv.models.line().yScale(yScale2),

        bars1 = nv.models.multiBar().stacked(false).yScale(yScale1),
        bars2 = nv.models.multiBar().stacked(false).yScale(yScale2),

        stack1 = nv.models.stackedArea().yScale(yScale1),
        stack2 = nv.models.stackedArea().yScale(yScale2),

        xAxis = nv.models.axis().scale(x).orient('bottom').tickPadding(5),
        yAxis1 = nv.models.axis().scale(yScale1).orient('left'),
        yAxis2 = nv.models.axis().scale(yScale2).orient('right'),

        legend = nv.models.legend().height(30),
        dispatch = d3.dispatch('tooltipShow', 'tooltipHide');

    var showTooltip = function (e, offsetElement) {
        var left = e.pos[0] + ( offsetElement.offsetLeft || 0 ),
            top = e.pos[1] + ( offsetElement.offsetTop || 0),
            x = xAxis.tickFormat()(lines1.x()(e.point, e.pointIndex)),
            y = ((e.series.yAxis == 2) ? yAxis2 : yAxis1).tickFormat()(lines1.y()(e.point, e.pointIndex)),
            content = tooltip(e.series.key, x, y, e, chart);

        nv.tooltip.show([left, top], content, undefined, undefined, offsetElement.offsetParent);
    };

    function chart(selection) {
        selection.each(function (data) {
            var container = d3.select(this),
                that = this;
            nv.utils.initSVG(container);

            chart.update = function () {
                container.transition().call(chart);
            };
            chart.container = this;

            var availableWidth = (width || parseInt(container.style('width')) || 960)
                    - margin.left - margin.right,
                availableHeight = (height || parseInt(container.style('height')) || 400)
                    - margin.top - margin.bottom;

            var dataLines1 = data.filter(function (d) {
                return d.type == 'line' && d.yAxis == 1
            });
            var dataLines2 = data.filter(function (d) {
                return d.type == 'line' && d.yAxis == 2
            });
            var dataBars1 = data.filter(function (d) {
                return d.type == 'bar' && d.yAxis == 1
            });
            var dataBars2 = data.filter(function (d) {
                return d.type == 'bar' && d.yAxis == 2
            });
            var dataStack1 = data.filter(function (d) {
                return d.type == 'area' && d.yAxis == 1
            });
            var dataStack2 = data.filter(function (d) {
                return d.type == 'area' && d.yAxis == 2
            });

            // Display noData message if there's nothing to show.
            if (!data || !data.length || !data.filter(function (d) {
                    return d.values.length
                }).length) {
                var noDataText = container.selectAll('.nv-noData').data([noData]);

                noDataText.enter().append('text')
                    .attr('class', 'nvd3 nv-noData')
                    .attr('dy', '-.7em')
                    .style('text-anchor', 'middle');

                noDataText
                    .attr('x', margin.left + availableWidth / 2)
                    .attr('y', margin.top + availableHeight / 2)
                    .text(function (d) {
                        return d
                    });

                return chart;
            }
            else {
                container.selectAll('.nv-noData').remove();
            }

            var series1 = data.filter(function (d) {
                return !d.disabled && d.yAxis == 1
            })
                .map(function (d) {
                    return d.values.map(function (d, i) {
                        return {x: d.x, y: d.y}
                    })
                });

            var series2 = data.filter(function (d) {
                return !d.disabled && d.yAxis == 2
            })
                .map(function (d) {
                    return d.values.map(function (d, i) {
                        return {x: d.x, y: d.y}
                    })
                });

            x.domain(d3.extent(d3.merge(series1.concat(series2)), function (d) {
                return d.x
            }))
                .range([0, availableWidth]);

            var wrap = container.selectAll('g.wrap.multiChart').data([data]);
            var gEnter = wrap.enter().append('g').attr('class', 'wrap nvd3 multiChart').append('g');

            gEnter.append('g').attr('class', 'x axis');
            gEnter.append('g').attr('class', 'y1 axis');
            gEnter.append('g').attr('class', 'y2 axis');
            gEnter.append('g').attr('class', 'lines1Wrap');
            gEnter.append('g').attr('class', 'lines2Wrap');
            gEnter.append('g').attr('class', 'bars1Wrap');
            gEnter.append('g').attr('class', 'bars2Wrap');
            gEnter.append('g').attr('class', 'stack1Wrap');
            gEnter.append('g').attr('class', 'stack2Wrap');
            gEnter.append('g').attr('class', 'legendWrap');

            var g = wrap.select('g');

            var color_array = data.map(function (d, i) {
                return data[i].color || color(d, i);
            });

            if (showLegend) {
                legend.color(color_array);
                legend.width(availableWidth / 2);

                g.select('.legendWrap')
                    .datum(data.map(function (series) {
                        series.originalKey = series.originalKey === undefined ? series.key : series.originalKey;
                        series.key = series.originalKey + (series.yAxis == 1 ? '' : ' (right axis)');
                        return series;
                    }))
                    .call(legend);

                if (margin.top != legend.height()) {
                    margin.top = legend.height();
                    availableHeight = (height || parseInt(container.style('height')) || 400)
                    - margin.top - margin.bottom;
                }

                g.select('.legendWrap')
                    .attr('transform', 'translate(' + ( availableWidth / 2 ) + ',' + (-margin.top) + ')');
            }

            lines1
                .width(availableWidth)
                .height(availableHeight)
                .interpolate(interpolate)
                .color(color_array.filter(function (d, i) {
                    return !data[i].disabled && data[i].yAxis == 1 && data[i].type == 'line'
                }));
            lines2
                .width(availableWidth)
                .height(availableHeight)
                .interpolate(interpolate)
                .color(color_array.filter(function (d, i) {
                    return !data[i].disabled && data[i].yAxis == 2 && data[i].type == 'line'
                }));
            bars1
                .width(availableWidth)
                .height(availableHeight)
                .color(color_array.filter(function (d, i) {
                    return !data[i].disabled && data[i].yAxis == 1 && data[i].type == 'bar'
                }));
            bars2
                .width(availableWidth)
                .height(availableHeight)
                .color(color_array.filter(function (d, i) {
                    return !data[i].disabled && data[i].yAxis == 2 && data[i].type == 'bar'
                }));
            stack1
                .width(availableWidth)
                .height(availableHeight)
                .color(color_array.filter(function (d, i) {
                    return !data[i].disabled && data[i].yAxis == 1 && data[i].type == 'area'
                }));
            stack2
                .width(availableWidth)
                .height(availableHeight)
                .color(color_array.filter(function (d, i) {
                    return !data[i].disabled && data[i].yAxis == 2 && data[i].type == 'area'
                }));

            g.attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

            var lines1Wrap = g.select('.lines1Wrap')
                .datum(
                dataLines1.filter(function (d) {
                    return !d.disabled
                })
            );
            var bars1Wrap = g.select('.bars1Wrap')
                .datum(
                dataBars1.filter(function (d) {
                    return !d.disabled
                })
            );
            var stack1Wrap = g.select('.stack1Wrap')
                .datum(
                dataStack1.filter(function (d) {
                    return !d.disabled
                })
            );

            var lines2Wrap = g.select('.lines2Wrap')
                .datum(
                dataLines2.filter(function (d) {
                    return !d.disabled
                })
            );
            var bars2Wrap = g.select('.bars2Wrap')
                .datum(
                dataBars2.filter(function (d) {
                    return !d.disabled
                })
            );
            var stack2Wrap = g.select('.stack2Wrap')
                .datum(
                dataStack2.filter(function (d) {
                    return !d.disabled
                })
            );

            var extraValue1 = dataStack1.length ? dataStack1.map(function (a) {
                return a.values
            }).reduce(function (a, b) {
                return a.map(function (aVal, i) {
                    return {x: aVal.x, y: aVal.y + b[i].y}
                })
            }).concat([{x: 0, y: 0}]) : []
            var extraValue2 = dataStack2.length ? dataStack2.map(function (a) {
                return a.values
            }).reduce(function (a, b) {
                return a.map(function (aVal, i) {
                    return {x: aVal.x, y: aVal.y + b[i].y}
                })
            }).concat([{x: 0, y: 0}]) : []

            yScale1.domain(yDomain1 || d3.extent(d3.merge(series1).concat(extraValue1), function (d) {
                return d.y
            }))
                .range([0, availableHeight])

            yScale2.domain(yDomain2 || d3.extent(d3.merge(series2).concat(extraValue2), function (d) {
                return d.y
            }))
                .range([0, availableHeight])

            lines1.yDomain(yScale1.domain())
            bars1.yDomain(yScale1.domain())
            stack1.yDomain(yScale1.domain())

            lines2.yDomain(yScale2.domain())
            bars2.yDomain(yScale2.domain())
            stack2.yDomain(yScale2.domain())

            if (dataStack1.length) {
                d3.transition(stack1Wrap).call(stack1);
            }
            if (dataStack2.length) {
                d3.transition(stack2Wrap).call(stack2);
            }

            if (dataBars1.length) {
                d3.transition(bars1Wrap).call(bars1);
            }
            if (dataBars2.length) {
                d3.transition(bars2Wrap).call(bars2);
            }

            if (dataLines1.length) {
                d3.transition(lines1Wrap).call(lines1);
            }
            if (dataLines2.length) {
                d3.transition(lines2Wrap).call(lines2);
            }

            xAxis
                .ticks(nv.utils.calcTicksX(availableWidth / 100, data))
                .tickSize(-availableHeight, 0);

            g.select('.x.axis')
                .attr('transform', 'translate(0,' + availableHeight + ')');
            d3.transition(g.select('.x.axis'))
                .call(xAxis);

            yAxis1
                .ticks(nv.utils.calcTicksY(availableHeight / 36, data))
                .tickSize(-availableWidth, 0);


            d3.transition(g.select('.y1.axis'))
                .call(yAxis1);

            yAxis2
                .ticks(nv.utils.calcTicksY(availableHeight / 36, data))
                .tickSize(-availableWidth, 0);

            d3.transition(g.select('.y2.axis'))
                .call(yAxis2);

            g.select('.y1.axis')
                .classed('nv-disabled', series1.length ? false : true)
                .attr('transform', 'translate(' + x.range()[0] + ',0)');

            g.select('.y2.axis')
                .classed('nv-disabled', series2.length ? false : true)
                .attr('transform', 'translate(' + x.range()[1] + ',0)');

            legend.dispatch.on('stateChange', function (newState) {
                chart.update();
            });

            dispatch.on('tooltipShow', function (e) {
                if (tooltips) showTooltip(e, that.parentNode);
            });

        });

        return chart;
    }

    //============================================================
    // Event Handling/Dispatching (out of chart's scope)
    //------------------------------------------------------------

    lines1.dispatch.on('elementMouseover.tooltip', function (e) {
        e.pos = [e.pos[0] + margin.left, e.pos[1] + margin.top];
        dispatch.tooltipShow(e);
    });

    lines1.dispatch.on('elementMouseout.tooltip', function (e) {
        dispatch.tooltipHide(e);
    });

    lines2.dispatch.on('elementMouseover.tooltip', function (e) {
        e.pos = [e.pos[0] + margin.left, e.pos[1] + margin.top];
        dispatch.tooltipShow(e);
    });

    lines2.dispatch.on('elementMouseout.tooltip', function (e) {
        dispatch.tooltipHide(e);
    });

    bars1.dispatch.on('elementMouseover.tooltip', function (e) {
        e.pos = [e.pos[0] + margin.left, e.pos[1] + margin.top];
        dispatch.tooltipShow(e);
    });

    bars1.dispatch.on('elementMouseout.tooltip', function (e) {
        dispatch.tooltipHide(e);
    });

    bars2.dispatch.on('elementMouseover.tooltip', function (e) {
        e.pos = [e.pos[0] + margin.left, e.pos[1] + margin.top];
        dispatch.tooltipShow(e);
    });

    bars2.dispatch.on('elementMouseout.tooltip', function (e) {
        dispatch.tooltipHide(e);
    });

    stack1.dispatch.on('tooltipShow', function (e) {
        //disable tooltips when value ~= 0
        //// TODO: consider removing points from voronoi that have 0 value instead of this hack
        if (!Math.round(stack1.y()(e.point) * 100)) {  // 100 will not be good for very small numbers... will have to think about making this valu dynamic, based on data range
            setTimeout(function () {
                d3.selectAll('.point.hover').classed('hover', false)
            }, 0);
            return false;
        }

        e.pos = [e.pos[0] + margin.left, e.pos[1] + margin.top],
            dispatch.tooltipShow(e);
    });

    stack1.dispatch.on('tooltipHide', function (e) {
        dispatch.tooltipHide(e);
    });

    stack2.dispatch.on('tooltipShow', function (e) {
        //disable tooltips when value ~= 0
        //// TODO: consider removing points from voronoi that have 0 value instead of this hack
        if (!Math.round(stack2.y()(e.point) * 100)) {  // 100 will not be good for very small numbers... will have to think about making this valu dynamic, based on data range
            setTimeout(function () {
                d3.selectAll('.point.hover').classed('hover', false)
            }, 0);
            return false;
        }

        e.pos = [e.pos[0] + margin.left, e.pos[1] + margin.top],
            dispatch.tooltipShow(e);
    });

    stack2.dispatch.on('tooltipHide', function (e) {
        dispatch.tooltipHide(e);
    });

    lines1.dispatch.on('elementMouseover.tooltip', function (e) {
        e.pos = [e.pos[0] + margin.left, e.pos[1] + margin.top];
        dispatch.tooltipShow(e);
    });

    lines1.dispatch.on('elementMouseout.tooltip', function (e) {
        dispatch.tooltipHide(e);
    });

    lines2.dispatch.on('elementMouseover.tooltip', function (e) {
        e.pos = [e.pos[0] + margin.left, e.pos[1] + margin.top];
        dispatch.tooltipShow(e);
    });

    lines2.dispatch.on('elementMouseout.tooltip', function (e) {
        dispatch.tooltipHide(e);
    });

    dispatch.on('tooltipHide', function () {
        if (tooltips) nv.tooltip.cleanup();
    });

    //============================================================
    // Global getters and setters
    //------------------------------------------------------------

    chart.dispatch = dispatch;
    chart.lines1 = lines1;
    chart.lines2 = lines2;
    chart.bars1 = bars1;
    chart.bars2 = bars2;
    chart.stack1 = stack1;
    chart.stack2 = stack2;
    chart.xAxis = xAxis;
    chart.yAxis1 = yAxis1;
    chart.yAxis2 = yAxis2;

    chart.options = nv.utils.optionsFunc.bind(chart);

    chart._options = Object.create({}, {
        // simple options, just get/set the necessary values
        width: {
            get: function () {
                return width;
            }, set: function (_) {
                width = _;
            }
        },
        height: {
            get: function () {
                return height;
            }, set: function (_) {
                height = _;
            }
        },
        showLegend: {
            get: function () {
                return showLegend;
            }, set: function (_) {
                showLegend = _;
            }
        },
        yDomain1: {
            get: function () {
                return yDomain1;
            }, set: function (_) {
                yDomain1 = _;
            }
        },
        yDomain2: {
            get: function () {
                return yDomain2;
            }, set: function (_) {
                yDomain2 = _;
            }
        },
        tooltips: {
            get: function () {
                return tooltips;
            }, set: function (_) {
                tooltips = _;
            }
        },
        tooltipContent: {
            get: function () {
                return tooltip;
            }, set: function (_) {
                tooltip = _;
            }
        },
        noData: {
            get: function () {
                return noData;
            }, set: function (_) {
                noData = _;
            }
        },
        interpolate: {
            get: function () {
                return interpolate;
            }, set: function (_) {
                interpolate = _;
            }
        },

        // options that require extra logic in the setter
        margin: {
            get: function () {
                return margin;
            }, set: function (_) {
                margin.top = _.top !== undefined ? _.top : margin.top;
                margin.right = _.right !== undefined ? _.right : margin.right;
                margin.bottom = _.bottom !== undefined ? _.bottom : margin.bottom;
                margin.left = _.left !== undefined ? _.left : margin.left;
            }
        },
        color: {
            get: function () {
                return color;
            }, set: function (_) {
                color = nv.utils.getColor(_);
            }
        },
        x: {
            get: function () {
                return getX;
            }, set: function (_) {
                getX = _;
                lines1.x(_);
                bars1.x(_);
            }
        },
        y: {
            get: function () {
                return getY;
            }, set: function (_) {
                getY = _;
                lines1.y(_);
                bars1.y(_);
            }
        }
    });

    nv.utils.initOptions(chart);

    return chart;
};


nv.models.ohlcBar = function () {
    "use strict";

    //============================================================
    // Public Variables with Default Settings
    //------------------------------------------------------------

    var margin = {top: 0, right: 0, bottom: 0, left: 0}
        , width = null
        , height = null
        , id = Math.floor(Math.random() * 10000) //Create semi-unique ID in case user doesn't select one
        , x = d3.scale.linear()
        , y = d3.scale.linear()
        , getX = function (d) {
            return d.x
        }
        , getY = function (d) {
            return d.y
        }
        , getOpen = function (d) {
            return d.open
        }
        , getClose = function (d) {
            return d.close
        }
        , getHigh = function (d) {
            return d.high
        }
        , getLow = function (d) {
            return d.low
        }
        , forceX = []
        , forceY = []
        , padData = false // If true, adds half a data points width to front and back, for lining up a line chart with a bar chart
        , clipEdge = true
        , color = nv.utils.defaultColor()
        , interactive = false
        , xDomain
        , yDomain
        , xRange
        , yRange
        , dispatch = d3.dispatch('tooltipShow', 'tooltipHide', 'stateChange', 'changeState', 'renderEnd', 'chartClick', 'elementClick', 'elementDblClick', 'elementMouseover', 'elementMouseout')
        ;

    //============================================================
    // Private Variables
    //------------------------------------------------------------

    function chart(selection) {
        selection.each(function (data) {
            var container = d3.select(this);
            var availableWidth = (width || parseInt(container.style('width')) || 960)
                - margin.left - margin.right;
            var availableHeight = (height || parseInt(container.style('height')) || 400)
                - margin.top - margin.bottom;

            nv.utils.initSVG(container);

            // Setup Scales
            x.domain(xDomain || d3.extent(data[0].values.map(getX).concat(forceX)));

            if (padData)
                x.range(xRange || [availableWidth * .5 / data[0].values.length, availableWidth * (data[0].values.length - .5) / data[0].values.length]);
            else
                x.range(xRange || [0, availableWidth]);

            y.domain(yDomain || [
                    d3.min(data[0].values.map(getLow).concat(forceY)),
                    d3.max(data[0].values.map(getHigh).concat(forceY))
                ]
            ).range(yRange || [availableHeight, 0]);

            // If scale's domain don't have a range, slightly adjust to make one... so a chart can show a single data point
            if (x.domain()[0] === x.domain()[1])
                x.domain()[0] ?
                    x.domain([x.domain()[0] - x.domain()[0] * 0.01, x.domain()[1] + x.domain()[1] * 0.01])
                    : x.domain([-1, 1]);

            if (y.domain()[0] === y.domain()[1])
                y.domain()[0] ?
                    y.domain([y.domain()[0] + y.domain()[0] * 0.01, y.domain()[1] - y.domain()[1] * 0.01])
                    : y.domain([-1, 1]);

            // Setup containers and skeleton of chart
            var wrap = d3.select(this).selectAll('g.nv-wrap.nv-ohlcBar').data([data[0].values]);
            var wrapEnter = wrap.enter().append('g').attr('class', 'nvd3 nv-wrap nv-ohlcBar');
            var defsEnter = wrapEnter.append('defs');
            var gEnter = wrapEnter.append('g');
            var g = wrap.select('g');

            gEnter.append('g').attr('class', 'nv-ticks');

            wrap.attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

            container
                .on('click', function (d, i) {
                    dispatch.chartClick({
                        data: d,
                        index: i,
                        pos: d3.event,
                        id: id
                    });
                });

            defsEnter.append('clipPath')
                .attr('id', 'nv-chart-clip-path-' + id)
                .append('rect');

            wrap.select('#nv-chart-clip-path-' + id + ' rect')
                .attr('width', availableWidth)
                .attr('height', availableHeight);

            g.attr('clip-path', clipEdge ? 'url(#nv-chart-clip-path-' + id + ')' : '');

            var ticks = wrap.select('.nv-ticks').selectAll('.nv-tick')
                .data(function (d) {
                    return d
                });
            ticks.exit().remove();

            var ticksEnter = ticks.enter().append('path')
                .attr('class', function (d, i, j) {
                    return (getOpen(d, i) > getClose(d, i) ? 'nv-tick negative' : 'nv-tick positive') + ' nv-tick-' + j + '-' + i
                })
                .attr('d', function (d, i) {
                    var w = (availableWidth / data[0].values.length) * .9;
                    return 'm0,0l0,'
                        + (y(getOpen(d, i))
                        - y(getHigh(d, i)))
                        + 'l'
                        + (-w / 2)
                        + ',0l'
                        + (w / 2)
                        + ',0l0,'
                        + (y(getLow(d, i)) - y(getOpen(d, i)))
                        + 'l0,'
                        + (y(getClose(d, i))
                        - y(getLow(d, i)))
                        + 'l'
                        + (w / 2)
                        + ',0l'
                        + (-w / 2)
                        + ',0z';
                })
                .attr('transform', function (d, i) {
                    return 'translate(' + x(getX(d, i)) + ',' + y(getHigh(d, i)) + ')';
                })
                .attr('fill', function (d, i) {
                    return color[0];
                })
                .attr('stroke', function (d, i) {
                    return color[0];
                })
                .attr('x', 0)
                .attr('y', function (d, i) {
                    return y(Math.max(0, getY(d, i)))
                })
                .attr('height', function (d, i) {
                    return Math.abs(y(getY(d, i)) - y(0))
                });

            // the bar colors are controlled by CSS currently
            ticks.attr('class', function (d, i, j) {
                return (getOpen(d, i) > getClose(d, i) ? 'nv-tick negative' : 'nv-tick positive') + ' nv-tick-' + j + '-' + i;
            });

            d3.transition(ticks)
                .attr('transform', function (d, i) {
                    return 'translate(' + x(getX(d, i)) + ',' + y(getHigh(d, i)) + ')';
                })
                .attr('d', function (d, i) {
                    var w = (availableWidth / data[0].values.length) * .9;
                    return 'm0,0l0,'
                        + (y(getOpen(d, i))
                        - y(getHigh(d, i)))
                        + 'l'
                        + (-w / 2)
                        + ',0l'
                        + (w / 2)
                        + ',0l0,'
                        + (y(getLow(d, i))
                        - y(getOpen(d, i)))
                        + 'l0,'
                        + (y(getClose(d, i))
                        - y(getLow(d, i)))
                        + 'l'
                        + (w / 2)
                        + ',0l'
                        + (-w / 2)
                        + ',0z';
                });
        });

        return chart;
    }


    //Create methods to allow outside functions to highlight a specific bar.
    chart.highlightPoint = function (pointIndex, isHoverOver) {
        chart.clearHighlights();
        d3.select(".nv-ohlcBar .nv-tick-0-" + pointIndex)
            .classed("hover", isHoverOver)
        ;
    };

    chart.clearHighlights = function () {
        d3.select(".nv-ohlcBar .nv-tick.hover")
            .classed("hover", false)
        ;
    };

    //============================================================
    // Expose Public Variables
    //------------------------------------------------------------

    chart.dispatch = dispatch;
    chart.options = nv.utils.optionsFunc.bind(chart);

    chart._options = Object.create({}, {
        // simple options, just get/set the necessary values
        width: {
            get: function () {
                return width;
            }, set: function (_) {
                width = _;
            }
        },
        height: {
            get: function () {
                return height;
            }, set: function (_) {
                height = _;
            }
        },
        xScale: {
            get: function () {
                return x;
            }, set: function (_) {
                x = _;
            }
        },
        yScale: {
            get: function () {
                return y;
            }, set: function (_) {
                y = _;
            }
        },
        xDomain: {
            get: function () {
                return xDomain;
            }, set: function (_) {
                xDomain = _;
            }
        },
        yDomain: {
            get: function () {
                return yDomain;
            }, set: function (_) {
                yDomain = _;
            }
        },
        xRange: {
            get: function () {
                return xRange;
            }, set: function (_) {
                xRange = _;
            }
        },
        yRange: {
            get: function () {
                return yRange;
            }, set: function (_) {
                yRange = _;
            }
        },
        forceX: {
            get: function () {
                return forceX;
            }, set: function (_) {
                forceX = _;
            }
        },
        forceY: {
            get: function () {
                return forceY;
            }, set: function (_) {
                forceY = _;
            }
        },
        padData: {
            get: function () {
                return padData;
            }, set: function (_) {
                padData = _;
            }
        },
        clipEdge: {
            get: function () {
                return clipEdge;
            }, set: function (_) {
                clipEdge = _;
            }
        },
        id: {
            get: function () {
                return id;
            }, set: function (_) {
                id = _;
            }
        },
        interactive: {
            get: function () {
                return interactive;
            }, set: function (_) {
                interactive = _;
            }
        },

        x: {
            get: function () {
                return getX;
            }, set: function (_) {
                getX = _;
            }
        },
        y: {
            get: function () {
                return getY;
            }, set: function (_) {
                getY = _;
            }
        },
        open: {
            get: function () {
                return getOpen();
            }, set: function (_) {
                getOpen = _;
            }
        },
        close: {
            get: function () {
                return getClose();
            }, set: function (_) {
                getClose = _;
            }
        },
        high: {
            get: function () {
                return getHigh;
            }, set: function (_) {
                getHigh = _;
            }
        },
        low: {
            get: function () {
                return getLow;
            }, set: function (_) {
                getLow = _;
            }
        },

        // options that require extra logic in the setter
        margin: {
            get: function () {
                return margin;
            }, set: function (_) {
                margin.top = _.top != undefined ? _.top : margin.top;
                margin.right = _.right != undefined ? _.right : margin.right;
                margin.bottom = _.bottom != undefined ? _.bottom : margin.bottom;
                margin.left = _.left != undefined ? _.left : margin.left;
            }
        },
        color: {
            get: function () {
                return color;
            }, set: function (_) {
                color = nv.utils.getColor(_);
            }
        }
    });

    nv.utils.initOptions(chart);
    return chart;
};

// Code adapted from Jason Davies' "Parallel Coordinates"
// http://bl.ocks.org/jasondavies/1341281

nv.models.parallelCoordinates = function () {
    "use strict";

    //============================================================
    // Public Variables with Default Settings
    //------------------------------------------------------------

    var margin = {top: 30, right: 10, bottom: 10, left: 10}
        , width = null
        , height = null
        , x = d3.scale.ordinal()
        , y = {}
        , dimensions = []
        , color = nv.utils.defaultColor()
        , filters = []
        , active = []
        , dispatch = d3.dispatch('brush')
        ;

    //============================================================
    // Private Variables
    //------------------------------------------------------------

    function chart(selection) {
        selection.each(function (data) {
            var container = d3.select(this);
            var availableWidth = (width || parseInt(container.style('width')) || 960)
                - margin.left - margin.right;
            var availableHeight = (height || parseInt(container.style('height')) || 400)
                - margin.top - margin.bottom;

            nv.utils.initSVG(container);

            active = data; //set all active before first brush call

            //This is a placeholder until this chart is made resizeable
            chart.update = function () {
            };

            // Setup Scales
            x.rangePoints([0, availableWidth], 1).domain(dimensions);

            // Extract the list of dimensions and create a scale for each.
            dimensions.forEach(function (d) {
                y[d] = d3.scale.linear()
                    .domain(d3.extent(data, function (p) {
                        return +p[d];
                    }))
                    .range([availableHeight, 0]);

                y[d].brush = d3.svg.brush().y(y[d]).on('brush', brush);

                return d != 'name';
            });

            // Setup containers and skeleton of chart
            var wrap = container.selectAll('g.nv-wrap.nv-parallelCoordinates').data([data]);
            var wrapEnter = wrap.enter().append('g').attr('class', 'nvd3 nv-wrap nv-parallelCoordinates');
            var gEnter = wrapEnter.append('g');
            var g = wrap.select('g');

            gEnter.append('g').attr('class', 'nv-parallelCoordinatesWrap');
            wrap.attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

            var line = d3.svg.line(),
                axis = d3.svg.axis().orient('left'),
                background,
                foreground;

            // Add grey background lines for context.
            background = gEnter.append('g')
                .attr('class', 'background')
                .selectAll('path')
                .data(data)
                .enter().append('path')
                .attr('d', path)
            ;

            // Add blue foreground lines for focus.
            foreground = gEnter.append('g')
                .attr('class', 'foreground')
                .selectAll('path')
                .data(data)
                .enter().append('path')
                .attr('d', path)
                .attr('stroke', color)
            ;

            // Add a group element for each dimension.
            var dimension = g.selectAll('.dimension')
                .data(dimensions)
                .enter().append('g')
                .attr('class', 'dimension')
                .attr('transform', function (d) {
                    return 'translate(' + x(d) + ',0)';
                });

            // Add an axis and title.
            dimension.append('g')
                .attr('class', 'axis')
                .each(function (d) {
                    d3.select(this).call(axis.scale(y[d]));
                })
                .append('text')
                .attr('text-anchor', 'middle')
                .attr('y', -9)
                .text(String);

            // Add and store a brush for each axis.
            dimension.append('g')
                .attr('class', 'brush')
                .each(function (d) {
                    d3.select(this).call(y[d].brush);
                })
                .selectAll('rect')
                .attr('x', -8)
                .attr('width', 16);

            // Returns the path for a given data point.
            function path(d) {
                return line(dimensions.map(function (p) {
                    return [x(p), y[p](d[p])];
                }));
            }

            // Handles a brush event, toggling the display of foreground lines.
            function brush() {
                var actives = dimensions.filter(function (p) {
                        return !y[p].brush.empty();
                    }),
                    extents = actives.map(function (p) {
                        return y[p].brush.extent();
                    });

                filters = []; //erase current filters
                actives.forEach(function (d, i) {
                    filters[i] = {
                        dimension: d,
                        extent: extents[i]
                    }
                });

                active = []; //erase current active list
                foreground.style('display', function (d) {
                    var isActive = actives.every(function (p, i) {
                        return extents[i][0] <= d[p] && d[p] <= extents[i][1];
                    });
                    if (isActive) active.push(d);
                    return isActive ? null : 'none';
                });

                dispatch.brush({
                    filters: filters,
                    active: active
                });
            }
        });

        return chart;
    }

    //============================================================
    // Expose Public Variables
    //------------------------------------------------------------

    chart.dispatch = dispatch;
    chart.options = nv.utils.optionsFunc.bind(chart);

    chart._options = Object.create({}, {
        // simple options, just get/set the necessary values
        width: {
            get: function () {
                return width;
            }, set: function (_) {
                width = _;
            }
        },
        height: {
            get: function () {
                return height;
            }, set: function (_) {
                height = _;
            }
        },
        dimensions: {
            get: function () {
                return dimensions;
            }, set: function (_) {
                dimensions = _;
            }
        },

        // options that require extra logic in the setter
        margin: {
            get: function () {
                return margin;
            }, set: function (_) {
                margin.top = typeof _.top != 'undefined' ? _.top : margin.top;
                margin.right = typeof _.right != 'undefined' ? _.right : margin.right;
                margin.bottom = typeof _.bottom != 'undefined' ? _.bottom : margin.bottom;
                margin.left = typeof _.left != 'undefined' ? _.left : margin.left;
            }
        },
        color: {
            get: function () {
                return color;
            }, set: function (_) {
                color = nv.utils.getColor(_);
            }
        }
    });

    nv.utils.initOptions(chart);
    return chart;
};
nv.models.pie = function () {
    "use strict";

    //============================================================
    // Public Variables with Default Settings
    //------------------------------------------------------------

    var margin = {top: 0, right: 0, bottom: 0, left: 0}
        , width = 500
        , height = 500
        , getX = function (d) {
            return d.x
        }
        , getY = function (d) {
            return d.y
        }
        , id = Math.floor(Math.random() * 10000) //Create semi-unique ID in case user doesn't select one
        , color = nv.utils.defaultColor()
        , valueFormat = d3.format(',.2f')
        , labelFormat = d3.format('%')
        , showLabels = true
        , pieLabelsOutside = true
        , donutLabelsOutside = false
        , labelType = "key"
        , labelThreshold = .02 //if slice percentage is under this, don't show label
        , donut = false
        , title = false
        , growOnHover = true
        , titleOffset = 0
        , labelSunbeamLayout = false
        , startAngle = false
        , padAngle = false
        , endAngle = false
        , cornerRadius = 0
        , donutRatio = 0.5
        , duration = 250
        , dispatch = d3.dispatch('chartClick', 'elementClick', 'elementDblClick', 'elementMouseover', 'elementMouseout', 'renderEnd')
        ;


    //============================================================
    // chart function
    //------------------------------------------------------------

    var renderWatch = nv.utils.renderWatch(dispatch);

    function chart(selection) {
        renderWatch.reset();
        selection.each(function (data) {
            var availableWidth = width - margin.left - margin.right
                , availableHeight = height - margin.top - margin.bottom
                , radius = Math.min(availableWidth, availableHeight) / 2
                , arcRadius = radius - (radius / 5)
                , container = d3.select(this)
                ;
            nv.utils.initSVG(container);

            // Setup containers and skeleton of chart
            var wrap = container.selectAll('.nv-wrap.nv-pie').data(data);
            var wrapEnter = wrap.enter().append('g').attr('class', 'nvd3 nv-wrap nv-pie nv-chart-' + id);
            var gEnter = wrapEnter.append('g');
            var g = wrap.select('g');
            var g_pie = gEnter.append('g').attr('class', 'nv-pie');
            gEnter.append('g').attr('class', 'nv-pieLabels');

            wrap.attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');
            g.select('.nv-pie').attr('transform', 'translate(' + availableWidth / 2 + ',' + availableHeight / 2 + ')');
            g.select('.nv-pieLabels').attr('transform', 'translate(' + availableWidth / 2 + ',' + availableHeight / 2 + ')');

            //
            container.on('click', function (d, i) {
                dispatch.chartClick({
                    data: d,
                    index: i,
                    pos: d3.event,
                    id: id
                });
            });


            var arc = d3.svg.arc().outerRadius(arcRadius);
            var arcOver = d3.svg.arc().outerRadius(arcRadius + 5);

            if (startAngle) {
                arc.startAngle(startAngle);
                arcOver.startAngle(startAngle);
            }
            if (endAngle) {
                arc.endAngle(endAngle);
                arcOver.endAngle(endAngle);
            }
            if (donut) {
                arc.innerRadius(radius * donutRatio);
                arcOver.innerRadius(radius * donutRatio);
            }

            // Setup the Pie chart and choose the data element
            var pie = d3.layout.pie()
                .sort(null)
                .value(function (d) {
                    return d.disabled ? 0 : getY(d)
                });

            // padAngle added in d3 3.5
            if (pie.padAngle && padAngle) {
                pie.padAngle(padAngle);
            }

            if (arc.cornerRadius && cornerRadius) {
                arc.cornerRadius(cornerRadius);
                arcOver.cornerRadius(cornerRadius);
            }

            // if title is specified and donut, put it in the middle
            if (donut && title) {
                var title_g = g_pie.append('g').attr('class', 'nv-pie');

                title_g.append("text")
                    .style("text-anchor", "middle")
                    .attr('class', 'nv-pie-title')
                    .text(function (d) {
                        return title;
                    })
                    .attr("dy", "0.35em") // trick to vertically center text
                    .attr('transform', function (d, i) {
                        return 'translate(0, ' + titleOffset + ')';
                    });
            }

            var slices = wrap.select('.nv-pie').selectAll('.nv-slice').data(pie);
            var pieLabels = wrap.select('.nv-pieLabels').selectAll('.nv-label').data(pie);

            slices.exit().remove();
            pieLabels.exit().remove();

            var ae = slices.enter().append('g')
            ae.attr('class', 'nv-slice')
            ae.on('mouseover', function (d, i) {
                d3.select(this).classed('hover', true);
                if (growOnHover) {
                    d3.select(this).select("path").transition()
                        .duration(70)
                        .attr("d", arcOver);
                }
                dispatch.elementMouseover({
                    label: getX(d.data),
                    value: getY(d.data),
                    point: d.data,
                    pointIndex: i,
                    pos: [d3.event.pageX, d3.event.pageY],
                    id: id,
                    color: d3.select(this).style("fill")
                });
            });
            ae.on('mouseout', function (d, i) {
                d3.select(this).classed('hover', false);
                if (growOnHover) {
                    d3.select(this).select("path").transition()
                        .duration(50)
                        .attr("d", arc);
                }
                dispatch.elementMouseout({
                    label: getX(d.data),
                    value: getY(d.data),
                    point: d.data,
                    index: i,
                    id: id
                });
            });

            slices.attr('fill', function (d, i) {
                return color(d, i);
            })
            slices.attr('stroke', function (d, i) {
                return color(d, i);
            });

            var paths = ae.append('path').each(function (d) {
                this._current = d;
            });

            paths.on('click', function (d, i) {
                dispatch.elementClick({
                    label: getX(d.data),
                    value: getY(d.data),
                    point: d.data,
                    index: i,
                    pos: d3.event,
                    id: id
                });
                d3.event.stopPropagation();
            });
            paths.on('dblclick', function (d, i) {
                dispatch.elementDblClick({
                    label: getX(d.data),
                    value: getY(d.data),
                    point: d.data,
                    index: i,
                    pos: d3.event,
                    id: id
                });
                d3.event.stopPropagation();
            });
            slices.select('path')
                .transition()
                .attr('d', arc)
                .attrTween('d', arcTween);

            if (showLabels) {
                // This does the normal label
                var labelsArc = d3.svg.arc().innerRadius(0);

                if (pieLabelsOutside) {
                    var labelsArc = arc;
                }

                if (donutLabelsOutside) {
                    labelsArc = d3.svg.arc().outerRadius(arc.outerRadius());
                }

                pieLabels.enter().append("g").classed("nv-label", true).each(function (d, i) {
                    var group = d3.select(this);

                    group.attr('transform', function (d) {
                        if (labelSunbeamLayout) {
                            d.outerRadius = arcRadius + 10; // Set Outer Coordinate
                            d.innerRadius = arcRadius + 15; // Set Inner Coordinate
                            var rotateAngle = (d.startAngle + d.endAngle) / 2 * (180 / Math.PI);
                            if ((d.startAngle + d.endAngle) / 2 < Math.PI) {
                                rotateAngle -= 90;
                            }
                            else {
                                rotateAngle += 90;
                            }
                            return 'translate(' + labelsArc.centroid(d) + ') rotate(' + rotateAngle + ')';
                        }
                        else {
                            d.outerRadius = radius + 10; // Set Outer Coordinate
                            d.innerRadius = radius + 15; // Set Inner Coordinate
                            return 'translate(' + labelsArc.centroid(d) + ')'
                        }
                    });

                    group.append('rect')
                        .style('stroke', '#fff')
                        .style('fill', '#fff')
                        .attr("rx", 3)
                        .attr("ry", 3);

                    group.append('text')
                        .style('text-anchor', labelSunbeamLayout ? ((d.startAngle + d.endAngle) / 2 < Math.PI ? 'start' : 'end') : 'middle') //center the text on it's origin or begin/end if orthogonal aligned
                        .style('fill', '#000')

                });

                var labelLocationHash = {};
                var avgHeight = 14;
                var avgWidth = 140;
                var createHashKey = function (coordinates) {
                    return Math.floor(coordinates[0] / avgWidth) * avgWidth + ',' + Math.floor(coordinates[1] / avgHeight) * avgHeight;
                };

                pieLabels.watchTransition(renderWatch, 'pie labels').attr('transform', function (d) {
                    if (labelSunbeamLayout) {
                        d.outerRadius = arcRadius + 10; // Set Outer Coordinate
                        d.innerRadius = arcRadius + 15; // Set Inner Coordinate
                        var rotateAngle = (d.startAngle + d.endAngle) / 2 * (180 / Math.PI);
                        if ((d.startAngle + d.endAngle) / 2 < Math.PI) {
                            rotateAngle -= 90;
                        }
                        else {
                            rotateAngle += 90;
                        }
                        return 'translate(' + labelsArc.centroid(d) + ') rotate(' + rotateAngle + ')';
                    }
                    else {
                        d.outerRadius = radius + 10; // Set Outer Coordinate
                        d.innerRadius = radius + 15; // Set Inner Coordinate

                        /*
                         Overlapping pie labels are not good. What this attempts to do is, prevent overlapping.
                         Each label location is hashed, and if a hash collision occurs, we assume an overlap.
                         Adjust the label's y-position to remove the overlap.
                         */
                        var center = labelsArc.centroid(d);
                        if (d.value) {
                            var hashKey = createHashKey(center);
                            if (labelLocationHash[hashKey]) {
                                center[1] -= avgHeight;
                            }
                            labelLocationHash[createHashKey(center)] = true;
                        }
                        return 'translate(' + center + ')'
                    }
                });

                pieLabels.select(".nv-label text")
                    .style('text-anchor', labelSunbeamLayout ? ((d.startAngle + d.endAngle) / 2 < Math.PI ? 'start' : 'end') : 'middle') //center the text on it's origin or begin/end if orthogonal aligned
                    .text(function (d, i) {
                        var percent = (d.endAngle - d.startAngle) / (2 * Math.PI);
                        var labelTypes = {
                            "key": getX(d.data),
                            "value": getY(d.data),
                            "percent": labelFormat(percent)
                        };
                        return (d.value && percent > labelThreshold) ? labelTypes[labelType] : '';
                    })
                ;
            }


            // Computes the angle of an arc, converting from radians to degrees.
            function angle(d) {
                var a = (d.startAngle + d.endAngle) * 90 / Math.PI - 90;
                return a > 90 ? a - 180 : a;
            }

            function arcTween(a) {
                a.endAngle = isNaN(a.endAngle) ? 0 : a.endAngle;
                a.startAngle = isNaN(a.startAngle) ? 0 : a.startAngle;
                if (!donut) a.innerRadius = 0;
                var i = d3.interpolate(this._current, a);
                this._current = i(0);
                return function (t) {
                    return arc(i(t));
                };
            }
        });

        renderWatch.renderEnd('pie immediate');
        return chart;
    }

    //============================================================
    // Expose Public Variables
    //------------------------------------------------------------

    chart.dispatch = dispatch;
    chart.options = nv.utils.optionsFunc.bind(chart);

    chart._options = Object.create({}, {
        // simple options, just get/set the necessary values
        width: {
            get: function () {
                return width;
            }, set: function (_) {
                width = _;
            }
        },
        height: {
            get: function () {
                return height;
            }, set: function (_) {
                height = _;
            }
        },
        showLabels: {
            get: function () {
                return showLabels;
            }, set: function (_) {
                showLabels = _;
            }
        },
        title: {
            get: function () {
                return title;
            }, set: function (_) {
                title = _;
            }
        },
        titleOffset: {
            get: function () {
                return titleOffset;
            }, set: function (_) {
                titleOffset = _;
            }
        },
        labelThreshold: {
            get: function () {
                return labelThreshold;
            }, set: function (_) {
                labelThreshold = _;
            }
        },
        labelFormat: {
            get: function () {
                return labelFormat;
            }, set: function (_) {
                labelFormat = _;
            }
        },
        valueFormat: {
            get: function () {
                return valueFormat;
            }, set: function (_) {
                valueFormat = _;
            }
        },
        x: {
            get: function () {
                return getX;
            }, set: function (_) {
                getX = _;
            }
        },
        id: {
            get: function () {
                return id;
            }, set: function (_) {
                id = _;
            }
        },
        endAngle: {
            get: function () {
                return endAngle;
            }, set: function (_) {
                endAngle = _;
            }
        },
        startAngle: {
            get: function () {
                return startAngle;
            }, set: function (_) {
                startAngle = _;
            }
        },
        padAngle: {
            get: function () {
                return padAngle;
            }, set: function (_) {
                padAngle = _;
            }
        },
        cornerRadius: {
            get: function () {
                return cornerRadius;
            }, set: function (_) {
                cornerRadius = _;
            }
        },
        donutRatio: {
            get: function () {
                return donutRatio;
            }, set: function (_) {
                donutRatio = _;
            }
        },
        pieLabelsOutside: {
            get: function () {
                return pieLabelsOutside;
            }, set: function (_) {
                pieLabelsOutside = _;
            }
        },
        donutLabelsOutside: {
            get: function () {
                return donutLabelsOutside;
            }, set: function (_) {
                donutLabelsOutside = _;
            }
        },
        labelSunbeamLayout: {
            get: function () {
                return labelSunbeamLayout;
            }, set: function (_) {
                labelSunbeamLayout = _;
            }
        },
        donut: {
            get: function () {
                return donut;
            }, set: function (_) {
                donut = _;
            }
        },
        growOnHover: {
            get: function () {
                return growOnHover;
            }, set: function (_) {
                growOnHover = _;
            }
        },

        // options that require extra logic in the setter
        margin: {
            get: function () {
                return margin;
            }, set: function (_) {
                margin.top = typeof _.top != 'undefined' ? _.top : margin.top;
                margin.right = typeof _.right != 'undefined' ? _.right : margin.right;
                margin.bottom = typeof _.bottom != 'undefined' ? _.bottom : margin.bottom;
                margin.left = typeof _.left != 'undefined' ? _.left : margin.left;
            }
        },
        y: {
            get: function () {
                return getY;
            }, set: function (_) {
                getY = d3.functor(_);
            }
        },
        color: {
            get: function () {
                return color;
            }, set: function (_) {
                color = nv.utils.getColor(_);
            }
        },
        labelType: {
            get: function () {
                return labelType;
            }, set: function (_) {
                labelType = _ || 'key';
            }
        }
    });

    nv.utils.initOptions(chart);
    return chart;
};
nv.models.pieChart = function () {
    "use strict";

    //============================================================
    // Public Variables with Default Settings
    //------------------------------------------------------------

    var pie = nv.models.pie();
    var legend = nv.models.legend();

    var margin = {top: 30, right: 20, bottom: 20, left: 20}
        , width = null
        , height = null
        , showLegend = true
        , color = nv.utils.defaultColor()
        , tooltips = true
        , tooltip = function (key, y, e, graph) {
            return '<h3 style="background-color: '
                + e.color + '">' + key + '</h3>'
                + '<p>' + y + '</p>';
        }
        , state = nv.utils.state()
        , defaultState = null
        , noData = "No Data Available."
        , duration = 250
        , dispatch = d3.dispatch('tooltipShow', 'tooltipHide', 'stateChange', 'changeState', 'renderEnd')
        ;

    //============================================================
    // Private Variables
    //------------------------------------------------------------

    var showTooltip = function (e, offsetElement) {
        var tooltipLabel = pie.x()(e.point);
        var left = e.pos[0] + ( (offsetElement && offsetElement.offsetLeft) || 0 ),
            top = e.pos[1] + ( (offsetElement && offsetElement.offsetTop) || 0),
            y = pie.valueFormat()(pie.y()(e.point)),
            content = tooltip(tooltipLabel, y, e, chart)
            ;
        nv.tooltip.show([left, top], content, e.value < 0 ? 'n' : 's', null, offsetElement);
    };

    var renderWatch = nv.utils.renderWatch(dispatch);

    var stateGetter = function (data) {
        return function () {
            return {
                active: data.map(function (d) {
                    return !d.disabled
                })
            };
        }
    };

    var stateSetter = function (data) {
        return function (state) {
            if (state.active !== undefined) {
                data.forEach(function (series, i) {
                    series.disabled = !state.active[i];
                });
            }
        }
    };

    //============================================================
    // Chart function
    //------------------------------------------------------------

    function chart(selection) {
        renderWatch.reset();
        renderWatch.models(pie);

        selection.each(function (data) {
            var container = d3.select(this);
            nv.utils.initSVG(container);

            var that = this;
            var availableWidth = (width || parseInt(container.style('width'), 10) || 960)
                    - margin.left - margin.right,
                availableHeight = (height || parseInt(container.style('height'), 10) || 400)
                    - margin.top - margin.bottom
                ;

            chart.update = function () {
                container.transition().call(chart);
            };
            chart.container = this;

            state.setter(stateSetter(data), chart.update)
                .getter(stateGetter(data))
                .update();

            //set state.disabled
            state.disabled = data.map(function (d) {
                return !!d.disabled
            });

            if (!defaultState) {
                var key;
                defaultState = {};
                for (key in state) {
                    if (state[key] instanceof Array)
                        defaultState[key] = state[key].slice(0);
                    else
                        defaultState[key] = state[key];
                }
            }

            // Display No Data message if there's nothing to show.
            if (!data || !data.length) {
                var noDataText = container.selectAll('.nv-noData').data([noData]);

                noDataText.enter().append('text')
                    .attr('class', 'nvd3 nv-noData')
                    .attr('dy', '-.7em')
                    .style('text-anchor', 'middle');

                noDataText
                    .attr('x', margin.left + availableWidth / 2)
                    .attr('y', margin.top + availableHeight / 2)
                    .text(function (d) {
                        return d
                    });

                return chart;
            }
            else {
                container.selectAll('.nv-noData').remove();
            }

            // Setup containers and skeleton of chart
            var wrap = container.selectAll('g.nv-wrap.nv-pieChart').data([data]);
            var gEnter = wrap.enter().append('g').attr('class', 'nvd3 nv-wrap nv-pieChart').append('g');
            var g = wrap.select('g');

            gEnter.append('g').attr('class', 'nv-pieWrap');
            gEnter.append('g').attr('class', 'nv-legendWrap');

            // Legend
            if (showLegend) {
                legend.width(availableWidth).key(pie.x());

                wrap.select('.nv-legendWrap')
                    .datum(data)
                    .call(legend);

                if (margin.top != legend.height()) {
                    margin.top = legend.height();
                    availableHeight = (height || parseInt(container.style('height')) || 400)
                    - margin.top - margin.bottom;
                }

                wrap.select('.nv-legendWrap')
                    .attr('transform', 'translate(0,' + (-margin.top) + ')');
            }
            wrap.attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

            // Main Chart Component(s)
            pie.width(availableWidth).height(availableHeight);
            var pieWrap = g.select('.nv-pieWrap').datum([data]);
            d3.transition(pieWrap).call(pie);

            // Event Handling/Dispatching (in chart's scope)
            legend.dispatch.on('stateChange', function (newState) {
                for (var key in newState) {
                    state[key] = newState[key];
                }
                dispatch.stateChange(state);
                chart.update();
            });

            pie.dispatch.on('elementMouseout.tooltip', function (e) {
                dispatch.tooltipHide(e);
            });

            // Update chart from a state object passed to event handler
            dispatch.on('changeState', function (e) {
                if (typeof e.disabled !== 'undefined') {
                    data.forEach(function (series, i) {
                        series.disabled = e.disabled[i];
                    });
                    state.disabled = e.disabled;
                }
                chart.update();
            });

        });

        renderWatch.renderEnd('pieChart immediate');
        return chart;
    }

    //============================================================
    // Event Handling/Dispatching (out of chart's scope)
    //------------------------------------------------------------

    pie.dispatch.on('elementMouseover.tooltip', function (e) {
        e.pos = [e.pos[0] + margin.left, e.pos[1] + margin.top];
        dispatch.tooltipShow(e);
    });

    dispatch.on('tooltipShow', function (e) {
        if (tooltips) showTooltip(e);
    });

    dispatch.on('tooltipHide', function () {
        if (tooltips) nv.tooltip.cleanup();
    });

    //============================================================
    // Expose Public Variables
    //------------------------------------------------------------

    // expose chart's sub-components
    chart.legend = legend;
    chart.dispatch = dispatch;
    chart.pie = pie;
    chart.options = nv.utils.optionsFunc.bind(chart);

    // use Object get/set functionality to map between vars and chart functions
    chart._options = Object.create({}, {
        // simple options, just get/set the necessary values
        noData: {
            get: function () {
                return noData;
            }, set: function (_) {
                noData = _;
            }
        },
        tooltipContent: {
            get: function () {
                return tooltip;
            }, set: function (_) {
                tooltip = _;
            }
        },
        tooltips: {
            get: function () {
                return tooltips;
            }, set: function (_) {
                tooltips = _;
            }
        },
        showLegend: {
            get: function () {
                return showLegend;
            }, set: function (_) {
                showLegend = _;
            }
        },
        defaultState: {
            get: function () {
                return defaultState;
            }, set: function (_) {
                defaultState = _;
            }
        },
        // options that require extra logic in the setter
        color: {
            get: function () {
                return color;
            }, set: function (_) {
                color = _;
                legend.color(color);
                pie.color(color);
            }
        },
        duration: {
            get: function () {
                return duration;
            }, set: function (_) {
                duration = _;
                renderWatch.reset(duration);
            }
        }
    });
    nv.utils.inheritOptions(chart, pie);
    nv.utils.initOptions(chart);
    return chart;
};



nv.models.scatterChart = function () {
    "use strict";

    //============================================================
    // Public Variables with Default Settings
    //------------------------------------------------------------

    var scatter = nv.models.scatter()
        , xAxis = nv.models.axis()
        , yAxis = nv.models.axis()
        , legend = nv.models.legend()
        , distX = nv.models.distribution()
        , distY = nv.models.distribution()
        ;

    var margin = {top: 30, right: 20, bottom: 50, left: 75}
        , width = null
        , height = null
        , color = nv.utils.defaultColor()
        , x = scatter.xScale()
        , y = scatter.yScale()
        , showDistX = false
        , showDistY = false
        , showLegend = true
        , showXAxis = true
        , showYAxis = true
        , rightAlignYAxis = false
        , tooltips = true
        , tooltipX = function (key, x, y) {
            return '<strong>' + x + '</strong>'
        }
        , tooltipY = function (key, x, y) {
            return '<strong>' + y + '</strong>'
        }
        , tooltip = function (key, x, y, date) {
            return '<h3>' + key + '</h3>'
                + '<p>' + date + '</p>'
        }
        , state = nv.utils.state()
        , defaultState = null
        , dispatch = d3.dispatch('tooltipShow', 'tooltipHide', 'stateChange', 'changeState', 'renderEnd')
        , noData = "No Data Available."
        , duration = 250
        ;

    scatter
        .xScale(x)
        .yScale(y)
    ;
    xAxis
        .orient('bottom')
        .tickPadding(10)
    ;
    yAxis
        .orient((rightAlignYAxis) ? 'right' : 'left')
        .tickPadding(10)
    ;
    distX
        .axis('x')
    ;
    distY
        .axis('y')
    ;

    //============================================================
    // Private Variables
    //------------------------------------------------------------

    var x0, y0
        , renderWatch = nv.utils.renderWatch(dispatch, duration);

    var showTooltip = function (e, offsetElement) {
        //TODO: make tooltip style an option between single or dual on axes (maybe on all charts with axes?
        var left = e.pos[0] + ( offsetElement.offsetLeft || 0 ),
            top = e.pos[1] + ( offsetElement.offsetTop || 0),
            leftX = e.pos[0] + ( offsetElement.offsetLeft || 0 ),
            topX = y.range()[0] + margin.top + ( offsetElement.offsetTop || 0),
            leftY = x.range()[0] + margin.left + ( offsetElement.offsetLeft || 0 ),
            topY = e.pos[1] + ( offsetElement.offsetTop || 0),
            xVal = xAxis.tickFormat()(scatter.x()(e.point, e.pointIndex)),
            yVal = yAxis.tickFormat()(scatter.y()(e.point, e.pointIndex));

        if (tooltipX != null)
            nv.tooltip.show([leftX, topX], tooltipX(e.series.key, xVal, yVal, e, chart), 'n', 1, offsetElement, 'x-nvtooltip');
        if (tooltipY != null)
            nv.tooltip.show([leftY, topY], tooltipY(e.series.key, xVal, yVal, e, chart), 'e', 1, offsetElement, 'y-nvtooltip');
        if (tooltip != null)
            nv.tooltip.show([left, top], tooltip(e.series.key, xVal, yVal, e.point.tooltip, e, chart), e.value < 0 ? 'n' : 's', null, offsetElement);
    };

    var stateGetter = function (data) {
        return function () {
            return {
                active: data.map(function (d) {
                    return !d.disabled
                })
            };
        }
    };

    var stateSetter = function (data) {
        return function (state) {
            if (state.active !== undefined)
                data.forEach(function (series, i) {
                    series.disabled = !state.active[i];
                });
        }
    };

    function chart(selection) {
        renderWatch.reset();
        renderWatch.models(scatter);
        if (showXAxis) renderWatch.models(xAxis);
        if (showYAxis) renderWatch.models(yAxis);
        if (showDistX) renderWatch.models(distX);
        if (showDistY) renderWatch.models(distY);

        selection.each(function (data) {
            var container = d3.select(this),
                that = this;
            nv.utils.initSVG(container);

            var availableWidth = (width || parseInt(container.style('width')) || 960)
                    - margin.left - margin.right,
                availableHeight = (height || parseInt(container.style('height')) || 400)
                    - margin.top - margin.bottom;

            chart.update = function () {
                if (duration === 0)
                    container.call(chart);
                else
                    container.transition().duration(duration).call(chart);
            };
            chart.container = this;

            state
                .setter(stateSetter(data), chart.update)
                .getter(stateGetter(data))
                .update();

            // DEPRECATED set state.disableddisabled
            state.disabled = data.map(function (d) {
                return !!d.disabled
            });

            if (!defaultState) {
                var key;
                defaultState = {};
                for (key in state) {
                    if (state[key] instanceof Array)
                        defaultState[key] = state[key].slice(0);
                    else
                        defaultState[key] = state[key];
                }
            }

            // Display noData message if there's nothing to show.
            if (!data || !data.length || !data.filter(function (d) {
                    return d.values.length
                }).length) {
                var noDataText = container.selectAll('.nv-noData').data([noData]);

                noDataText.enter().append('text')
                    .attr('class', 'nvd3 nv-noData')
                    .attr('dy', '-.7em')
                    .style('text-anchor', 'middle');

                noDataText
                    .attr('x', margin.left + availableWidth / 2)
                    .attr('y', margin.top + availableHeight / 2)
                    .text(function (d) {
                        return d
                    });

                renderWatch.renderEnd('scatter immediate');

                return chart;
            }
            else {
                container.selectAll('.nv-noData').remove();
            }

            // Setup Scales
            x = scatter.xScale();
            y = scatter.yScale();

            // Setup containers and skeleton of chart
            var wrap = container.selectAll('g.nv-wrap.nv-scatterChart').data([data]);
            var wrapEnter = wrap.enter().append('g').attr('class', 'nvd3 nv-wrap nv-scatterChart nv-chart-' + scatter.id());
            var gEnter = wrapEnter.append('g');
            var g = wrap.select('g');

            // background for pointer events
            gEnter.append('rect').attr('class', 'nvd3 nv-background').style("pointer-events", "none");

            gEnter.append('g').attr('class', 'nv-x nv-axis');
            gEnter.append('g').attr('class', 'nv-y nv-axis');
            gEnter.append('g').attr('class', 'nv-scatterWrap');
            gEnter.append('g').attr('class', 'nv-regressionLinesWrap');
            gEnter.append('g').attr('class', 'nv-distWrap');
            gEnter.append('g').attr('class', 'nv-legendWrap');

            wrap.attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

            if (rightAlignYAxis) {
                g.select(".nv-y.nv-axis")
                    .attr("transform", "translate(" + availableWidth + ",0)");
            }

            // Legend
            if (showLegend) {
                legend.width(availableWidth / 2);

                wrap.select('.nv-legendWrap')
                    .datum(data)
                    .call(legend);

                if (margin.top != legend.height()) {
                    margin.top = legend.height();
                    availableHeight = (height || parseInt(container.style('height')) || 400)
                    - margin.top - margin.bottom;
                }

                wrap.select('.nv-legendWrap')
                    .attr('transform', 'translate(' + (availableWidth / 2) + ',' + (-margin.top) + ')');
            }

            // Main Chart Component(s)
            scatter
                .width(availableWidth)
                .height(availableHeight)
                .color(data.map(function (d, i) {
                    return d.color || color(d, i);
                }).filter(function (d, i) {
                    return !data[i].disabled
                }));

            wrap.select('.nv-scatterWrap')
                .datum(data.filter(function (d) {
                    return !d.disabled
                }))
                .call(scatter);


            wrap.select('.nv-regressionLinesWrap')
                .attr('clip-path', 'url(#nv-edge-clip-' + scatter.id() + ')');

            var regWrap = wrap.select('.nv-regressionLinesWrap').selectAll('.nv-regLines')
                .data(function (d) {
                    return d;
                });

            regWrap.enter().append('g').attr('class', 'nv-regLines');

            var regLine = regWrap.selectAll('.nv-regLine')
                .data(function (d) {
                    return [d]
                });

            regLine.enter()
                .append('line').attr('class', 'nv-regLine')
                .style('stroke-opacity', 0);

            // don't add lines unless we have slope and intercept to use
            regLine.filter(function (d) {
                return d.intercept && d.slope;
            })
                .watchTransition(renderWatch, 'scatterPlusLineChart: regline')
                .attr('x1', x.range()[0])
                .attr('x2', x.range()[1])
                .attr('y1', function (d, i) {
                    return y(x.domain()[0] * d.slope + d.intercept)
                })
                .attr('y2', function (d, i) {
                    return y(x.domain()[1] * d.slope + d.intercept)
                })
                .style('stroke', function (d, i, j) {
                    return color(d, j)
                })
                .style('stroke-opacity', function (d, i) {
                    return (d.disabled || typeof d.slope === 'undefined' || typeof d.intercept === 'undefined') ? 0 : 1
                });

            // Setup Axes
            if (showXAxis) {
                xAxis
                    .scale(x)
                    .ticks(xAxis.ticks() ? xAxis.ticks() : nv.utils.calcTicksX(availableWidth / 100, data))
                    .tickSize(-availableHeight, 0);

                g.select('.nv-x.nv-axis')
                    .attr('transform', 'translate(0,' + y.range()[0] + ')')
                    .call(xAxis);
            }

            if (showYAxis) {
                yAxis
                    .scale(y)
                    .ticks(yAxis.ticks() ? yAxis.ticks() : nv.utils.calcTicksY(availableHeight / 36, data))
                    .tickSize(-availableWidth, 0);

                g.select('.nv-y.nv-axis')
                    .call(yAxis);
            }


            if (showDistX) {
                distX
                    .getData(scatter.x())
                    .scale(x)
                    .width(availableWidth)
                    .color(data.map(function (d, i) {
                        return d.color || color(d, i);
                    }).filter(function (d, i) {
                        return !data[i].disabled
                    }));
                gEnter.select('.nv-distWrap').append('g')
                    .attr('class', 'nv-distributionX');
                g.select('.nv-distributionX')
                    .attr('transform', 'translate(0,' + y.range()[0] + ')')
                    .datum(data.filter(function (d) {
                        return !d.disabled
                    }))
                    .call(distX);
            }

            if (showDistY) {
                distY
                    .getData(scatter.y())
                    .scale(y)
                    .width(availableHeight)
                    .color(data.map(function (d, i) {
                        return d.color || color(d, i);
                    }).filter(function (d, i) {
                        return !data[i].disabled
                    }));
                gEnter.select('.nv-distWrap').append('g')
                    .attr('class', 'nv-distributionY');
                g.select('.nv-distributionY')
                    .attr('transform', 'translate(' + (rightAlignYAxis ? availableWidth : -distY.size() ) + ',0)')
                    .datum(data.filter(function (d) {
                        return !d.disabled
                    }))
                    .call(distY);
            }

            //============================================================
            // Event Handling/Dispatching (in chart's scope)
            //------------------------------------------------------------

            legend.dispatch.on('stateChange', function (newState) {
                for (var key in newState)
                    state[key] = newState[key];
                dispatch.stateChange(state);
                chart.update();
            });


            scatter.dispatch.on('elementMouseover.tooltip', function (e) {
                d3.select('.nv-chart-' + scatter.id() + ' .nv-series-' + e.seriesIndex + ' .nv-distx-' + e.pointIndex)
                    .attr('y1', e.pos[1] - availableHeight);
                d3.select('.nv-chart-' + scatter.id() + ' .nv-series-' + e.seriesIndex + ' .nv-disty-' + e.pointIndex)
                    .attr('x2', e.pos[0] + distX.size());

                e.pos = [e.pos[0] + margin.left, e.pos[1] + margin.top];
                dispatch.tooltipShow(e);
            });

            dispatch.on('tooltipShow', function (e) {
                if (tooltips) showTooltip(e, that.parentNode);
            });

            // Update chart from a state object passed to event handler
            dispatch.on('changeState', function (e) {

                if (typeof e.disabled !== 'undefined') {
                    data.forEach(function (series, i) {
                        series.disabled = e.disabled[i];
                    });

                    state.disabled = e.disabled;
                }

                chart.update();
            });

            //store old scales for use in transitions on update
            x0 = x.copy();
            y0 = y.copy();

        });

        renderWatch.renderEnd('scatter with line immediate');
        return chart;
    }

    //============================================================
    // Event Handling/Dispatching (out of chart's scope)
    //------------------------------------------------------------

    scatter.dispatch.on('elementMouseout.tooltip', function (e) {
        dispatch.tooltipHide(e);

        d3.select('.nv-chart-' + scatter.id() + ' .nv-series-' + e.seriesIndex + ' .nv-distx-' + e.pointIndex)
            .attr('y1', 0);
        d3.select('.nv-chart-' + scatter.id() + ' .nv-series-' + e.seriesIndex + ' .nv-disty-' + e.pointIndex)
            .attr('x2', distY.size());
    });
    dispatch.on('tooltipHide', function () {
        if (tooltips) nv.tooltip.cleanup();
    });

    //============================================================
    // Expose Public Variables
    //------------------------------------------------------------

    // expose chart's sub-components
    chart.dispatch = dispatch;
    chart.scatter = scatter;
    chart.legend = legend;
    chart.xAxis = xAxis;
    chart.yAxis = yAxis;
    chart.distX = distX;
    chart.distY = distY;

    chart._options = Object.create({}, {
        // simple options, just get/set the necessary values
        width: {
            get: function () {
                return width;
            }, set: function (_) {
                width = _;
            }
        },
        height: {
            get: function () {
                return height;
            }, set: function (_) {
                height = _;
            }
        },
        showDistX: {
            get: function () {
                return showDistX;
            }, set: function (_) {
                showDistX = _;
            }
        },
        showDistY: {
            get: function () {
                return showDistY;
            }, set: function (_) {
                showDistY = _;
            }
        },
        showLegend: {
            get: function () {
                return showLegend;
            }, set: function (_) {
                showLegend = _;
            }
        },
        showXAxis: {
            get: function () {
                return showXAxis;
            }, set: function (_) {
                showXAxis = _;
            }
        },
        showYAxis: {
            get: function () {
                return showYAxis;
            }, set: function (_) {
                showYAxis = _;
            }
        },
        tooltips: {
            get: function () {
                return tooltips;
            }, set: function (_) {
                tooltips = _;
            }
        },
        tooltipContent: {
            get: function () {
                return tooltip;
            }, set: function (_) {
                tooltip = _;
            }
        },
        tooltipXContent: {
            get: function () {
                return tooltipX;
            }, set: function (_) {
                tooltipX = _;
            }
        },
        tooltipYContent: {
            get: function () {
                return tooltipY;
            }, set: function (_) {
                tooltipY = _;
            }
        },
        defaultState: {
            get: function () {
                return defaultState;
            }, set: function (_) {
                defaultState = _;
            }
        },
        noData: {
            get: function () {
                return noData;
            }, set: function (_) {
                noData = _;
            }
        },
        duration: {
            get: function () {
                return duration;
            }, set: function (_) {
                duration = _;
            }
        },

        // options that require extra logic in the setter
        margin: {
            get: function () {
                return margin;
            }, set: function (_) {
                margin.top = _.top !== undefined ? _.top : margin.top;
                margin.right = _.right !== undefined ? _.right : margin.right;
                margin.bottom = _.bottom !== undefined ? _.bottom : margin.bottom;
                margin.left = _.left !== undefined ? _.left : margin.left;
            }
        },
        rightAlignYAxis: {
            get: function () {
                return rightAlignYAxis;
            }, set: function (_) {
                rightAlignYAxis = _;
                yAxis.orient((_) ? 'right' : 'left');
            }
        },
        color: {
            get: function () {
                return color;
            }, set: function (_) {
                color = nv.utils.getColor(_);
                legend.color(color);
                distX.color(color);
                distY.color(color);
            }
        }
    });

    nv.utils.inheritOptions(chart, scatter);
    nv.utils.initOptions(chart);
    return chart;
};

nv.models.sparkline = function () {
    "use strict";

    //============================================================
    // Public Variables with Default Settings
    //------------------------------------------------------------

    var margin = {top: 2, right: 0, bottom: 2, left: 0}
        , width = 400
        , height = 32
        , animate = true
        , x = d3.scale.linear()
        , y = d3.scale.linear()
        , getX = function (d) {
            return d.x
        }
        , getY = function (d) {
            return d.y
        }
        , color = nv.utils.getColor(['#000'])
        , xDomain
        , yDomain
        , xRange
        , yRange
        ;

    function chart(selection) {
        selection.each(function (data) {
            var availableWidth = width - margin.left - margin.right,
                availableHeight = height - margin.top - margin.bottom,
                container = d3.select(this);
            nv.utils.initSVG(container);

            // Setup Scales
            x.domain(xDomain || d3.extent(data, getX))
                .range(xRange || [0, availableWidth]);

            y.domain(yDomain || d3.extent(data, getY))
                .range(yRange || [availableHeight, 0]);

            // Setup containers and skeleton of chart
            var wrap = container.selectAll('g.nv-wrap.nv-sparkline').data([data]);
            var wrapEnter = wrap.enter().append('g').attr('class', 'nvd3 nv-wrap nv-sparkline');
            var gEnter = wrapEnter.append('g');
            var g = wrap.select('g');

            wrap.attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')

            var paths = wrap.selectAll('path')
                .data(function (d) {
                    return [d]
                });
            paths.enter().append('path');
            paths.exit().remove();
            paths
                .style('stroke', function (d, i) {
                    return d.color || color(d, i)
                })
                .attr('d', d3.svg.line()
                    .x(function (d, i) {
                        return x(getX(d, i))
                    })
                    .y(function (d, i) {
                        return y(getY(d, i))
                    })
            );

            // TODO: Add CURRENT data point (Need Min, Mac, Current / Most recent)
            var points = wrap.selectAll('circle.nv-point')
                .data(function (data) {
                    var yValues = data.map(function (d, i) {
                        return getY(d, i);
                    });

                    function pointIndex(index) {
                        if (index != -1) {
                            var result = data[index];
                            result.pointIndex = index;
                            return result;
                        }
                        else {
                            return null;
                        }
                    }

                    var maxPoint = pointIndex(yValues.lastIndexOf(y.domain()[1])),
                        minPoint = pointIndex(yValues.indexOf(y.domain()[0])),
                        currentPoint = pointIndex(yValues.length - 1);
                    return [minPoint, maxPoint, currentPoint].filter(function (d) {
                        return d != null;
                    });
                });
            points.enter().append('circle');
            points.exit().remove();
            points
                .attr('cx', function (d, i) {
                    return x(getX(d, d.pointIndex))
                })
                .attr('cy', function (d, i) {
                    return y(getY(d, d.pointIndex))
                })
                .attr('r', 2)
                .attr('class', function (d, i) {
                    return getX(d, d.pointIndex) == x.domain()[1] ? 'nv-point nv-currentValue' :
                        getY(d, d.pointIndex) == y.domain()[0] ? 'nv-point nv-minValue' : 'nv-point nv-maxValue'
                });
        });

        return chart;
    }

    //============================================================
    // Expose Public Variables
    //------------------------------------------------------------

    chart.options = nv.utils.optionsFunc.bind(chart);

    chart._options = Object.create({}, {
        // simple options, just get/set the necessary values
        width: {
            get: function () {
                return width;
            }, set: function (_) {
                width = _;
            }
        },
        height: {
            get: function () {
                return height;
            }, set: function (_) {
                height = _;
            }
        },
        xDomain: {
            get: function () {
                return xDomain;
            }, set: function (_) {
                xDomain = _;
            }
        },
        yDomain: {
            get: function () {
                return yDomain;
            }, set: function (_) {
                yDomain = _;
            }
        },
        xRange: {
            get: function () {
                return xRange;
            }, set: function (_) {
                xRange = _;
            }
        },
        yRange: {
            get: function () {
                return yRange;
            }, set: function (_) {
                yRange = _;
            }
        },
        xScale: {
            get: function () {
                return x;
            }, set: function (_) {
                x = _;
            }
        },
        yScale: {
            get: function () {
                return y;
            }, set: function (_) {
                y = _;
            }
        },
        animate: {
            get: function () {
                return animate;
            }, set: function (_) {
                animate = _;
            }
        },

        //functor options
        x: {
            get: function () {
                return getX;
            }, set: function (_) {
                getX = d3.functor(_);
            }
        },
        y: {
            get: function () {
                return getY;
            }, set: function (_) {
                getY = d3.functor(_);
            }
        },

        // options that require extra logic in the setter
        margin: {
            get: function () {
                return margin;
            }, set: function (_) {
                margin.top = _.top !== undefined ? _.top : margin.top;
                margin.right = _.right !== undefined ? _.right : margin.right;
                margin.bottom = _.bottom !== undefined ? _.bottom : margin.bottom;
                margin.left = _.left !== undefined ? _.left : margin.left;
            }
        },
        color: {
            get: function () {
                return color;
            }, set: function (_) {
                color = nv.utils.getColor(_);
            }
        }
    });

    nv.utils.initOptions(chart);
    return chart;
};

nv.models.sparklinePlus = function () {
    "use strict";

    //============================================================
    // Public Variables with Default Settings
    //------------------------------------------------------------

    var sparkline = nv.models.sparkline();

    var margin = {top: 15, right: 100, bottom: 10, left: 50}
        , width = null
        , height = null
        , x
        , y
        , index = []
        , paused = false
        , xTickFormat = d3.format(',r')
        , yTickFormat = d3.format(',.2f')
        , showValue = true
        , alignValue = true
        , rightAlignValue = false
        , noData = "No Data Available."
        ;

    function chart(selection) {
        selection.each(function (data) {
            var container = d3.select(this);
            nv.utils.initSVG(container);

            var availableWidth = (width || parseInt(container.style('width')) || 960)
                    - margin.left - margin.right,
                availableHeight = (height || parseInt(container.style('height')) || 400)
                    - margin.top - margin.bottom;

            chart.update = function () {
                chart(selection)
            };
            chart.container = this;

            // Display No Data message if there's nothing to show.
            if (!data || !data.length) {
                var noDataText = container.selectAll('.nv-noData').data([noData]);

                noDataText.enter().append('text')
                    .attr('class', 'nvd3 nv-noData')
                    .attr('dy', '-.7em')
                    .style('text-anchor', 'middle');

                noDataText
                    .attr('x', margin.left + availableWidth / 2)
                    .attr('y', margin.top + availableHeight / 2)
                    .text(function (d) {
                        return d
                    });

                return chart;
            }
            else {
                container.selectAll('.nv-noData').remove();
            }

            var currentValue = sparkline.y()(data[data.length - 1], data.length - 1);

            // Setup Scales
            x = sparkline.xScale();
            y = sparkline.yScale();

            // Setup containers and skeleton of chart
            var wrap = container.selectAll('g.nv-wrap.nv-sparklineplus').data([data]);
            var wrapEnter = wrap.enter().append('g').attr('class', 'nvd3 nv-wrap nv-sparklineplus');
            var gEnter = wrapEnter.append('g');
            var g = wrap.select('g');

            gEnter.append('g').attr('class', 'nv-sparklineWrap');
            gEnter.append('g').attr('class', 'nv-valueWrap');
            gEnter.append('g').attr('class', 'nv-hoverArea');

            wrap.attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

            // Main Chart Component(s)
            var sparklineWrap = g.select('.nv-sparklineWrap');

            sparkline.width(availableWidth).height(availableHeight);
            sparklineWrap.call(sparkline);

            var valueWrap = g.select('.nv-valueWrap');
            var value = valueWrap.selectAll('.nv-currentValue')
                .data([currentValue]);

            value.enter().append('text').attr('class', 'nv-currentValue')
                .attr('dx', rightAlignValue ? -8 : 8)
                .attr('dy', '.9em')
                .style('text-anchor', rightAlignValue ? 'end' : 'start');

            value
                .attr('x', availableWidth + (rightAlignValue ? margin.right : 0))
                .attr('y', alignValue ? function (d) {
                    return y(d)
                } : 0)
                .style('fill', sparkline.color()(data[data.length - 1], data.length - 1))
                .text(yTickFormat(currentValue));

            gEnter.select('.nv-hoverArea').append('rect')
                .on('mousemove', sparklineHover)
                .on('click', function () {
                    paused = !paused
                })
                .on('mouseout', function () {
                    index = [];
                    updateValueLine();
                });

            g.select('.nv-hoverArea rect')
                .attr('transform', function (d) {
                    return 'translate(' + -margin.left + ',' + -margin.top + ')'
                })
                .attr('width', availableWidth + margin.left + margin.right)
                .attr('height', availableHeight + margin.top);

            //index is currently global (within the chart), may or may not keep it that way
            function updateValueLine() {
                if (paused) return;

                var hoverValue = g.selectAll('.nv-hoverValue').data(index)

                var hoverEnter = hoverValue.enter()
                    .append('g').attr('class', 'nv-hoverValue')
                    .style('stroke-opacity', 0)
                    .style('fill-opacity', 0);

                hoverValue.exit()
                    .transition().duration(250)
                    .style('stroke-opacity', 0)
                    .style('fill-opacity', 0)
                    .remove();

                hoverValue
                    .attr('transform', function (d) {
                        return 'translate(' + x(sparkline.x()(data[d], d)) + ',0)'
                    })
                    .transition().duration(250)
                    .style('stroke-opacity', 1)
                    .style('fill-opacity', 1);

                if (!index.length) return;

                hoverEnter.append('line')
                    .attr('x1', 0)
                    .attr('y1', -margin.top)
                    .attr('x2', 0)
                    .attr('y2', availableHeight);

                hoverEnter.append('text').attr('class', 'nv-xValue')
                    .attr('x', -6)
                    .attr('y', -margin.top)
                    .attr('text-anchor', 'end')
                    .attr('dy', '.9em')

                g.select('.nv-hoverValue .nv-xValue')
                    .text(xTickFormat(sparkline.x()(data[index[0]], index[0])));

                hoverEnter.append('text').attr('class', 'nv-yValue')
                    .attr('x', 6)
                    .attr('y', -margin.top)
                    .attr('text-anchor', 'start')
                    .attr('dy', '.9em')

                g.select('.nv-hoverValue .nv-yValue')
                    .text(yTickFormat(sparkline.y()(data[index[0]], index[0])));
            }

            function sparklineHover() {
                if (paused) return;

                var pos = d3.mouse(this)[0] - margin.left;

                function getClosestIndex(data, x) {
                    var distance = Math.abs(sparkline.x()(data[0], 0) - x);
                    var closestIndex = 0;
                    for (var i = 0; i < data.length; i++) {
                        if (Math.abs(sparkline.x()(data[i], i) - x) < distance) {
                            distance = Math.abs(sparkline.x()(data[i], i) - x);
                            closestIndex = i;
                        }
                    }
                    return closestIndex;
                }

                index = [getClosestIndex(data, Math.round(x.invert(pos)))];
                updateValueLine();
            }

        });

        return chart;
    }

    //============================================================
    // Expose Public Variables
    //------------------------------------------------------------

    // expose chart's sub-components
    chart.sparkline = sparkline;

    chart.options = nv.utils.optionsFunc.bind(chart);

    chart._options = Object.create({}, {
        // simple options, just get/set the necessary values
        width: {
            get: function () {
                return width;
            }, set: function (_) {
                width = _;
            }
        },
        height: {
            get: function () {
                return height;
            }, set: function (_) {
                height = _;
            }
        },
        xTickFormat: {
            get: function () {
                return xTickFormat;
            }, set: function (_) {
                xTickFormat = _;
            }
        },
        yTickFormat: {
            get: function () {
                return yTickFormat;
            }, set: function (_) {
                yTickFormat = _;
            }
        },
        showValue: {
            get: function () {
                return showValue;
            }, set: function (_) {
                showValue = _;
            }
        },
        alignValue: {
            get: function () {
                return alignValue;
            }, set: function (_) {
                alignValue = _;
            }
        },
        rightAlignValue: {
            get: function () {
                return rightAlignValue;
            }, set: function (_) {
                rightAlignValue = _;
            }
        },
        noData: {
            get: function () {
                return noData;
            }, set: function (_) {
                noData = _;
            }
        },

        // options that require extra logic in the setter
        margin: {
            get: function () {
                return margin;
            }, set: function (_) {
                margin.top = _.top !== undefined ? _.top : margin.top;
                margin.right = _.right !== undefined ? _.right : margin.right;
                margin.bottom = _.bottom !== undefined ? _.bottom : margin.bottom;
                margin.left = _.left !== undefined ? _.left : margin.left;
            }
        }
    });

    nv.utils.inheritOptions(chart, sparkline);
    nv.utils.initOptions(chart);

    return chart;
};

nv.models.stackedArea = function () {
    "use strict";

    //============================================================
    // Public Variables with Default Settings
    //------------------------------------------------------------

    var margin = {top: 0, right: 0, bottom: 0, left: 0}
        , width = 960
        , height = 500
        , color = nv.utils.defaultColor() // a function that computes the color
        , id = Math.floor(Math.random() * 100000) //Create semi-unique ID incase user doesn't selet one
        , getX = function (d) {
            return d.x
        } // accessor to get the x value from a data point
        , getY = function (d) {
            return d.y
        } // accessor to get the y value from a data point
        , style = 'stack'
        , offset = 'zero'
        , order = 'default'
        , interpolate = 'linear'  // controls the line interpolation
        , clipEdge = false // if true, masks lines within x and y scale
        , x //can be accessed via chart.xScale()
        , y //can be accessed via chart.yScale()
        , scatter = nv.models.scatter()
        , duration = 250
        , dispatch = d3.dispatch('tooltipShow', 'tooltipHide', 'areaClick', 'areaMouseover', 'areaMouseout', 'renderEnd')
        ;

    // scatter is interactive by default, but this chart isn't so must disable
    scatter.interactive(false);

    scatter
        .pointSize(2.2) // default size
        .pointDomain([2.2, 2.2]) // all the same size by default
    ;

    /************************************
     * offset:
     *   'wiggle' (stream)
     *   'zero' (stacked)
     *   'expand' (normalize to 100%)
     *   'silhouette' (simple centered)
     *
     * order:
     *   'inside-out' (stream)
     *   'default' (input order)
     ************************************/

    var renderWatch = nv.utils.renderWatch(dispatch, duration);

    function chart(selection) {
        renderWatch.reset();
        renderWatch.models(scatter);
        selection.each(function (data) {
            var availableWidth = width - margin.left - margin.right,
                availableHeight = height - margin.top - margin.bottom,
                container = d3.select(this);
            nv.utils.initSVG(container);

            // Setup Scales
            x = scatter.xScale();
            y = scatter.yScale();

            var dataRaw = data;
            // Injecting point index into each point because d3.layout.stack().out does not give index
            data.forEach(function (aseries, i) {
                aseries.seriesIndex = i;
                aseries.values = aseries.values.map(function (d, j) {
                    d.index = j;
                    d.seriesIndex = i;
                    return d;
                });
            });

            var dataFiltered = data.filter(function (series) {
                return !series.disabled;
            });

            data = d3.layout.stack()
                .order(order)
                .offset(offset)
                .values(function (d) {
                    return d.values
                })  //TODO: make values customizeable in EVERY model in this fashion
                .x(getX)
                .y(getY)
                .out(function (d, y0, y) {
                    var yHeight = (getY(d) === 0) ? 0 : y;
                    d.display = {
                        y: yHeight,
                        y0: y0
                    };
                })
            (dataFiltered);

            // Setup containers and skeleton of chart
            var wrap = container.selectAll('g.nv-wrap.nv-stackedarea').data([data]);
            var wrapEnter = wrap.enter().append('g').attr('class', 'nvd3 nv-wrap nv-stackedarea');
            var defsEnter = wrapEnter.append('defs');
            var gEnter = wrapEnter.append('g');
            var g = wrap.select('g');

            gEnter.append('g').attr('class', 'nv-areaWrap');
            gEnter.append('g').attr('class', 'nv-scatterWrap');

            wrap.attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

            scatter
                .width(availableWidth)
                .height(availableHeight)
                .x(getX)
                .y(function (d) {
                    return d.display.y + d.display.y0
                })
                .forceY([0])
                .color(data.map(function (d, i) {
                    return d.color || color(d, d.seriesIndex);
                }));

            var scatterWrap = g.select('.nv-scatterWrap')
                .datum(data);

            scatterWrap.call(scatter);

            defsEnter.append('clipPath')
                .attr('id', 'nv-edge-clip-' + id)
                .append('rect');

            wrap.select('#nv-edge-clip-' + id + ' rect')
                .attr('width', availableWidth)
                .attr('height', availableHeight);

            g.attr('clip-path', clipEdge ? 'url(#nv-edge-clip-' + id + ')' : '');

            var area = d3.svg.area()
                .x(function (d, i) {
                    return x(getX(d, i))
                })
                .y0(function (d) {
                    return y(d.display.y0)
                })
                .y1(function (d) {
                    return y(d.display.y + d.display.y0)
                })
                .interpolate(interpolate);

            var zeroArea = d3.svg.area()
                .x(function (d, i) {
                    return x(getX(d, i))
                })
                .y0(function (d) {
                    return y(d.display.y0)
                })
                .y1(function (d) {
                    return y(d.display.y0)
                });

            var path = g.select('.nv-areaWrap').selectAll('path.nv-area')
                .data(function (d) {
                    return d
                });

            path.enter().append('path').attr('class', function (d, i) {
                return 'nv-area nv-area-' + i
            })
                .attr('d', function (d, i) {
                    return zeroArea(d.values, d.seriesIndex);
                })
                .on('mouseover', function (d, i) {
                    d3.select(this).classed('hover', true);
                    dispatch.areaMouseover({
                        point: d,
                        series: d.key,
                        pos: [d3.event.pageX, d3.event.pageY],
                        seriesIndex: d.seriesIndex
                    });
                })
                .on('mouseout', function (d, i) {
                    d3.select(this).classed('hover', false);
                    dispatch.areaMouseout({
                        point: d,
                        series: d.key,
                        pos: [d3.event.pageX, d3.event.pageY],
                        seriesIndex: d.seriesIndex
                    });
                })
                .on('click', function (d, i) {
                    d3.select(this).classed('hover', false);
                    dispatch.areaClick({
                        point: d,
                        series: d.key,
                        pos: [d3.event.pageX, d3.event.pageY],
                        seriesIndex: d.seriesIndex
                    });
                });

            path.exit().remove();
            path.style('fill', function (d, i) {
                return d.color || color(d, d.seriesIndex)
            })
                .style('stroke', function (d, i) {
                    return d.color || color(d, d.seriesIndex)
                });
            path.watchTransition(renderWatch, 'stackedArea path')
                .attr('d', function (d, i) {
                    return area(d.values, i)
                });

            //============================================================
            // Event Handling/Dispatching (in chart's scope)
            //------------------------------------------------------------

            scatter.dispatch.on('elementMouseover.area', function (e) {
                g.select('.nv-chart-' + id + ' .nv-area-' + e.seriesIndex).classed('hover', true);
            });
            scatter.dispatch.on('elementMouseout.area', function (e) {
                g.select('.nv-chart-' + id + ' .nv-area-' + e.seriesIndex).classed('hover', false);
            });

            //Special offset functions
            chart.d3_stackedOffset_stackPercent = function (stackData) {
                var n = stackData.length,    //How many series
                    m = stackData[0].length,     //how many points per series
                    k = 1 / n,
                    i,
                    j,
                    o,
                    y0 = [];

                for (j = 0; j < m; ++j) { //Looping through all points
                    for (i = 0, o = 0; i < dataRaw.length; i++) { //looping through series'
                        o += getY(dataRaw[i].values[j]);   //total value of all points at a certian point in time.
                    }

                    if (o) for (i = 0; i < n; i++) {
                        stackData[i][j][1] /= o;
                    }
                    else {
                        for (i = 0; i < n; i++) {
                            stackData[i][j][1] = k;
                        }
                    }
                }
                for (j = 0; j < m; ++j) y0[j] = 0;
                return y0;
            };

        });

        renderWatch.renderEnd('stackedArea immediate');
        return chart;
    }


    //============================================================
    // Event Handling/Dispatching (out of chart's scope)
    //------------------------------------------------------------

    scatter.dispatch.on('elementClick.area', function (e) {
        dispatch.areaClick(e);
    });
    scatter.dispatch.on('elementMouseover.tooltip', function (e) {
        e.pos = [e.pos[0] + margin.left, e.pos[1] + margin.top],
            dispatch.tooltipShow(e);
    });
    scatter.dispatch.on('elementMouseout.tooltip', function (e) {
        dispatch.tooltipHide(e);
    });

    //============================================================
    // Global getters and setters
    //------------------------------------------------------------

    chart.dispatch = dispatch;
    chart.scatter = scatter;

    chart.interpolate = function (_) {
        if (!arguments.length) return interpolate;
        interpolate = _;
        return chart;
    };

    chart.duration = function (_) {
        if (!arguments.length) return duration;
        duration = _;
        renderWatch.reset(duration);
        scatter.duration(duration);
        return chart;
    };

    chart.dispatch = dispatch;
    chart.options = nv.utils.optionsFunc.bind(chart);

    chart._options = Object.create({}, {
        // simple options, just get/set the necessary values
        width: {
            get: function () {
                return width;
            }, set: function (_) {
                width = _;
            }
        },
        height: {
            get: function () {
                return height;
            }, set: function (_) {
                height = _;
            }
        },
        clipEdge: {
            get: function () {
                return clipEdge;
            }, set: function (_) {
                clipEdge = _;
            }
        },
        offset: {
            get: function () {
                return offset;
            }, set: function (_) {
                offset = _;
            }
        },
        order: {
            get: function () {
                return order;
            }, set: function (_) {
                order = _;
            }
        },
        interpolate: {
            get: function () {
                return interpolate;
            }, set: function (_) {
                interpolate = _;
            }
        },

        // simple functor options
        x: {
            get: function () {
                return getX;
            }, set: function (_) {
                getX = d3.functor(_);
            }
        },
        y: {
            get: function () {
                return getY;
            }, set: function (_) {
                getY = d3.functor(_);
            }
        },

        // options that require extra logic in the setter
        margin: {
            get: function () {
                return margin;
            }, set: function (_) {
                margin.top = _.top !== undefined ? _.top : margin.top;
                margin.right = _.right !== undefined ? _.right : margin.right;
                margin.bottom = _.bottom !== undefined ? _.bottom : margin.bottom;
                margin.left = _.left !== undefined ? _.left : margin.left;
            }
        },
        color: {
            get: function () {
                return color;
            }, set: function (_) {
                color = nv.utils.getColor(_);
            }
        },
        style: {
            get: function () {
                return style;
            }, set: function (_) {
                style = _;
                switch (style) {
                    case 'stack':
                        chart.offset('zero');
                        chart.order('default');
                        break;
                    case 'stream':
                        chart.offset('wiggle');
                        chart.order('inside-out');
                        break;
                    case 'stream-center':
                        chart.offset('silhouette');
                        chart.order('inside-out');
                        break;
                    case 'expand':
                        chart.offset('expand');
                        chart.order('default');
                        break;
                    case 'stack_percent':
                        chart.offset(chart.d3_stackedOffset_stackPercent);
                        chart.order('default');
                        break;
                }
            }
        },
        duration: {
            get: function () {
                return duration;
            }, set: function (_) {
                duration = _;
                renderWatch.reset(duration);
                scatter.duration(duration);
            }
        }
    });

    nv.utils.inheritOptions(chart, scatter);
    nv.utils.initOptions(chart);

    return chart;
};

nv.models.stackedAreaChart = function () {
    "use strict";

    //============================================================
    // Public Variables with Default Settings
    //------------------------------------------------------------

    var stacked = nv.models.stackedArea()
        , xAxis = nv.models.axis()
        , yAxis = nv.models.axis()
        , legend = nv.models.legend()
        , controls = nv.models.legend()
        , interactiveLayer = nv.interactiveGuideline()
        ;

    var margin = {top: 30, right: 25, bottom: 50, left: 60}
        , width = null
        , height = null
        , color = nv.utils.defaultColor()
        , showControls = true
        , showLegend = true
        , showXAxis = true
        , showYAxis = true
        , rightAlignYAxis = false
        , useInteractiveGuideline = false
        , tooltips = true
        , tooltip = function (key, x, y, e, graph) {
            return '<h3>' + key + '</h3>' +
                '<p>' + y + ' on ' + x + '</p>'
        }
        , x //can be accessed via chart.xScale()
        , y //can be accessed via chart.yScale()
        , yAxisTickFormat = d3.format(',.2f')
        , state = nv.utils.state()
        , defaultState = null
        , noData = 'No Data Available.'
        , dispatch = d3.dispatch('tooltipShow', 'tooltipHide', 'stateChange', 'changeState', 'renderEnd')
        , controlWidth = 250
        , cData = ['Stacked', 'Stream', 'Expanded']
        , controlLabels = {}
        , duration = 250
        ;

    state.style = stacked.style();
    xAxis.orient('bottom').tickPadding(7);
    yAxis.orient((rightAlignYAxis) ? 'right' : 'left');

    controls.updateState(false);

    //============================================================
    // Private Variables
    //------------------------------------------------------------

    var renderWatch = nv.utils.renderWatch(dispatch);
    var style = stacked.style();

    var showTooltip = function (e, offsetElement) {
        var left = e.pos[0] + ( offsetElement.offsetLeft || 0 ),
            top = e.pos[1] + ( offsetElement.offsetTop || 0),
            x = xAxis.tickFormat()(stacked.x()(e.point, e.pointIndex)),
            y = yAxis.tickFormat()(stacked.y()(e.point, e.pointIndex)),
            content = tooltip(e.series.key, x, y, e, chart);

        nv.tooltip.show([left, top], content, e.value < 0 ? 'n' : 's', null, offsetElement);
    };

    var stateGetter = function (data) {
        return function () {
            return {
                active: data.map(function (d) {
                    return !d.disabled
                }),
                style: stacked.style()
            };
        }
    };

    var stateSetter = function (data) {
        return function (state) {
            if (state.style !== undefined)
                style = state.style;
            if (state.active !== undefined)
                data.forEach(function (series, i) {
                    series.disabled = !state.active[i];
                });
        }
    };

    function chart(selection) {
        renderWatch.reset();
        renderWatch.models(stacked);
        if (showXAxis) renderWatch.models(xAxis);
        if (showYAxis) renderWatch.models(yAxis);

        selection.each(function (data) {
            var container = d3.select(this),
                that = this;
            nv.utils.initSVG(container);

            var availableWidth = (width || parseInt(container.style('width')) || 960)
                    - margin.left - margin.right,
                availableHeight = (height || parseInt(container.style('height')) || 400)
                    - margin.top - margin.bottom;

            chart.update = function () {
                container.transition().duration(duration).call(chart);
            };
            chart.container = this;

            state
                .setter(stateSetter(data), chart.update)
                .getter(stateGetter(data))
                .update();

            // DEPRECATED set state.disabled
            state.disabled = data.map(function (d) {
                return !!d.disabled
            });

            if (!defaultState) {
                var key;
                defaultState = {};
                for (key in state) {
                    if (state[key] instanceof Array)
                        defaultState[key] = state[key].slice(0);
                    else
                        defaultState[key] = state[key];
                }
            }

            // Display No Data message if there's nothing to show.
            if (!data || !data.length || !data.filter(function (d) {
                    return d.values.length
                }).length) {
                var noDataText = container.selectAll('.nv-noData').data([noData]);

                noDataText.enter().append('text')
                    .attr('class', 'nvd3 nv-noData')
                    .attr('dy', '-.7em')
                    .style('text-anchor', 'middle');

                noDataText
                    .attr('x', margin.left + availableWidth / 2)
                    .attr('y', margin.top + availableHeight / 2)
                    .text(function (d) {
                        return d
                    });

                return chart;
            }
            else {
                container.selectAll('.nv-noData').remove();
            }

            // Setup Scales
            x = stacked.xScale();
            y = stacked.yScale();

            // Setup containers and skeleton of chart
            var wrap = container.selectAll('g.nv-wrap.nv-stackedAreaChart').data([data]);
            var gEnter = wrap.enter().append('g').attr('class', 'nvd3 nv-wrap nv-stackedAreaChart').append('g');
            var g = wrap.select('g');

            gEnter.append("rect").style("opacity", 0);
            gEnter.append('g').attr('class', 'nv-x nv-axis');
            gEnter.append('g').attr('class', 'nv-y nv-axis');
            gEnter.append('g').attr('class', 'nv-stackedWrap');
            gEnter.append('g').attr('class', 'nv-legendWrap');
            gEnter.append('g').attr('class', 'nv-controlsWrap');
            gEnter.append('g').attr('class', 'nv-interactive');

            g.select("rect").attr("width", availableWidth).attr("height", availableHeight);

            // Legend
            if (showLegend) {
                var legendWidth = (showControls) ? availableWidth - controlWidth : availableWidth;

                legend.width(legendWidth);
                g.select('.nv-legendWrap').datum(data).call(legend);

                if (margin.top != legend.height()) {
                    margin.top = legend.height();
                    availableHeight = (height || parseInt(container.style('height')) || 400)
                    - margin.top - margin.bottom;
                }

                g.select('.nv-legendWrap')
                    .attr('transform', 'translate(' + (availableWidth - legendWidth) + ',' + (-margin.top) + ')');
            }

            // Controls
            if (showControls) {
                var controlsData = [
                    {
                        key: controlLabels.stacked || 'Stacked',
                        metaKey: 'Stacked',
                        disabled: stacked.style() != 'stack',
                        style: 'stack'
                    },
                    {
                        key: controlLabels.stream || 'Stream',
                        metaKey: 'Stream',
                        disabled: stacked.style() != 'stream',
                        style: 'stream'
                    },
                    {
                        key: controlLabels.expanded || 'Expanded',
                        metaKey: 'Expanded',
                        disabled: stacked.style() != 'expand',
                        style: 'expand'
                    },
                    {
                        key: controlLabels.stack_percent || 'Stack %',
                        metaKey: 'Stack_Percent',
                        disabled: stacked.style() != 'stack_percent',
                        style: 'stack_percent'
                    }
                ];

                controlWidth = (cData.length / 3) * 260;
                controlsData = controlsData.filter(function (d) {
                    return cData.indexOf(d.metaKey) !== -1;
                });

                controls
                    .width(controlWidth)
                    .color(['#444', '#444', '#444']);

                g.select('.nv-controlsWrap')
                    .datum(controlsData)
                    .call(controls);

                if (margin.top != Math.max(controls.height(), legend.height())) {
                    margin.top = Math.max(controls.height(), legend.height());
                    availableHeight = (height || parseInt(container.style('height')) || 400)
                    - margin.top - margin.bottom;
                }

                g.select('.nv-controlsWrap')
                    .attr('transform', 'translate(0,' + (-margin.top) + ')');
            }

            wrap.attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

            if (rightAlignYAxis) {
                g.select(".nv-y.nv-axis")
                    .attr("transform", "translate(" + availableWidth + ",0)");
            }

            //Set up interactive layer
            if (useInteractiveGuideline) {
                interactiveLayer
                    .width(availableWidth)
                    .height(availableHeight)
                    .margin({left: margin.left, top: margin.top})
                    .svgContainer(container)
                    .xScale(x);
                wrap.select(".nv-interactive").call(interactiveLayer);
            }

            stacked
                .width(availableWidth)
                .height(availableHeight);

            var stackedWrap = g.select('.nv-stackedWrap')
                .datum(data);

            stackedWrap.transition().call(stacked);

            // Setup Axes
            if (showXAxis) {
                xAxis.scale(x)
                    .ticks(nv.utils.calcTicksX(availableWidth / 100, data))
                    .tickSize(-availableHeight, 0);

                g.select('.nv-x.nv-axis')
                    .attr('transform', 'translate(0,' + availableHeight + ')');

                g.select('.nv-x.nv-axis')
                    .transition().duration(0)
                    .call(xAxis);
            }

            if (showYAxis) {
                yAxis.scale(y)
                    .ticks(stacked.offset() == 'wiggle' ? 0 : nv.utils.calcTicksY(availableHeight / 36, data))
                    .tickSize(-availableWidth, 0)
                    .setTickFormat((stacked.style() == 'expand' || stacked.style() == 'stack_percent')
                        ? d3.format('%') : yAxisTickFormat);

                g.select('.nv-y.nv-axis')
                    .transition().duration(0)
                    .call(yAxis);
            }

            //============================================================
            // Event Handling/Dispatching (in chart's scope)
            //------------------------------------------------------------

            stacked.dispatch.on('areaClick.toggle', function (e) {
                if (data.filter(function (d) {
                        return !d.disabled
                    }).length === 1)
                    data.forEach(function (d) {
                        d.disabled = false;
                    });
                else
                    data.forEach(function (d, i) {
                        d.disabled = (i != e.seriesIndex);
                    });

                state.disabled = data.map(function (d) {
                    return !!d.disabled
                });
                dispatch.stateChange(state);

                chart.update();
            });

            legend.dispatch.on('stateChange', function (newState) {
                for (var key in newState)
                    state[key] = newState[key];
                dispatch.stateChange(state);
                chart.update();
            });

            controls.dispatch.on('legendClick', function (d, i) {
                if (!d.disabled) return;

                controlsData = controlsData.map(function (s) {
                    s.disabled = true;
                    return s;
                });
                d.disabled = false;

                stacked.style(d.style);


                state.style = stacked.style();
                dispatch.stateChange(state);

                chart.update();
            });

            interactiveLayer.dispatch.on('elementMousemove', function (e) {
                stacked.clearHighlights();
                var singlePoint, pointIndex, pointXLocation, allData = [];
                data
                    .filter(function (series, i) {
                        series.seriesIndex = i;
                        return !series.disabled;
                    })
                    .forEach(function (series, i) {
                        pointIndex = nv.interactiveBisect(series.values, e.pointXValue, chart.x());
                        stacked.highlightPoint(i, pointIndex, true);
                        var point = series.values[pointIndex];
                        if (typeof point === 'undefined') return;
                        if (typeof singlePoint === 'undefined') singlePoint = point;
                        if (typeof pointXLocation === 'undefined') pointXLocation = chart.xScale()(chart.x()(point, pointIndex));

                        //If we are in 'expand' mode, use the stacked percent value instead of raw value.
                        var tooltipValue = (stacked.style() == 'expand') ? point.display.y : chart.y()(point, pointIndex);
                        allData.push({
                            key: series.key,
                            value: tooltipValue,
                            color: color(series, series.seriesIndex),
                            stackedValue: point.display
                        });
                    });

                allData.reverse();

                //Highlight the tooltip entry based on which stack the mouse is closest to.
                if (allData.length > 2) {
                    var yValue = chart.yScale().invert(e.mouseY);
                    var yDistMax = Infinity, indexToHighlight = null;
                    allData.forEach(function (series, i) {

                        //To handle situation where the stacked area chart is negative, we need to use absolute values
                        //when checking if the mouse Y value is within the stack area.
                        yValue = Math.abs(yValue);
                        var stackedY0 = Math.abs(series.stackedValue.y0);
                        var stackedY = Math.abs(series.stackedValue.y);
                        if (yValue >= stackedY0 && yValue <= (stackedY + stackedY0)) {
                            indexToHighlight = i;
                            return;
                        }
                    });
                    if (indexToHighlight != null)
                        allData[indexToHighlight].highlight = true;
                }

                var xValue = xAxis.tickFormat()(chart.x()(singlePoint, pointIndex));

                //If we are in 'expand' mode, force the format to be a percentage.
                var valueFormatter = (stacked.style() == 'expand') ?
                    function (d, i) {
                        return d3.format(".1%")(d);
                    } :
                    function (d, i) {
                        return yAxis.tickFormat()(d);
                    };
                interactiveLayer.tooltip
                    .position({left: pointXLocation + margin.left, top: e.mouseY + margin.top})
                    .chartContainer(that.parentNode)
                    .enabled(tooltips)
                    .valueFormatter(valueFormatter)
                    .data(
                    {
                        value: xValue,
                        series: allData
                    }
                )();

                interactiveLayer.renderGuideLine(pointXLocation);

            });

            interactiveLayer.dispatch.on("elementMouseout", function (e) {
                dispatch.tooltipHide();
                stacked.clearHighlights();
            });


            dispatch.on('tooltipShow', function (e) {
                if (tooltips) showTooltip(e, that.parentNode);
            });

            // Update chart from a state object passed to event handler
            dispatch.on('changeState', function (e) {

                if (typeof e.disabled !== 'undefined' && data.length === e.disabled.length) {
                    data.forEach(function (series, i) {
                        series.disabled = e.disabled[i];
                    });

                    state.disabled = e.disabled;
                }

                if (typeof e.style !== 'undefined') {
                    stacked.style(e.style);
                    style = e.style;
                }

                chart.update();
            });

        });

        renderWatch.renderEnd('stacked Area chart immediate');
        return chart;
    }

    //============================================================
    // Event Handling/Dispatching (out of chart's scope)
    //------------------------------------------------------------

    stacked.dispatch.on('tooltipShow', function (e) {
        e.pos = [e.pos[0] + margin.left, e.pos[1] + margin.top];
        dispatch.tooltipShow(e);
    });

    stacked.dispatch.on('tooltipHide', function (e) {
        dispatch.tooltipHide(e);
    });

    dispatch.on('tooltipHide', function () {
        if (tooltips) nv.tooltip.cleanup();
    });

    //============================================================
    // Expose Public Variables
    //------------------------------------------------------------

    // expose chart's sub-components
    chart.dispatch = dispatch;
    chart.stacked = stacked;
    chart.legend = legend;
    chart.controls = controls;
    chart.xAxis = xAxis;
    chart.yAxis = yAxis;
    chart.interactiveLayer = interactiveLayer;

    yAxis.setTickFormat = yAxis.tickFormat;

    chart.dispatch = dispatch;
    chart.options = nv.utils.optionsFunc.bind(chart);

    chart._options = Object.create({}, {
        // simple options, just get/set the necessary values
        width: {
            get: function () {
                return width;
            }, set: function (_) {
                width = _;
            }
        },
        height: {
            get: function () {
                return height;
            }, set: function (_) {
                height = _;
            }
        },
        showLegend: {
            get: function () {
                return showLegend;
            }, set: function (_) {
                showLegend = _;
            }
        },
        showXAxis: {
            get: function () {
                return showXAxis;
            }, set: function (_) {
                showXAxis = _;
            }
        },
        showYAxis: {
            get: function () {
                return showYAxis;
            }, set: function (_) {
                showYAxis = _;
            }
        },
        tooltips: {
            get: function () {
                return tooltips;
            }, set: function (_) {
                tooltips = _;
            }
        },
        tooltipContent: {
            get: function () {
                return tooltip;
            }, set: function (_) {
                tooltip = _;
            }
        },
        defaultState: {
            get: function () {
                return defaultState;
            }, set: function (_) {
                defaultState = _;
            }
        },
        noData: {
            get: function () {
                return noData;
            }, set: function (_) {
                noData = _;
            }
        },
        showControls: {
            get: function () {
                return showControls;
            }, set: function (_) {
                showControls = _;
            }
        },
        controlLabels: {
            get: function () {
                return controlLabels;
            }, set: function (_) {
                controlLabels = _;
            }
        },
        yAxisTickFormat: {
            get: function () {
                return yAxisTickFormat;
            }, set: function (_) {
                yAxisTickFormat = _;
            }
        },

        // options that require extra logic in the setter
        margin: {
            get: function () {
                return margin;
            }, set: function (_) {
                margin.top = _.top !== undefined ? _.top : margin.top;
                margin.right = _.right !== undefined ? _.right : margin.right;
                margin.bottom = _.bottom !== undefined ? _.bottom : margin.bottom;
                margin.left = _.left !== undefined ? _.left : margin.left;
            }
        },
        duration: {
            get: function () {
                return duration;
            }, set: function (_) {
                duration = _;
                renderWatch.reset(duration);
                stacked.duration(duration);
                xAxis.duration(duration);
                yAxis.duration(duration);
            }
        },
        color: {
            get: function () {
                return color;
            }, set: function (_) {
                color = nv.utils.getColor(_);
                legend.color(color);
                stacked.color(color);
            }
        },
        rightAlignYAxis: {
            get: function () {
                return rightAlignYAxis;
            }, set: function (_) {
                rightAlignYAxis = _;
                yAxis.orient(rightAlignYAxis ? 'right' : 'left');
            }
        },
        useInteractiveGuideline: {
            get: function () {
                return useInteractiveGuideline;
            }, set: function (_) {
                useInteractiveGuideline = !!_;
                if (_) {
                    chart.interactive(false);
                    chart.useVoronoi(false);
                }
            }
        }
    });

    nv.utils.inheritOptions(chart, stacked);
    nv.utils.initOptions(chart);

    return chart;
};