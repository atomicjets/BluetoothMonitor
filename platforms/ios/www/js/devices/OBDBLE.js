"use strict";

define(['../bluetooth/BLEDevice', '../util/Logger'], function(BLEDevice, Logger) {
	function hex2a(hexx) {
		var hex = hexx.toString();
		var str = '';
		for (var i = 0; i < hex.length; i += 2)
			str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
		return str;
	};

	function toAscii(hexstr) {
		var hex = hexstr.split(" ");
		var ascii = '';
		hex.forEach(function(val) {
			ascii += hex2a(val);
		});
		return ascii;
	}

	function toBytes(data) {	
		var split = data.split(" ");
		split.shift();
		split.shift();
		var bytes = [];
		split.forEach(function(hex) {
			bytes.push(parseInt(hex, 16));
		});
		return bytes;
	}

	function getRPM(data) {
		var bytes = toBytes(data);
		var rpm = Math.floor(((bytes[0] * 256 + bytes[1]) / 4));
		return rpm;
	}
	
	function getTemperature(data) {
		var bytes = toBytes(data);
		var temp = bytes[0] - 40;
		temp = Math.floor(temp * 1.8 + 32);
		return temp;
	}
	
	function getSpeed(data) {
		var bytes = toBytes(data);
		var speed = Math.floor((bytes[0] * 0.621371192));
		return speed;
	}
	
	function getPercentage(data) {
		var bytes = toBytes(data);
		var percentage = Math.floor(((bytes[0] * 100.0) / 255.0));
		return percentage;
	}
	
	function getPressure(data) {
		var bytes = toBytes(data);
		var pressure = Math.floor(bytes[0] * 0.145037738);
		return pressure;
	}
	
	function getAirFuelRatio(data) {
		var bytes = toBytes(data);
		var airFuelRatio = Math.floor((((bytes[0] * 256) + bytes[1]) / 32768) * 14.7);
		return airFuelRatio;
	}
	
	function toDisplayValue(
		rpm, 
		coolantTemp, 
		speed, 
		engineLoad, 
		throttlePosition, 
		fuelLevel,
		airIntakeTemp,
		ambientAirTemp,
		barometricPressure,
		fuelPressure,
		fuelRailPressure,
		intakeManifoldPressure,
		airFuelRatio,
		consumptionRate,
		fuelType,
		widebandAirFuelRatio,
		absoluteLoad,
		massAirFlow
	) {
		var displayValue = "RPM: "+ rpm +"\n";
		displayValue += "Coolant Temp: "+ coolantTemp +"F\n";
		displayValue += "Speed: "+ speed + "mph\n";
		displayValue += "Engine Load: "+ engineLoad +"%\n";
		displayValue += "Throttle Position: "+ throttlePosition +"%\n";
		displayValue += "Fuel Level: "+ fuelLevel +"%\n";
		displayValue += "Air Intake Temp: "+ airIntakeTemp +"F\n";
		displayValue += "Ambient Air Temp: "+ ambientAirTemp +"F\n";
		displayValue += "Barometric Pressure: "+ barometricPressure +"psi\n";
		displayValue += "Fuel Pressure: "+ fuelPressure +"psi\n";
		displayValue += "Fuel Rail Pressure: "+ fuelRailPressure +"psi\n";
		displayValue += "Intake Manifold Pressure: "+ intakeManifoldPressure +"psi\n";
		displayValue += "Air Fuel Ratio: "+ airFuelRatio +"\n";
		//displayValue += "Consumption Rate: "+ consumptionRate +"\n";
		displayValue += "Fuel Type: "+ fuelType +"\n";
		//displayValue += "Wideband Air Fuel Ratio: "+ widebandAirFuelRatio +"\n";
		displayValue += "Absolute Load: "+ absoluteLoad +"%\n";
		displayValue += "Mass Air Flow: "+ massAirFlow +"g/s\n";
		return displayValue;
	}

	function toInitValue(init) {
		var displayValue = "";
		for (var initId in init) {
			displayValue += initId;
			displayValue += " : ";
			displayValue += init[initId].ascii;
			displayValue += "\n";
		}
		return displayValue;
	}
	
	var SERVICES = [
		{
			name: "OBDBLE Service",
			id: "FFE0",
			characteristic: "FFE1",
			writeCharacteristic: "FFE1",
			commands: {
				Prompt: {
					id: "Prompt",
					name: "Prompt for Input",
					promptForInput: true
				},
				ATZ: {
					data: [0x41,0x54,0x5A,0x0D],
					id: "ATZ",
					name: "ATZ"
				},
				/*
				ATD: {
					data: [0x41,0x54,0x44,0x0D],
					id: "ATD",
					name: "ATD"
				},
				ATE0: {
					data: [0x41,0x54,0x20,0x45,0x30,0x0D],
					id: "ATE0",
					name: "AT E0"
				},
				ATL0: {
					data: [0x41,0x54,0x20,0x4C,0x30,0x0D],
					id: "ATL0",
					name: "AT L0"
				},
				ATS0: {
					data: [0x41,0x54,0x20,0x53,0x30,0x0D],
					id: "ATS0",
					name: "AT S0"
				},
				ATH0: {
					data: [0x41,0x54,0x20,0x48,0x30,0x0D],
					id: "ATH0",
					name: "AT H0"
				},
				*/
				ATSP0: {
					data: [0x41,0x54,0x20,0x53,0x50,0x20,0x30,0x0D],
					id: "ATSP0",
					name: "AT SP 0"
				},
				/*
				ATRV: {
					data: [0x41,0x54,0x52,0x56,0x0D],
					id: "ATRV",
					name: "ATRV"
				},
				ATI: {
					data: [0x41,0x54,0x49,0x0D],
					id: "ATI",
					name: "ATI"
				},
				ATMA: {
					data: [0x41,0x54,0x4D,0x41,0x0D],
					id: "ATMA",
					name: "ATMA"
				},
				*/
				General: {
					data: [0x30,0x31,0x30,0x30,0x31,0x0D],
					id: "General",
					name: "General"
				},
				RPM: {
					data: [0x30,0x31,0x30,0x43,0x31,0x0D],
					id: "RPM",
					name: "RPM"
				},
				CoolantTemp: {
					data: [0x30,0x31,0x30,0x35,0x31,0x0D],
					id: "CoolantTemp",
					name: "Coolant Temperature"
				},
				Speed: {
					data: [0x30,0x31,0x30,0x44,0x31,0x0D],
					id: "Speed",
					name: "Speed"
				},
				OilTemp: {
					data: [0x30,0x31,0x35,0x43,0x31,0x0D],
					id: "OilTemp",
					name: "Oil Temperature"
				},
				EngineLoad: {
					data: [0x30,0x31,0x30,0x34,0x31,0x0D],
					id: "EngineLoad",
					name: "Engine Load"
				},
				ThrottlePosition: {
					data: [0x30,0x31,0x31,0x31,0x31,0x0D],
					id: "ThrottlePosition",
					name: "Throttle Position"
				},
				FuelLevel: {
					data: [0x30,0x31,0x32,0x46,0x31,0x0D],
					id: "FuelLevel",
					name: "Fuel Level"
				},
				AirIntakeTemp: {
					data: [0x30,0x31,0x30,0x46,0x31,0x0D],
					id: "AirIntakeTemp",
					name: "Air Intake Temperature"
				},
				AmbientAirTemp: {
					data: [0x30,0x31,0x34,0x36,0x31,0x0D],
					id: "AmbientAirTemp",
					name: "Ambient Air Temperature"
				},
				BarometricPressure: {
					data: [0x30,0x31,0x33,0x33,0x31,0x0D],
					id: "BarometricPressure",
					name: "Barometric Pressure"
				},
				FuelPressure: {
					data: [0x30,0x31,0x30,0x41,0x31,0x0D],
					id: "FuelPressure",
					name: "Fuel Pressure"
				},
				FuelRailPressure: {
					data: [0x30,0x31,0x32,0x33,0x31,0x0D],
					id: "FuelRailPressure",
					name: "Fuel Rail Pressure"
				},
				IntakeManifoldPressure: {
					data: [0x30,0x31,0x30,0x42,0x31,0x0D],
					id: "IntakeManifoldPressure",
					name: "Intake Manifold Pressure"
				},
				AirFuelRatio: {
					data: [0x30,0x31,0x34,0x34,0x31,0x0D],
					id: "AirFuelRatio",
					name: "Air Fuel Ratio"
				},
				ConsumptionRate: {
					data: [0x30,0x31,0x35,0x45,0x31,0x0D],
					id: "ConsumptionRate",
					name: "Consumption Rate"
				},
				FuelType: {
					data: [0x30,0x31,0x35,0x31,0x31,0x0D],
					id: "FuelType",
					name: "Fuel Type"
				},
				WidebandAirFuelRatio: {
					data: [0x30,0x31,0x33,0x34,0x31,0x0D],
					id: "WidebandAirFuelRatio",
					name: "Wideband Air Fuel Ratio"
				},
				AbsoluteLoad: {
					data: [0x30,0x31,0x34,0x33,0x31,0x0D],
					id: "AbsoluteLoad",
					name: "Absolute Load"
				},
				MassAirFlow: {
					data: [0x30,0x31,0x31,0x30,0x31,0x0D],
					id: "MassAirFlow",
					name: "Mass Air Flow"
				},
				VinNumber: {
					data: [0x30,0x39,0x30,0x32,0x0D],
					id: "VinNumber",
					name: "Vin Number"
				}
			}
		}
	];

	class OBDBLE extends BLEDevice {
		constructor(id, name) {
			super(id, name, SERVICES);
		}

		startNotifications() {
			super.startNotifications();
			var count = 0;
			var result = {
				RPM: [], 
				CoolantTemp: [], 
				Speed: [], 
				EngineLoad: [], 
				ThrottlePosition: [], 
				FuelLevel: [],
				AirIntakeTemp: [],
				AmbientAirTemp: [],
				BarometricPressure: [],
				FuelPressure: [],
				FuelRailPressure: [],
				IntakeManifoldPressure: [],
				AirFuelRatio: [],
				ConsumptionRate: [],
				FuelType: [],
				WidebandAirFuelRatio: [],
				AbsoluteLoad: [],
				MassAirFlow: []	
			};
			var poller = function() {
				var p = this.sendCommandAndReadResponse("VinNumber", SERVICES[0].id);
				var rpm, 
					coolantTemp, 
					speed, 
					engineLoad, 
					throttlePosition, 
					fuelLevel,
					airIntakeTemp,
					ambientAirTemp,
					barometricPressure,
					fuelPressure,
					fuelRailPressure,
					intakeManifoldPressure,
					airFuelRatio,
					consumptionRate,
					fuelType,
					widebandAirFuelRatio,
					absoluteLoad,
					massAirFlow;
				p.then(function(results) {
					this.vin = results.hex;
					this.sendCommandAndReadResponse("RPM", SERVICES[0].id);
					return this.deferred.promise;
				}.bind(this))
				.then(function(results) {
					rpm = getRPM(results.ascii);
					result["RPM"].push(rpm);
					this.sendCommandAndReadResponse("CoolantTemp", SERVICES[0].id);
					return this.deferred.promise;
				}.bind(this))
				.then(function(results) {
					coolantTemp = getTemperature(results.ascii)
					result["CoolantTemp"].push(coolantTemp);
					this.sendCommandAndReadResponse("Speed", SERVICES[0].id);
					return this.deferred.promise;
				}.bind(this))	
				.then(function(results) {
					speed = getSpeed(results.ascii);
					result["Speed"].push(speed);
					this.sendCommandAndReadResponse("EngineLoad", SERVICES[0].id);
					return this.deferred.promise;
				}.bind(this))	
				.then(function(results) {
					engineLoad = getPercentage(results.ascii);
					result["EngineLoad"].push(engineLoad);
					this.sendCommandAndReadResponse("ThrottlePosition", SERVICES[0].id);
					return this.deferred.promise;
				}.bind(this))	
				.then(function(results) {
					throttlePosition = getPercentage(results.ascii)
					result["ThrottlePosition"].push(throttlePosition);
					this.sendCommandAndReadResponse("FuelLevel", SERVICES[0].id);
					return this.deferred.promise;
				}.bind(this))	
				.then(function(results) {
					fuelLevel = getPercentage(results.ascii);
					result["FuelLevel"].push(fuelLevel);
					this.sendCommandAndReadResponse("AirIntakeTemp", SERVICES[0].id);
					return this.deferred.promise;
				}.bind(this))	
				.then(function(results) {
					airIntakeTemp = getTemperature(results.ascii);
					result["AirIntakeTemp"].push(airIntakeTemp);
					this.sendCommandAndReadResponse("AmbientAirTemp", SERVICES[0].id);
					return this.deferred.promise;
				}.bind(this))	
				.then(function(results) {
					ambientAirTemp = getTemperature(results.ascii);
					result["AmbientAirTemp"].push(ambientAirTemp);
					this.sendCommandAndReadResponse("BarometricPressure", SERVICES[0].id);
					return this.deferred.promise;
				}.bind(this))	
				.then(function(results) {
					barometricPressure = getPressure(results.ascii);
					result["BarometricPressure"].push(barometricPressure);
					this.sendCommandAndReadResponse("FuelPressure", SERVICES[0].id);
					return this.deferred.promise;
				}.bind(this))	
				.then(function(results) {
					fuelPressure = getPressure(results.ascii);
					result["FuelPressure"].push(fuelPressure);
					this.sendCommandAndReadResponse("FuelRailPressure", SERVICES[0].id);
					return this.deferred.promise;
				}.bind(this))	
				.then(function(results) {
					fuelRailPressure = getPressure(results.ascii);
					result["FuelRailPressure"].push(fuelRailPressure);
					this.sendCommandAndReadResponse("IntakeManifoldPressure", SERVICES[0].id);
					return this.deferred.promise;
				}.bind(this))	
				.then(function(results) {
					intakeManifoldPressure = getPressure(results.ascii);
					result["IntakeManifoldPressure"].push(intakeManifoldPressure);
					this.sendCommandAndReadResponse("AirFuelRatio", SERVICES[0].id);
					return this.deferred.promise;
				}.bind(this))
				.then(function(results) {
					airFuelRatio = getAirFuelRatio(results.ascii);
					result["AirFuelRatio"].push(airFuelRatio);
					//this.sendCommandAndReadResponse("ConsumptionRate", SERVICES[0].id);
					this.sendCommandAndReadResponse("FuelType", SERVICES[0].id);
					return this.deferred.promise;
				}.bind(this))
				/*
				.then(function(results) {
					var bytes = toBytes(results.ascii);
					Logger.log(Logger.INFO, "ConsumptionRate : "+results.ascii);
					consumptionRate = Math.floor((bytes[0] * 256 + bytes[1]) * 0.05);
					result["ConsumptionRate"].push(consumptionRate);
					this.sendCommandAndReadResponse("FuelType", SERVICES[0].id);
					return this.deferred.promise;
				}.bind(this))
				*/
				.then(function(results) {
					var bytes = toBytes(results.ascii);
					switch (bytes[0]) {
						case 1: 
							fuelType = "Gasoline"; 
							break;
						case 2: 
							fuelType = "Methanol"; 
							break;
						case 3: 
							fuelType = "Ethanol"; 
							break;
						case 4: 
							fuelType = "Diesel"; 
							break;
						case 5: 
							fuelType = "GPL/LGP"; 
							break;
						case 6: 
							fuelType = "Natural Gas"; 
							break;
						case 7: 
							fuelType = "Propane"; 
							break;
						case 8: 
							fuelType = "Electric"; 
							break;
						/*
						case 0x09: fuelType = "Biodiesel + Gasoline"; break;
						case 0x0A: fuelType = "Biodiesel + Methanol"; break;
						case 0x0B: fuelType = "Biodiesel + Ethanol"; break;
						case 0x0C: fuelType = "Biodiesel + GPL/LGP"; break;
						case 0x0D: fuelType = "Biodiesel + Natural Gas"; break;
						case 0x0E: fuelType = "Biodiesel + Propane"; break;
						case 0x0F: fuelType = "Biodiesel + Electric"; break;
						case 0x10: fuelType = "Biodiesel + Gasoline/Electric"; break;
						case 0x11: fuelType = "Hybrid Gasoline"; break;
						case 0x12: fuelType = "Hybrid Ethanol"; break;
						case 0x13: fuelType = "Hybrid Diesel"; break;
						case 0x14: fuelType = "Hybrid Electric"; break;
						case 0x15: fuelType = "Hybrid Mixed"; break;
						case 0x16: fuelType = "Hybrid Regenerative"; break;
						*/
					}
					result["FuelType"].push(fuelType);
					//this.sendCommandAndReadResponse("WidebandAirFuelRatio", SERVICES[0].id);
					this.sendCommandAndReadResponse("AbsoluteLoad", SERVICES[0].id);
					return this.deferred.promise;
				}.bind(this))
				/*
				.then(function(results) {
					Logger.log(Logger.INFO, "WidebandAirFuelRatio : "+results.ascii);
					widebandAirFuelRatio = getAirFuelRatio(results.ascii);
					result["WidebandAirFuelRatio"].push(widebandAirFuelRatio);
					this.sendCommandAndReadResponse("AbsoluteLoad", SERVICES[0].id);
					return this.deferred.promise;
				}.bind(this))
				*/
				.then(function(results) {
					var bytes = toBytes(results.ascii);
					absoluteLoad = Math.floor((bytes[0] * 256 + bytes[1]) * 100 / 255);
					result["AbsoluteLoad"].push(absoluteLoad);
					this.sendCommandAndReadResponse("MassAirFlow", SERVICES[0].id);
					return this.deferred.promise;
				}.bind(this))
				.then(function(results) {
					var bytes = toBytes(results.ascii);
					massAirFlow = Math.floor((bytes[0] * 256 + bytes[1]) / 100.0);
					result["MassAirFlow"].push(massAirFlow);
					var str = toDisplayValue(
						rpm, 
						coolantTemp, 
						speed, 
						engineLoad, 
						throttlePosition, 
						fuelLevel,
						airIntakeTemp,
						ambientAirTemp,
						barometricPressure,
						fuelPressure,
						fuelRailPressure,
						intakeManifoldPressure,
						airFuelRatio,
						consumptionRate,
						fuelType,
						widebandAirFuelRatio,
						absoluteLoad,
						massAirFlow
					);
					var rawData = {
						"RPM": rpm,
						"CoolantTemp": isNaN(coolantTemp) ? 0 : coolantTemp,
						"Speed": speed,
						"AmbientAirTemp": isNaN(ambientAirTemp) ? 0 : ambientAirTemp
					};
					this.listeners.forEach(function(listener) {
						listener(SERVICES[0], str, rawData);
					});
					if (count++ > 9) {
						this.mqttPublish("obddata", {vin: this.vin, obddata: result}, true);
						count = 0;
						result = {
							RPM: [], 
							CoolantTemp: [], 
							Speed: [], 
							EngineLoad: [], 
							ThrottlePosition: [], 
							FuelLevel: [],
							AirIntakeTemp: [],
							AmbientAirTemp: [],
							BarometricPressure: [],
							FuelPressure: [],
							FuelRailPressure: [],
							IntakeManifoldPressure: [],
							AirFuelRatio: [],
							ConsumptionRate: [],
							FuelType: [],
							WidebandAirFuelRatio: [],
							AbsoluteLoad: [],
							MassAirFlow: []	
						};
					}
					if (!this.shutdown) {
						setTimeout(poller, 1000);
					}
				}.bind(this))	
				.fail(function(error) {
					onError(error);
					setTimeout(poller, 1000);
				});
			}.bind(this);

			this.response = "";			
			var init = {};
			var p = this.sendCommandAndReadResponse("ATZ", SERVICES[0].id);
			p.then(function(results) {
				init["ATZ"] = {hex: results.hex, ascii: results.ascii};
				this.sendCommandAndReadResponse("ATSP0", SERVICES[0].id);
				return this.deferred.promise;
			}.bind(this))
			.then(function(results) {
				init["ATSP0"] = {hex: results.hex, ascii: results.ascii};
				this.startTime = new Date().getTime();
				var obddata = {RPM: [], CoolantTemp: [], Speed: [], EngineLoad: [], ThrottlePosition: [], FuelLevel: []};
				var str = toInitValue(init);
				this.listeners.forEach(function(listener) {
					listener(SERVICES[0], str);
				});
				setTimeout(poller, 1000);
			}.bind(this))	
			.fail(function(error) {
				onError(error);
				setTimeout(poller, 1000);
			});
		}
				
		handleNotifactionResponse(buffer, service) {
			var data = new Uint8Array(buffer);
			var hex;
			for (var i = 0; i < data.length; i++) {
				hex = BLEDevice.byteToHex(data[i]);
				if (hex === "3E") {
					this.deferred.resolve({hex: this.response, ascii: toAscii(this.response)});
					this.response = "";
				} else {
					this.response += hex;
					this.response += " ";
				}
			}
		}
		
		static is(deviceName) {
			return (deviceName === 'OBDBLE');
		}
	}
	
	return OBDBLE;

});