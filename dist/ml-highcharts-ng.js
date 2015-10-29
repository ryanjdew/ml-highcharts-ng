(function () {
  'use strict';

  angular.module('ml.highcharts', ['highcharts-ng','ml.common','ml.highcharts.tpls','ml.search','ui.bootstrap']);

}());
(function() {
  'use strict';

  angular.module('ml.highcharts')
    .factory('HighchartsHelper', ['$q', 'MLQueryBuilder', 'MLRest', 'MLSearchFactory', function($q, MLQueryBuilder, MLRest, MLSearchFactory) {
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
            mappedXValues[dp.x][dpCategoryIndex] = [
              dp.xCategory,
              dp.y,
              dp.z
            ];
          });
          angular.forEach(mappedXValues, function(xVal, xValKey) {
            angular.forEach(categories, function(cat, index) {
              if (!xVal[index]) {
                xVal[index] = [
                  cat,
                  0,
                  0
                ];
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
        } else if (chartType === 'bubble') {
          seriesData = _.map(data, function(dp) {
            return {
              type: chartType,
              name: dp.name,
              data: [{
                x: dp.x,
                y: dp.y,
                z: dp.z
              }]
            };
          });
        } else {
          seriesData = _.map(data, function(dp) {
            return {
              type: chartType,
              name: dp.x,
              data: [dp.y, dp.z]
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

      function getDataConfig(highchartConfig, filteredFacetNames, filteredValueNames) {
        var dataConfig = {
          xCategoryAxis: highchartConfig.xAxisCategoriesMLConstraint,
          xAxis: highchartConfig.xAxisMLConstraint,
          yAxis: highchartConfig.yAxisMLConstraint,
          zAxis: highchartConfig.zAxisMLConstraint
        };

        if (highchartConfig.xAxisCategoriesMLConstraint === '$frequency') {
          dataConfig.frequency = 'xCategory';
        } else if (highchartConfig.xAxisMLConstraint === '$frequency') {
          dataConfig.frequency = 'x';
        } else if (highchartConfig.yAxisMLConstraint === '$frequency') {
          dataConfig.frequency = 'y';
        } else if (highchartConfig.zAxisMLConstraint === '$frequency') {
          dataConfig.frequency = 'z';
        }

        dataConfig.facets = {
          xCategoryAxisIndex: filteredFacetNames.indexOf(dataConfig.xCategoryAxis),
          xAxisIndex: filteredFacetNames.indexOf(dataConfig.xAxis),
          yAxisIndex: filteredFacetNames.indexOf(dataConfig.yAxis),
          zAxisIndex: filteredFacetNames.indexOf(dataConfig.zAxis)
        };

        dataConfig.values = {
          xCategoryAxisIndex: filteredValueNames.indexOf(dataConfig.xCategoryAxis),
          xAxisIndex: filteredValueNames.indexOf(dataConfig.xAxis),
          yAxisIndex: filteredValueNames.indexOf(dataConfig.yAxis),
          zAxisIndex: filteredValueNames.indexOf(dataConfig.zAxis)
        };

        return dataConfig;
      }

      function getConstraintsOnChart(constraints, facetNames) {
        return _.filter(constraints, function(constraint) {
          return constraint && constraint.name && facetNames.indexOf(constraint.name) > -1 && constraint.range;
        }).sort(function(a, b) {
          // ensure collections are on top
          var aCollectionFactor = (!a.collection) ? 100 : 1;
          var bCollectionFactor = (!b.collection) ? 100 : 1;
          return (facetNames.indexOf(a.name) * aCollectionFactor) - (facetNames.indexOf(b.name) * bCollectionFactor);
        });
      }

      function getSearchConstraintOptions(mlSearch, constraints, filteredConstraints, limit, additionalQuery) {
        var filteredConstraintRanges = _.map(filteredConstraints, function(constraint) {
          return constraint.range;
        });
        var filteredConstraintCollections = _.map(filteredConstraints, function(constraint) {
          return constraint.collection;
        });
        var tuples = [{
          'name': 'cooccurrence',
          'collection': _.without(filteredConstraintCollections, null, undefined),
          'range': _.without(filteredConstraintRanges, null, undefined),
          'values-option': ['frequency-order', 'limit=' + ((limit) ? limit : '20')]
        }];
        var query = (mlSearch) ? angular.copy(mlSearch.getQuery().query) : { queries: []};
        query.queries.unshift.apply(query.queries, additionalQuery);
        var constraintOptions = {
          'search': {
            'options': {
              'constraint': constraints
            },
            'query': query
          }
        };
        if (filteredConstraints.length > 1) {
          constraintOptions.search.options.tuples = tuples;
        } else {
          constraintOptions.search.options.values = tuples;
        }
        return constraintOptions;
      }

      // kudos to http://stackoverflow.com/questions/4331092/finding-all-combinations-of-javascript-array-values
      function allPossibleCases(arr) {
        if (arr.length === 1) {
          return _.map(arr[0].facetValues, function(facetVal) {
            return [{
              'facetName': arr[0].name,
              'type': arr[0].type,
              '_value': facetVal.value,
              'frequecy': facetVal.frequency,
              'query': { qtext: '"' + arr[0].name + '":"' + facetVal.name + '"' }
            }];
          });
        } else {
          var result = [];
          var allCasesOfRest = allPossibleCases(arr.slice(1)); // recur with the rest of array
          for (var i = 0; i < allCasesOfRest.length; i++) {
            for (var j = 0; j < arr[0].facetValues.length; j++) {
              result.push(_.flatten([{
                  'facetName': arr[0].name,
                  'type': arr[0].type,
                  '_value': arr[0].facetValues[j].value,
                  'frequecy': arr[0].facetValues[j].frequency,
                  'query': { qtext: '"' + arr[0].name + '":"' + arr[0].facetValues[j].name + '"' }
                },
                allCasesOfRest[i]
              ]));
            }
          }
          return result;
        }
      }

      highchartsHelper.getChartData = function(mlSearch, constraints, highchartConfig, limit) {
        var facetNames = _.without([highchartConfig.xAxisCategoriesMLConstraint, highchartConfig.xAxisMLConstraint, highchartConfig.yAxisMLConstraint, highchartConfig.zAxisMLConstraint], null, undefined);

        var valueIndexes = [];
        var facetData = [];
        var facetsPromise;
        if (mlSearch.results.facets) {
          var facets = angular.copy(mlSearch.results.facets);
          angular.forEach(facets, function(val, key) {
            val.name = key;
          });
          facetsPromise = $q.when(facets);
        } else {
          facetsPromise = MLRest.search({
            options: mlSearch.options.queryOptions
          })
          .then(function(response) {
            angular.forEach(response.data.facets, function(val, key) {
              val.name = key;
            });
            return response.data.facets;
          });
        }
        return facetsPromise.then(function(facets) {
          if (constraints && constraints.length) {
            var filteredConstraints = getConstraintsOnChart(constraints, facetNames);

            var constraintsFromFacets = [];
            var constraintsFromValues = [];

            angular.forEach(filteredConstraints, function(constraint) {
              if (constraint.custom || (constraint.range && (constraint.range.bucket || constraint.range['computed-bucket']))) {
                constraintsFromFacets.push(facets[constraint.name]);
              } else {
                constraintsFromValues.push(constraint);
              }
            });

            var valueConstraintNames = _.map(constraintsFromValues, function(c) { return c.name; });
            var facetConstraintNames = _.map(constraintsFromFacets, function(c) { return c.name; });
            var dataConfig = getDataConfig(highchartConfig, facetConstraintNames, valueConstraintNames);

            var getValue = function(item) {
              return (item) ? item._value : null;
            };

            var facetCombinations;
            if (constraintsFromFacets.length > 0) {
              facetCombinations = allPossibleCases(constraintsFromFacets);
            } else {
              facetCombinations = [[{
                'query': {
                  'and-query': {
                    'queries': []
                  }
                }
              }]];
            }

            if (constraintsFromValues.length > 0) {
              var promises = [];
              angular.forEach(facetCombinations, function(facetCombination) {
                var combinationQuery = _.map(facetCombination, function(f) {
                  return f.query;
                });
                var constraintOptions = getSearchConstraintOptions(mlSearch, constraints, constraintsFromValues, limit, combinationQuery);
                promises.push(MLRest.values('cooccurrence', {
                  format: 'json'
                }, constraintOptions).then(
                  function(response) {
                    if (response.data['values-response']) {
                      if (constraintsFromValues.length > 1) {
                        angular.forEach(response.data['values-response'].tuple, function(tup) {
                          var vals = tup['distinct-value'];
                          var dataPoint = {
                            xCategory: getValue(_.without([vals[dataConfig.values.xCategoryAxisIndex], facetCombination[dataConfig.facets.xCategoryAxisIndex]], null, undefined)[0]),
                            x: getValue(_.without([vals[dataConfig.values.xAxisIndex], facetCombination[dataConfig.facets.xAxisIndex]], null, undefined)[0]),
                            y: getValue(_.without([vals[dataConfig.values.yAxisIndex], facetCombination[dataConfig.facets.yAxisIndex]], null, undefined)[0]),
                            z: getValue(_.without([vals[dataConfig.values.zAxisIndex], facetCombination[dataConfig.facets.zAxisIndex]], null, undefined)[0])
                          };
                          if (dataPoint.xCategory && valueIndexes.indexOf(dataPoint.xCategory) < 0) {
                            valueIndexes.push(dataPoint.xCategory);
                          }
                          dataPoint.name = _.without([dataPoint.xCategory, dataPoint.x, dataPoint.y, dataPoint.z], null, undefined).join();
                          dataPoint[dataConfig.frequency] = tup.frequency;
                          dataPoint.frequency = tup.frequency;
                          facetData.push(dataPoint);
                        });
                      } else {
                        angular.forEach(response.data['values-response']['distinct-value'], function(valueObj) {
                          var dataPoint = {
                            xCategory: getValue(_.without([(dataConfig.values.xCategoryAxisIndex > -1) ? valueObj : null, facetCombination[dataConfig.facets.xCategoryAxisIndex]], null, undefined)[0]),
                            x: getValue(_.without([(dataConfig.values.xAxisIndex > -1) ? valueObj : null, facetCombination[dataConfig.facets.xAxisIndex]], null, undefined)[0]),
                            y: getValue(_.without([(dataConfig.values.yAxisIndex > -1) ? valueObj : null, facetCombination[dataConfig.facets.yAxisIndex]], null, undefined)[0]),
                            z: getValue(_.without([(dataConfig.values.zAxisIndex > -1) ? valueObj : null, facetCombination[dataConfig.facets.zAxisIndex]], null, undefined)[0])
                          };
                          if (dataPoint.xCategory && valueIndexes.indexOf(dataPoint.xCategory) < 0) {
                            valueIndexes.push(dataPoint.xCategory);
                          }
                          dataPoint.name = _.without([dataPoint.xCategory, dataPoint.x, dataPoint.y, dataPoint.z], null, undefined).join();
                          dataPoint[dataConfig.frequency] = valueObj.frequency;
                          dataPoint.frequency = valueObj.frequency;
                          facetData.push(dataPoint);
                        });
                      }
                    }
                  }));
              });
              return $q.all(promises).then(function() {
                return {
                  data: facetData.sort(function(a, b) {
                    return b.frequency - a.frequency;
                  }),
                  categories: valueIndexes
                };
              });
            } else if (constraintsFromFacets.length === 1) {
              //handle by getting facets
              angular.forEach(facetCombinations, function(facetCombination) {
                var dataPoint = {
                  xCategory: getValue(_.without([facetCombination[dataConfig.facets.xCategoryAxisIndex]], null, undefined)),
                  x: getValue(_.without([facetCombination[dataConfig.facets.xAxisIndex]], null, undefined)),
                  y: getValue(_.without([facetCombination[dataConfig.facets.yAxisIndex]], null, undefined)),
                  z: getValue(_.without([facetCombination[dataConfig.facets.zAxisIndex]], null, undefined)),
                  frequency: facetCombination[0].frequency
                };
                dataPoint[dataConfig.frequency] = facetCombination[0].frequency;
                facetData.push(dataPoint);
              });
            } else {
              console.log('TODO: mulitple bucket facets without values');
            }
          }
          return {
            data: facetData.sort(function(a, b) {
              return b.frequency - a.frequency;
            }),
            categories: valueIndexes
          };
        });
      };

      highchartsHelper.chartTypes = function() {
        return [
          'line',
          'spline',
          'area',
          'areaspline',
          'column',
          'bar',
          'bubble',
          'pie',
          'scatter'
        ];
      };

      return highchartsHelper;
    }]);
})();

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
        zAxisMLConstraint: null,
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

      $scope.xAxisMLConstraint = _.without([$scope.highchartConfig.xAxisMLConstraint], null, undefined);
      $scope.xAxisCategoriesMLConstraint = _.without([$scope.highchartConfig.xAxisCategoriesMLConstraint], null, undefined);
      $scope.yAxisMLConstraint = _.without([$scope.highchartConfig.yAxisMLConstraint], null, undefined);
      $scope.zAxisMLConstraint = _.without([$scope.highchartConfig.zAxisMLConstraint], null, undefined);

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
        $scope.highchartConfig.zAxisMLConstraint = $scope.zAxisMLConstraint[0];
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
