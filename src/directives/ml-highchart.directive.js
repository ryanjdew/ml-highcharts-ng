(function() {

  'use strict';

  /**
   * angular element directive; a highchart based off of MarkLogic values result.
   *
   * attributes:
   *
   * - `highchart-config`: a reference to the model with chart config information
   * - `ml-search`: optional. An mlSearch context to filter query.
   * - `callback`: optional. A function reference to callback when a chart item is selected
   *
   * Example:
   *
   * ```
   * <ml-highchart highchart-config="model.highChartConfig" ml-search="mlSearch"></ml-highchart>```
   *
   * @namespace ml-highchart
   */
  angular.module('ml.highcharts')
    .directive('mlHighchart', ['$q', 'HighchartsHelper', 'MLRest', 'MLSearchFactory', function($q, HighchartsHelper, MLRest, searchFactory) {

      function link(scope, element, attrs) {
  
        if (!scope.mlSearch) {
          scope.mlSearch = searchFactory.newContext();
        }

        var mlSearch = scope.mlSearch;

        if (scope.structuredQuery) {
          mlSearch = searchFactory.newContext();
          mlSearch.addAdditionalQuery(scope.structuredQuery);
        }
        
        var loadData = function() {
          if (scope.highchartConfig) {
            HighchartsHelper.chartFromConfig(
              scope.highchartConfig, mlSearch,
              scope.callback).then(function(populatedConfig) {
              scope.populatedConfig = populatedConfig;
            });
          }
        };
        var reloadChartsDecorator = function(fn) {
          return function() {
            var results = fn.apply(this, arguments);
            if (results && angular.isFunction(results.then)) {
              // Then this is promise
              return results.then(function(data) {
                loadData();
                return data;
              });
            } else {
              loadData();
              return results;
            }
          };
        };

        var origSearchFun = mlSearch.search;
        mlSearch.search = reloadChartsDecorator(origSearchFun);

        loadData();

        scope.$watch('structuredQuery', function() {
          loadData();
        });
          
      }

      return {
        restrict: 'E',
        templateUrl: '/ml-highcharts/templates/ml-highchart.html',
        scope: {
          'mlSearch': '=',
          'structuredQuery': '=',
          'highchartConfig': '=',
          'callback': '&'
        },
        link: link
      };
    }]);
})();
