Q 				= require 'q'
Database 		= require './database'
ObjectID 		= require('bson').BSONPure.ObjectID

class Document 
	constructor: (@$parent, initialData, options, next) ->

		initialData._id = new ObjectID() if not initialData.hasOwnProperty '_id'
		obj = @$parent.$schema.$validate(initialData)
		return obj if obj instanceof Error

		for key, prop of obj
			@[key] = obj[key]

		next null, @ if next
		if not options?.save?
			return @$save()
		else
			return @

	$save: (next) ->
		self = @
		obj = {}

		#console.log "Document.save called with : ", self

		for key, prop of self
			obj[key] = self[key] if not key.match /\$/

		deferred = Q.defer()

		db = new Database self.$parent.$client, self.$parent.$container
		# db.on "upload", console.log

		handler = (newDoc) ->
			for key, prop of newDoc
				self[key] = newDoc[key]
			deferred.resolve self

		db.write(self.$parent.$schemaName, obj).then handler
		if next 
			deferred.promise.then (result) ->
				next null, result
		return deferred.promise

	###$populate: () ->
		self = @

		db = new Database self.$parent.$client, self.$parent.$container

		return self###

	$remove: (next) ->
		self = @

		db = new Database self.$parent.$client, self.$parent.$container

		if self._id
			if next
				db.destroy(self.$parent.$schemaName, self._id).then (result) ->
					next result if result instanceof Error
					next null, result
			else return db.destroy(self.$parent.$schemaName, self._id)
		else return new Error "Document not instantiated. Call $save()"
	
module.exports = Document