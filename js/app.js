var modules = [
    'ngRoute',
    'chartsDirectives',
    'barController',
    'bubbleController',
    'lineController'
];

var chartsApp = angular.module('charts', modules);

chartsApp.config(['$routeProvider',
    function($routeProvider) {
        $routeProvider.
            when('/bar', {
                templateUrl: 'templates/bar.html',
                controller: 'BarCtrl'
            }).
            when('/bubble', {
                templateUrl: 'templates/bubble.html',
                controller: 'BubbleCtrl'
            }).
            when('/line', {
                templateUrl: 'templates/line.html',
                controller: 'LineCtrl'
            }).
            otherwise({
                redirectTo: '/bar'
            });
    }
]);
