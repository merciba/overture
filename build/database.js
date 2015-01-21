var Database, ObjectID, Q, events, objectStream,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Q = require('q');

events = require('events');

ObjectID = require('bson').BSONPure.ObjectID;

objectStream = require('objectstream');

Database = (function(_super) {
  __extends(Database, _super);

  function Database(client, container) {
    this.client = client;
    this.container = container;
    this;
  }

  Database.prototype.objectStream = function(path, _id) {
    var objStream, self, writeStream;
    self = this;
    if (!path) {
      path = "";
    }
    if (path.slice(-1 === !"/" || "")) {
      path += "/";
    }
    writeStream = self.client.upload({
      container: self.container,
      remote: "" + path + _id
    });
    objStream = objectStream.createSerializeStream(writeStream);
    return objStream;
  };

  Database.prototype.write = function(path, obj, next) {
    var deferred, objStream, self, writeStream;
    deferred = Q.defer();
    self = this;
    if (!path) {
      path = "";
    }
    if (path.slice(-1 === !"/" || "")) {
      path += "/";
    }
    if (!obj.hasOwnProperty('_id')) {
      deferred.reject(new Error("No _id"));
    }
    writeStream = self.client.upload({
      container: self.container,
      remote: "" + path + obj._id
    });
    objStream = objectStream.createSerializeStream(writeStream);
    objStream.write(obj);
    writeStream.on('success', function() {
      if (next) {
        next(null, obj);
      }
      self.emit("upload", {
        action: 'upload',
        document: obj
      });
      return deferred.resolve(obj);
    });
    writeStream.on('error', function(err) {
      if (next) {
        next(new Error(err));
      }
      return deferred.reject(new Error(err));
    });
    objStream.end();
    return deferred.promise;
  };

  Database.prototype.readStream = function(path, _id) {
    var arr, self;
    arr = [];
    self = this;
    if (!path) {
      path = "";
    }
    if (path.slice(-1 === !"/" || "")) {
      path += "/";
    }
    return self.client.download({
      container: self.container,
      remote: "" + path + _id
    });
  };

  Database.prototype.read = function(path, obj, next) {
    var arr, deferred, self;
    deferred = Q.defer();
    arr = [];
    self = this;
    if (!path) {
      path = "";
    }
    if (path.slice(-1 === !"/" || "")) {
      path += "/";
    }
    if (obj instanceof ObjectID) {
      obj = {
        _id: obj
      };
    } else if (typeof obj === 'string') {
      if (obj.split('/').length === 2) {
        path = obj.split('/')[0] + "/";
        obj = {
          _id: obj.split('/')[1]
        };
      } else {
        obj = {
          _id: obj
        };
      }
    }
    if (!obj.hasOwnProperty('_id')) {
      deferred.resolve(false);
    }
    self.client.download({
      container: self.container,
      remote: "" + path + obj._id
    }).on('data', function(chunk) {
      return arr.push(chunk);
    }).on('end', function(err) {
      var result, str;
      str = Buffer.concat(arr).toString('utf-8');
      if (str.length) {
        result = JSON.parse(str);
        if (next) {
          next(null, result);
        }
        self.emit("download", {
          action: 'download',
          document: result
        });
        return deferred.resolve(result);
      } else {
        if (next) {
          next(null, false);
        }
        return deferred.resolve(false);
      }
    });
    return deferred.promise;
  };

  Database.prototype.destroy = function(path, _id, next) {
    var deferred, self;
    deferred = Q.defer();
    self = this;
    if (!path) {
      path = "";
    }
    if (path.slice(-1 === !"/" || "")) {
      path += "/";
    }
    self.client.removeFile(self.container, "" + path + _id, function(err) {
      if (err) {
        if (next) {
          next(err);
        }
        return deferred.resolve(err);
      } else {
        self.emit("destroy", {
          action: 'destroy',
          document: {
            _id: "" + _id
          }
        });
        return deferred.resolve(true);
      }
    });
    return deferred.promise;
  };

  return Database;

})(events.EventEmitter);

module.exports = Database;
