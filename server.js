const cpen322 = require('./cpen322-tester.js');
const path = require('path');
const fs = require('fs');
const express = require('express');
const { WebSocketServer } = require('ws');
const Database = require('./Database.js');
const ws = new require('ws');

var db = new Database("mongodb://127.0.0.1:27017", "cpen322-messenger");

const messageBlockSize = 10;

function logRequest(req, res, next){
	console.log(`${new Date()}  ${req.ip} : ${req.method} ${req.path}`);
	next();
}

const host = 'localhost';
const port = 3000;
const clientApp = path.join(__dirname, 'client');

// express app
let app = express();

app.use(express.json()) 						// to parse application/json
app.use(express.urlencoded({ extended: true })) // to parse application/x-www-form-urlencoded
app.use(logRequest);							// logging for debug

// serve static files (client-side)
app.use('/', express.static(clientApp, { extensions: ['html'] }));
app.listen(port, () => {
	console.log(`${new Date()}  App Started. Listening on ${host}:${port}, serving ${clientApp}`);
});

var messages = {};
db.getRooms().then((result) => {
	console.log("werew");
	console.log(result);
	for (var i = 0; i < result.length; i++) {
		messages[result[i]._id] = [];
	}
});

app.route('/chat')
  .get(function (req, res, next) {
	db.getRooms().then((chatrooms) => {
		var properRooms = [];
		for (var i = 0; i < chatrooms.length; i++) {
			var room = {};
			room._id = chatrooms[i]._id; 
			room.name = chatrooms[i].name;
			room.image = chatrooms[i].image;
			room.messages = messages[chatrooms[i]._id];
			properRooms.push(room);
		}
		res.send(properRooms);
	});
  })
  .post(function (req, res, next) {
	db.addRoom(req.body).then(
		(result) => {
			messages[result._id] = [];
			res.status(200).send(JSON.stringify(result));
		},
		(error) => res.status(400).send('Error: name not found')
	);
  })

app.get('/chat/:room_id', (req, res) => {
	db.getRoom(req.params.room_id).then((room) => {
		if (room != null) {
			res.send(room);
		}
		else {
			res.status(404).send("Room " + req + " was not found");
		}
	});
})

app.get('/chat/:room_id/messages', (req, res) => {
	db.getLastConversation(req.params.room_id, req.query.before).then((convo) => {
		res.send(convo);
	});
})

var broker = new ws.Server({ port: 8000 });

broker.on('connection', (ws) => {
	ws.on('message', (data) => {
		var parsed = JSON.parse(data);

		for (client of broker.clients.values()) {
			if (client != ws) {
				client.send(JSON.stringify(parsed));
			}
		}
		messages[parsed.roomId].push(parsed);

		if (messages[parsed.roomId].length >= messageBlockSize) {
			var timestamp = Date.now();
			var conversation = {
				'room_id': parsed.roomId,
				'timestamp': timestamp,
				'messages': messages[parsed.roomId]
			};
			db.addConversation(conversation).then(() => {
				messages[parsed.roomId] = [];
			});
		}
	});
});

cpen322.connect('http://52.43.220.29/cpen322/test-a4-server.js');
cpen322.export(__filename, { app, messages, broker, db, messageBlockSize });