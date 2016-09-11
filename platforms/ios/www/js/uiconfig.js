define(function() {
	var mqttConfig;
	var mqttConfigStr = localStorage["blemon.mqtt"];
	if (mqttConfigStr) {
		mqttConfig = JSON.parse(mqttConfigStr);
	}
	return {
		getMqttConfig : function() {
			return mqttConfig;
		},
		setMqttConfig : function(newMqttConfig) {
			mqttConfig = newMqttConfig;
			var mqttConfigStr = JSON.stringify(mqttConfig);
			localStorage["blemon.mqtt"] = mqttConfigStr;
		}
	}
});