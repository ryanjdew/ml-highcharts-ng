# ml-highcharts-ng
AngularJS library for working with MarkLogic and Highcharts

#### getting started

    bower install ml-highcharts-ng --save

#### services

- `HighchartsHelper`: Service for working with Highchart configuration files. It is used by the ml-highchart directive.

#### directives

- `ml-highchart`: accepts highcart configuration object as highchart-config and MLSearch context as ml-search. Optionally accepts a structured-query object which will replace the search query with the structured query.

#### example

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
          'text': 'Ingredients'
        }
      },
      // constraint name for x axis
      'xAxisMLConstraint': 'Ingredients',
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
<ml-highchart highchart-config="ctrl.highchartConfig" ml-search="ctrl.mlSearch"></ml-highchart>
```
html using a structured query 
```html
<ml-highchart highchart-config="ctrl.highchartConfig" ml-search="ctrl.mlSearch" structured-query="{'term-query':{'text':['blue']}}"></ml-highchart>
```
