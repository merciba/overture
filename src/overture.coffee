Model = require './model'

class Overture

	constructor: (options) ->
		console.log "Overture instantiated."
		@Schema = require './schema'
		@Document = require './document'
		@Query = require './query'

	model: (name, schema) ->
		if name and schema
			return new Model(name, schema, @config)

	connect: (credentials, container) ->
		@config = {
			storage: credentials,
			container: container
		}

module.exports = new Overture()