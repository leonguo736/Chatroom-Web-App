const cpen322 = require('./cpen322-tester.js');
const path = require('path');
const fs = require('fs');
const express = require('express');
const { WebSocketServer } = require('ws');
const Database = require('./Database.js');
const SessionManager = require('./SessionManager.js');
const crypto = require('crypto');
const ws = new require('ws');

var db = new Database("mongodb://127.0.0.1:27017", "cpen322-messenger");
var sessionManager = new SessionManager;

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

//assignment 5
app.use('/profile', sessionManager.middleware);
app.use('/app.js', sessionManager.middleware, express.static(clientApp + '/app.js'));
app.use('/index.html', sessionManager.middleware, express.static(clientApp + '/index.html'));
app.use('/index', sessionManager.middleware, express.static(clientApp + '/index'));
app.use('/+', sessionManager.middleware, express.static(clientApp, { extensions: ['html'] }));

// serve static files (client-side)
app.use('/', express.static(clientApp, { extensions: ['html'] }));
app.listen(port, () => {
	console.log(`${new Date()}  App Started. Listening on ${host}:${port}, serving ${clientApp}`);
});

/**
 * Assignment 3
 */
// var chatrooms = [
// 	{id: "0", name: "room0", image: "/assets/everyone-icon.png"},
// 	{id: "1", name: "room1", image: "/assets/everyone-icon.png"},
// 	{id: "2", name: "room2", image: "/assets/everyone-icon.png"},
// ];

var messages = {};
db.getRooms().then((result) => {
	for (var i = 0; i < result.length; i++) {
		messages[result[i]._id] = [];
	}
});

app.route('/chat')
  .get(sessionManager.middleware, function (req, res, next) {
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
  .post(sessionManager.middleware, function (req, res, next) {
	db.addRoom(req.body).then(
		(result) => {
			messages[result._id] = [];
			res.status(200).send(JSON.stringify(result));
		},
		(error) => res.status(400).send('Error: name not found')
	);
  })

app.get('/chat/:room_id', sessionManager.middleware, (req, res) => {
	db.getRoom(req.params.room_id).then((room) => {
		if (room != null) {
			res.send(room);
		}
		else {
			res.status(404).send("Room " + req + " was not found");
		}
	});
})

app.get('/chat/:room_id/messages', sessionManager.middleware, (req, res) => {
	db.getLastConversation(req.params.room_id, req.query.before).then((convo) => {
		res.send(convo);
	});
})

app.route('/login')
	.post((req, res) => {
		db.getUser(req.body.username).then((user) => {
			if (!user) {
				res.redirect('/login');
			}
			else {
				if (isCorrectPassword(req.body.password, user.password)) {
					sessionManager.createSession(res, user.username);
					res.redirect('/');
				}
				else {
					res.redirect('/login');
				}
			}
		});
	});

app.route('/profile')
	.get(sessionManager.middleware, function(req, res) {
		console.log("profile get: " + req.username);
		var username = req.username;
		res.send(JSON.stringify({username: username}));
	});

app.route('/logout')
	.get((req, res) => {
		sessionManager.deleteSession(req);
		res.redirect('/login');
	});

app.use((err, req, res, next) => {
	if (err instanceof SessionManager.Error) {
		console.log("err handler");
		console.log("accept header: " + req.headers.accept);
		if (req.headers.accept === 'application/json') {
			console.log("sending 401");
			res.status(401).send(err);
		}
		else {
			res.redirect('/login');
		}
	}
	else {
		res.status(500).send('Something broke!');
	}
})

function isCorrectPassword(password, saltedHash) {
	var salt = saltedHash.slice(0, 20);

	var hash = crypto.createHash('sha256').update(password+salt).digest('base64');

	if (salt+hash === saltedHash) {
		return true;
	}
	else {
		return false;
	}
}

function sanitizeMessage(string) {
	const map = {
		'<': '&lt;',
		'>': '&gt;',
	};
	const reg = /[<>]/ig;
	return string.replace(reg, (match)=>(map[match]));
}

var broker = new ws.Server({ port: 8000 });

broker.on('connection', (ws, request) => {
	console.log("request: ");
	var cookie = request.headers.cookie;
	console.log(cookie);
	if (!cookie) {
		ws.close();
	}
	else {
		var parsed_cookie = cookie.slice(cookie.indexOf('=')+1, cookie.length);
		if (parsed_cookie.length < 15) {ws.close();}
		ws.on('message', (data) => {
			var parsed = JSON.parse(data);
			parsed.username = sessionManager.getUsername(parsed_cookie);

			parsed.text = sanitizeMessage(parsed.text);
			var message = JSON.stringify(parsed);
			
			for (client of broker.clients.values()) {
				if (client != ws) {
					client.send(message);
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
	}
});

cpen322.connect('http://52.43.220.29/cpen322/test-a5-server.js');
cpen322.export(__filename, { app, messages, broker, db, messageBlockSize, sessionManager, isCorrectPassword });