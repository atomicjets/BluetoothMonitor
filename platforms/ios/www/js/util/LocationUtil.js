define([
	'./Logger',
	'../mqttmanager/MQTTManager'
],
function(Logger, MQTTManager) {
	var currentPos;
	locationService.addListener(function(pos) {
		currentPos = pos;
		if (pos.inBackground) {
			Logger.log(Logger.INFO, "Location ["+pos.latitude+", "+pos.longitude+", "+pos.inBackground+"]");
			MQTTManager.publish("location", pos);
		}
	});
	return {
		getLocation: function() {
			return currentPos;
		}
	}
});