Model = require './model'

class Overture

	constructor: (args...) ->
		if args[0] 
			if (args[0].hasOwnProperty 'storage') and (args[0].hasOwnProperty 'container')
				@config = args[0]
				@Schema = require './schema'
				@Database = require './database'
				@Document = require './document'
				@Model = require './model'
				@models = {}
				return @
			else throw new Error "Incorrect config. Config accepts this format: \n{ \nstorage: { ...pkgcloud storage config... }, \ncontainer: '<your-container-name>' \n}"
		else throw new Error "Incorrect config. Config accepts this format: \n{ \nstorage: { ...pkgcloud storage config... }, \ncontainer: '<your-container-name>' \n}"

	model: (name, schema) ->
		if name and schema
			if schema instanceof @Schema
				@models[name] = new Model(name, schema, @config)
			else 
				@models[name] = new Model(name, new @Schema(schema), @config)

			return @models[name]

		else if name
			if @models.hasOwnProperty name
				return @models[name]
			else throw new Error "Schema '#{name}' not found."

		else throw new Error "Model must have a name and Schema passed as args"

module.exports = Overture