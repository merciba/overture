Query 			= require './query'
pkgcloud		= require 'pkgcloud'

class Model extends require('events').EventEmitter

	constructor: (name, schema, config) ->
		_factory = new Function "parent", "schema", "" +
			"return function #{name}(options) {" +
			"	var key, prop, self = this;" +
			"	self._schema = schema;" +
#			"	console.log('Instantiating #{name} with '+ JSON.stringify(options));" +
			"	for (key in parent) {" +
#			"		console.log('Adding parent method '+ key + ' to self');" +
			"		self[key] = parent[key];" +
			"	};" +
			"	if (typeof options === 'object') {" +
			"		for (key in options) {" +
			"			prop = options[key];" +
			"			if (self[key] && typeof prop === typeof self[key]) {" +
#			"				console.log('Updating Document property ' + key + '...');" +
			"				self[key] = prop;" +
			"			}" +
			"		}" +
			"	};" +
			"};"

		@client = pkgcloud.storage.createClient config.storage
		@container = config.container
		schema._name = name

		return _factory(@methods(), schema)

	methods: () ->
		self = @

		return {
			findById: (_id, fields, options, next) ->
				if typeof _id is 'string'
					return self.find({_id: _id}, fields, options, next)
				else return new Error "First argument must be a string."

			create: (args...) ->
				query = new Query(@_schema, self.client, self.container)
				query.create.apply(query, args)

				return query

			find: (args...) ->
				query = new Query(@_schema, self.client, self.container)
				query.find.apply(query, args)

				return query

			remove: (data, next) ->
				return new Query(@_schema, self.client, self.container, data).remove(next)

			save: (data, next) ->
				return new Query(@_schema, self.client, self.container, data).validate().create(next)

			where: (data, next) ->
				return new Query(@_schema, self.client, self.container, data).where(next)

			in: (imports) ->

			sort: (imports) ->

			select: (imports) ->

			test: (args...) ->

		}

module.exports = Model