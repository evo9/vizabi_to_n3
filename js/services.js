var chartsServices = angular.module('chartsServices', ['ngResource']);

chartsServices.factory('Data', ['$resource',
    function($resource) {
        return {
            names: $resource('data/:local/names.json', {}, {
                query: {
                    method: 'GET',
                    isArray: true
                }
            }),
            basicIndicators: $resource('data/:local/basic-indicators.json', {}, {
                query: {
                    method: 'GET',
                    isArray: true
                }
            }),
            multiDimensional: $resource('data/:local/multi-dimensional.json', {}, {
                query: {
                    method: 'GET',
                    isArray: true
                }
            }),
            companies: $resource('data/:local/companies.json', {}, {
                query: {
                    method: 'GET',
                    isArray: true
                }
            }),
            populationByAge: $resource('data/:local/population-by-age.json', {}, {
                query: {
                    method: 'GET',
                    isArray: true
                }
            })
        };
    }
]);