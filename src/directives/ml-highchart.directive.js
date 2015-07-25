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
      'use strict';

      function link(scope, element, attrs) {
        scope.mlSearch = scope.mlSearch || searchFactory.newContext();
        var loadData = function() {
          if (scope.highchartConfig) {
            scope.populatedConfig = HighchartsHelper.chartFromConfig(scope.highchartConfig, scope.mlSearch, scope.callback);
          }
        };
        scope.$watchCollection('mlSearch.getQuery()', loadData);
      }
      
      return {
        restrict: 'E',
        templateUrl: '/ml-highcharts/templates/ml-highchart.html',
        scope: {
          'mlSearch': '=',
          'highchartConfig': '=',
          'callback': '&'
        },
        link: link
      };
    }]);
})();
