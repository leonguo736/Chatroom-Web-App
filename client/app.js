/*
 * Helper Functions
*/
// Removes the contents of the given DOM element (equivalent to elem.innerHTML = '' but faster)
function emptyDOM (elem){
    while (elem.firstChild) elem.removeChild(elem.firstChild);
}

// Creates a DOM element from the given HTML string
function createDOM (htmlString){
    let template = document.createElement('template');
    template.innerHTML = htmlString.trim();
    return template.content.firstChild;
}
/**
 * Task 8
 */
// 8. A)
var profile = new Object();
profile.username = "Alice";

function main() {
    /**
     * Task 6
     */
    // 6. A)
    var lobby = new Lobby();

    /**
     * assignment 3 task 4
     */
    var socket = new WebSocket("ws://localhost:3000");
    socket.addEventListener("message", (e)=> {
        console.log("socket: e is " + e);
        var parsed = JSON.parse(e["data"]);
        // var parsed = JSON.stringify(e["data"]);
        // socket.send(parsed);
        // console.log("socket: " + parsed.roomId);

        var room = lobby.getRoom(parsed.roomId);
        room.addMessage(parsed.username, parsed.text);
    });

    // 3. D)
    var lobbyView = new LobbyView(lobby);
    var chatView = new ChatView(socket);
    var profileView = new ProfileView();

    /* 
     * Task 2 
    */
   // 2. A) 
    function renderRoute() {
        var path = window.location.hash;
        var splitPath = path.split("/");

        if (path == "#/") {
            var pageview = document.getElementById("page-view");
            emptyDOM(pageview);
            // 3. E)
            pageview.append(lobbyView.elem);
        }
        else if (splitPath[1] == "chat") {
            var pageview = document.getElementById("page-view");
            emptyDOM(pageview);
            // 3. E)
            pageview.append(chatView.elem);
            // 8. F)
            var splitPath = path.split("/");
            var room = lobby.getRoom(splitPath[2]);
            
            try {
                if (room == null) throw "null";
                if (room == undefined) throw "undefined";
                chatView.setRoom(room);
            }
            catch(err) {
                console.log("Room is " + err);
            }
        }
        else if (path == "#/profile") {
            var pageview = document.getElementById("page-view");
            emptyDOM(pageview);
            // 3. E)
            pageview.append(profileView.elem);
        }
    }
    // 2. B)
    window.addEventListener("popstate", renderRoute);

    // 2. C) 
    renderRoute();
    cpen322.export(arguments.callee, { renderRoute, lobbyView, chatView, profileView, lobby, refreshLobby, socket });

    // assignment 3 start
    function refreshLobby() {
        Service.getAllRooms().then((result) => {
            console.log("refreshing the lobby");
            for (var i = 0; i < result.length; i++) {
                var room = result[i];
                // console.log("room id is " + room.id);
                var existingRoom = lobby.getRoom(room._id);
                // console.log("key is " + existingRoom);

                if (existingRoom == -1) { // room does not exist. 
                    // console.log("creating new room with id " + room.id);
                    lobby.addRoom(room._id, room.name, room.image, room.messages);
                }
                else {
                    // console.log("updating room with id " + existingRoom.id );
                    existingRoom.name = room.name;
                    existingRoom.image = room.image;
                }
            }
        });
    }
    refreshLobby();
    var ret = setInterval(refreshLobby, 6000);
    // if (flag) clearInterval(ret);
}

/* 
 * Task 1
*/
window.addEventListener("load", main);

/*
 * Task 3 and 4
*/
class LobbyView {
    constructor(lobby) {
        this.elem = createDOM(
            `<div id="page-view">
                <div class="content">
                    <ul class="room-list">
                        <li>
                            <img class="menu-image" src="/assets/everyone-icon.png">
                            <a href="#/chat/everyone">Everyone in CPEN 400A</a>
                        </li>
                        <li>
                            <img class="menu-image" src="/assets/bibimbap.jpg">
                            <a href="#/chat/foodies">Foodies Only</a>
                        </li>
                        <li>
                            <img class="menu-image" src="/assets/minecraft.jpg">
                            <a href="#/chat/gamers">Gamers Rule</a>
                        </li>
                    </ul>
                    <div class="page-control">
                        <input class="control-input" type="text" value="">
                        <button class="control-button" type="button">Create Room</button>
                    </div>
                </div>
            </div>`
        );
        // 4. B)
        this.listElem = this.elem.querySelector("ul.room-list");
        this.inputElem = this.elem.querySelector("input");
        this.buttonElem = this.elem.querySelector("button");
        // 6. B)
        this.lobby = lobby;
        // 6. C)
        this.redrawList();
        // 6. D)
        var input = this.inputElem;
        this.buttonElem.addEventListener("click", function() { // click event here
            console.log("LobbyView: click event triggered");
            var result = Service.addRoom({name: input.value, image: "/assets/everyone-icon.png"});
            result.then(value=> {
                lobby.addRoom(value._id, value.name, value.image);
                console.log("LobbyView: " + value._id + value.name + value.image);
            });
            
            input.value = "";
        });
        // 7. B)
        var list = this.listElem;
        this.lobby.onNewRoom = function(room) {
            var tempElem = createDOM(
                `<li>
                    <img class="menu-image" src="/assets/minecraft.jpg">
                    <a href="#/chat">Placeholder</a>
                </li>`
            );
            list.append(tempElem);
            var img = tempElem.querySelector("img");
            img.src = room.image;

            var a = tempElem.querySelector("a")
            a.innerHTML = room.name;
            var text1 = "#/chat/";
            a.href = text1.concat(room.id);
        };
    }
    // 6. C)
    redrawList() {
        emptyDOM(this.listElem);
    
        for (let key in this.lobby.rooms) {
            var room = this.lobby.rooms[key];
            var tempElem = createDOM(
                `<li>
                    <img class="menu-image" src="/assets/minecraft.jpg">
                    <a href="#/chat">Placeholder</a>
                </li>`
            );  
            this.listElem.append(tempElem);
            var img = tempElem.querySelector("img");
            img.src = room.image;

            var a = tempElem.querySelector("a")
            a.innerHTML = room.name;
            var text1 = "#/chat/";
            a.href = text1.concat(room.id);
        }
    }
}

