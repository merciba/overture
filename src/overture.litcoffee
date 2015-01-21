Overture
========

	class Overture

Here we have the Overture base class. In the constructor, we assign all of the sub-classes as properties of the Overture class, and a models object to store the registered models. 

		constructor: (args...) ->
			if args[0] 
				if (args[0].hasOwnProperty 'storage') and (args[0].hasOwnProperty 'container')
					@config = args[0]
					@models = {}
					return @
				else throw new Error "Incorrect config. Config accepts this format: \n{ \nstorage: { ...pkgcloud storage config... }, \ncontainer: '<your-container-name>' \n}"
			@

Overture.model() is a function that takes a `name` and `schema`. 

		model: (name, schema) ->

If `name` and `schema` exist...

			if name and schema

...then check that the provided `schema` is an instance of Overture.Schema. If so, compile a new Model and add it to Overture.models.

				if schema instanceof @Schema
					@models[name] = new @Model(name, schema, @config)
				else 
					@models[name] = new @Model(name, new @Schema(schema), @config)

				return @models[name]

if only `name` is provided, search for an already-registered Model using that name. If none exist, return an error.

			else if name
				if @models.hasOwnProperty name
					return @models[name]
				else throw new Error "Schema '#{name}' not found."

			else throw new Error "Model must have a name and Schema passed as args."

		Schema: require './schema'
		Database: require './database'
		Document: require './document'
		Model: require './model'

	module.exports = Overture