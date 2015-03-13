;(function() {
  var undefined;

  var objectTypes = {
    'function': true,
    'object': true
  };

  var root = (objectTypes[typeof window] && window) || this;

  var freeExports = objectTypes[typeof exports] && exports && !exports.nodeType && exports;

  var freeModule = objectTypes[typeof module] && module && !module.nodeType && module

  var moduleExports = freeModule && freeModule.exports === freeExports && freeExports;

  var freeGlobal = objectTypes[typeof global] && global;
  if (freeGlobal && (freeGlobal.global === freeGlobal || freeGlobal.window === freeGlobal)) {
    root = freeGlobal;
  }

  var _ = root._;

  var templates = {};

  templates['blank'] = function(obj) {
    obj || (obj = {});
    var __t, __p = '', __e = _.escape;
    with (obj) {
    __p += '<h1>blank.template</h1>';

    }
    return __p
  };

  if (typeof define == 'function' && typeof define.amd == 'object' && define.amd) {
    define(['lodash'], function(lodash) {
      _ = lodash;
      lodash.templates = lodash.extend(lodash.templates || {}, templates);
    });
  } else if (freeExports && freeModule) {
    _ = require('lodash');
    if (moduleExports) {
      (freeModule.exports = templates).templates = templates;
    } else {
      freeExports.templates = templates;
    }
  } else if (_) {
    _.templates = _.extend(_.templates || {}, templates);
  }
}.call(this));
