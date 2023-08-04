const crypto = require('crypto');

class SessionError extends Error {};

function SessionManager (){
	const CookieMaxAgeMs = 600000;

	const sessions = {};

	this.createSession = (response, username, maxAge = CookieMaxAgeMs) => {
        var tkn = crypto.randomBytes(20).toString('hex');
        var obj = new Object;
        obj.username = username;
        sessions[tkn] = obj; 

        response.cookie('cpen322-session', tkn, {maxAge: maxAge}); 

        setTimeout(() => {
            delete sessions[tkn];
        }, maxAge);
	};

	this.deleteSession = (request) => {
        delete sessions[request.session];
        delete request.username;
        delete request.session;
	};

	this.middleware = (request, response, next) => {
        var cookie = request.headers.cookie;
        if (!cookie) {
            next(new SessionError());
        }
        else {
            var parsed = cookie.slice(cookie.indexOf('=')+1, cookie.length);
            var cookies = parsed.split(';');
            for (var i = 0; i < cookies.length; i++) {
                parsed_cookie = cookies[i];
                if (!sessions[parsed_cookie]) {
                    next(new SessionError());
                    return;
                }
                else {
                    request.username = sessions[parsed_cookie].username;
                    request.session = parsed_cookie;
                    next();
                    return;
                }
            }
        }
	};

	this.getUsername = (token) => ((token in sessions) ? sessions[token].username : null);
};

// SessionError class is available to other modules as "SessionManager.Error"
SessionManager.Error = SessionError;

module.exports = SessionManager;