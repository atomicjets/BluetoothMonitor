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

define([
	'../util/Logger',
	'../util/DB',
	'../uiconfig'
],
function(Logger, DB, config) {
	var errorCount = 0;
	var device;
	var connected = false;
	
	function connect() {
		if (connected) {
			return;
		}
		var mqttConfig = config.getMqttConfig();
		if (mqttConfig) {
			console.log('MQTT connecting');
			Logger.log(Logger.INFO, "MQTT connecting");
			device = mqttclient.connect(mqttConfig.host, mqttConfig.port, mqttConfig);
		}

		device.on('message', function(topic, message) {
			console.log(JSON.stringify(message));
		});

		device.on('connect', function(){
			connected = true;
			try {
				DB.getMQTTRecords(function(records) {
					records.forEach(function(record, index) {
						Logger.log(Logger.INFO, "MQTT back online. Publishing stored message : "+(index+1));
						device.publish(record.doc.topic, record.doc.message, {qos: 1});
						DB.removeMQTTRecord(record.doc);
					});
				});
			} catch (err) {
				Logger.log(Logger.ERROR, "failed to published stored messages "+ err);
			}
			Logger.log(Logger.INFO, "MQTT connected");
		});

		device.on('error', function(error) {
			Logger.log(Logger.ERROR, "MQTT Error "+error);
		});
	
		device.on('close', function() {
			if (connected) {
				connected = false;
				Logger.log(Logger.INFO, "MQTT disconnected");
				setTimeout(connect, 1000);
			}
		});
	}
	
	connect();
	
	return {
		publish: function(topic, message) {
			if (connected) {
				try {
					device.publish(topic, message, {qos: 1});
				} catch (err) {
					Logger.log(Logger.ERROR, "failed to published message "+err);
				}
			} else {
				Logger.log(Logger.INFO, "MQTT offline storing message for topic : "+ topic);
				try {
					DB.addMQTTRecord({topic: topic, message: message});
				} catch (err) {
					Logger.log(Logger.ERROR, "failed to add message to store "+err);
				}
			}
		},
		connect: function() {
			if (connected) {
				device.end();
			} else {
				connect();
			}
		}
	};
});