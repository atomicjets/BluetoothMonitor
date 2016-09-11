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
	'jquerymobile',
	'bluetooth/BLEDevice',
	'views/LogView',
	'views/DeviceView',
	'views/DeviceListView',
	'views/ConfigView',
	'views/DeviceChartView'
	], 
function($, Backbone, _, mobile, BLEDevice, LogView, DeviceView, DeviceListView, ConfigView, DeviceChartView) {
	var currentPage;
	
	var devices = {};

	function scan() {
		BLEDevice.startScan(function(device) {
			devices[device.getId()] = device;
			if (currentPage && currentPage.addDevice) {
				currentPage.addDevice(device);
			}
		});
	}
	scan();
	
	var Router = Backbone.Router.extend({
		initialize: function(options) {
			$('.back').on('click', function(event) {
	            window.history.back();
	            return false;
	        });
	        this.on("route:log", function() {
				this.changePage(new LogView(this));
	        });
	        this.on("route:config", function() {
				this.changePage(new ConfigView(this));
	        });
	        this.on("route:device", function(id) {
				this.changePage(new DeviceView({device: devices[id]}));
	        });
	        this.on("route:chart", function(id) {
				this.changePage(new DeviceChartView({device: devices[id]}));
	        });
	        this.on("route:devices", function() {
	        	var deviceMap = {};
	        	for (deviceId in devices) {
	        		deviceMap[deviceId] = devices[deviceId];
				}
				this.changePage(new DeviceListView({devices: deviceMap, router: this}));
	        });
			Backbone.history.start();
		},
	    changePage:function (page) {
	    	if (currentPage && currentPage.cleanup) {
	    		currentPage.cleanup();
	    	}
	    	currentPage = page;
	        $(page.el).attr('data-role', 'page');
	        page.render();
	        $('body').append($(page.el));
	        mobile.changePage($(page.el), {changeHash:false, reverse: false});
	    },
	    rescan: function() {
	    	BLEDevice.stopScan(function() {
		    	devices = {};
		    	scan();
		    });
	    },
		routes: {
			'device/:id': 'device',
			'chart/:id': 'chart',
			'devices': 'devices',
			'log': 'log',
			'config': 'config',
			'': 'devices'
		}
	});
	
	return Router;
});
