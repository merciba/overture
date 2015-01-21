var Overture,
  __slice = [].slice;

Overture = (function() {
  function Overture() {
    var args;
    args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
    if (args[0]) {
      if ((args[0].hasOwnProperty('storage')) && (args[0].hasOwnProperty('container'))) {
        this.config = args[0];
        this.models = {};
        return this;
      } else {
        throw new Error("Incorrect config. Config accepts this format: \n{ \nstorage: { ...pkgcloud storage config... }, \ncontainer: '<your-container-name>' \n}");
      }
    }
    this;
  }

  Overture.prototype.model = function(name, schema) {
    if (name && schema) {
      if (schema instanceof this.Schema) {
        this.models[name] = new this.Model(name, schema, this.config);
      } else {
        this.models[name] = new this.Model(name, new this.Schema(schema), this.config);
      }
      return this.models[name];
    } else if (name) {
      if (this.models.hasOwnProperty(name)) {
        return this.models[name];
      } else {
        throw new Error("Schema '" + name + "' not found.");
      }
    } else {
      throw new Error("Model must have a name and Schema passed as args.");
    }
  };

  Overture.prototype.Schema = require('./schema');

  Overture.prototype.Database = require('./database');

  Overture.prototype.Document = require('./document');

  Overture.prototype.Model = require('./model');

  return Overture;

})();

module.exports = Overture;
