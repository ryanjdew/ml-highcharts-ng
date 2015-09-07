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
        if (scope.mlSearchController && !scope.mlSearch){
          scope.mlSearch = scope.mlSearchController.mlSearch;
          console.warn('Please link mlSearch in mlHighCharts directive');
        }
        if (!scope.mlSearch) {
          scope.mlSearch = searchFactory.newContext();
        }
        var loadData = function() {
          if (scope.highchartConfig) {
            scope.populatedConfig = HighchartsHelper.chartFromConfig(scope.highchartConfig, scope.mlSearch, scope.mlSearchController, scope.callback);
          }
        };
        var reloadChartsDecorator = function (fn) {
          return function () {
            var results = fn.apply(this, arguments);
            if (results && angular.isFunction(results.then)) {
              // Then this is promise
              return results.then(function(data){
                loadData();
                return data;
              });
            } else {
              loadData();
              return results;
            }
          };
        };

        if (!scope.mlSearchController){
          //link on search if controller is unavailable
          var origSearchFun = scope.mlSearch.search;
          scope.mlSearch.search = reloadChartsDecorator(origSearchFun);
          loadData();
        }
        else
        {
          //otherwise use the updateSearchResults since it contains facet results
          var origUpdateFun = scope.mlSearchController.updateSearchResults;
          scope.mlSearchController.updateSearchResults = reloadChartsDecorator(origUpdateFun);
          loadData();
        }

      }

      return {
        restrict: 'E',
        templateUrl: '/ml-highcharts/templates/ml-highchart.html',
        scope: {
          'mlSearch': '=',
          'mlSearchController': '=',
          'highchartConfig': '=',
          'callback': '&'
        },
        link: link
      };
    }]);
})();
