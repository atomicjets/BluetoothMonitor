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

define(['../bluetooth/BLEDevice'], function(BLEDevice) {
	var SCALE_LSB = 0.03125;

	var SERVICES = [
		{
			name: "IR Temperature",
			id: "F000AA00-0451-4000-B000-000000000000",
			characteristic: "F000AA01-0451-4000-B000-000000000000",
			writeCharacteristic: "F000AA02-0451-4000-B000-000000000000",
			useWrite: true,
			commands: {
				TurnOnIRTemperature: {
					data: [0x01],
					id: "TurnOnIRTemperature",
					name: "Turn On IR Temperature"
				},
				TurnOffIRTemperature: {
					data: [0x00],
					id: "TurnOffIRTemperature",
					name: "Turn Off IR Temperature"
				}
			},
			convert: function(buffer) {
				var data = new Uint16Array(buffer);
				var converted = {
					object: (data[0] >> 2) * SCALE_LSB,
					Ambient: (data[1] >> 2) * SCALE_LSB
				};
				return converted;
			}
		},
		{
			name: "Humidity",
			id: "F000AA20-0451-4000-B000-000000000000",
			characteristic: "F000AA21-0451-4000-B000-000000000000",
			writeCharacteristic: "F000AA22-0451-4000-B000-000000000000",
			useWrite: true,
			commands: {
				TurnOnHumidity: {
					data: [0x01],
					id: "TurnOnHumidity",
					name: "Turn On Humidity"
				},
				TurnOffHumidity: {
					data: [0x00],
					id: "TurnOffHumidity",
					name: "Turn Off Humidity"
				}
			},
			convert: function(buffer) {
				var data = new Uint16Array(buffer);
				var converted = {
					Temperature: (data[0] / 65536) * 165 - 40,
					Humidity: (data[1] / 65536) * 100
				};
				return converted;
			}
		},
		{
			name: "Barometric Pressure",
			id: "F000AA40-0451-4000-B000-000000000000",
			characteristic: "F000AA41-0451-4000-B000-000000000000",
			writeCharacteristic: "F000AA42-0451-4000-B000-000000000000",
			useWrite: true,
			commands: {
				TurnOnBarometricPressure: {
					data: [0x01],
					id: "TurnOnBarometricPressure",
					name: "Turn On Barometric Pressure"
				},
				TurnOffBarometricPressure: {
					data: [0x00],
					id: "TurnOffBarometricPressure",
					name: "Turn Off Barometric Pressure"
				}
			},
			convert: function(buffer) {
				var data = new Uint8Array(buffer);
				var converted = {
					Temperature: data[0] | (data[1] << 8) | (data[2] << 16),
					humidity: data[3] | (data[4] << 8) | (data[5] << 16)
				};
				return converted;
			}
		}/*,
		{
			name: "Optical",
			id: "F000AA70-0451-4000-B000-000000000000",
			characteristic: "F000AA71-0451-4000-B000-000000000000",
			writeCharacteristic: "F000AA72-0451-4000-B000-000000000000",
			useWrite: true,
			commands: {
				TurnOnOptical: {
					data: [0x01],
					id: "TurnOnOptical",
					name: "Turn On Optical"
				},
				TurnOffOptical: {
					data: [0x00],
					id: "TurnOffOptical",
					name: "Turn Off Optical"
				}
			}
		},
		{
			name: "Movement",
			id: "F000AA80-0451-4000-B000-000000000000",
			characteristic: "F000AA81-0451-4000-B000-000000000000",
			writeCharacteristic: "F000AA82-0451-4000-B000-000000000000",
			useWrite: true,
			commands: {
				TurnOnMovement: {
					data: [0x7f, 0x00],
					id: "TurnOnMovement",
					name: "Turn On Movement"
				},
				TurnOffMovement: {
					data: [0x00, 0x00],
					id: "TurnOffMovement",
					name: "Turn Off Movement"
				}
			}
		}*/
	];

	class SensorTag extends BLEDevice {
		constructor(id, name) {
			super(id, name, SERVICES);
		}
		
		handleNotifactionResponse(buffer, service) {
			var result;
			var rawData;
			if (service.convert) {
				rawData = service.convert(buffer);
				result = JSON.stringify(data, null, '\t');
			} else {
				var data = new Uint8Array(buffer);
				result = BLEDevice.arrayToStr(data);
			}
			this.listeners.forEach(function(listener) {
				listener(service, result, rawData);
			});
		}
		
		configure() {
			this.sendCommand("TurnOnIRTemperature", SERVICES[0].id);
			this.sendCommand("TurnOnHumidity", SERVICES[1].id);
			this.sendCommand("TurnOnBarometricPressure", SERVICES[2].id);
		}
		
		static is(deviceName) {
			return (deviceName === 'SensorTag 2.0');
		}
	}
	
	return SensorTag;
});