var barController = angular.module('barController', ['utils']);

barController.controller('BarCtrl', [
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
                    values: []
                }

                angular.forEach($scope.basicIndicators, function(v, k) {
                    if (v['geo'] == name['geo'] && v['time'] == $scope.time) {

                        data.values.push({
                            color: $scope.colors[name['geo']] ? $scope.colors[name['geo']] : $scope.colors['_default'],
                            label: name['geo.name'],
                            value: Math.round(v['lex'])
                        });
                    }
                });

                result.push(data);
            });

            return result;
        };

        $scope.init = function() {
            d3.json('data/' + $scope.local + '/names.json', function(error, names) {
                if (names.length > 0) {
                    $scope.names = $utils.getNames(names, $scope.geoCat);
                    d3.json('data/' + $scope.local + '/basic-indicators.json', function(error, basicIndicators) {
                        if (basicIndicators.length > 0) {
                            $scope.basicIndicators = $utils.getBasicIndicators(basicIndicators);

                            nv.addGraph(function() {
                                $scope.chart = nv.models.vizabiBarChart()
                                    .width(500)
                                    .x(function(d) { return d.label })
                                    .y(function(d) { return d.value })
                                    .staggerLabels(false)
                                    .showValues(false)
                                    .forceY([55, 60, 65, 70, 75, 80, 85])
                                ;

                                $scope.chart.yAxis.tickFormat(d3.format('d'));

                                var svg = d3.select('#chart svg').datum($scope.chartData());
                                svg.transition().duration(0).call($scope.chart);

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
