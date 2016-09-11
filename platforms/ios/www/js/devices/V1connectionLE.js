"use strict";

define(['../bluetooth/BLEDevice'], function(BLEDevice) {
	var SERVICES = [
		{
			name: "V1 Service Short",
			id: "92A0AFF4-9E05-11E2-AA59-F23C91AEC05E",
			characteristic: "92A0B2CE-9E05-11E2-AA59-F23C91AEC05E",
			writeCharacteristic: "92A0B6D4-9E05-11E2-AA59-F23C91AEC05E",
			commands: {
				version: {
					data: 0x01,
					id: "version",
					name: "Get Version"
				},
				serialNumber: {
					data: 0x03,
					id: "serialNumber",
					name: "Get Serial #"
				},
				displayData: {
					data: 0x31,
					id: "displayData",
					name: "Get Display Data"
				},
				startAlertData: {
					data: 0x41,
					id: "startAlertData",
					name: "Start Alerts"
				},
				stopAlertData: {
					data: 0x42,
					id: "stopAlertData",
					name: "Stop Alerts"
				}
			}
		}/*,
		{
			name: "V1 Service Long",
			id: "92A0AFF4-9E05-11E2-AA59-F23C91AEC05E",
			characteristic: "92A0B4E0-9E05-11E2-AA59-F23C91AEC05E",
			writeCharacteristic: "92A0B8D2-9E05-11E2-AA59-F23C91AEC05E"
		}*/
	];
	
	function hex2bin(hex) {
		return parseInt(hex,16).toString(2);
	}

	function hex2dec(hex) {
		return parseInt(hex,16).toString(10);
	}

	function toDisplayValue(rawAlert) {
		var split = rawAlert.split(" ");
		var alert;
		if (split[3] === "31") {
			alert = "";
			var bc1 = hex2bin(split[5]);
			var bc2 = hex2bin(split[6]);
			var ss = hex2bin(split[7]);
			var bi1 = hex2bin(split[8]);
			var bi2 = hex2bin(split[9]);
	
			alert += "Bogey Counter 1: ["+bc1+"]\n";
			alert += "Bogey Counter 2: ["+bc2+"]\n";
			alert += "Signal Strength: ["+ss+"]\n";
			alert += "Band and Arrow 1: ["+bi1+"]\n";
			alert += "Band and Arrow 2: ["+bc2+"]";
		} else if (split[3] === "43") {
			alert = "";
			var aic = hex2bin(split[5]);
			var freqMSB = hex2dec(split[6]);
			var freqLSB = hex2dec(split[7]);
			var frontss = hex2dec(split[8]);
			var rearss = hex2dec(split[9]);
			var ba = hex2bin(split[10]);
			var pad = 8 - ba.length;
			for (var i = 0; i < pad; i++) {
				ba = "0"+ba;
			}
			var laser = ba.charAt(7) == "1";
			var ka = ba.charAt(6) == "1";
			var k = ba.charAt(5) == "1";
			var x = ba.charAt(4) == "1";
			var ku = ba.charAt(3) == "1";
			var front = ba.charAt(2) == "1";
			var side = ba.charAt(1) == "1";
			var rear = ba.charAt(0) == "1";
	
			alert += "Alert Index and Count: ["+aic+"]\n";
			alert += "MSB Frequency: ["+freqMSB+"]\n";
			alert += "LSB Frequency: ["+freqLSB+"]\n";
			alert += "Front Signal Strength: ["+frontss+"]\n";
			alert += "Rear Signal Strength: ["+rearss+"]\n";
			alert += "Band/Direction: ["+ba+"]\n";
			if (laser)
				alert += "Laser: ["+laser+"]\n";
			if (ka)	
				alert += "Ka: ["+ka+"]\n";
			if (k)	
				alert += "K: ["+k+"]\n";
			if (x)	
				alert += "X: ["+x+"]\n";
			if (ku)	
				alert += "Ku: ["+ku+"]\n";
			if (front)	
				alert += "Front: ["+front+"]\n";
			if (side)	
				alert += "Side: ["+side+"]\n";
			if (rear)	
				alert += "Rear: ["+rear+"]";
		} else {
			alert = rawAlert;
		}	
		return alert;		
	}
	
	
	class V1connectionLE extends BLEDevice {
		constructor(id, name) {
			super(id, name, SERVICES);
		}
		
		handleNotifactionResponse(buffer, service) {
			var data = new Uint8Array(buffer);
			var dataStr = BLEDevice.arrayToStr(data);
			var result;
			switch (data[3]) {
				case 0x02:
					this.listeners.forEach(function(listener) {
						listener(service, "Version : ["+dataStr+"]");
					});
					break;	
				case 0x04:
					this.listeners.forEach(function(listener) {
						listener(service, "Serial # : ["+dataStr+"]");
					});
					break;	
				case 0x31:
					if (!this.currDisplay || dataStr !== this.currDisplay) {
						this.currDisplay = dataStr;
						//result = dataStr;
					}
					break;
				case 0x43:
					if (!this.currAlert || dataStr !== this.currAlert) {
						this.currAlert = dataStr;
						result = dataStr;
					}
					break;	
				default:
					this.listeners.forEach(function(listener) {
						listener(service, "type : "+data[3]+" ["+dataStr+"]");
					});
					break;	
			}
			if (result) {
				var displayValue = toDisplayValue(result);
				this.mqttPublish("v1alerts", {alert: result}, true);
				
				this.listeners.forEach(function(listener) {
					listener(service, displayValue);
				});
			}
		
		}
		
		packageCmdData(data) {
			var checksum = (0xAA+0xDA+0xE6+data+0x01) & 0xFF;
			return new Uint8Array([0xAA, 0xDA, 0xE6, data, 0x01, checksum, 0xAB]);
		}
		
		static is(deviceName) {
			return (deviceName === 'V1connection LE');
		}
	}
	
	return V1connectionLE;

});