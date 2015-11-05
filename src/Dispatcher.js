var Autowire = require('autowire');


Autowire(function(_) {
	var Dispatcher = function() {
		this.listeners = {};
		this.omniListeners = [];
	};
	
	function emit(listener, argument) {
			var listenerScope = listener[0];
			var listenerMethod = listener[1];
			listenerMethod.apply(listenerScope, argument);
	}

	Dispatcher.prototype.getListeners = function() {
		return this.listeners;
	};

	Dispatcher.prototype.clear = function(eventName) {
		if(eventName) {
			delete this.listeners[eventName];
		} else {
			this.listeners = {};
			this.omniListeners = [];
		}
	}
		
	Dispatcher.prototype.register = function(eventName, listenerScope, listenerMethod) {
		if(this.listeners[eventName] === undefined) {
			this.listeners[eventName] = [];
		}
		this.listeners[eventName].push([listenerScope, listenerMethod]);
	};
	
	Dispatcher.prototype.registerAll = function(listenerScope, listenerMethod) {
		this.omniListeners.push([listenerScope, listenerMethod]);
	};

	Dispatcher.prototype.broadcast = function(eventName, argument) {
		_.each(this.listeners[eventName], function(listener) {
			emit(listener, [argument]);
		});

		_.each(this.omniListeners, function(listener) {
			emit(listener, [eventName, argument]);
		});
	};

	Dispatcher.autowire = {
		instantiate: true,
		singleton: true	
	}

	module.exports = Dispatcher;

});