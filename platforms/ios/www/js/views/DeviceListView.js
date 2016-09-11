define([
		'jquery', 
		'backbone',
		'underscore',
		'./BaseView',
		'../uiconfig',
		'../util/Logger',
		'../util/LocationUtil',
		'../mqttmanager/MQTTManager',
		'text!templates/devicelist.html',
		'text!templates/devicelistitem.html'
		], 
function($, Backbone, _, BaseView, config, Logger, LocationUtil, MQTTManager, template, itemTemplate) {
	var View = BaseView.extend({
		events: function() {
			return _.extend({}, BaseView.prototype.events, {
				"click #rescan" : function(evt) {
					this.deviceMap = {};
					$("#devicelist li").remove();
					$("#devicelist").listview('refresh');
					this.router.rescan();
				}
			});
		},
		initialize: function(options) {
			options.header = {
				title: "Devices"
			};
			this.constructor.__super__.initialize.apply(this, [options]);
			this.deviceMap = options.devices;
			this.router = options.router;
			var devices = [];
			for (deviceId in options.devices) {
				devices.push(options.devices[deviceId]);
			}
			this.template = _.template(template) ( {devices: devices} );
		},
		render: function() {
			$(this.el).html( this.headerTemplate + this.template + this.menuTemplate );
		},
		cleanup: function() {
		},
		addDevice: function(device) {
			if (!this.deviceMap[device.id]) {
				this.deviceMap[device.id] = device;
				$("#devicelist").append(_.template(itemTemplate) ( {device: device} ));
				$("#devicelist").listview('refresh');
			}
		}
	});
	
	return View;
});