class ChatView {
    constructor(socket) {
        this.elem = createDOM(
            `<div id="page-view">
                <div class="content">
                    <h4 class="room-name">
                        Everyone in CPEN400A
                    </h4>
                    <div class="message-list">
                        <div class="message">
                            <span class="message-user">Bob</span>
                            <span class="message-text">Hey guys!</span>
                        </div>
                        <div class="message my-message">
                            <span class="message-user">Alice</span>
                            <span class="message-text">Hey guys!</span>
                        </div>
                    </div>
                    <div class="page-control">
                        <textarea class="textarea">type your message here</textarea>
                        <button class="control-button" type="button">Send</button>
                    </div>
                </div>
            </div>`
        );
        // 4. A)
        this.titleElem = this.elem.querySelector("h4");
        this.chatElem = this.elem.querySelector("div.message-list");
        this.inputElem = this.elem.querySelector("textarea");
        this.buttonElem = this.elem.querySelector("button");
        // 8. D)
        this.room = null;
        this.buttonElem.addEventListener("click", () => {
            this.sendMessage();
        });
        this.inputElem.addEventListener("keyup", (event) => {
            if ((!event.shiftKey) && (event.keyCode == 13)) {
                this.sendMessage();
            }
        });
        //assignment 3 
        this.socket = socket;
    }
    // 8. C) COME BACK LATER HOPEFULLY IT WORKS THEN
    sendMessage() {
        var text = this.inputElem.value;
        // this.room is still null, so when you try to access this.room.addMessage, it is also null!
        this.room.addMessage(profile.username, text);
        this.inputElem.value = "";

        // assignment 3 task4
        var jsonString = new Object;
        jsonString.roomId = this.room.id;
        jsonString.username = profile.username;
        jsonString.text = text;
        this.socket.send(JSON.stringify(jsonString));
    }
    // 8. E)
    setRoom(room) {
        this.room = room;
        this.titleElem.innerText = this.room.name;
        emptyDOM(this.chatElem);
        for (let key in this.room.messages) {
            var msg = this.room.messages[key];
            var tempElem;
            if (msg.username == profile.username) {
                tempElem = createDOM(
                    `<div class="message my-message">
                        <span class="message-user">${msg.username}</span>
                        <span class="message-text">${msg.text}</span>
                    </div>`
                ); 
            }
            else {
                tempElem = createDOM(
                    `<div class="message">
                        <span class="message-user">${msg.username}</span>
                        <span class="message-text">${msg.text}</span>
                    </div>`
                );
            } 
            this.chatElem.append(tempElem);
        }
        this.room.onNewMessage = (message) => {
            var tempElem;
            if (message.username == profile.username) {
                tempElem = createDOM(
                    `<div class="message my-message">
                        <span class="message-user">${message.username}</span>
                        <span class="message-text">${message.text}</span>
                    </div>`
                ); 
            }
            else {
                tempElem = createDOM(
                    `<div class="message">
                        <span class="message-user">${message.username}</span>
                        <span class="message-text">${message.text}</span>
                    </div>`
                );
            } 
            this.chatElem.append(tempElem);
        }
    }
}

class ProfileView {
    constructor() {
        this.elem = createDOM(
            `<div id="page-view">
                <div class="content">
                    <div class="profile-form">
                        <div class="form-field">
                            <label>Username</label>
                            <input type="text">
                        </div>
                        <div class="form-field">
                            <label>Password</label>
                            <input type="password">
                        </div>
                        <div class="form-field">
                            <label>Avatar Image</label>
                            <img id="profile-image" src="/assets/profile-icon.png">
                            <input type="file">
                        </div>
                    </div>
                    <div class="page-control">
                        <button class="control-button" type="button">Save</button>
                    </div>
                </div>
            </div>`
        );
    }
}

/**
 * Task 5 
 */
