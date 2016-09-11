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
