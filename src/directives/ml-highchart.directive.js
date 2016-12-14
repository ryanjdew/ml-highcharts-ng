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
    .filter('decodeString', function() {
      return function(input) {
        try {
          return decodeURIComponent(input);
        } catch (e) {
          return {};
        }
      };
    })
    .directive('mlHighchart', ['$q', '$timeout', 'HighchartsHelper', 'MLRest', 'MLSearchFactory', function($q, $timeout, HighchartsHelper, MLRest, searchFactory) {

      function link(scope, element, attrs) {
        if (!attrs.callback) {
          scope.callback = null;
        }
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
              $timeout(function() {
                scope.populatedConfig = populatedConfig;
              });
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

        var structuredQueryWatch = null;
        var mlSearchWatch = null;

        scope.$watch('highchartConfig', function(newVal, oldValue) {
          if (newVal && !angular.equals({}, newVal)) {
            if (attrs.structuredQuery && !structuredQueryWatch) {
              structuredQueryWatch = scope.$watch('structuredQuery', function(newVal) {
                if (newVal && !angular.equals({}, newVal)) {
                  loadData();
                }
              }, true);
            } else if (attrs.mlSearch && !mlSearchWatch) {
              mlSearchWatch = scope.$watch('mlSearch.results', function(newVal) {
                if (newVal && !angular.equals({}, newVal)) {
                  loadData();
                }
              }, true);
            } else if (oldValue || !(attrs.mlSearch || attrs.structuredQuery)) {
             loadData();
            }
          }
        }, true);

      }

      return {
        restrict: 'E',
        templateUrl: '/ml-highcharts/templates/ml-highchart.html',
        scope: {
          'mlSearch': '=?',
          'structuredQuery': '=?',
          'highchartConfig': '=',
          'callback': '&'
        },
        link: link
      };
    }]);
})();
