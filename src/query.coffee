Q = require 'q'
Document = require './document'

class Query 
	constructor: (@schema, @client, @container, initialData) ->
		@promises = []
		arr = if initialData instanceof Array then initialData else [ (if typeof initialData is 'string' then {_id: initialData} else initialData) ]
		@promises.push Q(arr)
		return @

	exec: (next) ->
		deferred = Q.defer()
		self = @

		error = (err) ->
			console.log err
			next err if next
			deferred.reject err

		deferred.resolve self.promises[self.promises.length-1] if self.promises.length

		next null, deferred.promise if next
		return deferred.promise

	find: (conditions, fields, options, next) ->
		deferred = Q.defer()
		doc = new Document @client, @container
		self = @

		handler = (data) ->
			if typeof conditions is 'string'
				deferred.resolve doc.get(self.schema._name, conditions)
			else if typeof conditions is 'object'
				self.client.getFiles self.container, {limit: Infinity}, (err, files) ->
					if err
						next err if next
						deferred.reject err

					else
						docPromises = []
						for file, index in files
							((self, file) ->
								docPromises.push doc.get("", file.name)
								)(self, files[index])

						Q.all(docPromises).then (results) ->
							next null, results if next
							deferred.resolve(new Query(self.schema, self.client, self.container, results).where(conditions).exec())

			else deferred.reject "Must supply at least an empty object {} as first argument, for find"
		
		self.promises[self.promises.length-1].then handler if self.promises?.length > 0
		self.promises.push deferred.promise
		return 

	where: (conditions) ->
		deferred = Q.defer()
		self = @

		handler = (data) ->
			if conditions and typeof conditions is 'object'
				for result, index in data
					for key, prop of conditions
						delete result[key] if not (result and typeof result is 'object' and result[key] is prop)
							
			deferred.resolve data

		self.promises[self.promises.length-1].then handler if self.promises?.length > 0
		self.promises.push deferred.promise
		return self

	validate: (next) ->
		deferred = Q.defer()
		self = @

		handler = (data) ->
			promises = []

			validate = (parent, child, def) ->
				for key, prop of child
					if parent[key] is not '_name'
						if typeof parent[key] is 'object' and typeof prop is 'object'
							validate parent[key], child[key]
						else
							if parent.hasOwnProperty key
								if typeof parent[key] is 'function'
									if typeof parent[key]() is not typeof child[key]
										delete child[key] unless (parent[key].hasOwnProperty 'now') and (typeof child[key] is 'object')
								else
									delete child[key]
							else
								delete child[key]

				def.resolve child if def

			for obj, index in data
				((doc, validate) ->
					docDeferred = Q.defer()
					validate self.schema, doc, docDeferred if typeof doc is 'object'
					promises.push docDeferred.promise
					)(obj, validate)

			Q.all(promises).then (results) ->
				next null, results if next
				deferred.resolve results

		self.promises[self.promises.length-1].then handler if self.promises?.length > 0 
		self.promises.push deferred.promise
		return self

	create: (next) ->
		deferred = Q.defer()
		self = @
		doc = new Document @client, @container

		handler = (data) ->
			promises = []

			for value, index in data
				((self, obj) ->
					def = Q.defer()
					def.resolve doc.set(self.schema._name, obj)
					promises.push def.promise
					)(self, data[index])

			Q.all(promises).then (results) ->
				next null, results if next
				deferred.resolve results

		self.promises[self.promises.length-1].then handler if self.promises?.length > 0
		self.promises.push deferred.promise
		return self

	remove: (next) ->
		deferred = Q.defer()
		self = @
		doc = new Document @client, @container

		handler = (data) ->
			promises = []

			for value, index in data
				((self, obj) ->
					def = Q.defer()
					def.resolve doc.destroy(self.schema._name, obj._id)
					promises.push def.promise
					)(self, data[index])

			Q.all(promises).then (results) ->
				for result, index in results
					if not result?
						deferred.reject "Not deleted: #{data[index]}" 
						next "Not deleted: #{data[index]}"
				next null, true if next and results?
				deferred.resolve true

		self.promises[self.promises.length-1].then handler if self.promises?.length > 0
		self.promises.push deferred.promise
		return self

module.exports = Query