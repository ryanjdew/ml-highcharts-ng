(function() {
  'use strict';

  angular.module('app', ['ml.highcharts']).controller('HighchartsCtrl', HighchartsCtrl);

  HighchartsCtrl.$inject = ['$scope', '$location', 'HighchartsHelper'];

  function HighchartsCtrl($scope, $location, HighchartsHelper) {
    var ctrl = this;
  }
})();