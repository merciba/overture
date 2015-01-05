Q = require 'q'
events = require 'events'
ObjectID = require('bson').BSONPure.ObjectID

class Schema

	constructor: (obj, options) ->
		@$methods = {}

		copy = (schema, object) ->
			for key, prop of object
				if (not key.match /\$/) and (typeof prop is 'function') and ((typeof prop()).match(/string|boolean|number/) or prop instanceof Array)
					schema[key] = prop
					copy schema[key], prop if typeof prop is 'object'

		copy @, obj

		@_id = ObjectID
		@$emitter = new events.EventEmitter()
		@$emitter.emit "init"
		return @

	$validate: (obj) ->
		errMsg = "Does not match Schema."

		validate = (schema, object) ->
			err = null

			# Assign schema defaults if no corresponding child property
			for key, prop of schema
				object[key] = schema[key]() if (typeof schema[key] is 'function') and (not key.match /\$/) and (not object.hasOwnProperty key)

			# Match child properties to parent schema types
			for key, prop of object
				if not key.match /\$/
					if typeof schema[key] is 'object' and typeof object[key] is 'object'
						object[key] = validate schema[key], object[key]
					else
						#console.log schema[key], object[key]
						if schema.hasOwnProperty key
							if typeof schema[key] is 'function' 
								if typeof schema[key]() is not typeof object[key]
									if not ((schema[key].hasOwnProperty 'now') and (object[key] instanceof Date)) # Date() support
										err = errMsg
							else
								err = errMsg
						else
							err = errMsg

					if object[key] instanceof Error
						return object[key]
				else err = errMsg

			return new Error err if err?
			return object

		return validate @, obj

module.exports = Schema