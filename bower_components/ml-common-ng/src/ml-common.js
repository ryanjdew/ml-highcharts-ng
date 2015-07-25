(function() {
  'use strict';

  /**
   * @namespace 'ml.common'
   */
  angular.module('ml.common', [])
    .filter('object2Array', object2Array)
    .filter('truncate', truncate);

  /**
   * angular filter for converting object properties to arrays
   *
   * converts `{ prop: { value: 'val' }}` to `[{ value: 'val', __key: 'prop' }]`
   *
   * @name object2Array
   * @memberof 'ml.common'
   */
  function object2Array() {
    return function(input) {
      var out = [];
      for (var name in input) {
        input[name].__key = name;
        out.push(input[name]);
      }
      return out;
    };
  }

  /**
   * angular filter for truncating text.
   *
   * truncates to `length`, offset by the length of `end`, and concatenates with `end`.
   *
   * ex:
   *
   *   `'abcdefg' | truncate:5` returns `'ab...'` <br/>
   *   `'abcdefg' | truncate:5:''` returns `'abcde'`
   *
   * @name truncate
   * @memberof 'ml.common'
   *
   * @param {Number} length - output length (defaults to `10`)
   * @param {String} [end] - string to append to the input (defaults to `'...'`)
   */
  function truncate() {
    return function (text, length, end) {
      length = length || 10;
      end = end || '...';

      return (text.length > length) ?
             String(text).substring(0, length - end.length) + end :
             text;
    };
  }

}());
