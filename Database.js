const { MongoClient, ObjectID, ObjectId } = require('mongodb');	// require the mongodb driver

/**
 * Uses mongodb v4.2+ - [API Documentation](http://mongodb.github.io/node-mongodb-native/4.2/)
 * Database wraps a mongoDB connection to provide a higher-level abstraction layer
 * for manipulating the objects in our cpen322 app.
 */
function Database(mongoUrl, dbName){
	if (!(this instanceof Database)) return new Database(mongoUrl, dbName);
	this.connected = new Promise((resolve, reject) => {
		MongoClient.connect(
			mongoUrl,
			{
				useNewUrlParser: true
			},
			(err, client) => {
				if (err) reject(err);
				else {
					console.log('[MongoClient] Connected to ' + mongoUrl + '/' + dbName);
					resolve(client.db(dbName));
				}
			}
		)
	});
	this.status = () => this.connected.then(
		db => ({ error: null, url: mongoUrl, db: dbName }),
		err => ({ error: err })
	);
}

Database.prototype.getRooms = function(){
	return this.connected.then(db =>
		new Promise((resolve, reject) => {
			/* TODO: read the chatrooms from `db`
			 * and resolve an array of chatrooms */
			db.collection("chatrooms").find({}).toArray((err, result) => {
				resolve(result);
			});
			
		})
	)
}

Database.prototype.getRoom = function(room_id){
	return this.connected.then(db =>
		new Promise((resolve, reject) => {
			/* TODO: read the chatroom from `db`
			 * and resolve the result */
			try {
				var id = ObjectId(room_id);
			}
			catch(err) {
				var id = room_id;
			}
			var room = db.collection("chatrooms").findOne({ _id: id });
			resolve(room);
			// how to consider string case?
		})
	)
}

Database.prototype.addRoom = function(room){
	return this.connected.then(db => 
		new Promise((resolve, reject) => {
			/* TODO: insert a room in the "chatrooms" collection in `db`
			 * and resolve the newly added room */
			if (room.messages == undefined) {
				var messages = [];
			}
			else {
				var messages = room.messages;
			}

			if (room.image == undefined) {
				var image = 'assets/everyone-icon.png';
			}
			else {
				var image = room.image;
			}

			if(room._id == undefined) {
				var id = ObjectId();
				var document = {
					'_id': id.toString(),
					'name': room.name,
					'image': image,
					'messages': messages
				};
			}
			else {
				var document = {
					'_id': room._id,
					'name': room.name,
					'image': image,
					'messages': messages
				};
			}

			if (document.name != undefined) {
				db.collection("chatrooms").insertOne(document).then((result) => {
					resolve(document);
				});
			}
			else {
				reject(new Error("addRoom: name not specified"));
			}
		})
	)
}

Database.prototype.getLastConversation = function(room_id, before){
	return this.connected.then(db =>
		new Promise((resolve, reject) => {
			/* TODO: read a conversation from `db` based on the given arguments
			 * and resolve if found */
			if(before == undefined) {
				before = Date.now();
			}
			db.collection("conversations").find().toArray((err, result) => {
				if ((result == null) || (result == undefined)) {
					resolve(result);
				}
				else if (result.length == 0) {
					resolve(result);
				}
				else {
					var convo = result[0];
					var timeSince = before - result[0].timestamp;
					for (var i = 1; i < result.length; i++) {
						if (result[i].timestamp >= before) {
							continue;
						}
						if ((before - result[i].timestamp) > timeSince) {
							continue;
						}
						convo = result[i];
						timeSince = before - result[i].timestamp;
					}
					resolve(convo);
				}
			});
		})
	)
}

Database.prototype.addConversation = function(conversation){
	return this.connected.then(db =>
		new Promise((resolve, reject) => {
			/* TODO: insert a conversation in the "conversations" collection in `db`
			 * and resolve the newly added conversation */
			var document = {
				'room_id': conversation.room_id,
				'timestamp': conversation.timestamp,
				'messages': conversation.messages
			}
			if ((document.room_id == undefined) || (document.timestamp == undefined) ||(document.messages == undefined)) {
				reject(new Error("at least one conversation field is undefined"));
			}
			else {
				db.collection("conversations").insertOne(document).then((result) => {
					resolve(document);
				});
			}
		})
	)
}

Database.prototype.getUser = function(username){
	return this.connected.then(db =>
		new Promise((resolve, reject) => {
			db.collection("users").findOne({ username: username }).then((user) => {
				resolve(user);
			})
		})
	)
}

module.exports = Database;