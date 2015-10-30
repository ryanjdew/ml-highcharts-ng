# ml-highcharts-ng
AngularJS library for working with MarkLogic and Highcharts

#### getting started

    bower install ml-highcharts-ng --save

#### services

- `HighchartsHelper`: Service for working with Highchart configuration files. It is used by the ml-highchart directive.

#### directives

- `ml-highchart`: accepts highcart configuration object as highchart-config and MLSearch context as ml-search. Optionally accepts a structured-query object which will replace the search query with the structured query.

#### example

Search constraint with buckets:
``` 
  <constraint name="Years">
    <range type="xs:date" facet="true">
      <element ns="http://marklogic.com/flights" name="departure-date"/>

    <bucket ge="2016-01-01" name="future"></bucket>
      <bucket lt="2016-01-01" ge="2015-01-01" name="2015"></bucket>
      <bucket lt="2015-01-01" ge="2014-01-01" name="2014"></bucket>
      <bucket lt="2014-01-01" ge="2013-01-01" name="2013"></bucket>
      <bucket lt="2013-01-01" ge="2012-01-01" name="2012"></bucket>
      <bucket lt="2012-01-01" ge="2011-01-01" name="2011"></bucket>
      <bucket lt="2011-01-01" ge="2010-01-01" name="2010"></bucket>
      <bucket lt="2010-01-01" name="past"></bucket>

      <facet-option>descending</facet-option>
    </range>
  </constraint>

```


app.js
```javascript
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
          'text': 'Years'
        }
      },
      // constraint name for x axis
      'xAxisMLConstraint': 'Years',
      // optional constraint name for categorizing x axis values
      'dataPointNameMLConstraint': 'Category',
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

``` 
html 
```html
<ml-highchart highchart-config="ctrl.highchartConfig" ml-search="ctrl.mlSearch" ml-search-controller="ctrl"></ml-highchart>
```
html using a structured query 
```html
<ml-highchart highchart-config="ctrl.highchartConfig" ml-search="ctrl.mlSearch" structured-query="{'term-query':{'text':['blue']}}"></ml-highchart>
```
