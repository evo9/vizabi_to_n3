var bubbleController = angular.module('bubbleController', ['utils']);

bubbleController.controller('BubbleCtrl', [
    '$scope', '$utils', function ($scope, $utils) {

        $scope.chart = null;

        $scope.local = 'en';
        $scope.geoCat = 'country';
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
                            x: v['gdp_per_cap'],
                            y: v['lex'],
                            shape: 'circle',
                            size: v['pop']
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
                                $scope.chart = nv.models.vizabiBubbleChart()
                                    .showLegend(false)
                                    /*.showDistX(true)
                                    .showDistY(true)
                                    .useVoronoi(true)
                                    .color(d3.scale.category10().range())
                                    .duration(300)*/
                                ;
                                /*$scope.chart.dispatch.on('renderEnd', function(){
                                    console.log('render complete');
                                });
                                $scope.chart.xAxis.tickFormat(d3.format('.02f'));
                                $scope.chart.yAxis.tickFormat(d3.format('.02f'));*/
                                d3.select('#chart svg')
                                    .datum($scope.chartData())
                                    .call($scope.chart);
                                nv.utils.windowResize($scope.chart.update);
                                //$scope.chart.dispatch.on('stateChange', function(e) { ('New State:', JSON.stringify(e)); });
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
