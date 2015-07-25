/* global describe, beforeEach, module, it, expect, inject */

describe('HighchartsHelper#mock-service', function () {

  var highchartsHelper, mockMLRest, mockValuesResults, mockTuplesResults,
    valuesHighchartConfig, tuplesHighchartConfig, $rootScope, $q;

  // fixture
  beforeEach(module('values-results.json'));
  beforeEach(module('tuples-results.json'));

  beforeEach(module('ml.highcharts'));

  beforeEach(function() {
    mockMLRest = {
      values: jasmine.createSpy('values').and.callFake(function() {
        var d = $q.defer();
        d.resolve({ data: mockValuesResults });
        return d.promise;
      })
    };
  });

  beforeEach(module(function($provide) {
    $provide.value('MLRest', mockMLRest);
  }));

  beforeEach(inject(function ($injector) {
    mockValuesResults = $injector.get('valuesResults');
    mockTuplesResults = $injector.get('tuplesResults');
    valuesHighchartConfig = $injector.get('valuesHighchartConfig');
    tuplesHighchartConfig = $injector.get('tuplesHighchartConfig');
    $q = $injector.get('$q');
    // $httpBackend = $injector.get('$httpBackend');
    // $location = $injector.get('$location');
    $rootScope = $injector.get('$rootScope');

    highchartsHelper = $injector.get('HighchartsHelper');
  }));

  it('should query for chart values', function() {
    mockResults = $injector.get('valuesResults');
    var count = 0;
    highchartsHelper.chartFromConfig()
    .then(function() { count++; });
    $rootScope.$apply();

  });

});