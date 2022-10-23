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

    // 3. D)
    var lobbyView = new LobbyView(lobby);
    var chatView = new ChatView();
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
    cpen322.export(arguments.callee, { renderRoute, lobbyView, chatView, profileView, lobby });
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
        this.buttonElem.addEventListener("click", function() {
            lobby.addRoom(input.value, input.value);
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
    constructor() {
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
    }
    // 8. C) COME BACK LATER HOPEFULLY IT WORKS THEN
    sendMessage() {
        var text = this.inputElem.value;
        // this.room is still null, so when you try to access this.room.addMessage, it is also null!
        this.room.addMessage(profile.username, text);
        this.inputElem.value = "";
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
}

// 5. C)
class Lobby {
    constructor() { // 5. C)
        this.rooms = [];
        var room1 = new Room("1", "room1");
        var room2 = new Room("2", "room2");
        var room3 = new Room("3", "room3");
        var room4 = new Room("4", "room4");
        this.rooms[room1.id] = room1;
        this.rooms[room2.id] = room2;
        this.rooms[room3.id] = room3;
        this.rooms[room4.id] = room4;
    }
    // 5. D)
    getRoom(roomId) {
        // search through all rooms and return the room with matching ID
        for (var key in this.rooms) {
            if (this.rooms[key].id == roomId) {
                return this.rooms[key];
            }
        }
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