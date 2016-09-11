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

"use strict";

define(['require', 'q', '../util/Logger', '../util/LocationUtil', '../mqttmanager/MQTTManager'], function(require, Q, Logger, LocationUtil, MQTTManager) {
	var hexChar = ["0", "1", "2", "3", "4", "5", "6", "7","8", "9", "A", "B", "C", "D", "E", "F"];
 
	var DEVICE_LOOKUP = {
		"CC2650 SensorTag": "../devices/SensorTag2_0",
		"V1connection LE": "../devices/V1connectionLE",
		"OBDBLE": "../devices/OBDBLE",
		"SATECHIPLUG": "../devices/IQPlug",
		"Bean": "../devices/LightBlueBean"
	};
	
	var deviceHandlers = {};
	
	class BLEDevice {
		constructor(id, name, services) {
			this.id = id;
			this.name = name;
			this.services = services;
			this.listeners = [];
			this.errListeners = [];
			this.connected = false;
		}
		
		connect(cb) {
			console.log("Connecting to device "+this.name+" : " +this.id);

			ble.connect(this.id, 
				function(device) {
					console.log("Connected to device "+this.name+" : " +this.id);
					this.name = device.name;
					this.device = device;
					this.connected = true;
					cb();
				}.bind(this), 
				function(err) {
					this.handleError(err);
				}.bind(this)
			);	
		}
		
		disconnect() {
			console.log("Disconnecting from device "+this.name+" : " +this.id);
			ble.disconnect(this.id);
			this.device = undefined;
			this.connected = false;
		}
		
		isConnected() {
			return this.connected;
		}
		
		getName() {
			return this.name;
		}
		
		getId() {
			return this.id;
		}
		
		getCommandIds() {
			var commandIds = [];
			this.services.forEach(function(service) {
				for (var id in service.commands) {
					commandIds.push({id: id, serviceId: service.id});
				}
			});
			return commandIds;
		}
		
		getCommand(id, serviceId) {
			var command;
			this.services.forEach(function(service) {
				if (service.id === serviceId) {
					command = service.commands[id];
				}
			});
			return command;
		}
		
		sendCommand(id, serviceId, input) {
			console.log("sendCommand "+id+" : " +serviceId+" : "+input);
		
			this.services.forEach(function(service) {
				if (service.id === serviceId) {
					var command = service.commands[id];
					var requestData;
					if (input) {
						input = input.toUpperCase();
						var i = 0;
						var bytes = [];
						for (i = 0; i < input.length; i++) {
							var hex = input.charCodeAt(i).toString(16);
							bytes.push(parseInt(hex, 16));
						}
						bytes.push(13);
						console.log(bytes);
						requestData = new Uint8Array(bytes);
					} else {
						console.log(command.data);
						requestData = this.packageCmdData(command.data);
					}
					console.log("Sending command "+id+" : " +serviceId+" : "+input+" on device "+this.name+"("+this.id+")");
					if (service.useWrite) {
						ble.write(this.device.id, service.id, service.writeCharacteristic, requestData.buffer, 
							function() {
							}.bind(this),
							function(err) {
								this.handleError(err);
							}.bind(this)
						);
					} else {
						ble.writeWithoutResponse(this.device.id, service.id, service.writeCharacteristic, requestData.buffer, 
							function() {
							}.bind(this),
							function(err) {
								this.handleError(err);
							}.bind(this)
						);
					}
				}	
			}.bind(this));	
		}
		
		sendCommandAndReadResponse(id, serviceId) {
			this.deferred = Q.defer();
			
			this.services.forEach(function(service) {
				if (service.id === serviceId) {
					var command = service.commands[id];
					var requestData = this.packageCmdData(command.data);
					ble.write(this.device.id, service.id, service.writeCharacteristic, requestData.buffer, 
						function() {
						}.bind(this), 
						function(err) {
							this.deferred.reject(err);
						}.bind(this)
					);
				}	
			}.bind(this));	

			return this.deferred.promise;
		}
		
		promptForInput(id, serviceId) {
			var prompt = false;
			this.services.forEach(function(service) {
				if (service.id === serviceId) {
					var command = service.commands[id];
					prompt = command.promptForInput ? true : false;
				}
			});	
			return prompt;
		}
		
		startNotifications() {
			if (this.connected) {
				this.services.forEach(function(service) {
					if (service.characteristic) {
						console.log("Starting notification for "+this.device.name+" "+ service.name);
						ble.startNotification(this.device.id, service.id, service.characteristic, 
							function(buffer) {
								this.handleNotifactionResponse(buffer, service);
							}.bind(this),
							function(err) {
								this.handleError(err);
							}.bind(this)
						);
					}
				}.bind(this));
			}
		}
		
		stopNotifications(cb) {
			if (this.connected) {
				this.services.forEach(function(service) {
					if (service.characteristic) {
						console.log("Stopping notification for "+this.device.name+" "+ service.name);
						ble.stopNotification(this.device.id, service.id, service.characteristic, 
							function() {
								console.log("Stopped notification for "+this.name+" "+ service.name);
								cb();
							}.bind(this), 
							function(err) {
								this.handleError(err);
								cb();
							}.bind(this)
						);
					}
				}.bind(this));
			}
		}
		
		configure() {
			if (this.connected) {
				this.services.forEach(function(service) {
					if (service.configCharacteristic) {
						var value = new Uint8Array(service.configData);
						ble.write(this.device.id, service.id, service.configCharacteristic, value.buffer, 
							function() {
								this.handleConfigResponse();
							}.bind(this),
							function(err) {
								this.handleError(err);
							}.bind(this)
						);
					}
				}.bind(this));
			}
		}
		
		addListener(listener) {
			this.listeners.push(listener);
		}
		
		removeListener(listener) {
			var index = this.listeners.indexOf(listener);
			if (index > -1) {
				this.listeners.splice(index, 1);
			}
		}
		
		addErrorListener(listener) {
			this.errListeners.push(listener);
		}
		
		removeErrorListener(listener) {
			var index = this.errListeners.indexOf(listener);
			if (index > -1) {
				this.errListeners.splice(index, 1);
			}
		}
		
		handleConfigResponse() {
		}
		
		handleNotifactionResponse(buffer, service) {
			var result = new Uint8Array(buffer);
			this.listeners.forEach(function(listener) {
				listener(service, result);
			});
		}
		
		handleError(err) {
			this.errListeners.forEach(function(listener) {
				listener(err);
			});
		}
		
		packageCmdData(data) {
			return new Uint8Array(data);
		}
		
		mqttPublish(topic, msg, addLocation) {
			var payload = {
				msg: msg
			}
			if (addLocation) {
				payload.location = LocationUtil.getLocation();
			}
			MQTTManager.publish(topic, payload);
		}
		
		static arrayToStr(hex) {
			var dataStr = '';
			for (var i = 0; i < hex.length; i++) {
				dataStr += hexChar[(hex[i] >> 4) & 0x0f] + hexChar[hex[i] & 0x0f];
				dataStr += ' ';
			}
			return dataStr;
		}
		
		static is(deviceName) {
			return false;
		}
		
		static byteToHex(b) {
	  		return hexChar[(b >> 4) & 0x0f] + hexChar[b & 0x0f];
		}
		
		static startScan(cb) {
			ble.startScan([], 
				function(device) {
					if (device.advertising && device.advertising.kCBAdvDataLocalName) {
						var name = device.advertising.kCBAdvDataLocalName;
						if (DEVICE_LOOKUP[name]) {
							if (deviceHandlers[name]) {
								cb(new deviceHandlers[name](device.id, device.name));
							} else {
								require([DEVICE_LOOKUP[name]], function(deviceHandler) {
									console.log("device : "+DEVICE_LOOKUP[name]+" loaded");
									deviceHandlers[name] = deviceHandler;
									cb(new deviceHandler(device.id, device.name));
								});
							}
						}
					}	
				}, 
				function(err) {
				}.bind(this)
			);
		}
		
		static stopScan(cb) {
			ble.stopScan(
				function() {
					cb();
				},
				function(err) {
				}
			);	
		}
	}
	
	return BLEDevice;
});