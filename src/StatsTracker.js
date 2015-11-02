var Autowire = require('autowire');

Autowire(function(_, Dispatcher, Utils, Matchmaker) {
	var activeConnections = [];
	var monitoringConnections = [];

	function isMonitoringConnection(name) {
		return name.indexOf('$monitoring') === 0;
	}

	function getPlayers() {
		return _.map(activeConnections, function(conn) {
			return conn.spudzData.player;
		});
	}

	function updateStats() {
		activeConnections = Utils.clearDisconnected(activeConnections);
		monitoringConnections = Utils.clearDisconnected(monitoringConnections);

		var players = getPlayers();

		var mm = _.reduce(activeConnections, function(count, elem) {
			if(!elem.spudzData || elem.spudzData.opponent === undefined) {
				return count;
			} else {
				return count + 1;
			}
		}, 0);

		var msg = {
			name: 'monitoring_data',
			players: players,
			playerCount: players.length,
			matchmaked: mm,
			matchmakingQueue: Matchmaker.getMatchmakingQueue()
		};

		Utils.broadcast(monitoringConnections, msg);
	}

	var StatsTracker = function() {
		Dispatcher.register('new_connection', this, this.onNewConnection);
		Dispatcher.register('connection_closed', this, this.onDisconnect);
		Dispatcher.register('register_name', this, this.onPlayerName);

		setInterval(function() {
			updateStats();
		}, 1000);
	};

	StatsTracker.prototype.onNewConnection = function(arg) {
		activeConnections.push(arg.connection);
	};
	
	StatsTracker.prototype.onDisconnect = function(arg) {
	};

	StatsTracker.prototype.onPlayerName = function(arg) {
		if(isMonitoringConnection(arg.param)) {
			monitoringConnections.push(arg.connection);
			activeConnections = _.filter(activeConnections, function(conn) {
				return arg.connection !== conn;
			});
		}
	};

	StatsTracker.prototype.isPlayerNameAvailable = function(name) {
		var players = getPlayers();
		return undefined === _.find(players, function(elem) {
			return elem === name;
		});
	}

	StatsTracker.autowire = {
		instantiate: true,
		singleton: true
	}
	module.exports = StatsTracker;
});