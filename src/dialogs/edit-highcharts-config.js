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
