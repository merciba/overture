Q = require 'q'

class Schema

	constructor: (obj) ->

		copy = (to, from) ->
			for key, prop of from
				to[key] = prop
				copy to[key], prop if typeof prop is 'object'

		copy @, obj

	@

module.exports = Schema