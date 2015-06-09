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
                    if (this.time == timeArr[timeArr.length - 1]) {
                        this.showPause = false;
                    }
                    else {
                        this.showPause = true;
                    }

                    $scope.changeTime();

                    for (var i = 0; i < timeArr.length; i ++) {
                        if (timeArr[i + 1] > this.time) {
                            this.time = timeArr[i + 1];
                            setTimeout(function(){
                                $scope.playGraph();
                            }, 90);
                            break;
                        }
                    }
                    return this;
                }
            };
            return {
                replace: true,
                restrict: 'EA',
                $scope: {
                    time: '=',
                    showPause: '='
                },
                link: link
            }
        }
    ]);