(function() {
  'use strict';

  angular.module('app', ['ml.search','ml.highcharts']).controller('HighchartsCtrl', HighchartsCtrl);

  HighchartsCtrl.$inject = ['$scope', '$location', 'MLSearchFactory', 'HighchartsHelper'];

  function HighchartsCtrl($scope, $location, searchFactory, HighchartsHelper) {
    var ctrl = this;
    ctrl.mlSearch = searchFactory.newContext();
    ctrl.highchartConfig = {
      'options': {
        'chart': {
          'type': 'bar'
        },
        'tooltip': {
          'style': {
            'padding': 10,
            'fontWeight': 'bold'
          }
        }
      },
      'title': {
        'text': 'Title'
      },
      'xAxis': {
        'title': {
          'text': 'Ingredients'
        }
      },
      // constraint name for x axis
      'xAxisMLConstraint': 'Ingredients',
      // optional constraint name for categorizing x axis values
      'xAxisCategoriesMLConstraint': 'Category',
      'yAxis': {
        'title': {
          'text': 'Frequency'
        }
      },
      // constraint name for y axis ($frequency is special value for value/tuple frequency)
      'yAxisMLConstraint': '$frequency',
      'zAxis': {
        'title': {
          'text': null
        }
      },
      'size': {
        'height': 250,
        'width': 300
      },
      // limit of returned results
      'resultLimit': 15
    };
  }
})();
