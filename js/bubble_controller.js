var bubbleController = angular.module('bubbleController', ['utils']);

bubbleController.controller('BubbleCtrl', [
    '$scope', '$utils', function ($scope, $utils) {

        $scope.chart = null;

        $scope.local = 'en';
        $scope.geoCat = 'country';
        $scope.xAxis = 'gdp_per_cap';
        $scope.yAxis = 'lex';
        $scope.colors = {
            _default: '#ffb600',
            world: '#ffb600',
            eur: '#FFE700',
            afr: '#00D5E9',
            asi: '#FF5872',
            ame: '#7FEB00'
        };
        $scope.params =[
            {
                label: 'TIME',
                value: 'time'
            },
            {
                label: 'GEO',
                value: 'geo'
            },
            {
                label: 'GEO_PER_CAP',
                value: 'gdp_per_cap'
            },
            {
                label: 'LEX',
                value: 'lex'
            },
            {
                label: 'POP',
                value: 'pop'
            },
            {
                label: 'GEO.REGION',
                value: 'geo.region'
            },
            {
                label: 'GEO.CATEGORY',
                value: 'geo.cat'
            },

        ];
        $scope.names = [];
        $scope.basicIndicators = [];
        $scope.time = 2012;
        $scope.timeMin = 1990;
        $scope.timeMax = 2014;

        $scope.showPause = false;
        $scope.x = $scope.xAxis;
        $scope.y = $scope.yAxis;

        $scope.chartData = function() {
            var returns = [];

            angular.forEach($scope.names, function(name, key) {
                var data = {
                    key: name['geo.name'],
                    values: []
                }

                angular.forEach($scope.basicIndicators, function(v, k) {
                    if (v['geo'] == name['geo'] && v['time'] == $scope.time && v['gdp_per_cap'] && v['lex'] && v['pop']) {

                        data.values.push({
                            color: $scope.colors[name['geo.region']] ? $scope.colors[name['geo.region']] : $scope.colors['_default'],
                            label: name['geo.name'],
                            x: Math.round(v[$scope.xAxis]),
                            y: Math.round(v[$scope.yAxis]),
                            shape: 'circle',
                            size: Math.round(v['pop'])
                        });
                    }
                });

                if (data.values.length > 0) {
                    returns.push(data);
                }
            });

            return returns;
        };

        $scope.init = function() {
            d3.json('data/' + $scope.local + '/names.json', function(error, names) {
                if (names.length > 0) {
                    $scope.names = $utils.getNames(names, $scope.geoCat);
                    d3.json('data/' + $scope.local + '/basic-indicators.json', function(error, basicIndicators) {
                        if (basicIndicators.length > 0) {
                            $scope.basicIndicators = $utils.getBasicIndicators(basicIndicators);

                            nv.addGraph(function() {
                                $scope.chart = nv.models.scatterChart()
                                    .height(500)
                                    .width(500)
                                    .showLegend(false)
                                    .forceY([30, 40, 50, 60, 70, 80])
                                    .forceX([250, 4000, 64000])
                                    .showDistX(true)
                                    .showDistY(true)
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
