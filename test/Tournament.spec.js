var expect = require('chai').expect;
var Autowire = require('autowire');


Autowire(function(Dispatcher, Tournament, Utils) {

//**************** Helpers *********************

	var lastSentEventName;
	var lastSentEventParam;
	var eventQueue = [];
	var playerThatReceivedLastMsg;

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
				playerThatReceivedLastMsg = connection.spudzData.player;
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

	var p1_conn = createConnection();
	p1_conn.spudzData.player = 'p1';
	
	var p2_conn = createConnection();
	p2_conn.spudzData.player = 'p2';

	var p3_conn = createConnection();
	p3_conn.spudzData.player = 'p3';

	var p4_conn = createConnection();
	p4_conn.spudzData.player = 'p4';


	function broadcast_p1(evtName, obj, conn) {
		broadcast(evtName, obj, p1_conn);	
	}

	function broadcast_p2(evtName, obj, conn) {
		broadcast(evtName, obj, p2_conn);	
	}

	function broadcast_p3(evtName, obj, conn) {
		broadcast(evtName, obj, p3_conn);	
	}

	function broadcast_p4(evtName, obj, conn) {
		broadcast(evtName, obj, p4_conn);	
	}

	function andSignedUp_p1() {
		Tournament.currentRound.playerList.push(
			{
				player: p1_conn.spudzData.player,
				connection: p1_conn
			});
	}

	function andSignedUp_p2() {
		Tournament.currentRound.playerList.push(
			{
				player: p2_conn.spudzData.player,
				connection: p2_conn
			});
	}

	function andSignedUp_p3() {
		Tournament.currentRound.playerList.push(
			{
				player: p3_conn.spudzData.player,
				connection: p3_conn
			});
	}

	function andSignedUp_p4() {
		Tournament.currentRound.playerList.push(
			{
				player: p4_conn.spudzData.player,
				connection: p4_conn
			});
	}


	function withStartedTournament() {
		clearTournamentState();
		setCurrentTime(1000);
		broadcast('create_tournament', {
			startTime: 500,
			readyUpLimit: 100,
			maxPlayers: 20
		});
	}

	function withFutureTournament() {
		clearTournamentState();
		setCurrentTime(0);
		broadcast('create_tournament', {
			startTime: 500,
			readyUpLimit: 100,
			maxPlayers: 20
		});
	}