var ws = require("nodejs-websocket")
var Autowire = require('autowire');


Autowire(function(Dispatcher, Greeter, Matchmaker, MoveRelay, StatsTracker, DisconnectR) {

	var server = ws.createServer(function (conn) {

		Dispatcher.broadcast('new_connection', {
			connection: conn
		});

	  conn.on("text", function (str) {
	    var command = JSON.parse(str);
	    
	    Dispatcher.broadcast(command.name, {
	    	connection: conn,
	    	param: command.param
	    });
	    //conn.sendText(str.toUpperCase()+"!!!")
	  })

	  conn.on("close", function (code, reason) {
	    Dispatcher.broadcast('connection_closed', {
	    	connection: conn,
	    	code: code,
	    	reason: reason
	    });
	    //console.log("Connection closed")
	  })

	}).listen(8001)

	process.on('uncaughtException', function (err) {
	  console.log('Caught exception: ' + err);
	});

});