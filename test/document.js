var fs = require('fs'),
	assert = require('assert'),
	should = require('should'),
	config = require('../config.json'),
	Overture = require('../index.js'),
	client = require('pkgcloud').storage.createClient(config);

var doc = new Overture.Document(client, 'abstrait.users'),
	obj = {
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
	schemaName = "docTest"

describe('Overture.Document', function() {

	it('should set document', function(done){
		doc.set(schemaName, obj).then(function(result) {
			should.exist(result);
			_id = result._id
			done();
		}, error);
	});

	it('should get document with path', function(done) {
		
		doc.get(schemaName, _id).then(function(result) {
			should.exist(result);
			done();
		}, error);

	});

	it('should get document without path', function(done) {
		
		doc.get("", schemaName+"/"+_id).then(function(result) {
			should.exist(result);
			done();
		}, error);

	});

	it('should destroy document', function(done) {
		
		doc.destroy(schemaName, _id).then(function(result) {
			result.should.be.true
			done();
		}, error);

	});

});