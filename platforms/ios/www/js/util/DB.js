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
