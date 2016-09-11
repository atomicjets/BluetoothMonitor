"use strict";

define(['../bluetooth/BLEDevice'], function(BLEDevice) {
	var SERVICES = [
		{
			name: "Bean",
			id: "A495FF10-C5B1-4B44-B512-1370F02D74DE",
			characteristic: "A495FF11-C5B1-4B44-B512-1370F02D74DE",
			writeCharacteristic: "A495FF11-C5B1-4B44-B512-1370F02D74DE",
			commands: {
				GetTemp: {
					data: [0x20, 0x11],
					id: "GetTemp",
					name: "Get Temperature"
				},
				GetAccel: {
					data: [0x20, 0x10],
					id: "GetAccel",
					name: "Get Accelerometer"
				}
			}
		}
	];

	class LightBlueBean extends BLEDevice {
		constructor(id, name) {
			super(id, name, SERVICES);
		}
		
		handleNotifactionResponse(buffer, service) {
			var data = new Uint8Array(buffer);
			var result = BLEDevice.arrayToStr(data);
			this.listeners.forEach(function(listener) {
				listener(service, result);
			});
		}
		
		packageCmdData(data) {
			var sizeBuffer = new Uint8Array(2);
			sizeBuffer.writeUInt8(cmdBuffer.length,0);
			sizeBuffer.writeUInt8(0,1);

			var gstBuffer = Buffer.concat([sizeBuffer,cmdBuffer]);

			var crcString = crc.crc16ccitt(gstBuffer);
			var crc16Buffer = new Buffer(crcString, 'hex');

			var gattBuffer = new Buffer(1 + gstBuffer.length + crc16Buffer.length);

			var header = (((this.count++ * 0x20) | 0x80) & 0xff);
			gattBuffer[0]=header;

			gstBuffer.copy(gattBuffer,1,0);

			gattBuffer[gattBuffer.length-2]=crc16Buffer[1];
			gattBuffer[gattBuffer.length-1]=crc16Buffer[0];
			return 	gattBuffer;
		}
		
		static is(deviceName) {
			return (deviceName === 'Bean');
		}
	}
	
	return LightBlueBean;

});