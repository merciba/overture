var fs = require('fs'),
	assert = require('assert'),
	should = require('should'),
	config = require('../config.json'),
	Overture = require('../index.js'),
	Schema = Overture.Schema,
	modelTestSchemaOptions = {
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
	modelTestSchema = new Schema(modelTestSchemaOptions);

Overture.connect(config, 'abstrait.users');

var ModelTest = Overture.model('modelTest', modelTestSchema);
var modelTest = new ModelTest();
var model = modelTest
var error = function(err) { throw new Error(err); };

describe('Overture.Model', function() {

	it('should create a valid Model instance', function() {
		modelTest.should.be.an.instanceOf(ModelTest);
	});

	it('should save model', function(done) {
		var cleanup = function(results) {
			should.exist(results);
			for (key in results) {
				(function(model, obj) {
					model.remove(obj._id).exec().then(function(result) {
						should.exist(result);
						done();
					}, error);
				})(model, results[key])
			}
		}
		model.save(validTestObj).exec().then(cleanup, error)
	});

});