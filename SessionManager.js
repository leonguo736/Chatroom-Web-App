const crypto = require('crypto');

class SessionError extends Error {};

function SessionManager (){
	// default session length - you might want to
	// set this to something small during development
	const CookieMaxAgeMs = 600000;

	// keeping the session data inside a closure to keep them protected
	const sessions = {};

	// might be worth thinking about why we create these functions
	// as anonymous functions (per each instance) and not as prototype methods
	this.createSession = (response, username, maxAge = CookieMaxAgeMs) => {
		/* To be implemented */
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
		/* To be implemented */
        delete sessions[request.session];
        delete request.username;
        delete request.session;
	};

	this.middleware = (request, response, next) => {
		/* To be implemented */
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

	// this function is used by the test script.
	// you can use it if you want.
	this.getUsername = (token) => ((token in sessions) ? sessions[token].username : null);
};

// SessionError class is available to other modules as "SessionManager.Error"
SessionManager.Error = SessionError;

module.exports = SessionManager;