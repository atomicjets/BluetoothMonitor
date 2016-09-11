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

define(['pouchdb', './Logger'], function(PouchDB, Logger) {
	var mqttdb = new PouchDB('MQTTDB');
	console.log("adapter: "+mqttdb.adapter); 
	
	mqttdb.info(function(err, info) { 
		Logger.log(Logger.INFO, "Connected to MQTT DB "+info.doc_count+ " records found");
	});
	
	return {
		addMQTTRecord: function(mqtt) {
			mqttdb.post(mqtt, function(err, doc) {
				if (err) {
					Logger.log(Logger.ERROR, "Failed to put message with id "+doc.id+ " err: "+err);
				}
			});
		},
		getMQTTRecords: function(cb) {
			mqttdb.allDocs({
  				include_docs: true,
  				attachments: true
			}, function(err, response) {
  				if (err) { 
					Logger.log(Logger.ERROR, "Failed to put messages err: "+err);
  				}
  				cb(response.rows);
			});
		},
		removeMQTTRecord: function(record) {
			mqttdb.remove(record, function(err, response) {
				if (err) {
					Logger.log(Logger.ERROR, "Failed to delete message with id "+message._id+ " err: "+err);
				}
			});
		}
	};
});
