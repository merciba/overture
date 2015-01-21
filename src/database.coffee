Q = require 'q'
events = require 'events'
ObjectID = require('bson').BSONPure.ObjectID
objectStream = require 'objectstream'

class Database extends events.EventEmitter
	constructor: (@client, @container) ->
		@

	objectStream: (path, _id) ->
		self = @
		path = "" if not path
		path += "/" if path.slice -1 is not "/" or ""

		writeStream = self.client.upload({ container: self.container, remote: "#{path}#{_id}" })
		objStream = objectStream.createSerializeStream(writeStream)

		return objStream

	write: (path, obj, next) ->
		#console.log "Document.write", obj
		deferred = Q.defer()
		self = @
		path = "" if not path
		path += "/" if path.slice -1 is not "/" or ""

		deferred.reject new Error "No _id" if not obj.hasOwnProperty '_id'

		writeStream = self.client.upload({ container: self.container, remote: "#{path}#{obj._id}" })
		objStream = objectStream.createSerializeStream(writeStream)

		objStream.write obj

		writeStream.on 'success', () ->
			next null, obj if next
			self.emit "upload", { action: 'upload', document: obj }
			deferred.resolve obj

		writeStream.on 'error', (err) ->
			next new Error err if next
			deferred.reject new Error err

		objStream.end()

		return deferred.promise

	readStream: (path, _id) ->
		arr = []
		self = @
		path = "" if not path
		path += "/" if path.slice -1 is not "/" or ""

		return self.client.download({ container: self.container, remote: "#{path}#{_id}" })

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
		).on 'end', (err) ->
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