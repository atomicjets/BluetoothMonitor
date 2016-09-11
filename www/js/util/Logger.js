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

define(function() {
	var logMsgs = [];
	var listeners = [];
	
	return {
		ERROR: 1,
		WARN: 2,
		INFO: 3,
		TRACE: 4,
		log: function(level, msg) {
			var logMsg = {time: new Date(), msg: msg, level: level};
			logMsgs.push(logMsg);
			listeners.forEach(function(listener) {
				listener(logMsg);
			});
		},
		addLogListener: function(listener) {
			listeners.push(listener);
		},
		removeLogListener: function(listener) {
			var index = listeners.indexOf(listener);
			if (index > -1) {
				listeners.splice(index, 1);
			}
		},
		getLogMsgs: function(level) {
			if (level) {
				var msgs = [];
				logMsgs.forEach(function(msg) {
					if (msg.level === level) {
						msgs.push(msg);
					}
				});
				return msgs;
			} else {
				return logMsgs;
			}
		},
		levelToString: function(level) {
			switch (level) {
				case this.ERROR: 
					return "ERROR";
				case this.WARN: 
					return "WARN";
				case this.INFO: 
					return "INFO";
				case this.TRACE: 
					return "TRACE";
			}
		}
	}
});