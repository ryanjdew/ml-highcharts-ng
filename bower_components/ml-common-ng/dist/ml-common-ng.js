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

(function() {
  'use strict';

  angular.module('ml.common')
    .factory('MLQueryBuilder', MLQueryBuilder);

  function MLQueryBuilder() {
    return {

      query: function query() {
        var args = asArray.apply(null, arguments);
        return {
          'query': {
            'queries': args
          }
        };
      },

      text: function text(qtext) {
        return {
          'qtext': qtext
        };
      },

      and: function and() {
        var args = asArray.apply(null, arguments);
        return {
          'and-query': {
            'queries': args
          }
        };
      },

      or: function or() {
        var args = asArray.apply(null, arguments);
        return {
          'or-query': {
            'queries': args
          }
        };
      },

      not: function properties(query) {
        return {
          'not-query': query
        };
      },

      document: function document() {
        var args = asArray.apply(null, arguments);
        return {
          'document-query': {
            'uri': args
          }
        };
      },

      range: function range(name, values) {
        values = asArray.apply(null, [values]);
        return {
          'range-constraint-query': {
            'constraint-name': name,
            'value': values
          }
        };
      },

      collection: function collection(name, values) {
        values = asArray.apply(null, [values]);
        return {
          'collection-constraint-query': {
            'constraint-name': name,
            'uri': values
          }
        };
      },

      custom: function custom(name, values) {
        values = asArray.apply(null, [values]);
        return {
          'custom-constraint-query': {
            'constraint-name': name,
            'value': values
          }
        };
      },

      constraint: function constraint(type) {
        switch(type) {
          case 'custom':
            return this.custom;
          case 'collection':
            return this.collection;
          default:
            return this.range;
        }
      },

      boost: function boost(matching, boosting) {
        return {
          'boost-query': {
            'matching-query': matching,
            'boosting-query': boosting
          }
        };
      },

      properties: function properties(query) {
        return { 'properties-query': query };
      },

      operator: function operator(name, stateName) {
        return {
          'operator-state': {
            'operator-name': name,
            'state-name': stateName
          }
        };
      }

    };

  }

  function asArray() {
    var args;

    if ( arguments.length === 0 ) {
      args = [];
    } else if ( arguments.length === 1) {
      if (Array.isArray( arguments[0] )) {
        args = arguments[0];
      } else {
        args = [ arguments[0] ];
      }
    } else {
      args = [].slice.call(arguments);
    }

    return args;
  }


}());

