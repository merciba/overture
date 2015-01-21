Q = require 'q'
streamifier = require 'streamifier'
events = require 'events'
ObjectID = require('bson').BSONPure.ObjectID

class Database extends events.EventEmitter
	constructor: (@client, @container) ->
		@

	write: (path, obj, next) ->
		#console.log "Document.set"
		deferred = Q.defer()
		self = @
		path = "" if not path
		path += "/" if path.slice -1 is not "/" or ""

		deferred.reject new Error "No _id" if not obj.hasOwnProperty '_id'

		streamifier.createReadStream(new Buffer(JSON.stringify(obj))).pipe(
			self.client.upload({ container: self.container, remote: "#{path}#{obj._id}" }).on('success', () ->
				next null, obj if next
				self.emit "upload", { action: 'upload', document: obj }
				deferred.resolve obj
			).on('error', (err) ->
				next new Error err if next
				deferred.reject new Error err
			))

		return deferred.promise

	read: (path, obj, next) ->
		deferred = Q.defer()
		arr = []
		self = @
		path = "" if not path
		path += "/" if path.slice -1 is not "/" or ""
		if obj instanceof ObjectID
			obj = {_id: obj}
		else if typeof obj is 'string'
			if obj.split('/').length is 2
				path = obj.split('/')[0] + "/"
				obj = {_id: obj.split('/')[1]}
			else obj = {_id: obj}

		deferred.resolve false if not obj.hasOwnProperty '_id'

		self.client.download({ container: self.container, remote: "#{path}#{obj._id}" }).on('data', (chunk) ->
			arr.push chunk
		).on 'end', (err, result) ->
			str = Buffer.concat(arr).toString('utf-8')
			if str.length
				result = JSON.parse str
				next null, result if next
				self.emit "download", { action: 'download', document: result }
				deferred.resolve result
			else
				next null, false if next
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
				deferred.resolve err
			else
				self.emit "destroy", { action: 'destroy', document: { _id: "#{_id}"} }
				deferred.resolve true

		return deferred.promise

module.exports = Database