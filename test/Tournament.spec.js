var expect = require('chai').expect;
var Autowire = require('autowire');
var TournamentClass = require('../src/Tournament');

Autowire(function(_, Dispatcher, Utils) {

//**************** Helpers *********************

	var lastSentEventName;
	var lastSentEventParam;
	var playerThatReceivedLastMsg;
	var playerShuffleCalled;
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

	function withNewTournament() {};
	function withConfiguredTournament() {
			broadcast('configure_tournament', {
				startTime: 500
			});
	};
	function withStartedTournament() {
		withConfiguredTournament();
			signUpPlayer('p1');
			signUpPlayer('p2');
			signUpPlayer('p3');
			signUpPlayer('p4');

			Tournament.onTournamentStart();
	}


	function signUpPlayer(p) {
			broadcast('tournament_sign_up', {}, createConnection({
				playerId: p
			}));		
	}

	//************** specs *******************

	var Tournament;

	describe('Tournament', function() {
		beforeEach(function() {
			Tournament = new TournamentClass();
			playerShuffleCalled = false;
			Tournament.shufflePlayers = function(list) {
				playerShuffleCalled = true;
				return list;
			}
		});

		it('is set up with a start time', function() {		
			broadcast('configure_tournament', {
				startTime: 500
			});

			expect(Tournament.startTime).to.equal(500);
		});

		it('accepts player sign ups when in configured state', function() {
			withConfiguredTournament();

			signUpPlayer('p1');

			expect(
				_.find(Tournament.playersSignedUp, function(elem) {
					return elem.playerId === 'p1';
			})).to.exist;

		});

		it('on start time it randomly creates matches with signed up players', function() {
			withConfiguredTournament();
			signUpPlayer('p1');
			signUpPlayer('p2');
			signUpPlayer('p3');
			signUpPlayer('p4');

			Tournament.onTournamentStart();

			expect(Tournament.matches.length).to.equal(2);			
		});
		
		it('monitors match ends and creates a new round of matches when every match has ended', function() {
			withStartedTournament();
			Tournament.matches[0].ended = true;
			Tournament.matches[0].winner = Tournament.playersSignedUp[0];
			Tournament.matches[1].ended = true;
			Tournament.matches[1].winner = Tournament.playersSignedUp[2];

			broadcast('match_end', Tournament.matches[0]);

			expect(Tournament.matches.length).to.equal(1);
			expect(Tournament.matches[0].player1).to.equal(Tournament.playersSignedUp[0]);
			expect(Tournament.matches[0].player2).to.equal(Tournament.playersSignedUp[2]);
		});

		it('moves forward to next round any player without a match on start', function() {
			withConfiguredTournament();
			signUpPlayer('p1');
			signUpPlayer('p2');
			signUpPlayer('p3');
			Tournament.onTournamentStart();
			Tournament.matches[0].ended = true;
			Tournament.matches[0].winner = Tournament.playersSignedUp[0];
			
			broadcast('match_end', Tournament.matches[0]);

			expect(Tournament.matches.length).to.equal(1);
			expect(Tournament.matches[0].player2).to.equal(Tournament.playersSignedUp[2]);
		});

		it('moves forward to next round any player without a match on second round', function() {
			withConfiguredTournament();
			signUpPlayer('p1');
			signUpPlayer('p2');
			signUpPlayer('p3');
			signUpPlayer('p4');
			signUpPlayer('p5');
			signUpPlayer('p6');

			Tournament.onTournamentStart();
			Tournament.matches[0].ended = true;
			Tournament.matches[0].winner = Tournament.playersSignedUp[0];
			Tournament.matches[1].ended = true;
			Tournament.matches[1].winner = Tournament.playersSignedUp[2];
			Tournament.matches[2].ended = true;
			Tournament.matches[2].winner = Tournament.playersSignedUp[4];
			broadcast('match_end', Tournament.matches[0]);
			Tournament.matches[0].ended = true;
			Tournament.matches[0].winner = Tournament.playersSignedUp[0];
			broadcast('match_end', Tournament.matches[0]);
			
			expect(Tournament.matches.length).to.equal(1);
			expect(Tournament.matches[0].player2).to.equal(Tournament.playersSignedUp[4]);
		});


		it('notifies the player without a match that he advances', function() {
			withConfiguredTournament();
			signUpPlayer('p1');
			signUpPlayer('p2');
			signUpPlayer('p3');

			Tournament.newStage();
			
			expect(lastSentEventName).to.equal('tournament_advance');
		});

		it('declares a winner when only one player is left', function() {
			withConfiguredTournament();
			signUpPlayer('p1');
			signUpPlayer('p2');
			signUpPlayer('p3');
			signUpPlayer('p4');
			signUpPlayer('p5');
			signUpPlayer('p6');

			Tournament.onTournamentStart();
			Tournament.matches[0].ended = true;
			Tournament.matches[0].winner = Tournament.playersSignedUp[0];
			Tournament.matches[1].ended = true;
			Tournament.matches[1].winner = Tournament.playersSignedUp[2];
			Tournament.matches[2].ended = true;
			Tournament.matches[2].winner = Tournament.playersSignedUp[4];
			broadcast('match_end', Tournament.matches[0]);

			Tournament.matches[0].ended = true;
			Tournament.matches[0].winner = Tournament.playersSignedUp[0];
			broadcast('match_end', Tournament.matches[0]);

			Tournament.matches[0].ended = true;
			Tournament.matches[0].winner = Tournament.playersSignedUp[4];
			broadcast('match_end', Tournament.matches[0]);
			
			expect(lastSentEventName).to.equal('tournament_advance');
		});
		
		it('reshuffles players on every round', function() {
			withConfiguredTournament();
			signUpPlayer('p1');
			signUpPlayer('p2');
			signUpPlayer('p3');

			Tournament.newStage();
			
			expect(playerShuffleCalled).to.be.true;
		});
	});
});