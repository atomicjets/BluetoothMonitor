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
