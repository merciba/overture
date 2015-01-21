var ObjectID, Q, Schema, events;

Q = require('q');

events = require('events');

ObjectID = require('bson').BSONPure.ObjectID;

Schema = (function() {
  function Schema(obj, options) {
    var copy;
    this.$methods = {};
    copy = function(schema, object) {
      var key, prop, _results;
      _results = [];
      for (key in object) {
        prop = object[key];
        if ((!key.match(/\$/)) && (typeof prop === 'function') && ((typeof prop()).match(/string|boolean|number/) || prop instanceof Array)) {
          schema[key] = prop;
          if (typeof prop === 'object') {
            _results.push(copy(schema[key], prop));
          } else {
            _results.push(void 0);
          }
        } else {
          _results.push(void 0);
        }
      }
      return _results;
    };
    copy(this, obj);
    this._id = ObjectID;
    this.$emitter = new events.EventEmitter();
    this.$emitter.emit("init");
    return this;
  }

  Schema.prototype.$validate = function(obj) {
    var errMsg, validate;
    errMsg = "Does not match Schema.";
    validate = function(schema, object) {
      var err, key, prop;
      err = null;
      for (key in schema) {
        prop = schema[key];
        if ((typeof schema[key] === 'function') && (!key.match(/\$/)) && (!object.hasOwnProperty(key))) {
          object[key] = schema[key]();
        }
      }
      for (key in object) {
        prop = object[key];
        if (!key.match(/\$/)) {
          if (typeof schema[key] === 'object' && typeof object[key] === 'object') {
            object[key] = validate(schema[key], object[key]);
          } else {
            if (schema.hasOwnProperty(key)) {
              if (typeof schema[key] === 'function') {
                if (typeof schema[key]() === !typeof object[key]) {
                  if (!((schema[key].hasOwnProperty('now')) && (object[key] instanceof Date))) {
                    err = errMsg;
                  }
                }
              } else {
                err = errMsg;
              }
            } else {
              err = errMsg;
            }
          }
          if (object[key] instanceof Error) {
            return object[key];
          }
        } else {
          err = errMsg;
        }
      }
      if (err != null) {
        return new Error(err);
      }
      return object;
    };
    return validate(this, obj);
  };

  return Schema;

})();

module.exports = Schema;
