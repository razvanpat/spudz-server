var ws = require("nodejs-websocket")
var Autowire = require('autowire');


process.on('uncaughtException', function (err) {
  console.log('Caught exception: ' + err);
  console.log(err.stack);
});

Autowire(function(Dispatcher, Greeter, Matchmaker, MoveRelay, StatsTracker) {

	var server = ws.createServer(function (conn) {

		Dispatcher.broadcast('new_connection', {
			connection: conn
		});

	  conn.on("text", function (str) {
	    var command = JSON.parse(str);

	    Dispatcher.broadcast(command.event, {
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
	  });

	  conn.on("error", function(errorObj) {
	  	var player = 'unknown';
	  	if(conn.spudzData != undefined) {
	  		player = conn.spudzData.player
	  	}
	  	console.log('ERROR for player ' + player, errorObj);
	  	Dispatcher.broadcast('connection_error', {
	    	connection: conn,
	    	errorObj: errorObj
	    });
	  });

	}).listen(8001)


});
