define([
		'jquery', 
		'backbone',
		'underscore',
		'./BaseView',
		'../uiconfig',
		'../util/Logger',
		'chart',
		'text!templates/devicecharts.html',
		'text!templates/devicechart.html'
		], 
function($, Backbone, _, BaseView, config, Logger, Chart, template, chartTemplate) {
	var View = BaseView.extend({
		events: function() {
			return _.extend({}, BaseView.prototype.events, {
				"click #connect" : function(evt) {
					if (this.device.isConnected()) {
						this.disconnect();
					} else {
						this.connect();
					}
				}
			});
		},
		initialize: function(options) {
			options.header = {
				title: "Device Chart"
			};
			this.constructor.__super__.initialize.apply(this, [options]);
			this.charts = {};
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
			$("#charts div").remove();
			
			var deviceListener = function(service, dataStr, rawData) {
				if (rawData) {
					var elem = $("#"+service.id);
					if (elem.length > 0) {
						for (var chartId in rawData) {
							var chartData = rawData[chartId];
							this.charts[service.id][chartId].data.datasets[0].data.push(chartData);
							if (this.charts[service.id][chartId].data.datasets[0].data.length > 9) {
								this.charts[service.id][chartId].data.labels.splice(0, 1);
								this.charts[service.id][chartId].data.datasets[0].data.splice(0, 1);
							}
							var labels = this.charts[service.id][chartId].data.labels;
							var label = labels[labels.length -1] + 1;
							this.charts[service.id][chartId].data.labels.push(label);
							this.charts[service.id][chartId].update();
						}
					} else {
						$("#charts").append(_.template(chartTemplate) ( {chart: {service: service, charts: rawData} } ));
						this.charts[service.id] = {};
						for (var chartId in rawData) {
							var chartData = rawData[chartId];
							var ctx = $("#chart_"+service.id+"_"+chartId);
							this.charts[service.id][chartId] = new Chart(ctx,{
								type: "line",
								data: { 
									labels: [1],
									datasets: [{
										label: chartId,
										borderColor: "rgba(75,192,192,1)",
										backgroundColor: "rgba(75,192,192,0.4)",
										pointBorderColor: "rgba(75,192,192,1)",
										pointBackgroundColor: "#fff",
										pointBorderWidth: 1,
										data: [chartData]							
									}]
								},
								options: {/*
									title: {
				                    	display:true,
                				    	text: chartId
                					},
									scales: {
										xAxes: [{
											type: "time",
											time: {
												format: timeFormat,
												// round: 'day'
												tooltipFormat: 'll HH:mm'
											},
											scaleLabel: {
												display: true,
												labelString: 'Date'
											}
										}, ],
										yAxes: [{
											scaleLabel: {
												display: true,
												labelString: chartId
											}
										}]
									}*/                												
								}
							});
						}	
						$("#charts").collapsibleset('refresh');
					}
				}
			}.bind(this);
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
			}.bind(this));
		},
		disconnect: function() {
			$("#connect").val('Connect');
			$("#connect").button("refresh");
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
