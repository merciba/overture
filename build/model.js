var Database, Document, Model, Q, Schema, events, pkgcloud,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Document = require('./document');

Database = require('./database');

events = require('events');

pkgcloud = require('pkgcloud');

Schema = require('./schema');

Q = require('q');

Array.prototype.remove = function(from, to) {
  var rest, _ref;
  rest = this.slice((to || from) + 1 || this.length);
  this.length = (_ref = from < 0) != null ? _ref : this.length + {
    from: from
  };
  return this.push.apply(this, rest);
};

Model = (function(_super) {
  __extends(Model, _super);

  function Model(schemaName, schema, config) {
    var $factory;
    this.compile(schemaName, schema, config);
    $factory = new Function("methods", "schema", "client", "Document", "" + ("return function " + this.$schemaName + "(object, next) {") + "	var key, prop, self = this;" + "	for (key in methods) {" + "		self[key] = methods[key];" + "	};" + "	if (object) {" + "		return new Document(self, object, {save: false}, next);" + "	}" + "	else {" + "		return self" + "	}" + "};");
    return $factory(this, this.$schema, this.$client, Document);
  }

  Model.prototype.compile = function(schemaName, schema, config) {
    this.$schemaName = schemaName;
    this.$schema = schema;
    this.$container = config.container;
    this.$client = pkgcloud.storage.createClient(config.storage);
    this.promises = [];
    this.deferred = Q.defer();
    if (this.$schema) {
      return this;
    } else {
      return new Error("Needs a Schema.");
    }
  };

  Model.prototype.find = function(conditions, next) {
    var db, deferred, handler, self;
    deferred = Q.defer();
    self = this;
    db = new Database(self.$client, self.$container);
    handler = function(next) {
      if (typeof conditions === 'string') {
        return db.read("", file.name).then(function(result) {
          return deferred.resolve(new Document(self, result, {
            save: false
          }));
        });
      } else if (typeof conditions === 'object') {
        return self.$client.getFiles(self.$container, {
          limit: Infinity
        }, function(err, files) {
          var docPromises, file, index, _i, _len;
          if (err) {
            if (next) {
              next(err);
            }
            return deferred.resolve(err);
          } else {
            docPromises = [];
            for (index = _i = 0, _len = files.length; _i < _len; index = ++_i) {
              file = files[index];
              if (files[index].name.split('/')[0] === self.$schemaName) {
                (function(self, file) {
                  return docPromises.push(db.read("", file.name));
                })(self, files[index]);
              } else {
                docPromises.push(new Error("File does not match Overture specs."));
              }
            }
            return Q.all(docPromises).then(function(results) {
              var final, key, prop, _j, _len1;
              final = [];
              err = null;
              for (index = _j = 0, _len1 = results.length; _j < _len1; index = ++_j) {
                file = results[index];
                if (Object.keys(conditions).length === 0) {
                  final.push(new Document(self, results[index], {
                    save: false
                  }));
                } else {
                  for (key in conditions) {
                    prop = conditions[key];
                    if ((results[index].hasOwnProperty(key)) && (results[index][key] === conditions[key])) {
                      final.push(new Document(self, results[index], {
                        save: false
                      }));
                    }
                  }
                }
              }
              if (next) {
                next(null, final);
              }
              return deferred.resolve(final);
            });
          }
        });
      } else {
        return deferred.resolve("Must supply at least an empty object {} as first argument, for find");
      }
    };
    handler(next);
    self.promises.push(deferred.promise);
    return self;
  };

  Model.prototype.exec = function(next) {
    var deferred, handler, self;
    deferred = Q.defer();
    self = this;
    handler = function(results) {
      if (results instanceof Error) {
        self.deferred.reject(results);
        if (next) {
          return next(results);
        }
      } else {
        self.deferred.resolve(results);
        if (next) {
          return next(null, results);
        }
      }
    };
    self.promises[self.promises.length - 1].then(handler);
    return self.deferred.promise;
  };

  Model.prototype.where = function(conditions, next) {
    var deferred, handler, self, _ref;
    deferred = Q.defer();
    self = this;
    handler = function(data) {
      var index, key, prop, result, _i, _len;
      if (conditions && typeof conditions === 'object') {
        for (index = _i = 0, _len = data.length; _i < _len; index = ++_i) {
          result = data[index];
          if (data[index] instanceof Error) {
            deferred.resolve(data[index]);
          } else {
            for (key in conditions) {
              prop = conditions[key];
              if (!(result && typeof result === 'object' && result[index][key] === prop)) {
                delete result[index];
              }
            }
          }
        }
      }
      return deferred.resolve(data);
    };
    if (next) {
      handler(next);
    } else {
      if (((_ref = self.promises) != null ? _ref.length : void 0) > 0) {
        self.promises[self.promises.length - 1].then(handler);
      }
      self.promises.push(deferred.promise);
    }
    return self;
  };

  Model.prototype.update = function(fields, options, next) {
    var deferred, handler, self, _ref;
    deferred = Q.defer();
    self = this;
    handler = function(data) {
      var errMsg, index, key, obj, opts, prop, _i, _len, _ref, _ref1;
      opts = {
        returnNew: (options != null ? options.returnNew : void 0) ? options.returnNew : true,
        upsert: (options != null ? options.upsert : void 0) ? options.upsert : false,
        sort: (options != null ? options.sort : void 0) ? options.sort : {},
        select: (options != null ? options.select : void 0) ? options.select : {}
      };
      if (fields && typeof fields === 'object') {
        for (index = _i = 0, _len = data.length; _i < _len; index = ++_i) {
          obj = data[index];
          if (data[index] instanceof Error) {
            deferred.resolve(data[index]);
          } else {
            if (fields.$set != null) {
              _ref = fields.$set;
              for (key in _ref) {
                prop = _ref[key];
                if (obj.hasOwnProperty(key && ((typeof obj[key] === (_ref1 = typeof fields.$set[key]) && _ref1 === typeof self.$schema[key]())) && (key === !'_id') && (key === !'timestamp'))) {
                  obj[key] = fields.$set[key];
                } else if (key === '_id' || key === 'timestamp') {

                } else {
                  errMsg = "Object " + fields.$set[key] + " does not match Schema or '" + key + "' is invalid key";
                  deferred.resolve(new Error(errMsg));
                }
              }
            }
          }
        }
      }
      return deferred.resolve(data);
    };
    if (((_ref = self.promises) != null ? _ref.length : void 0) > 0) {
      self.promises[self.promises.length - 1].then(handler);
    }
    self.promises.push(deferred.promise);
    return self;
  };

  Model.prototype.save = function(next) {
    var db, deferred, handler, self, _ref;
    deferred = Q.defer();
    self = this;
    db = new Database(self.$client, self.$container).on("upload", self.pushReceipt);
    handler = function(data) {
      var index, promises, value, _i, _len;
      promises = [];
      for (index = _i = 0, _len = data.length; _i < _len; index = ++_i) {
        value = data[index];
        if (data[index] instanceof Error) {
          deferred.resolve(data[index]);
        } else {
          (function(self, obj) {
            var def;
            def = Q.defer();
            return db.write(self.$schemaName, obj).then(function(result) {
              def.resolve(obj.$save());
              return promises.push(def.promise);
            });
          })(self, data[index]);
        }
      }
      return Q.all(promises).then(function(results) {
        if (next) {
          self.exec(next);
        }
        return deferred.resolve(results);
      });
    };
    if (((_ref = self.promises) != null ? _ref.length : void 0) > 0) {
      self.promises[self.promises.length - 1].then(handler);
    }
    self.promises.push(deferred.promise);
    return self;
  };

  Model.prototype.remove = function(next) {
    var db, deferred, handler, self, _ref;
    deferred = Q.defer();
    self = this;
    db = new Database(self.$client, self.$container);
    handler = function(data) {
      var index, promises, value, _i, _len;
      promises = [];
      for (index = _i = 0, _len = data.length; _i < _len; index = ++_i) {
        value = data[index];
        if (!data[index] instanceof Error) {
          (function(obj, promises) {
            var def;
            def = Q.defer();
            def.resolve(obj.$remove());
            return promises.push(def.promise);
          })(data[index], promises);
        }
      }
      return Q.all(promises).then(function(results) {
        var errMsg, result, _j, _len1;
        for (index = _j = 0, _len1 = results.length; _j < _len1; index = ++_j) {
          result = results[index];
          if (result == null) {
            errMsg = "Not deleted: " + data[index];
            deferred.resolve(new Error(errMsg));
            next(new Error(errMsg));
          }
        }
        if (next) {
          self.exec(next);
        }
        return deferred.resolve(true);
      });
    };
    if (((_ref = self.promises) != null ? _ref.length : void 0) > 0) {
      self.promises[self.promises.length - 1].then(handler);
    }
    self.promises.push(deferred.promise);
    return self;
  };

  return Model;

})(events.EventEmitter);

module.exports = Model;
