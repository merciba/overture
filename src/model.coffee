Document 		= require './document'
Database 		= require './database'
events 			= require 'events'
pkgcloud		= require 'pkgcloud'
Schema 			= require './schema'
Q 				= require 'q'

Array.prototype.remove = (from, to) ->
  rest = this.slice((to || from) + 1 || this.length)
  this.length = from < 0 ? this.length + from : from
  return this.push.apply(this, rest)

# Overture.Model

class Model extends events.EventEmitter

	constructor: (schemaName, schema, config) ->
		@compile(schemaName, schema, config)

		$factory = new Function "methods", "schema", "client", "Document", "" +
			"return function #{this.$schemaName}(object, next) {" +
			"	var key, prop, self = this;" +
			"	for (key in methods) {" +
			"		self[key] = methods[key];" +
			"	};" +
			"	if (object) {" +
			"		return new Document(self, object, {save: false}, next);" +
			"	}" +
			"	else {" +
			"		return self" +
			"	}" + 
			"};"

		return $factory(@, @$schema, @$client, Document)

	compile: (schemaName, schema, config) ->
		@$schemaName = schemaName
		@$schema = schema
		@$container = config.container
		@$client = pkgcloud.storage.createClient config.storage
		@promises = []
		@deferred = Q.defer()

		if @$schema
			return @
		else
			return new Error "Needs a Schema."

	find: (conditions, next) ->
		#console.log "Document.find(#{conditions}, #{next})"
		deferred = Q.defer()
		self = @
		db = new Database self.$client, self.$container
		#.on "download", self.pushReceipt

		handler = (next) ->
			# console.log "Document.find"
			if typeof conditions is 'string'
				db.read("", file.name).then (result) ->
					deferred.resolve new Document(self, result, {save: false})
				
			else if typeof conditions is 'object'
				# console.log JSON.stringify conditions
				self.$client.getFiles self.$container, {limit: Infinity}, (err, files) ->
					if err
						next err if next
						deferred.resolve err

					else
						docPromises = []
						for file, index in files
							if files[index].name.split('/')[0] is self.$schemaName
								((self, file) ->
									#console.log file
									docPromises.push db.read("", file.name)
									)(self, files[index])
							else docPromises.push new Error "File does not match Overture specs."

						Q.all(docPromises).then (results) ->
							final = []
							err = null
							for file, index in results
								if Object.keys(conditions).length is 0
									final.push new Document(self, results[index], {save: false})
								else
									for key, prop of conditions
										if (results[index].hasOwnProperty key) and (results[index][key] is conditions[key])
											final.push new Document(self, results[index], {save: false})

							next null, final if next 
							deferred.resolve final

			else deferred.resolve "Must supply at least an empty object {} as first argument, for find"

		handler(next)
		self.promises.push deferred.promise
		return self

	exec: (next) ->
		#console.log "Document.exec() called" 
		deferred = Q.defer()
		
		self = @

		handler = (results) ->
			#console.log "Final promise resolved with: ", results
			if results instanceof Error
				self.deferred.reject results
				next results if next
			else 
				self.deferred.resolve results
				next null, results if next

		self.promises[self.promises.length-1].then handler

		return self.deferred.promise

	where: (conditions, next) ->
		# console.log "Document.where(#{conditions}, #{next})"
		deferred = Q.defer()
		self = @

		handler = (data) ->
			# console.log "Document.where acting on :", data
			if conditions and typeof conditions is 'object'
				for result, index in data
					if data[index] instanceof Error
						deferred.resolve data[index]
					else
						for key, prop of conditions
							delete result[index] if not (result and typeof result is 'object' and result[index][key] is prop)

			# console.log "Document.where resolving with : ", results
			deferred.resolve data

		if next 
			handler(next)
		else 
			self.promises[self.promises.length-1].then handler if self.promises?.length > 0
			self.promises.push deferred.promise
		return self

	# Updates properties of objects in the promise chain with new values

	update: (fields, options, next) ->
		# console.log "Document.update(#{fields}, #{schema}, #{options}, #{next})"
		deferred = Q.defer()
		self = @

		handler = (data) ->
			# console.log "Document.update acting on :", data
			opts = {
				returnNew: if options?.returnNew then options.returnNew else true
				upsert: if options?.upsert then options.upsert else false
				sort: if options?.sort then options.sort else {}
				select: if options?.select then options.select else {}
			}

			if fields and typeof fields is 'object'
				for obj, index in data
					if data[index] instanceof Error
						deferred.resolve data[index]
					else
						if fields.$set?
							for key, prop of fields.$set
								if obj.hasOwnProperty key and (typeof obj[key] is typeof fields.$set[key] is typeof self.$schema[key]() ) and (key is not '_id') and (key is not 'timestamp')
									obj[key] = fields.$set[key]
								else if key is '_id' or key is 'timestamp'
									# console.log "Skipping _id or timestamp"
								else
									errMsg = "Object #{fields.$set[key]} does not match Schema or '#{key}' is invalid key"
									deferred.resolve new Error errMsg

			# console.log "Document.update resolving with : ", data
			deferred.resolve data

		self.promises[self.promises.length-1].then handler if self.promises?.length > 0
		self.promises.push deferred.promise
		return self

	# Writes current state of promise chain to db

	save: (next) ->
		# console.log "Document.save called with schemaName: ", schemaName 
		deferred = Q.defer()
		self = @
		db = new Database self.$client, self.$container
		.on "upload", self.pushReceipt

		handler = (data) ->
			# console.log "Document.save acting on : ", data
			promises = []

			for value, index in data
				if data[index] instanceof Error
					deferred.resolve data[index]
				else
					((self, obj) ->
						def = Q.defer()
						db.write(self.$schemaName, obj).then (result) ->
							def.resolve obj.$save()
							promises.push def.promise
						)(self, data[index])

			Q.all(promises).then (results) ->
				# console.log "Document.save resolving with : ", results
				self.exec next if next
				deferred.resolve results

		
		self.promises[self.promises.length-1].then handler if self.promises?.length > 0
		self.promises.push deferred.promise
		return self

	# Removes all items in the promise chain

	remove: (next) ->
		# console.log "Document.remove called with schemaName: ", schemaName 
		deferred = Q.defer()
		self = @
		db = new Database self.$client, self.$container

		handler = (data) ->
			promises = []

			for value, index in data
				if not data[index] instanceof Error 
					((obj, promises) ->
						def = Q.defer()
						def.resolve obj.$remove()
						promises.push def.promise
						)(data[index], promises)

			Q.all(promises).then (results) ->
				for result, index in results
					if not result?
						errMsg = "Not deleted: #{data[index]}" 
						deferred.resolve new Error errMsg
						next new Error errMsg

				self.exec next if next
				deferred.resolve true

		self.promises[self.promises.length-1].then handler if self.promises?.length > 0
		self.promises.push deferred.promise
		return self

module.exports = Model