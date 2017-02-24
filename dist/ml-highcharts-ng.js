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
    .controller('EditChartConfigCtrl', [
      '$uibModalInstance', '$scope', '$timeout', 'HighchartsHelper', 
      'facets', 'highchartConfig', 'mlSearch', 
      function(
        $uibModalInstance, $scope, $timeout, HighchartsHelper, 
        facets, highchartConfig, mlSearch
      ) {
      $scope.axisTypes = ['linear', 'logarithmic', 'datetime', 'categories'];
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
          },
          type: 'linear'
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
          },
          type: 'linear'
        },
        yAxisMLConstraint: '$frequency',
        yAxisMLConstraintAggregate: null,
        zAxis: {
          title: {
            text: null
          },
          type: 'linear'
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
        if ($scope.highchartConfig.series) {
          $scope.highchartConfig.series.length = 0;
        }
        if ($scope.highchartConfig.xAxis.categories) {
          $scope.highchartConfig.xAxis.categories.length = 0;
          $scope.highchartConfig.xAxis.categories = undefined;
        }
        $scope.reset = true;
        $timeout(function() {
          $scope.reset = false;
          $scope.mlSearch.search();
        });
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

(function() {
  'use strict';

  angular.module('ml.highcharts')
    .factory('HighchartsHelper', [
      '$q', 'MLQueryBuilder', 'MLRest', 
      'MLSearchFactory', 
    function($q, MLQueryBuilder, MLRest, MLSearchFactory) {
      var highchartsHelper = {};
      var _storedOptionPromises = {};

      function getStoredOptions(mlSearch) {
        var queryOptions = mlSearch.options.queryOptions;
        if (!_storedOptionPromises[queryOptions]) {
          _storedOptionPromises[queryOptions] = mlSearch.getStoredOptions(queryOptions);
        }
        return _storedOptionPromises[queryOptions];
      }

      function parseDateInformation(dateStr) {
        var date;
        if (/^[1-9]+\/[1-9]+\/[0-9]{2,2}/.test(dateStr)) {
          var yearPart = parseInt(dateStr.replace(/^.*\/([0-9]{2,2})$/, '$1'), 10);
          var monthPart = parseInt(dateStr.replace(/^([0-9]{1,2})\/.*$/, '$1'), 10);
          date = new Date(Date.parse(dateStr));
          date.setFullYear((yearPart > 50 ? 1900 : 2000) + yearPart);
          date.setMonth(monthPart - 1);
        } else if (/^[1-9]+-[A-Za-z]/.test(dateStr)) {
          var year = 2000 + parseInt(dateStr.replace(/^([1-9]+)\-(.*)$/, '$1'), 10);
          date = new Date(Date.parse(dateStr));
          date.setFullYear(year);
        } else {
          date = new Date(Date.parse(dateStr));
        }
        return date;
      }

      highchartsHelper.seriesData = function(data, chartType, categories, yCategories, highchartConfig) {
        var seriesData = [];

        // Loop over all data points to push them into the correct series,
        // based on either seriesName, or using facetNames as default..
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
          if (!series) {
            series = {
              name: dp.facetNames.join(' - '),
              data: []
            };
            seriesData.push(series);
          }

          // Add data in order of categories in case xCategory is filled..
          if (dp.xCategory) {
            var catIndex = categories.indexOf(dp.xCategory);
            series.data[catIndex] = dp;
          } else {
            series.data.push(dp);
          }
        });

        angular.forEach(seriesData, function(series) {
          // If categories, use catIndex for x and/or y..
          if ((categories && categories.length) || (yCategories && yCategories.length)) {
            angular.forEach(series.data, function(dp) {
              if (dp.xCategory && dp.x === undefined) {
                dp.x = categories.indexOf(dp.xCategory);
              }
              if (dp.yCategory && dp.y === undefined) {
                dp.y = yCategories.indexOf(dp.yCategory);
              }
            });

            // Make sure series data ordered by categories has no gaps..
            angular.forEach(categories, function(cat, catIndex) {
              if (!series.data[catIndex]) {
                series.data[catIndex] = {};
              }
            });
          }
          series.data.sort(function(a, b) { return b.x - a.x; });
        });
        return seriesData;
      };

      highchartsHelper.chartFromConfig = function(highchartConfig, mlSearch, callback) {
        var d = $q.defer();
        var chartType = highchartConfig.options.chart.type;
        var chart = angular.copy(highchartConfig);
        if (!mlSearch) {
          mlSearch = MLSearchFactory.newContext();
        }
        if (callback) {
          var plotOptions = {
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
          if (chart.options.plotOptions) {
            angular.merge(chart.options.plotOptions, plotOptions);
          } else {
            chart.options.plotOptions = plotOptions;
          }
        }
        getStoredOptions(mlSearch).then(function(data) {
          if (data.options && data.options.constraint && data.options.constraint.length) {
            highchartsHelper.getChartData(mlSearch, data.options.constraint, highchartConfig, highchartConfig.resultLimit).then(function(values) {
              chart.series = highchartsHelper.seriesData(values.data, chartType, values.categories, values.yCategories, highchartConfig);

              // Apply xAxis categories
              if (values.categories && values.categories.length) {
                chart.xAxis.type = 'category';
                chart.xAxis.categories = values.categories;

                // prevent unnecessary (numeric) axis values to be shown before/after the categories
                chart.xAxis.min = 0;
                chart.xAxis.max = chart.xAxis.categories.length - 1;

                if (chart.options.chart.type === 'bubble') {
                  // Add two extra empty-string categories for extra padding left and right..
                  // Seems clumsy, but simplest way to avoid numbers being shown left and right..
                  chart.xAxis.categories.unshift('');
                  chart.xAxis.categories.push('');
                  chart.xAxis.max = chart.xAxis.max + 2;
                  angular.forEach(chart.series, function(series) {
                    angular.forEach(series.data, function(dp) {
                      if (dp.xCategory) {
                        dp.x = dp.x + 1;
                      }
                    });
                  });
                }
              }

              // Apply yAxis categories
              if (values.yCategories && values.yCategories.length) {
                chart.yAxis.type = 'category';
                chart.yAxis.categories = values.yCategories;

                if (chart.options.chart.type === 'bubble') {
                  // Add two extra empty-string categories for extra padding left and right..
                  // Seems clumsy, but simplest way to avoid numbers being shown left and right..
                  chart.yAxis.categories.unshift('');
                  chart.yAxis.categories.push('');
                  angular.forEach(chart.series, function(series) {
                    angular.forEach(series.data, function(dp) {
                      if (dp.yCategory) {
                        dp.y = dp.y + 1;
                      }
                    });
                  });
                }
              }

              // Hide legend if only one series (consumes unnecessary space), unless specified explicitly
              chart.legend = chart.legend || {};
              chart.legend.enabled = chart.legend.enabled !== undefined ? chart.legend.enabled : (chart.series.length > 1);
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
          yCategoryAxis: highchartConfig.yAxisCategoriesMLConstraint,
          yAxis: highchartConfig.yAxisMLConstraint,
          zAxis: highchartConfig.zAxisMLConstraint,
          seriesName: highchartConfig.seriesNameMLConstraint,
          dataPointName: highchartConfig.dataPointNameMLConstraint,
          xCategoryAxisAggregate: highchartConfig.xAxisCategoriesMLConstraintAggregate,
          xAxisAggregate: highchartConfig.xAxisMLConstraintAggregate,
          yCategoryAxisAggregate: highchartConfig.yAxisCategoriesMLConstraintAggregate,
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
        } else if (highchartConfig.yAxisCategoriesMLConstraint === '$frequency') {
          dataConfig.frequency = 'yCategory';
        } else if (highchartConfig.yAxisMLConstraint === '$frequency') {
          dataConfig.frequency = 'y';
        } else if (highchartConfig.zAxisMLConstraint === '$frequency') {
          dataConfig.frequency = 'z';
        }

        dataConfig.facets = {
          xCategoryAxisIndex: filteredFacetNames.indexOf(dataConfig.xCategoryAxis),
          xAxisIndex: filteredFacetNames.indexOf(dataConfig.xAxis),
          yCategoryAxisIndex: filteredFacetNames.indexOf(dataConfig.yCategoryAxis),
          yAxisIndex: filteredFacetNames.indexOf(dataConfig.yAxis),
          zAxisIndex: filteredFacetNames.indexOf(dataConfig.zAxis),
          seriesNameIndex: filteredFacetNames.indexOf(dataConfig.seriesName),
          dataPointNameIndex: filteredFacetNames.indexOf(dataConfig.dataPointName)
        };

        dataConfig.values = {
          xCategoryAxisIndex: filteredValueNames.indexOf(dataConfig.xCategoryAxis),
          xAxisIndex: filteredValueNames.indexOf(dataConfig.xAxis),
          yCategoryAxisIndex: filteredValueNames.indexOf(dataConfig.yCategoryAxis),
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
        var qtext = mlSearch && mlSearch.getText();
        var constraintOptions = {
          'search': {
            'options': {
              'constraint': constraints
            },
            'query': query,
            'qtext': qtext || ''
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
            highchartConfig.yAxisCategoriesMLConstraint, highchartConfig.yAxisMLConstraint,
            highchartConfig.zAxisMLConstraint
          ], null, undefined, '$frequency');

        var xAxisIsDateTime = highchartConfig.xAxis && highchartConfig.xAxis.type === 'datetime';
        var yAxisIsDateTime = highchartConfig.yAxis && highchartConfig.yAxis.type === 'datetime';
        var zAxisIsDateTime = highchartConfig.zAxis && highchartConfig.zAxis.type === 'datetime';

        var valueIndexes = [];
        var yValueIndexes = [];
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

            var getValue = function(item, isDateTime) {
              var val = (item) ? item._value : undefined;
              return (isDateTime && val) ? parseDateInformation(val) : val;
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
                              seriesName: 
                                getValue(
                                  _.without([
                                    vals[dataConfig.values.seriesNameIndex], 
                                    facetCombination[dataConfig.facets.seriesNameIndex]
                                  ], null, undefined)[0]),
                              name: 
                                getValue(
                                  _.without([
                                    vals[dataConfig.values.dataPointNameIndex], facetCombination[dataConfig.facets.dataPointNameIndex]
                                  ], null, undefined)[0]),
                              xCategory: 
                                getValue(
                                  _.without([
                                    vals[dataConfig.values.xCategoryAxisIndex], facetCombination[dataConfig.facets.xCategoryAxisIndex]
                                  ], null, undefined)[0]),
                              x: 
                                getValue(
                                  _.without([
                                    vals[dataConfig.values.xAxisIndex], 
                                    facetCombination[dataConfig.facets.xAxisIndex]
                                  ], null, undefined)[0], xAxisIsDateTime),
                              yCategory: 
                                getValue(
                                  _.without([
                                    vals[dataConfig.values.yCategoryAxisIndex], 
                                    facetCombination[dataConfig.facets.yCategoryAxisIndex]
                                  ], null, undefined)[0]),
                              y: 
                                getValue(
                                  _.without([
                                    vals[dataConfig.values.yAxisIndex], 
                                    facetCombination[dataConfig.facets.yAxisIndex]
                                  ], null, undefined)[0], yAxisIsDateTime),
                              z: 
                                getValue(
                                  _.without([
                                    vals[dataConfig.values.zAxisIndex], 
                                    facetCombination[dataConfig.facets.zAxisIndex]
                                  ], null, undefined)[0], zAxisIsDateTime)
                            };
                            if (dataPoint.xCategory && valueIndexes.indexOf(dataPoint.xCategory) < 0) {
                              valueIndexes.push(dataPoint.xCategory);
                            }
                            if (dataPoint.yCategory && yValueIndexes.indexOf(dataPoint.yCategory) < 0) {
                              yValueIndexes.push(dataPoint.yCategory);
                            }
                            if (!dataPoint.name) {
                              dataPoint.name = _.without([dataPoint.seriesName, dataPoint.xCategory, dataPoint.x, dataPoint.yCategory, dataPoint.y, dataPoint.z], null, undefined).join();
                            }
                            dataPoint[dataConfig.frequency] = tup.frequency;
                            dataPoint.frequency = tup.frequency;
                            facetData.push(dataPoint);
                          });
                        } else {
                          angular.forEach(results['values-response']['distinct-value'], function(valueObj) {
                            var dataPoint = {
                              facetNames: facetNames,
                              seriesName: 
                                getValue(
                                  _.without([
                                    (dataConfig.values.seriesNameIndex > -1) ? valueObj : null, 
                                    facetCombination[dataConfig.facets.seriesNameIndex]
                                  ], null, undefined)[0]),
                              name: 
                                getValue(
                                  _.without([
                                    (dataConfig.values.dataPointNameIndex > -1) ? valueObj : null, 
                                    facetCombination[dataConfig.facets.dataPointNameIndex]
                                  ], null, undefined)[0]),
                              xCategory: 
                                getValue(
                                  _.without([
                                    (dataConfig.values.xCategoryAxisIndex > -1) ? valueObj : null, 
                                    facetCombination[dataConfig.facets.xCategoryAxisIndex]
                                  ], null, undefined)[0]),
                              x: 
                                getValue(
                                  _.without([
                                    (dataConfig.values.xAxisIndex > -1) ? valueObj : null, 
                                    facetCombination[dataConfig.facets.xAxisIndex]
                                  ], null, undefined)[0], xAxisIsDateTime),
                              yCategory: 
                                getValue(
                                  _.without([
                                    (dataConfig.values.yCategoryAxisIndex > -1) ? valueObj : null, 
                                    facetCombination[dataConfig.facets.yCategoryAxisIndex]
                                  ], null, undefined)[0]),
                              y: 
                                getValue(
                                  _.without([
                                    (dataConfig.values.yAxisIndex > -1) ? valueObj : null, 
                                    facetCombination[dataConfig.facets.yAxisIndex]
                                  ], null, undefined)[0], yAxisIsDateTime),
                              z: 
                                getValue(
                                  _.without([
                                    (dataConfig.values.zAxisIndex > -1) ? valueObj : null, 
                                    facetCombination[dataConfig.facets.zAxisIndex]
                                  ], null, undefined)[0], zAxisIsDateTime)
                            };
                            if (dataPoint.xCategory && valueIndexes.indexOf(dataPoint.xCategory) < 0) {
                              valueIndexes.push(dataPoint.xCategory);
                            }
                            if (dataPoint.yCategory && yValueIndexes.indexOf(dataPoint.yCategory) < 0) {
                              yValueIndexes.push(dataPoint.yCategory);
                            }
                            if (!dataPoint.name) {
                              dataPoint.name = 
                                _.without([
                                  dataPoint.xCategory, dataPoint.x, dataPoint.yCategory, dataPoint.y, dataPoint.z
                                ], null, undefined).join();
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
                    categories: valueIndexes,
                    yCategories: yValueIndexes
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
                  x: getValue(facetCombination[dataConfig.facets.xAxisIndex], xAxisIsDateTime),
                  yCategory: getValue(facetCombination[dataConfig.facets.yCategoryAxisIndex]),
                  y: getValue(facetCombination[dataConfig.facets.yAxisIndex], yAxisIsDateTime),
                  z: getValue(facetCombination[dataConfig.facets.zAxisIndex], zAxisIsDateTime)
                };
                if (dataPoint.xCategory && valueIndexes.indexOf(dataPoint.xCategory) < 0) {
                  valueIndexes.push(dataPoint.xCategory);
                }
                if (dataPoint.yCategory && yValueIndexes.indexOf(dataPoint.yCategory) < 0) {
                  yValueIndexes.push(dataPoint.yCategory);
                }
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

      highchartsHelper.constraintValueCall = function(
          mlSearch, constraints, constraintsFromValues, 
          limit, combinationQuery, aggregate
      ) {
        var constraintOptions = 
          getSearchConstraintOptions(
            mlSearch, constraints, constraintsFromValues, 
            limit, combinationQuery
          );
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