(function () {
  'use strict';

  angular.module('ml.common')
    .provider('MLRest', function() {
        this.$get = ['$http', MLRest];
    });

  /**
   * @class MLRest
   * @classdesc low-level angular service, encapsulates REST API builtins and normalizes the responses.
   *
   * @param {Object} $http - angular $http service
   */
  function MLRest($http) {
    var defaults = { apiVersion: 'v1' };

    var service = {
      search: search,
      getDocument: getDocument,
      createDocument: createDocument,
      updateDocument: updateDocument,
      patchDocument: patchDocument,
      sparql: sparql,
      suggest: suggest,
      values: values,
      extension: extension,
      queryConfig: queryConfig,
      request: request,

      // DEPRECATED: TODO: remove
      getSearchOptions: queryConfig,
      callExtension: extension,
      patch: patchDocument
    };

    // private function for checking if a method is supported
    function isSupportedMethod(method) {
      var supported = [ 'GET', 'PUT', 'POST', 'DELETE' ];
      return supported.indexOf(method) > -1;
    }

    /**
     * Makes a REST API request (all other methods wrap this)
     * @method MLRest#request
     *
     * @param {String} endpoint - the request endpoint: can be version agnostic (`/search`) or specific (`/v1/search`)
     * @param {Object} settings - angular `$http` service settings
     * @return {Promise} a promise resolved with an angular `$http` service response object
     */
    function request(endpoint, settings) {
      var url;

      if (/^\/v1\//.test(endpoint)) {
        url = endpoint;
      } else {
        url = '/' + defaults.apiVersion + endpoint;
      }

      settings = settings || {};
      settings.method = settings.method || 'GET';

      if (!isSupportedMethod(settings.method)) {
        settings.headers = settings.headers || {};
        settings.headers['X-HTTP-Method-Override'] = settings.method;
        settings.method = 'POST';
      }

      return $http({
        url: url,
        data: settings.data,
        method: settings.method,
        params: settings.params,
        headers: settings.headers
      });
    }

    /**
     * Makes a resource extension request
     * @method MLRest#extension
     *
     * @param {String} name - resource extension name
     * @param {Object} [settings] - angular `$http` service settings
     * @return {Promise} a promise resolved with an angular `$http` service response object
     */
    function extension(name, settings) {
      if ( !/^\//.test(name) ) {
        name = '/' + name;
      }
      return request('/resources' + name, settings);
    }

    /**
     * Makes a search request (POST if combined query, GET otherwise)
     * @method MLRest#search
     *
     * @param {Object} [options] - URL params
     * @param {Object} [combined] - a combined search object (identified by a `search` property)
     * @return {Promise} a promise resolved with an angular `$http` service response object
     */
    function search(options, combined) {
      var settings = {};

      if ( !combined && options && options.search ) {
        combined = options;
        options = {};
      } else {
        options = options || {};
      }

      if (!options.format){
        options.format = 'json';
      }

      settings.params = options;

      if ( combined ) {
        settings.method = 'POST';
        settings.data = combined;
      }

      return request('/search', settings);
    }

    /**
     * Retrieves a document at the specified URI
     * @method MLRest#getDocument
     *
     * @param {String} uri - document URI
     * @param {Object} options - URL params
     * @return {Promise} a promise resolved with an angular `$http` service response object
     */
    function getDocument(uri, options) {
      options = options || {};
      options.uri = uri;

      if (!options.format){
        options.format = 'json';
      }

      return request('/documents', { params: options });
    }

    /**
     * Creates a document, returning the new URI
     * @method MLRest#createDocument
     *
     * @param {Object|String} doc - document contents
     * @param {Object} [options] - URL params
     * @return {Promise} a promise resolved with the new document URI
     */
    function createDocument(doc, options) {
      return request('/documents', {
        method: 'POST',
        params: options,
        data: doc
      }).then(function(response) {
        return response.headers('location');
      });
    }

    /**
     * Creates or updates a document at the specified URI (`options.uri`)
     * @method MLRest#updateDocument
     *
     * @param {Object|String} doc - document contents
     * @param {Object} options - URL params
     * @return {Promise} a promise resolved with the new document URI
     */
    //TODO: uri param?
    //TODO: shouldn't resolve location?
    function updateDocument(doc, options) {
      return request('/documents', {
        method: 'PUT',
        params: options,
        data: doc
      }).then(function(response) {
        return response.headers('location');
      });
    }

    /**
     * Applies the provided patch to the document at the specified URI
     * @method MLRest#patchDocument
     *
     * @param {String} uri - document URI
     * @param {Object} patch - a document patch definition
     * @return {Promise} a promise resolved with the new document URI
     */
    //TODO: shouldn't resolve location?
    function patchDocument(uri, patch) {
      // TODO: support XML patches

      // var headers = {};
      //
      // if (isObject(patch)) {
      //   headers = { 'Content-Type': 'application/json' }
      // } else {
      //   headers = { 'Content-Type': 'application/xml' }
      // }

      return request('/documents', {
        method: 'PATCH',
        params: { uri: uri },
        // headers: headers,
        data: patch
      })
      .then(function(response) {
        return response.headers('location');
      });
    }

    /**
     * Evaluates a SPARQL query
     * @method MLRest#sparql
     *
     * @param {String} query - a SPARQL query
     * @param {Object} [params] - URL params
     * @return {Promise} a promise resolved with an angular `$http` service response object
     */
    function sparql(query, params) {
      var accept = [
        'application/sparql-results+json'
        // TODO: file bug against REST API for not supporting multiple Accept mime-types
        // 'application/rdf+json'
      ];

      params = params || {};

      //TODO: POST query?
      params.query = query;

      return request('/graphs/sparql', {
        params: params,
        headers: { 'Accept': accept.join(', ') }
      });
    }

    /**
     * Retrieves search phrase suggestions
     * @method MLRest#suggest
     *
     * @param {Object} [params] - URL params
     * @param {Object} [combined] - combined query
     * @return {Promise} a promise resolved with an angular `$http` service response object
     */
    function suggest(params, combined) {
      var settings = { params: params };

      if (combined) {
        settings.method = 'POST';
        settings.data = combined;
      }

      return request('/suggest', settings);
    }

    /**
     * Retrieves lexicon values
     * @method MLRest#values
     *
     * @param {String} name - values definition name (from stored or combined search options)
     * @param {Object} [params] - URL params
     * @param {Object} [combined] - combined query
     * @return {Promise} a promise resolved with an angular `$http` service response object
     */
    function values(name, params, combined) {
      var settings = { params: params };

      if (combined) {
        settings.method = 'POST';
        settings.data = combined;
      }

      return request('/values/' + name, settings);
    }

    /**
     * Retrieves stored search options
     * @method MLRest#queryConfig
     *
     * @param {String} name - stored search options name
     * @param {String} [section] - options section to retrieve
     * @return {Promise} a promise resolved with an angular `$http` service response object
     */
    function queryConfig(name, section) {
      var url = '/config/query/' + name;

      if (section) {
        url += '/' + section;
      }
      return request(url, {
        params: { format: 'json' }
      });
    }

    return service;
  }

}());
