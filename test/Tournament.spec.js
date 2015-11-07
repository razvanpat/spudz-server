var expect = require('chai').expect;
var Autowire = require('autowire');


Autowire(function(Dispatcher, Tournament, Utils) {

//**************** Helpers *********************

	var lastSentEventName;
	var lastSentEventParam;
	var playerThatReceivedLastMsg;
	var eventQueue = [];

	function clearTournamentState() {
		Tournament.currentRound = {};
		Tournament.previousRounds = [];
	}

	function createConnection(obj) {
		if(obj && obj.spudzData) {
			return obj;
		}

		var connection = obj || {
			spudzData: {
				player: 'px'
			}
		};
		connection.sendEvent = function(name, param, player) {
			lastSentEventName = name;
			lastSentEventParam = param;
			eventQueue.push({
				name: name,
				param: param,
				player: player
			});
			if(connection.spudzData) {
				playerThatReceivedLastMsg = player;
			}
		}
		return connection;
	}

	function broadcast(evtName, obj, conn) {	
		Dispatcher.broadcast(evtName, {
			connection: createConnection(conn),
			param: obj
		});
	}


	function setCurrentTime(time) {
		Utils.getTime = function() {
			return time;
		};
	}

	//************** specs *******************


	describe('Tournament', function() {
		it('is set up with a start time', function() {
			broadcast('configure_tournament', {
				startTime: 500
			});

			expect(Tournament.startTime).to.equal(500);
		});

		xit('accepts player sign ups');
		xit('on start time it randomly creates matches with signed up players');
		xit('monitors match ends and creates a new round of matches when every match has ended');
		xit('reshuffles players on every round');
		xit('moves forward to next round any player without a match');
		xit('declares a winner when only one player is left');
	});
});