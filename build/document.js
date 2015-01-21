var Database, Document, ObjectID, Q,
  __slice = [].slice;

Q = require('q');

Database = require('./database');

ObjectID = require('bson').BSONPure.ObjectID;

Document = (function() {
  function Document($parent, initialData, options, next) {
    var key, obj, prop;
    this.$parent = $parent;
    if (!initialData.hasOwnProperty('_id')) {
      initialData._id = new ObjectID();
    }
    obj = this.$parent.$schema.$validate(initialData);
    if (obj instanceof Error) {
      return obj;
    }
    for (key in obj) {
      prop = obj[key];
      this[key] = obj[key];
    }
    if (next) {
      next(null, this);
    }
    if ((options != null ? options.save : void 0) == null) {
      return this.$save();
    } else {
      return this;
    }
  }

  Document.prototype.$save = function(next) {
    var db, deferred, handler, key, obj, prop, self;
    self = this;
    obj = {};
    for (key in self) {
      prop = self[key];
      if (!key.match(/\$/)) {
        obj[key] = self[key];
      }
    }
    deferred = Q.defer();
    db = new Database(self.$parent.$client, self.$parent.$container);
    handler = function(newDoc) {
      for (key in newDoc) {
        prop = newDoc[key];
        self[key] = newDoc[key];
      }
      return deferred.resolve(self);
    };
    db.write(self.$parent.$schemaName, obj).then(handler);
    if (next) {
      deferred.promise.then(function(result) {
        return next(null, result);
      });
    }
    return deferred.promise;
  };


  /*$populate: () ->
  		self = @
  
  		db = new Database self.$parent.$client, self.$parent.$container
  
  		return self
   */

  Document.prototype.$remove = function() {
    var args, db, self;
    args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
    self = this;
    db = new Database(self.$parent.$client, self.$parent.$container);
    if (self._id) {
      return db.destroy(self.$parent.$schemaName, self._id);
    } else {
      return new Error("Document not instantiated. Call $save()");
    }
  };

  return Document;

})();

module.exports = Document;
