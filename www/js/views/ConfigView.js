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
		'../util/MessagePopup',
		'../mqttmanager/MQTTManager',
		'text!templates/config.html'
		], 
function($, Backbone, _, BaseView, config, Logger, MessagePopup, MQTTManager, template) {

	function toArray(list) {
  		return Array.prototype.slice.call(list || [], 0);
	}
		
	function listDirectory(dir, cb, individual) {
		var dirReader = dir.createReader();
		var entries = [];

		var readEntries = function() {
			dirReader.readEntries (function(results) {
				if (!results.length) {
					if (individual) {
						entries.forEach(function(entry) {
							if (entry.isFile) {
								cb(entry);
							} else {
								listDirectory(entry, cb, individual);
							}
						});				
					} else {
						cb(entries);
					}
				} else {
					entries = entries.concat(toArray(results));
					readEntries();
				}
			}, onError);
		}
		readEntries();
	}
	
	function onError(err) {
		Logger.log(Logger.ERROR, "File System error : "+JSON.stringify(err));
	}

	var dataDirEntry;
	window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function (fileSystem) {
		window.resolveLocalFileSystemURL(cordova.file.dataDirectory, function (dirEntry) {
			listDirectory(dirEntry, function(entry) {
				console.log("file : "+entry.name+" : "+entry.fullPath);
			}, true);
			dataDirEntry = dirEntry;
		}, onError);
	});

	var View = BaseView.extend({
		events: function() {
			return _.extend({}, BaseView.prototype.events, {
				"click #getCert" : function(evt) {
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
						text : "Enter Cert URL"
					}).appendTo($popUp);
			
					$("<p/>", {
						text : "URL:"
					}).appendTo($popUp);
			
					$("<input/>", {
						id : "url",
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
						var url = $("#url").val();
						dataDirEntry.getFile("cert.p12", {create: true, exclusive: false}, function(fileEntry) {
							var fileTransfer = new FileTransfer();
							fileTransfer.download(url, fileEntry.toURL(),
								function(entry) {
									Logger.log(Logger.INFO, "Cert downloaded to : "+entry.toURL());
									MessagePopup.create("Cert Downloaded", "Cert downloaded to : "+entry.toURL());
								},
								function(error) {
									Logger.log(Logger.ERROR, "File Download error : "+JSON.stringify(error));
									MessagePopup.create("Cert Download Error", "Cert download error "+error.source+":"+error.target+":"+error.code);
								}
							);			
						}, onError);
					
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
				},	
				"click #save" : function(evt) {
					var mqttConfig = {
						host: $("#host").val(),
						port: parseInt($("#port").val()),
						clientId: $("#clientId").val(),
						certfile: "cert.p12",
						tls: $("#tls").is(":checked"),
						certpwd: $("#certpwd").val()
					};
					config.setMqttConfig(mqttConfig);
					MQTTManager.connect();
					MessagePopup.create("Save Complete", "Save of MQTT config complete");
				
				}
			});
		},	
		initialize: function(options) {
			options.header = {
				title: "Device"
			};
			this.constructor.__super__.initialize.apply(this, [options]);
			var mqttConfig = config.getMqttConfig();
			if (!mqttConfig) {
				mqttConfig = {
					host: "",
					port: 1883,
					clientId: "",
					certfile: "cert.p12",
					tls: false,
					certpwd: ""
				};
			}
			this.template = _.template( template) ( {mqttConfig: mqttConfig} );
		},
		render: function() {
			$(this.el).html( this.headerTemplate + this.template + this.menuTemplate );
		}
	});
	
	return View;
});
