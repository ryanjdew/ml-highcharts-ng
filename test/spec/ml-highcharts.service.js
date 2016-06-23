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
    mockMLRest.search = jasmine.createSpy('values').and.callFake(function() {
        var d = $q.defer();
        d.resolve({ data: { facets: {}, results: [] }});
        return d.promise;
      });
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

  // Store references to $rootScope and $compile
  // so they are available to all tests in this describe block
  beforeEach(inject(function(_$compile_, _$rootScope_){
    // The injector unwraps the underscores (_) from around the parameter names when matching
    $compile = _$compile_;
    $rootScope = _$rootScope_;
  }));

  it('should transform values to chart series', function() {
    highchartsHelper.chartFromConfig(valuesHighchartConfig).then(function(populatedConfig) {
      var results = mockValuesResults['values-response']['distinct-value'];
      for (var i = 0; i < results.length; i++) {
        expect(populatedConfig.series[0].data[i].y).toEqual(results[i].frequency);
        expect(populatedConfig.series[0].data[i].name).toEqual(results[i]._value);
      }
    });
    $rootScope.$digest();
  });

  it('should transform tuples to chart series', function() {
    mockMLRest.values = jasmine.createSpy('values').and.callFake(function() {
        var d = $q.defer();
        d.resolve({ data: mockTuplesResults });
        return d.promise;
      });
    highchartsHelper.chartFromConfig(tuplesHighchartConfig).then(function(populatedConfig) {
      var results = mockTuplesResults['values-response'].tuple;
      for (var i = 0; i < populatedConfig.xAxis.categories.length; i++) {
        var categoryName = populatedConfig.xAxis.categories[i];
        var expectedCategorySum = 0;
        for (var j = 0; j < results.length; j++) {
          if (categoryName === results[j]['distinct-value'][1]._value) {
            expectedCategorySum += results[j].frequency;
          }
        }
        var categorySum = 0;

        for (var k = 0; k < populatedConfig.series.length; k++) {
          var yVals = _.filter(populatedConfig.series[k].data, function(val) {
            return val.x === i;
          });
          categorySum += _.reduce(yVals, function(memo, num){ return memo + (num.y) ? num.y : 0; }, 0);
        }
        expect(expectedCategorySum).toEqual(categorySum);
      }
    });
    $rootScope.$digest();
    tuplesHighchartConfig.xAxisCategoriesMLConstraint = undefined;
    tuplesHighchartConfig.yAxisCategoriesMLConstraint = "Ingredients";
    tuplesHighchartConfig.yAxisMLConstraint = undefined;
    tuplesHighchartConfig.xAxisMLConstraint = "$frequency";
    highchartsHelper.chartFromConfig(tuplesHighchartConfig).then(function(populatedConfig) {
      var results = mockTuplesResults['values-response'].tuple;
      for (var i = 0; i < populatedConfig.yAxis.categories.length; i++) {
        var categoryName = populatedConfig.yAxis.categories[i];
        var expectedCategorySum = 0;
        for (var j = 0; j < results.length; j++) {
          if (categoryName === results[j]['distinct-value'][1]._value) {
            expectedCategorySum += results[j].frequency;
          }
        }
        var categorySum = 0;

        for (var k = 0; k < populatedConfig.series.length; k++) {
          var xVals = _.filter(populatedConfig.series[k].data, function(val) {
            return val.y === i;
          });
          categorySum += _.reduce(xVals, function(memo, num){ return memo + (num.x) ? num.x : 0; }, 0);
        }
        expect(expectedCategorySum).toEqual(categorySum);
      }
    });
    $rootScope.$digest();
  });

  it('replaces the element with the appropriate content', function() {
    // Compile a piece of HTML containing the directive
    $rootScope.highchartConfig = tuplesHighchartConfig;
    $rootScope.highchartConfig.series.length = 0;
    var element = $compile('<ml-highchart highchart-config="highchartConfig"></ml-highchart>')($rootScope);
    $rootScope.$digest();
    // Check that the compiled element contains the templated content
    expect(element.html()).toContain("Highcharts");
  });

  it('reloads when mlSearch.results changes', function() {
    // Compile a piece of HTML containing the directive
    $rootScope.highchartConfig = tuplesHighchartConfig;
    $rootScope.highchartConfig.series.length = 0;
    var origChartFromConfig = highchartsHelper.chartFromConfig;
    highchartsHelper.chartFromConfig = jasmine.createSpy('chartFromConfig').and.callFake(function() {
      return origChartFromConfig.apply(highchartsHelper, arguments);
    });
    $rootScope.mlSearch = {
      options: {
        queryOptions: 'all'
      },
      getStoredOptions: function() {
        return $q.when({
          options: {}
        });
      },
      results: [],
      search: jasmine.createSpy('search').and.callFake(function() {
        var d = $q.defer();
        d.resolve({data: mockOptions});
        return d.promise;
      })
    };
    var element = $compile('<ml-highchart ml-search="mlSearch" highchart-config="highchartConfig"></ml-highchart>')($rootScope);
    $rootScope.$digest();
    expect(highchartsHelper.chartFromConfig.calls.count()).toEqual(1);
    $rootScope.mlSearch.results.push({'test': 1});
    $rootScope.$digest();
    expect(highchartsHelper.chartFromConfig.calls.count()).toEqual(2);
  });

  it('reloads when structured query changes', function() {
    // Compile a piece of HTML containing the directive
    $rootScope.highchartConfig = tuplesHighchartConfig;
    $rootScope.highchartConfig.series.length = 0;
    var origChartFromConfig = highchartsHelper.chartFromConfig;
    highchartsHelper.chartFromConfig = jasmine.createSpy('chartFromConfig').and.callFake(function() {
      return origChartFromConfig.apply(highchartsHelper, arguments);
    });
    $rootScope.structuredQuery = {
        'and-query': {
          'query': []
        }
      };
    var element = $compile('<ml-highchart structured-query="structuredQuery" highchart-config="highchartConfig"></ml-highchart>')($rootScope);
    $rootScope.$digest();
    expect(highchartsHelper.chartFromConfig.calls.count()).toEqual(1);
    $rootScope.structuredQuery['and-query'].query.push({'qtext': 'this is a test'});
    $rootScope.$digest();
    expect(highchartsHelper.chartFromConfig.calls.count()).toEqual(2);
  });

});