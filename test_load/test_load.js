var expect = require('chai').expect;
var Autowire = require('autowire');
var WebSocket = require('ws');

var messageCount = 0;
setInterval(function() {
	console.log(" *** Messages passed around: " + messageCount);
}, 3000)

for(var i=0; i<2000; i++) {
setTimeout(function(t) {	
	var ws = new WebSocket('ws://razvanpat.info.tm:8001');
	ws.name = 'Drone' + t;
	ws.on('open', function() {
		console.log(this.name + ' connected');
		var that = this;
		setTimeout(function() {
			console.log(that.name + ' closing');
			that.close();
		}, 80000);
	});

	ws.on('message', function(data, flags) {
  	//console.log(this.name + ' received message', data);
  	messageCount++;
  	var dataObj = JSON.parse(data);

		if(this.readyState !== WebSocket.OPEN) {
			return;
		}

  	if(dataObj.name === 'welcome') {
  		this.send(JSON.stringify({
  			name: 'register_name',
  			param: this.name
  		}));
  	} else if(dataObj.name === 'player_registered') {
  		this.send(JSON.stringify({
  			name: 'find_match'
  		}));
  	} else {
  		var that = this;
  		var t = Math.floor(Math.random() * 1000) + 500;
  		setTimeout(function() {
  			if(that.readyState !== WebSocket.OPEN) {
  				return;
  			}
  			var m = Math.floor(Math.random() * 100);
	  		that.send(JSON.stringify({
	  			name: 'move',
	  			param: {
	  				postion: m
	  			}
	  		}));
  		}, t);
  	}
  });

  ws.on('close', function() {
	  console.log(this.name + ' disconnected');
	});

	ws.on('error', function(err) {
		console.log('Error for ' + this.name, err);
	});
}, 10*i, i);
}


