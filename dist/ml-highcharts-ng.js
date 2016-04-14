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
   * $uibModal service. Provides a user interface for configuring a highchart.
   * See <a href="http://angular-ui.github.io/bootstrap/"
   * target="_blank">ui.bootstrap.modal</a> for more information.
   *
   * @param {ui.bootstrap.modal.$uibModalInstance} $uibModalInstance (injected)
   * @param {angular.Scope} $scope (injected)
   * @param {ml.highcharts.HighchartsHelper} HighchartsHelper (injected)
   * @param {object} facets object
   * @param {object} highchartConfig object
   * @param {ml.search.MLSearchFactory} MLSearchFactory (injected)
   *
   */

  angular.module('ml.highcharts')
    .controller('EditChartConfigCtrl', ['$uibModalInstance', '$scope', 'HighchartsHelper', 'facets', 'highchartConfig', 'mlSearch', function($uibModalInstance, $scope, HighchartsHelper, facets, highchartConfig, mlSearch) {
      $scope.facetSortOptions = {
        clone: true,
        accept: function(sourceItemHandleScope, destSortableScope) {
          return true;
        },
        allowDuplicates: false
      };
      $scope.xSortOptions = {
        accept: function(sourceItemHandleScope, destSortableScope) {
          return destSortableScope.modelValue && destSortableScope.modelValue.length < 1;
        }
      };
      $scope.mlSearch = mlSearch;
      $scope.chartFacetOptions = Object.keys(facets);
      var facetName = $scope.chartFacetOptions[0];
      $scope.chartFacetOptions.push('$frequency');
      $scope.aggregateTypes = HighchartsHelper.aggregateTypes();
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
          title: {
            text: facetName
          }
        },
        seriesNameMLConstraint: facetName,
        dataPointNameMLConstraint: null,
        xAxisMLConstraint: null,
        xAxisMLConstraintAggregate: null,
        xAxisCategoriesMLConstraint: null,
        xAxisCategoriesMLConstraintAggregate: null,
        yAxis: {
          title: {
            text: null
          }
        },
        yAxisMLConstraint: '$frequency',
        yAxisMLConstraintAggregate: null,
        zAxis: {
          title: {
            text: null
          }
        },
        zAxisMLConstraint: null,
        zAxisMLConstraintAggregate: null,
        size: {
          height: 250
        },
        resultLimit: 15
      };

      if (!$scope.highchartConfig.xAxis) {
        $scope.highchartConfig.xAxis = {
          title: {
            text: null
          }
        };
      }
      if (!$scope.highchartConfig.yAxis) {
        $scope.highchartConfig.yAxis = {
          title: {
            text: null
          }
        };
      }

      $scope.dataPointNameMLConstraint = _.without([$scope.highchartConfig.dataPointNameMLConstraint], null, undefined);
      $scope.seriesNameMLConstraint = _.without([$scope.highchartConfig.seriesNameMLConstraint], null, undefined);
      $scope.xAxisMLConstraint = _.without([$scope.highchartConfig.xAxisMLConstraint], null, undefined);
      $scope.xAxisCategoriesMLConstraint = _.without([$scope.highchartConfig.xAxisCategoriesMLConstraint], null, undefined);
      $scope.yAxisMLConstraint = _.without([$scope.highchartConfig.yAxisMLConstraint], null, undefined);
      $scope.zAxisMLConstraint = _.without([$scope.highchartConfig.zAxisMLConstraint], null, undefined);

      var reloadSeriesData = function() {
        $scope.mlSearch.search();
      };

      $scope.chartTypes = HighchartsHelper.chartTypes();
      reloadSeriesData();

      $scope.$watch(function() {
        return $scope.highchartConfig.options.chart.type + $scope.highchartConfig.xAxis.title.text + $scope.highchartConfig.yAxis.title.text + $scope.highchartConfig.title.text + $scope.highchartConfig.resultLimit;
      }, function() {
        reloadSeriesData();
      });

      $scope.$watch(function() {
        return $scope.xAxisMLConstraint.length + '' + $scope.yAxisMLConstraint.length +
          '' + $scope.zAxisMLConstraint.length + '' + $scope.xAxisCategoriesMLConstraint.length +
          '' + $scope.seriesNameMLConstraint.length + '' + $scope.dataPointNameMLConstraint.length +
          '' + $scope.highchartConfig.xAxisMLConstraintAggregate + '' + $scope.highchartConfig.yAxisMLConstraintAggregate +
          '' + $scope.highchartConfig.zAxisMLConstraintAggregate;
      }, function() {
        $scope.highchartConfig.seriesNameMLConstraint = $scope.seriesNameMLConstraint[0];
        $scope.highchartConfig.dataPointNameMLConstraint = $scope.dataPointNameMLConstraint[0];
        $scope.highchartConfig.xAxisMLConstraint = $scope.xAxisMLConstraint[0];
        $scope.highchartConfig.yAxisMLConstraint = $scope.yAxisMLConstraint[0];
        $scope.highchartConfig.zAxisMLConstraint = $scope.zAxisMLConstraint[0];
        $scope.highchartConfig.xAxisCategoriesMLConstraint = $scope.xAxisCategoriesMLConstraint[0];
        reloadSeriesData();
      });

      $scope.save = function() {
        $uibModalInstance.close($scope.highchartConfig);
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
    '$uibModal', 'MLSearchFactory',
    function($uibModal, searchFactory) {
      return function(facets, highchartConfig, optionsName) {
        return $uibModal.open({
          templateUrl: '/ml-highcharts/templates/ml-highchart-config-modal.html',
          controller: 'EditChartConfigCtrl',
          size: 'lg',
          resolve: {
            facets: function() {
              return facets;
            },
            highchartConfig: function() {
              return highchartConfig;
            },
            mlSearch: function() {
              return searchFactory.newContext({ 'queryOptions': optionsName || 'all'});
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

(function() {
  'use strict';

  angular.module('ml.highcharts')
    .factory('HighchartsHelper', ['$q', 'MLQueryBuilder', 'MLRest', 'MLSearchFactory', function($q, MLQueryBuilder, MLRest, MLSearchFactory) {
      var highchartsHelper = {};
      highchartsHelper.seriesData = function(data, chartType, categories) {
        var seriesData = [{
          name: null,
          data: []
        }];
        angular.forEach(data, function(dp) {
          var series;
          if (dp.seriesName) {
            series = _.filter(seriesData, function(s) {
              return s.name === dp.seriesName;
            })[0];
            if (!series) {
              series = {
                name: dp.seriesName,
                data: []
              };
              seriesData.push(series);
            }
          } else {
            series = seriesData[0];
          }
          if (categories.length) {
            angular.forEach(categories, function(cat, catIndex) {
              if (cat === dp.xCategory) {
                series = _.filter(seriesData, function(value) {
                  var seriesMatches = true;
                  if (dp.seriesName) {
                    seriesMatches = value.name === dp.seriesName;
                  }
                  return !value.data[catIndex] && seriesMatches;
                })[0];
                if (!series) {
                  series = {
                    name: dp.seriesName,
                    data: []
                  };
                  seriesData.push(series);
                }
                series.data[catIndex] = dp;
              }
            });
          } else {
            series.data.push(dp);
          }
        });
        if (categories.length) {
          angular.forEach(seriesData, function(series) {
            angular.forEach(categories, function(cat, catIndex) {
              if (!series.data[catIndex]) {
                series.data[catIndex] = {
                  name: null,
                  x: 0,
                  y: 0,
                  z: 0
                };
              }
            });
          });
        }
        return _.filter(seriesData, function(val) {
          return val.name || (val.data && val.data.length);
        });
      };

      highchartsHelper.chartFromConfig = function(highchartConfig, mlSearch, callback) {
        var d = $q.defer();
        var chartType = highchartConfig.options.chart.type;
        var chart = angular.copy(highchartConfig);
        if (!mlSearch) {
          mlSearch = MLSearchFactory.newContext();
        }
        if (callback) {
          chart.options.plotOptions = {
            series: {
              cursor: 'pointer',
              point: {
                events: {
                  click: function() {
                    var value = this.name || this.seriesName;
                    callback(angular.extend({
                      facet: this.facetNames[0],
                      value: value
                    }, this));
                  }
                }
              }
            }
          };
        }
        mlSearch.getStoredOptions(mlSearch.options.queryOptions).then(function(data) {
          if (data.options && data.options.constraint && data.options.constraint.length) {
            highchartsHelper.getChartData(mlSearch, data.options.constraint, highchartConfig, highchartConfig.resultLimit).then(function(values) {
              chart.series = highchartsHelper.seriesData(values.data, chartType, values.categories);
              if (values.categories && values.categories.length) {
                chart.xAxis.categories = values.categories;
              }
              d.resolve(chart);
            });
          }
        });
        return d.promise;
      };

      function getDataConfig(highchartConfig, filteredFacetNames, filteredValueNames) {
        var dataConfig = {
          xCategoryAxis: highchartConfig.xAxisCategoriesMLConstraint,
          xAxis: highchartConfig.xAxisMLConstraint,
          yAxis: highchartConfig.yAxisMLConstraint,
          zAxis: highchartConfig.zAxisMLConstraint,
          seriesName: highchartConfig.seriesNameMLConstraint,
          dataPointName: highchartConfig.dataPointNameMLConstraint,
          xCategoryAxisAggregate: highchartConfig.xAxisCategoriesMLConstraintAggregate,
          xAxisAggregate: highchartConfig.xAxisMLConstraintAggregate,
          yAxisAggregate: highchartConfig.yAxisMLConstraintAggregate,
          zAxisAggregate: highchartConfig.zAxisMLConstraintAggregate
        };

        dataConfig.aggregates = {};

        angular.forEach(dataConfig, function(constraintName, key) {
          if (constraintName && dataConfig[key + 'Aggregate']) {
            if (!dataConfig.aggregates[constraintName]) {
              dataConfig.aggregates[constraintName] = [];
            }
            dataConfig.aggregates[constraintName].push({
              type: dataConfig[key + 'Aggregate'],
              axis: key.substring(0, key.indexOf('Axis'))
            });
          }
        });

        var aggregateIndexes = _.map(dataConfig.aggregates, function(value, constraintName) {
          return constraintName;
        });

        filteredValueNames = _.filter(filteredValueNames, function(name) {
          return aggregateIndexes.indexOf(name) < 0;
        });


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
          zAxisIndex: filteredFacetNames.indexOf(dataConfig.zAxis),
          seriesNameIndex: filteredFacetNames.indexOf(dataConfig.seriesName),
          dataPointNameIndex: filteredFacetNames.indexOf(dataConfig.dataPointName)
        };

        dataConfig.values = {
          xCategoryAxisIndex: filteredValueNames.indexOf(dataConfig.xCategoryAxis),
          xAxisIndex: filteredValueNames.indexOf(dataConfig.xAxis),
          yAxisIndex: filteredValueNames.indexOf(dataConfig.yAxis),
          zAxisIndex: filteredValueNames.indexOf(dataConfig.zAxis),
          seriesNameIndex: filteredValueNames.indexOf(dataConfig.seriesName),
          dataPointNameIndex: filteredValueNames.indexOf(dataConfig.dataPointName)
        };

        return dataConfig;
      }

      function getConstraintsOnChart(constraints, facetNames) {
        return _.filter(constraints, function(constraint) {
          return constraint && constraint.name && facetNames.indexOf(constraint.name) > -1;
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
        var query = (mlSearch) ? angular.copy(mlSearch.getQuery().query) : {
          queries: []
        };
        if (additionalQuery && additionalQuery.length) {
          query.queries.unshift.apply(query.queries, additionalQuery);
        }
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
        } else if (filteredConstraints.length === 1) {
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
              'frequency': facetVal.frequency || facetVal.count,
              'query': {
                qtext: '"' + arr[0].name + '":"' + facetVal.name + '"'
              }
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
                  'query': constraintQuery(arr[0].name, arr[0].facetValues[j].name)
                },
                allCasesOfRest[i]
              ]));
            }
          }
          return result;
        }
      }

      function constraintQuery(name, value) {
        return {
          qtext: '"' + name + '":"' + value + '"'
        };
      }

      highchartsHelper.getChartData = function(mlSearch, constraints, highchartConfig, limit) {
        var facetNames = _.without(
          [highchartConfig.seriesNameMLConstraint, highchartConfig.dataPointNameMLConstraint,
            highchartConfig.xAxisCategoriesMLConstraint, highchartConfig.xAxisMLConstraint,
            highchartConfig.yAxisMLConstraint, highchartConfig.zAxisMLConstraint
          ], null, undefined, '$frequency');

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

            var valueConstraintNames = _.map(constraintsFromValues, function(c) {
              return c.name;
            });
            var facetConstraintNames = _.map(constraintsFromFacets, function(c) {
              return c.name;
            });
            var dataConfig = getDataConfig(highchartConfig, facetConstraintNames, valueConstraintNames);

            var getValue = function(item) {
              return (item) ? item._value : undefined;
            };

            var facetCombinations;
            if (constraintsFromFacets.length > 0) {
              facetCombinations = allPossibleCases(constraintsFromFacets);
            } else {
              facetCombinations = [
                []
              ];
            }

            if (constraintsFromValues.length > 0) {
              var promises = [];
              var valueFields = _.filter(constraintsFromValues, function(c) {
                return !dataConfig.aggregates[c.name];
              });
              var valueAggregates = _.filter(constraintsFromValues, function(c) {
                return dataConfig.aggregates[c.name];
              });
              angular.forEach(facetCombinations, function(facetCombination) {
                var combinationQuery = _.map(facetCombination, function(f) {
                  return f.query;
                });
                if (valueFields.length > 0) {
                  promises.push(
                    highchartsHelper.constraintValueCall(
                      mlSearch, constraints, valueFields,
                      limit, combinationQuery)
                    .then(function(results) {
                      if (results['values-response']) {
                        if (valueFields.length > 1) {
                          angular.forEach(results['values-response'].tuple, function(tup) {
                            var vals = tup['distinct-value'];
                            var dataPoint = {
                              facetNames: facetNames,
                              seriesName: getValue(_.without([vals[dataConfig.values.seriesNameIndex], facetCombination[dataConfig.facets.seriesNameIndex]], null, undefined)[0]),
                              name: getValue(_.without([vals[dataConfig.values.dataPointNameIndex], facetCombination[dataConfig.facets.dataPointNameIndex]], null, undefined)[0]),
                              xCategory: getValue(_.without([vals[dataConfig.values.xCategoryAxisIndex], facetCombination[dataConfig.facets.xCategoryAxisIndex]], null, undefined)[0]),
                              x: getValue(_.without([vals[dataConfig.values.xAxisIndex], facetCombination[dataConfig.facets.xAxisIndex]], null, undefined)[0]),
                              y: getValue(_.without([vals[dataConfig.values.yAxisIndex], facetCombination[dataConfig.facets.yAxisIndex]], null, undefined)[0]),
                              z: getValue(_.without([vals[dataConfig.values.zAxisIndex], facetCombination[dataConfig.facets.zAxisIndex]], null, undefined)[0])
                            };
                            if (dataPoint.xCategory && valueIndexes.indexOf(dataPoint.xCategory) < 0) {
                              valueIndexes.push(dataPoint.xCategory);
                            }
                            if (!dataPoint.name) {
                              dataPoint.name = _.without([dataPoint.seriesName, dataPoint.xCategory, dataPoint.x, dataPoint.y, dataPoint.z], null, undefined).join();
                            }
                            dataPoint[dataConfig.frequency] = tup.frequency;
                            dataPoint.frequency = tup.frequency;
                            facetData.push(dataPoint);
                          });
                        } else {
                          angular.forEach(results['values-response']['distinct-value'], function(valueObj) {
                            var dataPoint = {
                              facetNames: facetNames,
                              seriesName: getValue(_.without([(dataConfig.values.seriesNameIndex > -1) ? valueObj : null, facetCombination[dataConfig.facets.seriesNameIndex]], null, undefined)[0]),
                              name: getValue(_.without([(dataConfig.values.dataPointNameIndex > -1) ? valueObj : null, facetCombination[dataConfig.facets.dataPointNameIndex]], null, undefined)[0]),
                              xCategory: getValue(_.without([(dataConfig.values.xCategoryAxisIndex > -1) ? valueObj : null, facetCombination[dataConfig.facets.xCategoryAxisIndex]], null, undefined)[0]),
                              x: getValue(_.without([(dataConfig.values.xAxisIndex > -1) ? valueObj : null, facetCombination[dataConfig.facets.xAxisIndex]], null, undefined)[0]),
                              y: getValue(_.without([(dataConfig.values.yAxisIndex > -1) ? valueObj : null, facetCombination[dataConfig.facets.yAxisIndex]], null, undefined)[0]),
                              z: getValue(_.without([(dataConfig.values.zAxisIndex > -1) ? valueObj : null, facetCombination[dataConfig.facets.zAxisIndex]], null, undefined)[0])
                            };
                            if (dataPoint.xCategory && valueIndexes.indexOf(dataPoint.xCategory) < 0) {
                              valueIndexes.push(dataPoint.xCategory);
                            }
                            if (!dataPoint.name) {
                              dataPoint.name = _.without([dataPoint.xCategory, dataPoint.x, dataPoint.y, dataPoint.z], null, undefined).join();
                            }
                            dataPoint[dataConfig.frequency] = valueObj.frequency;
                            dataPoint.frequency = valueObj.frequency;
                            facetData.push(dataPoint);
                          });
                        }
                      }
                    })
                  );
                }
              });
              return $q.all(promises).then(function() {
                var aggregatePromises = [];
                angular.forEach(valueAggregates, function(aggregatedConstraint) {
                  angular.forEach(dataConfig.aggregates[aggregatedConstraint.name], function(aggregateInfo) {
                    angular.forEach(facetData, function(dataPoint) {
                      var aggQueries = _.without(_.map(dataPoint, function(dpValue, key) {
                        var dataConfigInfo = dataConfig[key + 'Axis'];
                        if (key === 'name') {
                          dataConfigInfo = dataConfig.dataPointName;
                        } else if (key === 'seriesName') {
                          dataConfigInfo = dataConfig.seriesName;
                        }
                        if (dpValue && dataConfigInfo && dataConfigInfo !== '$frequency') {
                          return constraintQuery(dataConfigInfo, dpValue);
                        } else {
                          return null;
                        }
                      }), null, undefined);
                      aggregatePromises.push(
                        highchartsHelper.constraintValueCall(
                          mlSearch, constraints, [aggregatedConstraint],
                          limit, aggQueries, aggregateInfo.type)
                        .then(function(results) {
                          dataPoint[aggregateInfo.axis] = Number(results['values-response']['aggregate-result'][0]._value);
                        })
                      );
                    });
                  });
                });
                return $q.all(aggregatePromises).then(function() {
                  return {
                    data: facetData.sort(function(a, b) {
                      return b.frequency - a.frequency;
                    }),
                    categories: valueIndexes
                  };
                });
              });
            } else {
              var facetPromises = [];
              //handle by getting facets
              angular.forEach(facetCombinations, function(facetCombination, facetIndex) {
                var dataPoint = {
                  facetNames: facetNames,
                  seriesName: getValue(facetCombination[dataConfig.facets.seriesNameIndex]),
                  name: getValue(facetCombination[dataConfig.facets.dataPointNameIndex]),
                  xCategory: getValue(facetCombination[dataConfig.facets.xCategoryAxisIndex]),
                  x: getValue(facetCombination[dataConfig.facets.xAxisIndex]),
                  y: getValue(facetCombination[dataConfig.facets.yAxisIndex]),
                  z: getValue(facetCombination[dataConfig.facets.zAxisIndex])
                };
                if (constraintsFromFacets.length === 1) {
                  dataPoint.frequency = facetCombination[0].frequency || facetCombination[0].count;
                  dataPoint[dataConfig.frequency] = dataPoint.frequency;
                } else {
                  var combinationQuery = _.map(facetCombination, function(f) {
                    return f.query;
                  });
                  var queryOptions = getSearchConstraintOptions(mlSearch, constraints, [], limit, combinationQuery);
                  queryOptions.search.options['return-results'] = false;
                  queryOptions.search.options['return-facets'] = false;
                  queryOptions.search.options['return-values'] = false;
                  queryOptions.search.options['return-metrics'] = true;
                  facetPromises.push(
                    MLRest.search({options: mlSearch.options.queryOptions }, queryOptions).then(function(response) {
                      var frequency = response.data.total;
                      dataPoint.frequency = frequency;
                      dataPoint[dataConfig.frequency] = frequency;
                    })
                  );
                }
                facetData.push(dataPoint);
              });
              return $q.all(facetPromises).then(function() {
                return {
                  data: facetData.sort(function(a, b) {
                    return b.frequency - a.frequency;
                  }),
                  categories: valueIndexes
                };
              });
            }
          }
        });
      };

      highchartsHelper.constraintValueCall = function(mlSearch, constraints, constraintsFromValues, limit, combinationQuery, aggregate) {
        var constraintOptions = getSearchConstraintOptions(mlSearch, constraints, constraintsFromValues, limit, combinationQuery);
        return MLRest.values('cooccurrence', {
            format: 'json',
            aggregate: aggregate,
            view: aggregate ? 'aggregate' : 'all'
          }, constraintOptions)
          .then(function(response) {
            return response.data;
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

      highchartsHelper.aggregateTypes = function() {
        return [
          null,
          'sum',
          'avg',
          'min',
          'max',
          'median',
          'count',
          'stddev',
          'stddev-population',
          'correlation',
          'covariance',
          'covariance-population',
          'variance',
          'variance-population'
        ];
      };

      return highchartsHelper;
    }]);
})();
