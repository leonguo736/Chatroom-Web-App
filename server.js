const cpen322 = require('./cpen322-tester.js');
const path = require('path');
const fs = require('fs');
const express = require('express');
const { WebSocketServer } = require('ws');
const ws = new require('ws');
// import { WebSocketServer } from 'ws';
// var WebSocketServer = new require('ws');

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

/**
 * Assignment 3
 */
var chatrooms = [
	{id: "0", name: "room0", image: "/assets/everyone-icon.png"},
	{id: "1", name: "room1", image: "/assets/everyone-icon.png"},
	{id: "2", name: "room2", image: "/assets/everyone-icon.png"},
];

var messages = {};
for (let key in chatrooms) {
	messages[chatrooms[key].id] = [];
}

app.route('/chat')
//   .all(function (req, res, next) {
//     // runs for all HTTP verbs first
//     // think of it as route specific middleware!
//   })
  .get(function (req, res, next) {
	var properRooms = [];
	for (var i = 0; i < chatrooms.length; i++) {
		var room = new Object;
		room.id = chatrooms[i].id; 
		room.name = chatrooms[i].name;
		room.image = chatrooms[i].image;
		room.messages = messages[chatrooms[i].id];
		properRooms[i] = room;
	}
    res.send(properRooms);
  })
  .post(function (req, res, next) {
	if (req.body.name != undefined) {
		var newRoom = {};
		newRoom["id"] = req.body.name;
		newRoom["name"] = req.body.name;
		if (req.body.image != undefined) {
			newRoom["image"] = req.body.image;
		}
		else {
			newRoom["image"] = "/assets/everyone-icon.png";
		}
		chatrooms.push(newRoom);
		messages[newRoom["id"]] = [];
		// console.log("post: messages check: " + messages);
		res.status(200).send(JSON.stringify(newRoom));
	}
	else {
		res.status(400).send('Error: name not found');
	}
  })

var broker = new ws.Server({ port: 8000 });

broker.on('connection', (ws) => {
	ws.on('message', (data) => {
		var parsed = JSON.parse(data);
		// console.log("broker: data is " + parsed);

		for (client of broker.clients.values()) {
			if (client != ws) {
				client.send(JSON.stringify(parsed));
			}
		}
		messages[parsed.roomId].push(parsed);
	});

	// ws.on('close', function() {
	// 	delete clients[id];
	// });
});

cpen322.connect('http://52.43.220.29/cpen322/test-a3-server.js');
cpen322.export(__filename, { app, chatrooms, messages, broker });