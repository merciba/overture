Overture
========

A mongoose-style ODM for cloud storage.

Overture leverages the magic of [pkgcloud](https://github.com/pkgcloud/pkgcloud)'s stream-capable storage functionality for use as an Object Document Mapper. This allows you to skip using a database entirely, instead querying your Amazon S3 bucket or Rackspace CloudFiles container as your "database".

A typical Amazon S3-enabled Overture config would then look like: 

```
{
	"storage" : {
		"provider" : "amazon",
		"keyId" : "<keyId>",
		"key" : "<key>"
	},
	"container" : "<container>"
}
```

where `<keyId>` and `<key>` are valid Amazon S3 API credentials and `<container>` is the name of a valid S3 Bucket.

Getting Started
---------------

```
npm install overture
```

Overture aims to simplify the [Mongoose](http://mongoosejs.com/) syntax for making queries and modeling objects. Initialize like so:

```Javascript
var Overture = require('overture'),
  config = require('<path/to/config.json>'),
  overture = new Overture(config);
```

Now you should be able to register a Schema and Model:

```Javascript
var schema = new overture.Schema({ firstname: String, lastname: String, alive: Boolean });
var RoleModel = overture.model('RoleModels', schema);
```

And instantiate it:

```Javascript
// Promise-style save
var malcolm = RoleModel({ firstname: "Malcolm", lastname: "X", alive: false }) // returns a promise

malcolm.$save().then(function(malcolm) {
	// { "_id": "<overture_document_id>", firstname: "Malcolm", lastname: "X", alive: false } saved to db.
	console.log(malcolm); // Document instance matching the saved document
});

// Node-style callback save
RoleModel({ firstname: "Angela", lastname: "Davis", alive: true }, function(err, angela) {
	// {"_id": "<overture_document_id>", firstname: "Angela", lastname: "Davis", alive: true } saved to db.
	console.log(angela); // Document instance matching the saved document
});
```

Overture also supports the chainable promise syntax for its models (which also accept callbacks):

```Javascript
RoleModel().find({alive: true }, function(err, results) {
  console.log(results); // [{"_id": "<overture_document_id>", firstname: "Angela", lastname: "Davis", alive: true}]
});

var livingRoleModels = RoleModel().find({alive: true }); // returns a promise

livingRoleModels.exec().then(function(results) {
	console.log(results); // [{"_id": "<overture_document_id>", firstname: "Angela", lastname: "Davis", alive: true}]
});
```

Disclaimer
----------
More documentation coming soon. Not yet ready for production, Please remember that use of this software means providing access to your provider's APIs, which use services that may cost you money. Always be careful with your API keys! Merciba is not responsible for any loss or damage caused by use of this software.  