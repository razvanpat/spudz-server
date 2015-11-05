var expect = require('chai').expect;
var Autowire = require('autowire');

var DummyListener = function() {
	this.called = false;
	this.argument = null;
}

DummyListener.prototype.onCommand = function(arg) {
	this.called = true;
	this.argument = arg;
}

describe('Dispatcher', function() {
	var listener;
		
	Autowire(function(Dispatcher) {
		var listener;
		beforeEach(function() {
			listener = new DummyListener();
			Dispatcher.clear('testEvt');
		});

		it('can clear all listeners', function() {
			Dispatcher.register('testEvt', listener, listener.onCommand);
			Dispatcher.clear('testEvt');

			expect(Dispatcher.getListeners()['testEvt']).to.not.exist;
		});

		it('broadcasts commands to all registered listeners', function() {
			Dispatcher.register('testEvt', listener, listener.onCommand);
			Dispatcher.broadcast('testEvt', {});

			expect(listener.called).to.be.true;
		});

		it('passes the argument to all listeners', function() {
			Dispatcher.register('testEvt', listener, listener.onCommand);
			Dispatcher.broadcast('testEvt', 'special');

			expect(listener.argument).to.eql('special');
		});
	});
});