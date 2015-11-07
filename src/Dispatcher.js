var Autowire = require('autowire');


Autowire(function(_) {
	var Dispatcher = function() {
		this.listeners = {};
	};

	Dispatcher.prototype.getListeners = function() {
		return this.listeners;
	};

	Dispatcher.prototype.clear = function() {
		this.listeners = {};
	}

	Dispatcher.prototype.register = function(eventName, listenerScope, listenerMethod) {
		if(this.listeners[eventName] === undefined) {
			this.listeners[eventName] = [];
		}
		this.listeners[eventName].push([listenerScope, listenerMethod]);
	};

	Dispatcher.prototype.broadcast = function(eventName, argument) {
		_.each(this.listeners[eventName], function(listener) {
			var listenerScope = listener[0];
			var listenerMethod = listener[1];
			listenerMethod.call(listenerScope, argument);
		});
	};


	Dispatcher.autowire = {
		instantiate: true,
		singleton: true
	}

	module.exports = Dispatcher;

});
