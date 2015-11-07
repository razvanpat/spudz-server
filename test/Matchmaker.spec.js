var Autowire = require('autowire');
var expect = require('chai').expect;
var Matchmaker = require('../src/Matchmaker');
var _ = require("underscore");


Autowire(function(Dispatcher) {
    function makePlayer(sendEvent){
        return {
            on : _.noop,
            sendEvent : sendEvent || _.noop
        };
    }
    describe('Matchmaker', function(){
        var matchmaker;
        beforeEach(function(){
            matchmaker = new Matchmaker();
        });

        it('listens on the dispatcher for the "find_match" command', function(){
            Dispatcher.broadcast('find_match', {
                connection : makePlayer()
            });
            expect(matchmaker.getPlayersInQueue().length).to.be.eql(1);
        });
        describe('when 1 or more players join the matchmaker', function(){
            it('removes the first player in the queue', function(){
                matchmaker.queue.push(makePlayer());
                Dispatcher.broadcast('find_match', {
                    connection : makePlayer()
                });
                expect(matchmaker.getPlayersInQueue().length).to.be.eql(0);
            });
            it('creates a match between the first player in the queue and the incomming player', function(){
                var eventQueueP1 = [];
                var eventQueueP2 = [];

                var player1 = makePlayer(function(e){
                    eventQueueP1.push(e);
                });
                var player2 = makePlayer(function(e){
                    eventQueueP2.push(e);
                });
                matchmaker.queue.push(player1);

                Dispatcher.broadcast('find_match', {
                    connection : player2
                });
                function match_found(object){
                    return object === 'match_found';
                }
                expect(_.find(eventQueueP1, match_found)).to.exist;
                expect(_.find(eventQueueP2, match_found)).to.exist;
            });
        });
    });
});
