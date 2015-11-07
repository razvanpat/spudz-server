var Autowire = require('autowire');

Autowire(function(Dispatcher, Match) {
    function Matchmaker(){
        this.queue = [];
        Dispatcher.register('find_match', this, this.enqueuePlayer);
    }

    Matchmaker.prototype.enqueuePlayer = function(params){
        var incommingPlayer = params.connection;
        if(this.queue.length > 0){
            var firstPlayer = this.queue.pop();
            new Match(firstPlayer, incommingPlayer).start();
        }else{
            this.queue.push(incommingPlayer);
        }
    };
    Matchmaker.prototype.getPlayersInQueue = function(){
        return this.queue;
    };

    Matchmaker.autowire = {
		instantiate: true,
		singleton: true
	}
	module.exports = Matchmaker;
});
