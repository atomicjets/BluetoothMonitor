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