angular.module('utils', [])
    .factory('$utils', [function() {
        return {
            getNames: function(input, condition) {
                var output = [];
                angular.forEach(input, function(data, key) {
                    angular.forEach(data, function(d, k) {
                        if (d['geo.cat'][0] == condition) {
                            output.push(d);
                        }
                    });
                });

                return output;
            },
            getBasicIndicators: function(input) {
                var output = [];
                angular.forEach(input, function(data, key) {
                    angular.forEach(data, function(d, k) {
                        output.push(d);
                    });
                });

                return output;
            },
            getMax: function(arr){
                return Math.max.apply(Math, arr);
            },
            getMin: function(arr){
                return Math.min.apply(Math, arr);
            },
            getTimeArr: function(input) {
                var output = [];
                angular.forEach(input, function(data, key) {
                    if (angular.element.inArray(data['time'], output) == -1) {
                        output.push(data['time']);
                    }
                });

                /*$scope.timeMax = $scope.getMax(output);

                $scope.timeMin = $scope.getMin(output);

                $scope.time = $scope.timeMax;*/

                return output.sort();
            },
            /*playGraph: function($scope) {
                var self = this;
                var timeArr = self.getTimeArr($scope.basicIndicators);
                if ($scope.time == timeArr[timeArr.length - 1]) {
                    $scope.showPause = false;
                }
                else {
                    $scope.showPause = true;
                }

                $scope.changeTime();

                for (var i = 0; i < timeArr.length; i ++) {
                    if (timeArr[i + 1] > $scope.time) {
                        $scope.time = timeArr[i + 1];
                        setTimeout(function(){
                            self.playGraph($scope);
                        }, 90);
                        break;
                    }
                }
            }*/
        };
    }]
);