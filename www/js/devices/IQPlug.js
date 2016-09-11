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

	var SERVICES = [
		{
			name: "IQ Plug",
			id: "FFF0",		
			writeCharacteristic: "FFF3",
			characteristic: "FFF4",
			commands: {
				On: {
					data: [0x0F, 0x06, 0x03, 0x00, 0x01, 0x00, 0x00, 0x05, 0xFF, 0xFF],
					id: "On",
					name: "Turn on"
				},
				Off: {
					data: [0x0F, 0x06, 0x03, 0x00, 0x00, 0x00, 0x00, 0x04, 0xFF, 0xFF],
					id: "Off",
					name: "Turn off"
				}
			}
		}
	];
	
	class IQPlug extends BLEDevice {
		constructor(id, name) {
			super(id, name, SERVICES);
		}
		
		handleNotifactionResponse(buffer, service) {
			var result;
			
			if (service.convert) {
				result = JSON.stringify(service.convert(buffer), null, '\t');
			} else {
				var data = new Uint8Array(buffer);
				result = BLEDevice.arrayToStr(data);
			}
			
			this.listeners.forEach(function(listener) {
				listener(service, result);
			});
		}
	
		static is(deviceName) {
			return (deviceName === 'IQ Plug 1');
		}
	}
	
	return IQPlug;
});