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


	function broadcast_p1(evtName, obj, conn) {
		broadcast(evtName, obj, p1_conn);	
	}

	function broadcast_p2(evtName, obj, conn) {
		broadcast(evtName, obj, p2_conn);	
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
/*
	var lastDispatchedEvent;
	var lastDispatchedArg;
	Dispatcher.registerAll(this, function(evtName, arg) {
		lastDispatchedEvent = evtName;
		lastDispatchedArg = arg;
	});
*/

//************ Test Cases *****************

	describe('Tournament', function() {
		beforeEach(function() {
			clearTournamentState();
			delete lastSentEventName;
			delete lastSentEventParam;
			eventQueue = [];
			p1_conn = createConnection();
			p1_conn.spudzData.player = 'p1';
			p2_conn = createConnection();
			p2_conn.spudzData.player = 'p2';
			setCurrentTime(0);
		});

		describe('create_tournament', function() {

			it('creates a new round', function() {
				withFutureTournament();

				expect(Tournament.currentRound.startTime).to.equal(500);
				expect(Tournament.currentRound.readyUpLimit).to.equal(100);
				expect(Tournament.currentRound.maxPlayers).to.equal(20);
				expect(Tournament.currentRound.playerList).to.be.an('array');
				expect(Tournament.currentRound.playersOut).to.be.an('array');
				expect(Tournament.currentRound.winners).to.be.an('array');
				expect(Tournament.currentRound.startAllowed).to.be.false;
			});


			it('sets startAllowed true when tournament is created with startTime before current time', function() {
				withStartedTournament();

				expect(Tournament.currentRound.startAllowed).to.be.true;
			});

			it('removes previous round', function() {
				withFutureTournament();
				Tournament.currentRound.test = 1;

				withStartedTournament();

				expect(Tournament.currentRound.test).to.not.exist;
			})
		});

		describe('tournament_sign_up', function() {

			it('adds the player to the player list', function() {
				withFutureTournament();
				broadcast_p1('tournament_sign_up', {});

				expect(Tournament.currentRound.playerList[0].player).to.equal('p1');
				expect(Tournament.currentRound.playerList[0].connection).to.equal(p1_conn);
			});

			it('responds with tournament_signed_up when successful', function() {
				withFutureTournament();
				
				broadcast_p1('tournament_sign_up', {});

				expect(lastSentEventName).to.equal('tournament_signed_up');
			});

			it('rejects sign up if tournament is already started', function() {
				withStartedTournament();

				broadcast_p1('tournament_sign_up', {});

				expect(lastSentEventName).to.equal('tournament_already_started');
				expect(Tournament.currentRound.playerList.length).to.equal(0);
			});
		});

		describe('tournament_ready', function() {
			it('sets the current player\'s ready state to true', function() {
				withStartedTournament();
				andSignedUp_p1();

				broadcast_p1('tournament_ready', {}, p1_conn);

				expect(Tournament.currentRound.playerList[0].connection.spudzData.ready).to.be.true;
				expect(lastSentEventName).to.equal('waiting_for_opponent');
				
			});

			it('outputs error if player is not signed up', function() {
				withStartedTournament();

				broadcast_p1('tournament_ready', {}, p1_conn);				

				expect(lastSentEventName).to.equal('error');
			});

			it('sends matchmaking found if oponent is also ready', function() {
				withStartedTournament();
				andSignedUp_p1();
				andSignedUp_p2();
				p1_conn.spudzData.opponent = p2_conn;
				p2_conn.spudzData.opponent = p1_conn;
				p2_conn.spudzData.ready = true;

				broadcast_p1('tournament_ready', {});

				expect(eventQueue[0].name).to.equal('match_found');
				expect(eventQueue[0].param.opponentId).to.equal('p2');
				expect(eventQueue[0].param.firstPlayer).to.exist;
			});

			it('sets the opponent in player list', function() {
				withStartedTournament();
				andSignedUp_p1();
				andSignedUp_p2();
				p1_conn.spudzData.opponent = p2_conn;
				p2_conn.spudzData.opponent = p1_conn;
				p2_conn.spudzData.ready = true;

				broadcast_p1('tournament_ready', {});

				expect(Tournament.currentRound.playerList[0].player).to.equal('p1');
				expect(Tournament.currentRound.playerList[0].opponent).to.equal('p2');
			});

		});

		describe('connection_closed', function() {
			it('moves the opponent to the winner list', function() {
				withStartedTournament();
				andSignedUp_p1();
				andSignedUp_p2();
				p1_conn.spudzData.opponent = p2_conn;
				p2_conn.spudzData.opponent = p1_conn;

				broadcast_p1('connection_closed', {});
				
				expect(Tournament.currentRound.winners.indexOf(p2_conn)).to.be.greaterThan(-1);
				expect(Tournament.currentRound.playerList.indexOf(p2_conn)).to.equal(-1);
			});

			it('removes the connection from player list', function() {
				withStartedTournament();
				andSignedUp_p1();
				andSignedUp_p2();
				p1_conn.spudzData.opponent = p2_conn;
				p2_conn.spudzData.opponent = p1_conn;

				broadcast_p1('connection_closed', {});
				
				expect(Tournament.currentRound.playerList.indexOf(p1_conn)).to.equal(-1);
			});

			it('adds the player id to the players out list', function() {
				withStartedTournament();
				andSignedUp_p1();
				andSignedUp_p2();
				p1_conn.spudzData.opponent = p2_conn;
				p2_conn.spudzData.opponent = p1_conn;

				broadcast_p1('connection_closed', {});
				
				expect(Tournament.currentRound.playersOut.indexOf('p1')).to.be.greaterThan(-1);
			});
		});

		describe('connection_error', function() {
			it('moves the opponent to the winner list', function() {
				withStartedTournament();
				andSignedUp_p1();
				andSignedUp_p2();
				p1_conn.spudzData.opponent = p2_conn;
				p2_conn.spudzData.opponent = p1_conn;

				broadcast_p1('connection_error', {});
				
				expect(Tournament.currentRound.winners.indexOf(p2_conn)).to.be.greaterThan(-1);
				expect(Tournament.currentRound.playerList.indexOf(p2_conn)).to.equal(-1);
			});

			it('removes the connection from player list', function() {
				withStartedTournament();
				andSignedUp_p1();
				andSignedUp_p2();
				p1_conn.spudzData.opponent = p2_conn;
				p2_conn.spudzData.opponent = p1_conn;

				broadcast_p1('connection_error', {});
				
				expect(Tournament.currentRound.playerList.indexOf(p1_conn)).to.equal(-1);
			});

			it('adds the player id to the players out list', function() {
				withStartedTournament();
				andSignedUp_p1();
				andSignedUp_p2();
				p1_conn.spudzData.opponent = p2_conn;
				p2_conn.spudzData.opponent = p1_conn;

				broadcast_p1('connection_error', {});
				
				expect(Tournament.currentRound.playersOut.indexOf('p1')).to.be.greaterThan(-1);
			});
		});

		describe('verify_state', function() {
			it('sets startAllowed to true when the start time is reached', function() {
				withFutureTournament();
				andSignedUp_p1();
				andSignedUp_p2();

				broadcast('verify_state', {});
				expect(Tournament.currentRound.startAllowed).to.be.false;

				setCurrentTime(550);

				broadcast('verify_state', {});
				expect(Tournament.currentRound.startAllowed).to.be.true;
			});

			it('sets the round start when the tournament start is reached', function() {
				withFutureTournament();
				andSignedUp_p1();
				andSignedUp_p2();
				broadcast('verify_state', {}); //resets the previousVerifyTime to 0
				setCurrentTime(550);
				
				broadcast('verify_state', {});
				
				expect(Tournament.currentRound.roundStartTime).to.equal(500);
			});
			
			it('creates a new round once all players finished their game', function() {
				withStartedTournament();
				andSignedUp_p1();
				andSignedUp_p2();
				p1_conn.spudzData.opponent = p2_conn;
				p2_conn.spudzData.opponent = p1_conn;
				broadcast_p1('tournament_ready', {});
				broadcast_p2('tournament_ready', {});
				Tournament.setMatchWin(p1_conn.spudzData.player);
				var round = Tournament.currentRound;

				broadcast('verify_state', {});

				expect(Tournament.currentRound).to.not.equal(round);
				expect(Tournament.previousRounds.indexOf(round)).to.be.greaterThan(-1);
			});

			it('disqualifies players who did not ready up in time', function() {
				withStartedTournament();
				andSignedUp_p1();
				andSignedUp_p2();
				p1_conn.spudzData.opponent = p2_conn;
				p2_conn.spudzData.opponent = p1_conn;
				Tournament.currentRound.roundStartTime = 500;
				broadcast_p1('tournament_ready', {});
				broadcast_p2('tournament_ready', {});
				setCurrentTime(550);
				broadcast('verify_state', {});
				broadcast_p1('tournament_ready', {});

				setCurrentTime(650)
				broadcast('verify_state', {});

				expect(Tournament.getPlayer('p1').matchWin).to.be.true;
				expect(Tournament.getPlayer('p2').matchWin).to.be.false;


			});
			
			xit('saves the tournament state to db');
		});
	});

});