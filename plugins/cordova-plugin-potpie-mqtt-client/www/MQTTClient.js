/*
* The MIT License (MIT)
* 
* Copyright (c) 2016 Richard Backhouse
* 
* Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"),
* to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense,
* and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
* 
* The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
* 
* THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
* FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
* LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
* DEALINGS IN THE SOFTWARE.
*/

function isString(it) { return (typeof it === "string" || it instanceof String); }

var MQTTClient = function(host, port, options) {
	this.host = host;
	this.port = port;
	this.options = options || {};
	
	if (!this.options.tls) {
		this.options.tls = false;
	}
	if (!this.options.keepalive) {
		this.options.keepalive = 10;
	}
	if (!this.options.clean) {
		this.options.clean = true;
	}
	if (!this.options.clientId) {
		this.options.clientId = 'mqttclientplugin_' + Math.random().toString(16).substr(2, 8);
	}
	
	if (this.options.will) {
		this.options.will.payload = JSON.stringify(this.options.will.payload);
	}
	
	this.handlers = {};
	this.key = JSON.stringify({host:host, port: port, options: this.options});
	cordova.exec(
		function(data) {
			if (this.handlers[data.event]) {
				switch (data.event) {
					case 'message':
						var message = data.message;
						try {
							message = JSON.parse(data.message);
						} catch(err) {}
						this.handlers[data.event](data.topic, message);
						break;
					case 'connect':
					case 'close':
						this.handlers[data.event]();
						break;
					case 'error':
						this.handlers[data.event](data.error);
						break;
				}
			}
		}.bind(this),
		function(err) {
			if (this.handlers['error']) {
				this.handlers['error'](err);
			}
		},
		"MQTTClientPlugin",
		"connect",
		[this.key]
	);	
}

MQTTClient.prototype = {
	on: function(event, cb) {
		this.handlers[event] = cb;
	},
	publish: function(topic, message, options) {
		if (!options) {
			options = {};
		}
		if (!options.qos) {
			options.qos = 0;
		}
		if (!options.retain) {
			options.retain = false;
		}
		var msg = message;
		if (!isString(msg)) {
			msg = JSON.stringify(message);
		}
		
		cordova.exec(
			function() {
			}.bind(this),
			function(err) {
			},
			"MQTTClientPlugin",
			"publish",
			[this.key, topic, msg, JSON.stringify(options)]
		);	
	},
	subscribe: function(topic, options, cb) {
		if (!options) {
			options = {};
		}
		if (!options.qos) {
			options.qos = 0;
		}
		cordova.exec(
			function() {
				console.log("subscribed to "+topic);
				if (cb) {
					cb();
				}
			}.bind(this),
			function(err) {
			},
			"MQTTClientPlugin",
			"subscribe",
			[this.key, topic, JSON.stringify(options)]
		);	
	},
	unsubscribe: function(topic, cb) {
		cordova.exec(
			function() {
				if (cb) {
					cb();
				}
			}.bind(this),
			function(err) {
			},
			"MQTTClientPlugin",
			"unsubscribe",
			[this.key, topic]
		);	
	},
	end: function(force, cb) {
		cordova.exec(
			function() {
				if (cb) {
					cb();
				}
			}.bind(this),
			function(err) {
				cb(err);
			},
			"MQTTClientPlugin",
			"end",
			[this.key, force]
		);	
	}
}

module.exports = {
	connect: function(host, port, options) {
		return new MQTTClient(host, port, options);
	}
};
