Q = require 'q'
streamifier = require 'streamifier'
uuid = require 'node-uuid'

class Document
	constructor: (@client, @container) ->
		return @

	set: (path, obj, next) ->
		#console.log "Document.set"
		deferred = Q.defer()
		self = @
		path = "" if not path
		path += "/" if path.slice -1 is not "/" or ""

		obj._id = uuid.v1() if not obj.hasOwnProperty '_id'

		streamifier.createReadStream(new Buffer(JSON.stringify(obj))).pipe(
			self.client.upload({ container: self.container, remote: "#{path}#{obj._id}" }).on('success', () ->
				next null, obj if next
				deferred.resolve obj
			))

		return deferred.promise

	get: (path, obj, next) ->
		deferred = Q.defer()
		arr = []
		self = @
		path = "" if not path
		path += "/" if path.slice -1 is not "/" or ""
		obj = {_id: obj} if typeof obj is 'string'

		deferred.resolve false if not obj.hasOwnProperty '_id'

		self.client.download({ container: self.container, remote: "#{path}#{obj._id}" }).on('data', (chunk) ->
			arr.push chunk
		).on 'end', (err, result) ->
			str = Buffer.concat(arr).toString('utf-8')
			if str.length
				result = JSON.parse str
				next null, result if next
				deferred.resolve result
			else
				next null, false
				deferred.resolve false

		return deferred.promise

	destroy: (path, _id, next) ->
		deferred = Q.defer()
		self = @
		path = "" if not path
		path += "/" if path.slice -1 is not "/" or ""

		self.client.removeFile self.container, "#{path}#{_id}", (err) ->
			if err
				next err if next
				deferred.reject err
			else
				deferred.resolve true

		return deferred.promise

module.exports = Document