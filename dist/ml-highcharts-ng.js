(function () {
  'use strict';

  angular.module('ml.highcharts', ['highcharts-ng','ml.common','ml.highcharts.tpls','ml.search','ui.bootstrap']);

}());
(function() {
  'use strict';
  /**
   * @ngdoc controller
   * @kind constructor
   * @name EditChartConfigCtrl
   * @description
   * Controller for {@link editChartConfigDialog}. The controller is injected by the
   * $modal service. Provides a user interface for configuring a highchart.
   * See <a href="http://angular-ui.github.io/bootstrap/"
   * target="_blank">ui.bootstrap.modal</a> for more information.
   *
   * @param {ui.bootstrap.modal.$modalInstance} $modalInstance (injected)
   * @param {angular.Scope} $scope (injected)
   * @param {ml.highcharts.HighchartsHelper} HighchartsHelper (injected)
   * @param {object} facets object
   * @param {object} highchartConfig object
   * @param {ml.search.MLSearchFactory} MLSearchFactory (injected)
   *
   */

  angular.module('ml.highcharts')
  .controller('EditChartConfigCtrl', ['$modalInstance', '$scope', 'HighchartsHelper', 'facets', 'highchartConfig', 'MLSearchFactory', function ($modalInstance, $scope, HighchartsHelper, facets, highchartConfig, searchFactory) {
      $scope.facetSortOptions = {};
      $scope.xSortOptions = {
        accept: function (sourceItemHandleScope, destSortableScope) {
          return destSortableScope.modelValue.length < 1;
        }
      };
      $scope.chartFacetOptions = Object.keys(facets);
      var facetName = $scope.chartFacetOptions[0];
      $scope.chartFacetOptions.splice(0,1);
      $scope.facets = facets;
      $scope.highchartConfig = highchartConfig || {
        options: {
            //This is the Main Highcharts chart config. Any Highchart options are valid here.
            //will be overriden by values specified below.
            chart: {
                type: 'bar'
            },
            tooltip: {
                style: {
                    padding: 10,
                    fontWeight: 'bold'
                }
            }
        },
        title: {
          text: 'Title'
        },
        xAxis: {
          title: {text: facetName}
        },
        xAxisMLConstraint: facetName,
        xAxisCategoriesMLConstraint: null,
        yAxis: {
          title: {text: null}
        },
        yAxisMLConstraint: '$frequency',
        zAxis: {
          title: {text: null}
        },
        size: {
          height: 250
        },
        resultLimit: 15
      };

      if (!$scope.highchartConfig.xAxis) {
        $scope.highchartConfig.xAxis = {
          title: {text: null}
        };
      }
      if (!$scope.highchartConfig.yAxis) {
        $scope.highchartConfig.yAxis = {
          title: {text: null}
        };
      }

      $scope.xAxisMLConstraint = [$scope.highchartConfig.xAxisMLConstraint];
      $scope.xAxisCategoriesMLConstraint = [$scope.highchartConfig.xAxisCategoriesMLConstraint];
      $scope.yAxisMLConstraint = [$scope.highchartConfig.yAxisMLConstraint];

      var reloadSeriesData = function() {
        $scope.previewHighChart = HighchartsHelper.chartFromConfig($scope.highchartConfig);
      };

      $scope.chartTypes = HighchartsHelper.chartTypes();
      reloadSeriesData();

      $scope.$watch(function() { 
        return $scope.highchartConfig.options.chart.type + $scope.highchartConfig.xAxis.title.text + $scope.highchartConfig.yAxis.title.text + $scope.highchartConfig.title.text + $scope.highchartConfig.resultLimit;
      }, function() {
        reloadSeriesData();
      });
      
      $scope.$watch(function() { 
        return $scope.xAxisMLConstraint.length + '' + $scope.yAxisMLConstraint.length + '' + $scope.xAxisCategoriesMLConstraint.length;
      }, function() {
        $scope.highchartConfig.xAxisMLConstraint = $scope.xAxisMLConstraint[0];
        $scope.highchartConfig.yAxisMLConstraint = $scope.yAxisMLConstraint[0];
        $scope.highchartConfig.xAxisCategoriesMLConstraint = $scope.xAxisCategoriesMLConstraint[0];
        reloadSeriesData();
      });
      
      $scope.save = function () {
        $modalInstance.close($scope.highchartConfig);
      };
    }])

  /**
   * @ngdoc dialog
   * @name EditChartConfigDialog
   * @kind function
   * @description A UI Bootstrap component that provides a modal dialog for
   * adding/editing a highcart config to the application.
   */
  .factory('EditChartConfigDialog', [
    '$modal',
    function ($modal) {
      return function (facets, highchartConfig) {
        return $modal.open({
          templateUrl : '/ml-highcharts/templates/ml-highchart-config-modal.html',
          controller : 'EditChartConfigCtrl',
          size : 'lg',
          resolve: {
            facets: function() {
              return facets;
            },
            highchartConfig: function() {
              return highchartConfig;
            }
          }
        }).result;
      };
    }
  ]);
}());
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
        var loadData = function() {
          if (scope.highchartConfig) {
            scope.populatedConfig = HighchartsHelper.chartFromConfig(scope.highchartConfig, scope.mlSearch, scope.callback);
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

        var origSearchFun = scope.mlSearch.search;
        scope.mlSearch.search = reloadChartsDecorator(origSearchFun);
        loadData();
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

(function() {
  'use strict';

  angular.module('ml.highcharts')
    .factory('HighchartsHelper', ['$q', 'MLRest', 'MLSearchFactory', function($q, MLRest, MLSearchFactory) {
      var highchartsHelper = {};
      highchartsHelper.seriesData = function(data, chartType, categories) {
        var seriesData = [];
        if (categories.length) {
          var mappedXValues = {};
          angular.forEach(data, function(dp) {
            if (!mappedXValues[dp.x]) {
              mappedXValues[dp.x] = [];
            }
            var dpCategoryIndex = categories.indexOf(dp.xCategory);
            mappedXValues[dp.x][dpCategoryIndex] = [dp.xCategory, dp.y];
          });
          angular.forEach(mappedXValues, function(xVal, xValKey) {
            angular.forEach(categories, function(cat, index) {
              if (!xVal[index]) {
                xVal[index] = [cat, 0];
              }
            });
            seriesData.push({
              'type': chartType,
              'name': xValKey,
              'data': xVal
            });
          });
        } else if (chartType === 'pie') {
          seriesData = [{
            type: chartType,
            data: data
          }];
        } else {
          seriesData = _.map(data, function(dp) {
            return {
              type: chartType,
              name: dp.x,
              data: [dp.y]
            };
          });
        }
        return seriesData;
      };

      highchartsHelper.chartFromConfig = function(highchartConfig, mlSearch, callback) {
        var chartType = highchartConfig.options.chart.type;
        var chart = angular.copy(highchartConfig);
        if (!mlSearch) {
          mlSearch = MLSearchFactory.newContext();
        }
        mlSearch.getStoredOptions('all').then(function(data) {
          if (data.options && data.options.constraint) {
            var availableConstraints = _.filter(data.options.constraint, function(con) {
              var value = con.range || con.collection;
              return (value && value.facet);
            });
            highchartsHelper.getChartData(mlSearch, availableConstraints, highchartConfig, highchartConfig.resultLimit).then(function(values) {
              chart.series = highchartsHelper.seriesData(values.data, chartType, values.categories);
              if (values.categories && values.categories.length) {
                chart.xAxis.categories = values.categories;
              }
            });
          }
        });
        if (callback) {
          chart.options.plotOptions = {
            series: {
              cursor: 'pointer',
              point: {
                events: {
                  click: function() {
                    var value = this.name || this.series.name;
                    if (value.data.length === 1) {
                      callback({
                        facet: value.data[0].__key,
                        value: value
                      });
                    } else {
                      callback({
                        facet: this.series.name,
                        value: value
                      });
                    }
                  }
                }
              }
            }
          };
        }
        return chart;
      };

      highchartsHelper.getChartData = function(mlSearch, constraints, highchartConfig, limit) {
        var facetNames = [highchartConfig.xAxisCategoriesMLConstraint, highchartConfig.xAxisMLConstraint, highchartConfig.yAxisMLConstraint];
        var dataConfig = {
          xCategoryAxis: highchartConfig.xAxisCategoriesMLConstraint,
          xAxis: highchartConfig.xAxisMLConstraint,
          yAxis: highchartConfig.yAxisMLConstraint
        };

        var valueIndexes = [];

        if (highchartConfig.xAxisCategoriesMLConstraint === '$frequency') {
          dataConfig.frequecy = 'xCategory';
        } else if (highchartConfig.xAxisMLConstraint === '$frequency') {
          dataConfig.frequecy = 'x';
        } else if (highchartConfig.yAxisMLConstraint === '$frequency') {
          dataConfig.frequecy = 'y';
        }

        if (constraints && constraints.length) {
          var filteredConstraints = _.filter(constraints, function(constraint) {
            return constraint && constraint.name && facetNames.indexOf(constraint.name) > -1 && constraint.range;
          }).sort(function(a, b) {
            return facetNames.indexOf(a.name) - facetNames.indexOf(b.name);
          });
          var filteredConstraintRanges = _.map(filteredConstraints, function(constraint) {
            return constraint.range;
          });
          var filteredConstraintNames = _.map(filteredConstraints, function(constraint) {
            return constraint.name;
          });
          dataConfig.xCategoryAxisIndex = filteredConstraintNames.indexOf(dataConfig.xCategoryAxis);
          dataConfig.xAxisIndex = filteredConstraintNames.indexOf(dataConfig.xAxis);
          dataConfig.yAxisIndex = filteredConstraintNames.indexOf(dataConfig.yAxis);
          var tuples = [{
            'name': 'cooccurrence',
            'range': filteredConstraintRanges,
            'values-option': ['frequency-order', 'limit=' + ((limit) ? limit : '20')]
          }];
          var constaintOptions = {
            'search': {
              'options': {
                'constraint': constraints
              },
              'query': (mlSearch) ? mlSearch.getQuery().query : {
                'queries': []
              }
            }
          };
          if (filteredConstraints.length > 1) {
            constaintOptions.search.options.tuples = tuples;
          } else {
            constaintOptions.search.options.values = tuples;
          }
          return MLRest.values('cooccurrence', {
            format: 'json'
          }, constaintOptions).then(
            function(response) {
              var data = [];
              if (response.data['values-response']) {
                if (filteredConstraints.length > 1) {
                  angular.forEach(response.data['values-response'].tuple, function(tup) {
                    var vals = tup['distinct-value'];
                    var dataPoint = {
                      xCategory: vals[dataConfig.xCategoryAxisIndex] ? vals[dataConfig.xCategoryAxisIndex]._value : null,
                      x: vals[dataConfig.xAxisIndex] ? vals[dataConfig.xAxisIndex]._value : null,
                      y: vals[dataConfig.yAxisIndex] ? vals[dataConfig.yAxisIndex]._value : null
                    };
                    if (dataPoint.xCategory && valueIndexes.indexOf(dataPoint.xCategory) < 0) {
                      valueIndexes.push(dataPoint.xCategory);
                    }
                    dataPoint.name = dataPoint.xCategory || dataPoint.x || dataPoint.y;
                    dataPoint[dataConfig.frequecy] = tup.frequency;
                    data.push(dataPoint);
                  });
                } else {
                  angular.forEach(response.data['values-response']['distinct-value'], function(valueObj) {
                    var dataPoint = {
                      x: dataConfig.xAxisIndex > -1 ? valueObj._value : null,
                      y: dataConfig.yAxisIndex > -1 ? valueObj._value : null
                    };
                    dataPoint.name = dataPoint.x || dataPoint.y;
                    dataPoint[dataConfig.frequecy] = valueObj.frequency;
                    data.push(dataPoint);
                  });
                }
              }
              return {
                data: data,
                categories: valueIndexes
              };
            });
        } else {
          var d = $q.defer();
          d.resolve(null);
          return d.promise;
        }
      };

      highchartsHelper.chartTypes = function() {
        return [
          'line',
          'spline',
          'area',
          'areaspline',
          'column',
          'bar',
          'pie',
          'scatter'
        ];
      };

      return highchartsHelper;
    }]);
})();
