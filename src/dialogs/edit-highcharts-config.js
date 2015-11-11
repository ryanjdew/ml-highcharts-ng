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
    .controller('EditChartConfigCtrl', ['$modalInstance', '$scope', 'HighchartsHelper', 'facets', 'highchartConfig', 'MLSearchFactory', function($modalInstance, $scope, HighchartsHelper, facets, highchartConfig, searchFactory) {
      $scope.facetSortOptions = {};
      $scope.xSortOptions = {
        accept: function(sourceItemHandleScope, destSortableScope) {
          return destSortableScope.modelValue && destSortableScope.modelValue.length < 1;
        }
      };
      $scope.chartFacetOptions = Object.keys(facets);
      var facetName = $scope.chartFacetOptions[0];
      if (!highchartConfig) {
        $scope.chartFacetOptions.splice(0, 1);
      } else {
        $scope.chartFacetOptions.push('$frequency');
        $scope.chartFacetOptions = _.without($scope.chartFacetOptions,
          highchartConfig.seriesNameMLConstraint,
          highchartConfig.dataPointNameMLConstraint,
          highchartConfig.xAxisMLConstraint,
          highchartConfig.xAxisCategoriesMLConstraint,
          highchartConfig.yAxisMLConstraint,
          highchartConfig.zAxisMLConstraint);
      }
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
        seriesNameMLConstraint: null,
        dataPointNameMLConstraint: null,
        xAxisMLConstraint: facetName,
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
    function($modal) {
      return function(facets, highchartConfig) {
        return $modal.open({
          templateUrl: '/ml-highcharts/templates/ml-highchart-config-modal.html',
          controller: 'EditChartConfigCtrl',
          size: 'lg',
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
