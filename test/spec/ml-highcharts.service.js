/* global describe, beforeEach, module, it, expect, inject */

describe('HighchartsHelper#mock-service', function () {

  var highchartsHelper, mockMLRest, mockValuesResults, mockTuplesResults, mockOptions,
    searchFactory, valuesHighchartConfig, tuplesHighchartConfig, $rootScope, $q;

  // fixture
  beforeEach(module('values-result.json'));
  beforeEach(module('tuples-result.json'));
  beforeEach(module('values-highchart-config.json'));
  beforeEach(module('tuples-highchart-config.json'));
  beforeEach(module('options-all.json'));

  beforeEach(module('ml.highcharts'));
  beforeEach(module('ml.search'));

  beforeEach(function() {
    mockMLRest = {
      values: jasmine.createSpy('values').and.callFake(function() {
        var d = $q.defer();
        d.resolve({ data: mockValuesResults });
        return d.promise;
      }),
      queryConfig: jasmine.createSpy('queryConfig').and.callFake(function() {
        var d = $q.defer();
        d.resolve({data: mockOptions});
        return d.promise;
      })
    };
  });

  beforeEach(module(function($provide) {
    $provide.value('MLRest', mockMLRest);
  }));

  beforeEach(inject(function ($injector) {
    mockOptions = $injector.get('optionsAll');
    mockValuesResults = $injector.get('valuesResult');
    mockTuplesResults = $injector.get('tuplesResult');
    valuesHighchartConfig = $injector.get('valuesHighchartConfig');
    tuplesHighchartConfig = $injector.get('tuplesHighchartConfig');
    $q = $injector.get('$q');
    // $httpBackend = $injector.get('$httpBackend');
    // $location = $injector.get('$location');
    $rootScope = $injector.get('$rootScope');

    highchartsHelper = $injector.get('HighchartsHelper');
  }));

  it('should transform values to chart series', function() {
    var populatedConfig = highchartsHelper.chartFromConfig(valuesHighchartConfig);
    $rootScope.$apply();
    var results = mockValuesResults['values-response']['distinct-value'];
    for (var i = 0; i < results.length; i++) {
      expect(populatedConfig.series[i].data[0]).toEqual(results[i].frequency);
      expect(populatedConfig.series[i].name).toEqual(results[i]._value);
    }
  });

  it('should transform tuples to chart series', function() {
    mockMLRest.values = jasmine.createSpy('values').and.callFake(function() {
        var d = $q.defer();
        d.resolve({ data: mockTuplesResults });
        return d.promise;
      });
    var populatedConfig = highchartsHelper.chartFromConfig(tuplesHighchartConfig);
    $rootScope.$apply();
    var results = mockTuplesResults['values-response'].tuple;
    for (var i = 0; i < results.length; i++) {
      expect(populatedConfig.series[i].name).toEqual(results[i]['distinct-value'][1]._value);
      for (var j = 0; j < populatedConfig.series[i].data[0].length; j++) {
        if (populatedConfig.series[i].data[j][0] === results[i]['distinct-value'][0]._value) {
          expect(populatedConfig.series[i].data[j][1]).toEqual(results[i].frequency);
        }
      }
    }
  });

});