class Room {
    constructor(id, name, image = "assets/everyone-icon.png", messages = []) { // 5. A)
        this.id = id;
        this.name = name;
        this.image = image;
        this.messages = messages;
        this.canLoadConversation = true;
        this.generator = makeConversationLoader(this);
    }
    // 5. B)
    addMessage(username, text) {
        if (text.trim().length > 0) {
            var msg = new Object();
            msg.username = username;
            msg.text = text;
            this.messages.push(msg);
            
            // 8. B)
            if (typeof this.onNewMessage === 'function') {
                this.onNewMessage(msg);
            }
        }
        else {
            return;
        }
    }
    addConversation(conversation) {
        // var newMessageArray = [];
        for (var i = 0; i < conversation.messages.length; i++) {
            this.messages.push(conversation.messages[i]);
        }
        // for (var i = 0; i < this.messages.length; i++) {
        //     newMessageArray.push(this.messages[i]);
        // }
        // this.messages = newMessageArray;

        this.onFetchConversation(conversation);
    }
}

// 5. C)
class Lobby {
    constructor() { // 5. C)
        // this.rooms = [];
        // var room1 = new Room("1", "room1");
        // var room2 = new Room("2", "room2");
        // var room3 = new Room("3", "room3");
        // var room4 = new Room("4", "room4");
        // this.rooms[room1.id] = room1;
        // this.rooms[room2.id] = room2;
        // this.rooms[room3.id] = room3;
        // this.rooms[room4.id] = room4;
        this.rooms = new Object;
    }
    // 5. D)
    getRoom(roomId) {
        // search through all rooms and return the room with matching ID
        for (var key in this.rooms) {
            if (this.rooms[key].id == roomId) {
                return this.rooms[key];
            }
        }
        return -1; // can also try returning null
    }
    // 5. E)
    addRoom(id, name, image, messages) {
        var newRoom = new Room(id, name, image, messages);
        this.rooms[newRoom.id] = newRoom;
        // 7. A)
        if (typeof this.onNewRoom === 'function') {
            this.onNewRoom(newRoom);
        }
    }
}

/**
 *  Assignment 3
 */

var Service = {
    origin: window.location.origin,
    getAllRooms: function() {
        var promiseObj = new Promise(function(resolve, reject) {
            var xhr = new XMLHttpRequest();
            xhr.open("GET", Service.origin + "/chat");
            xhr.onload = function() { 
                if (xhr.status === 200){
                   console.log("getAllRooms: xhr done successfully");
                   var resp = xhr.responseText;
                   var respJson = JSON.parse(resp);
                   resolve(respJson);
                } 
                else {
                   reject(new Error(xhr.responseText)); // is this rejecting client side or server side error?
                   console.log("getAllRooms: xhr failed");
                }
            } 
            xhr.onerror = function(error) {
                reject(new Error(error));
                console.log("getAllRooms: promise rejected");
            }
            xhr.send();
            console.log("getAllRooms: request sent succesfully");
        });
        return promiseObj;
    },
    addRoom: function(data) {
        var promiseObj = new Promise(function(resolve, reject) {
            let xhr = new XMLHttpRequest();
            xhr.open("POST", Service.origin + "/chat");
            // xhr.setRequestHeader("Accept", "application/json");
            xhr.setRequestHeader("Content-Type", "application/json");
            xhr.send(JSON.stringify(data));
            console.log("addRoom: data sent?");

            xhr.onload = function() { 
                if (xhr.status === 200){
                console.log("addRoom: xhr done successfully. data is " + data.name);
                // this.lobby.addRoom(data.name, data.image);
                var resp = xhr.responseText;
                var respJson = JSON.parse(resp);
                resolve(respJson);
                } 
                else {
                reject(new Error(xhr.responseText)); // is this rejecting client side or server side error?
                console.log("addRoom: xhr failed");
                }
            } 
            xhr.onerror = function(error) {
                reject(new Error(error));
                console.log("addRoom: promise rejected");
            }
        });
        return promiseObj;
    },
    getLastConversation: function(roomId, before) {
        var promiseObj = new Promise(function(resolve, reject) {
            var xhr = new XMLHttpRequest();
            xhr.open("GET", Service.origin + "/chat/" + roomId + "/messages?before=" + before);
            xhr.onload = function() { 
                if (xhr.status === 200){
                   console.log("getLastConvo: xhr done successfully");
                   var resp = xhr.responseText;
                   var respJson = JSON.parse(resp);
                   resolve(respJson);
                } 
                else {
                   reject(new Error(xhr.responseText)); // is this rejecting client side or server side error?
                   console.log("getLastConvo: xhr failed");
                }
            } 
            xhr.onerror = function(error) {
                reject(new Error(error));
                console.log("getLastConvo: promise rejected");
            }
            xhr.send();
            console.log("ggetLastConvo: request sent succesfully");
        });
        return promiseObj;
    }
};

// assignment 4
function* makeConversationLoader(room) {
    var recentBlock;
    room.canLoadConversation = false;

    var i = 0;
    while(i < 5) {
        Service.getLastConversation(room.id).then(
            (result) => {
                recentBlock = result;
                room.addConversation(result);
            },
            (error) => {
                
            }
        ); 
        i++;
    }  

}
