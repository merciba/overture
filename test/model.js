var fs = require('fs'),
	assert = require('assert'),
	should = require('should'),
	config = require('../config.json'),
	Overture = require('../index.js'),
	overture = new Overture(config),
	Schema = overture.Schema,
	Document = overture.Document;

var allResults = [];
var schema = new overture.Schema({ firstname: String, lastname: String, alive: Boolean });
var RoleModel = overture.model('RoleModels', schema);
var documents = [];

describe('Overture.Model', function() {

	describe('Getting Started example', function() {

		it('should save user to db using node-style callback', function(done){
			RoleModel({ firstname: "Angela", lastname: "Davis", alive: true }, function(err, angela) {
				angela.should.be.instanceOf(Document);
				angela.$save(function(err, saved) {
					saved.should.be.instanceOf(Document);
					documents[0] = saved;
					done();
				});
			});
		});

		it('should save user to db using a promise', function(done) {
			RoleModel({ firstname: "Malcolm", lastname: "X", alive: false }).$save().then(function(malcolm) {
				malcolm.should.be.instanceOf(Document);
				documents[1] = malcolm;
				done();
			});
		})
		

		it('should find users in db matching conditions using node-style callback', function(done) {
			RoleModel().find({alive: true }, function(err, results) {
				results[0].should.be.instanceOf(Document);
				done();
			});
		});

		it('should find users in db matching conditions using a promise', function(done) {
			var livingRoleModels = RoleModel().find({alive: true });

			livingRoleModels.exec().then(function(results) {
				results[0].should.be.instanceOf(Document);
				done(); 
			});
		});

		it('should remove document documents from db', function(done) {
			documents[0].$remove(function(err, result) {
				result.should.be.ok
				documents[1].$remove(function(err, result) {
					result.should.be.ok
					done();
				});
			});
		});
	});
});