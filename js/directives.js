angular.module('chartsDirectives', ['utils'])
    .directive('input', [
        function () {
            return {
                restrict: 'E',
                link: function ($scope, element, attr) {
                    if (attr.type !== 'range') return;
                    element.attr('min', $scope.timeMin);
                    element.attr('max', $scope.timeMax);
                    element.on('change', function() {
                        $scope.changeTime();
                    });
                }
            }
        }
    ])
    .directive('play', [
        '$utils', function ($utils) {
            var link;
            link = function($scope, element) {
                element.on('click', function() {
                    $scope.time = $scope.timeMin;
                    $scope.changeTime();
                    $scope.playGraph();
                });

                $scope.playGraph = function() {
                    var timeArr = $utils.getTimeArr($scope.basicIndicators);
                    if ($scope.time == timeArr[timeArr.length - 1]) {
                        $scope.$apply(function () {
                            $scope.showPause = false;
                        });
                    }
                    else {
                        $scope.$apply(function () {
                            $scope.showPause = true;
                        });
                    }

                    $scope.changeTime();

                    for (var i = 0; i < timeArr.length; i ++) {
                        if (timeArr[i + 1] > $scope.time) {
                            $scope.$apply(function () {
                                $scope.time = timeArr[i + 1];
                            });
                            setTimeout(function(){
                                $scope.playGraph();
                            }, 90);
                            break;
                        }
                    }
                }
            };
            return {
                replace: true,
                restrict: 'EA',
                link: link
            }
        }
    ])
    .directive('customSelect', [
        function () {
            return {
                restrict: 'EA',
                link: function ($scope, element) {
                    element.styler({
                        selectSearch: false,
                        selectSmartPositioning: false
                    });
                    setTimeout(function() {
                        element.trigger('refresh');
                    }, 1);

                    element.on('change', function() {
                        var axis = element.data('axis');
                        if (axis == 'x') {
                            $scope.setXAxis();
                        }
                        if (axis == 'y') {
                            $scope.setYAxis();
                        }
                    });

                    $scope.setXAxis = function() {
                        $scope.xAxis = $scope.x;
                        if ($scope.chart !== null) {
                            $scope.redraw();
                        }
                    };

                    $scope.setYAxis = function() {
                        $scope.yAxis = $scope.y;
                        if ($scope.chart !== null) {
                            $scope.redraw();
                        }
                    };
                }
            }
        }
    ])
;