var expect = require("chai").expect;
var Match = require("../src/Match");
var _ = require("underscore");

describe("Match", function(){
    function storeEvents(array){
        return function(evtName){
            array.push(evtName);
        };
    }
    var player1 = {
        player : 'p1',
        sendEvent : _.noop
    };
    var player2 = {
        player : 'p2',
        sendEvent : _.noop
    };
    function createMatchWith(pl1, pl2){
        var match = new Match(pl1,pl2);
        match._pickRandomPlayer = function(){
            return pl1;
        };
        match.start();
        return match;
    }
    function createMatch(){
        var match = new Match(player1,player2);
        match._pickRandomPlayer = function(){
            return player1;
        };
        match.start();
        return match;
    }
    function moveToCharacterSelection(match){
        match.playerReadyEvent(match.player1);
        match.playerReadyEvent(match.player2);
        return match;
    }

    function moveToPlay(match){
        match.playerCharacterSelectedEvent(match.player1);
        match.playerCharacterSelectedEvent(match.player2);
        return match;
    }

    it("start as ready", function(){
        var match = new Match();
        match.start();
        expect(match.state()).to.be.equal('readyUp');
    });
    describe("when both players are ready (playerReadyEvent)", function(){
        it("it switches to 'characterSelection' state", function(){
            var match = createMatch();
            match.playerReadyEvent(player1);
            expect(match.state()).to.be.equal('readyUp');

            match.playerReadyEvent(player2);
            expect(match.state()).to.be.equal('characterSelection');
        });
    });
    describe("when both players have selected the character (playerCharacterSelectedEvent)", function(){
        it("it switches to 'play' state", function(){
            var match = moveToCharacterSelection(createMatch());
            match.playerCharacterSelectedEvent(player1);
            expect(match.state()).to.be.eql('characterSelection');

            match.playerCharacterSelectedEvent(player2);
            expect(match.state()).to.be.eql('play');

        });
        describe('_pickRandomPlayer', function(){
            it('returns either player1 or player2', function(){
                var player = createMatch()._pickRandomPlayer();
                expect(player === player1 || player === player2).to.be.true;
            });
        });
        it("pick a random player to go first", function(){
            var match = _.compose(moveToPlay, moveToCharacterSelection, createMatch)();
            expect(match.currentPlayer).to.be.equal(player1);
        });
        it("broadcasts to the current player 'your_move'", function(done){
            var pl1 = {
                sendEvent : function(eventName){
                    expect(eventName).to.be.eql('your_move');
                    done();
                }
            }
            var pl2 = {};
            moveToPlay(moveToCharacterSelection(createMatchWith(pl1, pl2)));
        });
    });

    describe("when a player is done moving (end_turn)", function(){
        it("changes to the second player", function(){
            var match = _.compose(moveToPlay, moveToCharacterSelection, createMatch)();
            match.endTurn(match.currentPlayer);
            expect(match.currentPlayer).to.be.equal(player2);
        });
        it("broadcasts to the second player 'your_move'", function(done){
            var pl1 = {
                sendEvent : _.noop
            };
            var pl2 = {
                sendEvent : function(eventName){
                    expect(eventName).to.be.eql('your_move');
                    done();
                }
            }
            var match = createMatchWith(pl1, pl2);
            _.compose(moveToPlay, moveToCharacterSelection)(match);
            match.endTurn(match.currentPlayer);
        });
    });

    describe('when a player moves', function(){
        var match, player1, player2;
        function setupStuff(p1F, p2F){
            player1 = {
                sendEvent : p1F
            };
            player2 = {
                sendEvent : p2F
            }
            match = createMatchWith(player1, player2);
            _.compose(moveToPlay, moveToCharacterSelection)(match);
        };

        var PLAYER1_WIN_ACTION = {
            player1 : {
                health : 10,
            },
            player2 : {
                health : 0
            }
        };


        it("broadcasts the move to the other player (opponent_move)", function(done){
            setupStuff(_.noop, function(evtName){
                expect(evtName).to.be.eql('opponent_move');
                done();
            });

            match.playerMove(player1);
        });
        it('checks the health of both players and determines a winner of this round', function(){
            var firstPlayer = [];
            var secondPlayer = [];
            setupStuff(storeEvents(firstPlayer), storeEvents(secondPlayer));
            match.playerMove(player1, PLAYER1_WIN_ACTION);
            var p1Win = _.find(firstPlayer, function(i){
                return i === 'win';
            });
            var p2Loose= _.find(secondPlayer, function(i){
                return i === 'lose';
            });
            var p2OpponentMove = _.find(secondPlayer, function(i){
                return i === 'opponent_move';
            });
            expect(p1Win).to.exist;
            expect(p2Loose).to.exist;
            expect(p2OpponentMove).to.exist;
        });

        it('keeps track of the rounds', function(){
            setupStuff(_.noop, _.noop);

            match.playerMove(player1, PLAYER1_WIN_ACTION);

            expect(match.rounds.player1).to.be.eql(1);
            expect(match.rounds.player2).to.be.eql(0);
        });
        it('when a player wins 2 rounds he wins the match (end_match)', function(){
            var pl1Events = [],
                pl2Events = [];
            setupStuff(storeEvents(pl1Events), storeEvents(pl2Events));

            match.playerMove(player1, PLAYER1_WIN_ACTION);
            match.playerMove(player1, PLAYER1_WIN_ACTION);
            function end_match(i){
                return i === 'end_match';
            }
            var end_match_pl1 = _.find(pl1Events, end_match);
            expect(end_match_pl1).to.exist;
        });

        it('switches to "endMatch" when a player wins', function(){
            setupStuff(_.noop, _.noop);

            match.playerMove(player1, PLAYER1_WIN_ACTION);
            match.playerMove(player1, PLAYER1_WIN_ACTION);

            expect(match.state()).to.be.eql('endMatch');
            expect(match.winner).to.be.equal(player1);
        });
    });

    describe('when a players timeouts (readyTimeoutEvent)', function(){
        it("it switches to 'end' state", function(){
            var match = createMatch();
            match.readyTimeout(player1);

            expect(match.state()).to.be.eql('endMatch');
            expect(match.winner).to.be.equal(player2);
        });
    });


    describe("handleAction", function(){
        function expectToHaveBeenCalledWith(eventList){
            return function(event){
                var action = _.find(eventList, function(i){
                    return i === event;
                });
                expect(action).to.exist;
            }
        }
        function makePlayer(name, action){
            return {
                id : name,
                sendEvent : action
            };
        }
        function action(type, data){
            return {
                action : type,
                params : data
            };
        }
        var ready = function(player){
            return action('ready', {
                player : player
            });
        };
        var characterSelected = function(player){
            return action('characterSelected', {
                player : player
            });
        };
        var playerMove = function(player, data){
            return action('playerMove', {
                player : player,
                state : data
            });
        };
        var endTurn = function(player){
            return action('endTurn');
        };

        var killingMove = function(player, playerWhoGotKilled){
            var data = {
                player1: {
                    health : 5
                },
                player2: {
                    health : 5
                }
            };
            data[playerWhoGotKilled].health = 0;
            return playerMove(player,  data);
        }
        it("handles the action", function(){
            var player1Events = [];
            var player2Events = [];
            var expectationPlayer1 = expectToHaveBeenCalledWith(player1Events);
            var expectationPlayer2 = expectToHaveBeenCalledWith(player2Events);

            var player1 = makePlayer('pl1', storeEvents(player1Events));
            var player2 = makePlayer('pl2', storeEvents(player2Events));
            var match = createMatchWith(player1, player2);

            match.handleAction(ready(player1));
            match.handleAction(ready(player2));
            expect(match.state()).to.be.eql('characterSelection');

            match.handleAction(characterSelected(player1));
            match.handleAction(characterSelected(player2));
            expect(match.state()).to.be.equal('play');
            expectationPlayer1('your_move');

            match.handleAction(playerMove(player1, {
                player1: {
                    health : 10
                },
                player2: {
                    health : 9
                }
            }));
            expectationPlayer2('opponent_move');
            match.handleAction(endTurn(player1));

            expect(match.currentPlayer).to.be.equal(player2);
            expectationPlayer2('your_move');

            match.handleAction(killingMove(player2, 'player1'));
            expect(match.rounds.player2).to.be.eql(1);

            match.handleAction(endTurn(player2));
            expect(match.currentPlayer).to.be.equal(player1);

            match.handleAction(killingMove(player2, 'player1'));
            expect(match.rounds.player2).to.be.eql(2);

            expect(match.state()).to.be.eql('endMatch');
            expect(match.winner).to.be.eql(player2);

        });
    });

});
