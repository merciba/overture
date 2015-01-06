var fs = require('fs'),
	assert = require('assert'),
	should = require('should'),
	config = require('../config.json'),
	Overture = require('../index.js'),
	overture = new Overture(config),
	Schema = overture.Schema;

describe('Overture.Schema', function() {

	it('should create a valid Schema', function() {
		var RoleModelSchema = new Schema({ firstname: String, lastname: String, alive: Boolean });
		RoleModelSchema.should.be.instanceOf(Schema);
	});

	it('should create a valid Schema, disregarding reserved $ properties', function() {
		var RoleModelSchema = new Schema({ firstname: String, lastname: String, alive: Boolean, $test: String });
		RoleModelSchema.should.be.instanceOf(Schema);
		RoleModelSchema.should.not.have.property("$test");
	});

	it('should validate objects correctly', function() {
		var RoleModelSchema = new Schema({ firstname: String, lastname: String, alive: Boolean });
		RoleModelSchema.$validate({ firstname: "Toussaint", lastname: "L'Overture", alive: false }).should.not.be.instanceOf(Error);
		RoleModelSchema.$validate({ firstname: "Toussaint", lastname: "L'Overture", alive: false, test: "I should break Schema validation" }).should.be.instanceOf(Error);
		RoleModelSchema.$validate({ firstname: "Toussaint", lastname: true, alive: false, test: "I should break Schema validation" }).should.be.instanceOf(Error);
	});

});