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
		'text!templates/device.html',
		'text!templates/devicenotification.html',
		'text!templates/devicecommand.html'
		], 
function($, Backbone, _, BaseView, config, Logger, template, notificationTemplate, commandTemplate) {
	var View = BaseView.extend({
		events: function() {
			return _.extend({}, BaseView.prototype.events, {
				"click #connect" : function(evt) {
					if (this.device.isConnected()) {
						this.disconnect();
					} else {
						this.connect();
					}
				},
				"click #commandlist li" : function(evt) {
					var id = evt.target.id;
					if (id === "") {
						id = evt.target.parentNode.id;
					}
					if (id !== "") {
						var serviceId = id.substring(0, id.indexOf('~'));
						var commandId = id.substring(id.indexOf('~')+1);
						if (this.device.promptForInput(commandId, serviceId) === true) {
							var $popUp = $("<div/>").popup({
								dismissible : false,
								theme : "a",
								overlyaTheme : "a",
								transition : "pop"
							}).bind("popupafterclose", function() {
								$(this).remove();
							});			
							$popUp.addClass("ui-content");
							$("<h3/>", {
								text : "Request Input"
							}).appendTo($popUp);
			
							$("<p/>", {
								text : "Input:"
							}).appendTo($popUp);
			
							$("<input/>", {
								id : "input",
								type : "text",
								value : "",
								autocapitalize: "off"
							}).appendTo($popUp);
			
							$("<a>", {
								text : "Ok"
							}).buttonMarkup({
								inline : true,
								icon : "check"
							}).bind("click", function() {
								$popUp.popup("close");
								var input = $("#input").val();
								this.device.sendCommand(commandId, serviceId, input);
							}.bind(this)).appendTo($popUp);
			
							$("<a>", {
								text : "Cancel"
							}).buttonMarkup({
								inline : true,
								icon : "delete"
							}).bind("click", function() {
								$popUp.popup("close");
							}).appendTo($popUp);
			
							$popUp.popup("open").trigger("create");
						
						} else {
							this.device.sendCommand(commandId, serviceId);
						}
					}
				}	
			});
		},
		initialize: function(options) {
			options.header = {
				title: "Device"
			};
			this.constructor.__super__.initialize.apply(this, [options]);
			this.device = options.device;
			this.template = _.template(template) ( {device: this.device} );
			//this.connect();
		},
		render: function() {
			$(this.el).html( this.headerTemplate + this.template + this.menuTemplate );
		},
		connect: function() {
			$("#connect").val('Disconnect');
			$("#connect").button("refresh");
			$("#commandlist li").remove();
			$("#notifications div").remove();
			
			var deviceListener = function(service, dataStr) {
				var notification = {service: service, data: dataStr};
				var elem = $("#"+service.id);
				if (elem.length > 0) {
					$("#data_"+service.id).val(dataStr);
				} else {
					$("#notifications").append(_.template(notificationTemplate) ( {notification: notification } ));						
					$("#notifications").collapsibleset('refresh');
				}
			}
			this.deviceListener = deviceListener;
			this.device.addListener(deviceListener);
			
			var errorListener = function(err) {
				console.log(err);
				this.disconnect();
			}.bind(this);
			this.errorListener = errorListener;
			this.device.addErrorListener(errorListener);
			
			this.device.connect(function() {
				this.device.startNotifications();
				this.device.configure();
				var commandIds = this.device.getCommandIds();
				commandIds.forEach(function(commandId) {
					var command = this.device.getCommand(commandId.id, commandId.serviceId);
					$("#commandlist").append(_.template(commandTemplate) ( {command: command, serviceId: commandId.serviceId} ));						
				}.bind(this));
				$("#commandlist").listview('refresh');
			}.bind(this));
		},
		disconnect: function() {
			$("#connect").val('Connect');
			$("#connect").button("refresh");
			$("#commandlist li").remove();
			$("#commandlist").listview('refresh');
			this.device.stopNotifications(function() {
				this.device.disconnect();
				this.device.removeListener(this.deviceListener);
				this.device.removeErrorListener(this.errorListener);
			}.bind(this));
		},
		cleanup: function() {
			if (this.device.isConnected()) {
				this.disconnect();
			}
		}
	});
	
	return View;
});
