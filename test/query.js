var fs = require('fs'),
	assert = require('assert'),
	should = require('should'),
	config = require('../config.json'),
	Overture = require('../index.js'),
	client = require('pkgcloud').storage.createClient(config);
	Schema = Overture.Schema,
	queryTestSchemaOptions = {
				testString: String,
				testBool: Boolean,
				testNum: Number,
				testArr: Array,
				timestamp: Date,
				meta: {
					numReviews: Number,
					reviews: Array
				},
				admin: Boolean
			},
	validTestObj = {
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
	invalidTestObj = { text: "I'm invalid, I don't match my Schema. :(" },
	queryTestSchema = new Schema(queryTestSchemaOptions);
	queryTestSchema._name = 'queryTest'

var query = new Overture.Query(queryTestSchema, client, 'abstrait.users');
var error = function(err) { throw new Error(err); };

describe('Overture.Query', function() {

	it('should create a valid Query instance', function(){
		query.should.be.instanceOf(Overture.Query);
	});

	it('should create query using promise', function(done){
		done();
		//query.create().exec().then()
	});

});