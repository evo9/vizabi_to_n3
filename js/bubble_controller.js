var bubbleController = angular.module('bubbleController', ['utils']);

bubbleController.controller('BubbleCtrl', [
    '$scope', '$utils', function ($scope, $utils) {

        $scope.chart = null;

        $scope.local = 'en';
        $scope.geoCat = 'country';
        $scope.names = [];
        $scope.basicIndicators = [];
        $scope.time = 2014;
        $scope.timeMin = 1990;
        $scope.timeMax = 2014;

        $scope.randomData = function(groups, points) {
            var data = [],
                shapes = ['circle'],
                random = d3.random.normal();
            for (i = 0; i < groups; i++) {
                data.push({
                    key: 'Group ' + i,
                    values: []
                });
                for (j = 0; j < points; j++) {
                    data[i].values.push({
                        x: random(),
                        y: random(),
                        size: Math.round(Math.random() * 100) / 100,
                        shape: 'circle'
                    });
                }
            }
            return data;
        };

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
                            //color: $scope.colors[name['geo']] ? $scope.colors[name['geo']] : $scope.colors['_default'],
                            label: name['geo.name'],
                            x: v['gdp_per_cap']/100,
                            y: v['lex'],
                            shape: 'circle',
                            size: v['pop']/100000
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
    }
]);
