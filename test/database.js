var fs = require('fs'),
	assert = require('assert'),
	should = require('should'),
	config = require('../config.json'),
	Overture = require('../index.js');
	Database = new Overture(config).Database,
	ObjectID = require('bson').BSONPure.ObjectID;

var client = require('pkgcloud').storage.createClient(config.storage);

var db = new Database(client, config.container),
	obj = {
		_id: new ObjectID(),
		testString: "Asdasdasd",
		testBool: false,
		testNum: 1234,
		testArr: [ "asdas", false ],
		timestamp: new Date(),
		meta: {
			numReviews: 123123,
			reviews: [{text: "This sucks.", timestamp: new Date()}, {text: "This rocks!", timestamp: new Date()}]
		},
		admin: true
	},
	error = function(err) { throw new Error(err); },
	_id = ""
	folderName = "dbTest"

describe('Overture.Database', function() {

	it('should set document', function(done){
		db.write(folderName, obj).then(function(result) {
			should.exist(result);
			_id = result._id
			done();
		}, error);

	});

	it('should get document with path', function(done) {
		
		db.read(folderName, _id).then(function(result) {
			should.exist(result);
			done();
		}, error);

	});

	it('should get document without path', function(done) {
		
		db.read("", folderName+"/"+_id).then(function(result) {
			should.exist(result);
			done();
		}, error);

	});

	it('should destroy document', function(done) {
		
		db.destroy(folderName, _id).then(function(result) {
			result.should.be.true
			done();
		}, error);

	});

});