var lineController = angular.module('lineController', ['utils']);

lineController.controller('LineCtrl', [
    '$scope', '$utils', function ($scope, $utils) {

        $scope.chart = null;

        $scope.local = 'en';
        $scope.geoCat = 'region';
        $scope.colors = {
            _default: '#ffb600',
            world: '#ffb600',
            eur: '#FFE700',
            afr: '#00D5E9',
            asi: '#FF5872',
            ame: '#7FEB00'
        };
        $scope.names = [];
        $scope.basicIndicators = [];
        $scope.time = 2014;
        $scope.timeMin = 1990;
        $scope.timeMax = 2014;

        $scope.chartData = function() {
            var result = [];
            angular.forEach($scope.names, function(name, key) {
                var data = {
                    key: name['geo.name'],
                    color: $scope.colors[name['geo']] ? $scope.colors[name['geo']] : $scope.colors['_default'],
                    label: name['geo.name'],
                    values: []
                }

                angular.forEach($scope.basicIndicators, function(v, k) {
                    if (v['geo'] == name['geo'] && v['time'] <= $scope.time) {

                        data.values.push({
                            x: v['time'],
                            y: v['gdp_per_cap']
                        });
                    }
                });

                result.push(data);
            });

            return result;
        };

        $scope.init = function() {
            d3.json('data/' + $scope.local + '/names.json', function (error, names) {
                if (names.length > 0) {
                    $scope.names = $utils.getNames(names, $scope.geoCat);
                    d3.json('data/' + $scope.local + '/basic-indicators.json', function (error, basicIndicators) {
                        if (basicIndicators.length > 0) {
                            $scope.basicIndicators = $utils.getBasicIndicators(basicIndicators);

                            nv.addGraph(function () {
                                $scope.chart = nv.models.vizabiLineChart()
                                    .options({
                                        transitionDuration: 300
                                        //useInteractiveGuideline: true
                                    })
                                ;
                                // chart sub-models (ie. xAxis, yAxis, etc) when accessed directly, return themselves, not the parent chart, so need to chain separately
                                $scope.chart.xAxis
                                    //.axisLabel("Time (s)")
                                    //.tickFormat(d3.format('.1f'))
                                    .staggerLabels(false)
                                ;
                                $scope.chart.forceX([1990, 2000, 2012]);
                                $scope.chart.yAxis
                                    //.axisLabel('Voltage (v)')
                                    .tickFormat(d3.format('d'))
                                ;
                                d3.select('#chart svg')
                                    .datum($scope.chartData())
                                    .call($scope.chart);

                                nv.utils.windowResize($scope.chart.update);

                                return $scope.chart;
                            });
                        }
                    });
                }
            });
        };

        $scope.init();

        $scope.changeTime = function() {
            if ($scope.chart !== null) {
                $scope.redraw();
            }
        };

        $scope.redraw = function() {
            d3.select('#chart svg')
                .datum($scope.chartData())
                .transition()
                .duration(0)
                .call($scope.chart);
        };
    }
]);
