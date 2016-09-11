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
		'text!templates/log.html',
		'text!templates/logitem.html'
		], 
function($, Backbone, _, BaseView, config, Logger, template, logItemTemplate) {
	var dtFormat = function(d) {
		function pad(val) {
			val = val + "";
			if (val.length == 1) {
				val = "0" + val;
			}
			return val;
		}
		var month = pad(d.getMonth()+1);
		var day = pad(d.getDate());
		var hour = d.getHours();
		var ampm;
		if (hour < 12) {
			ampm = "AM";
		} else {
			ampm = "PM";
		}
		if (hour == 0) {
			hour = 12;
		}
		if (hour > 12) {
			hour = hour - 12;
		}

		var mins = pad(d.getMinutes());
		var secs = pad(d.getSeconds());
		return d.getFullYear()+"-"+month+"-"+day+" "+hour+":"+mins+":"+secs+ " "+ampm;
	};
	var levelFormat = function(level) {
		return Logger.levelToString(level);
	};
	var View = BaseView.extend({
		initialize: function(options) {
			options.header = {
				title: "Log"
			};
			this.constructor.__super__.initialize.apply(this, [options]);
			var logMsgs = Logger.getLogMsgs().slice(0);
			logMsgs.reverse();
			this.template = _.template( template) ( {logMsgs: logMsgs, dtFormat: dtFormat, levelFormat: levelFormat} );
			var logListener = function(logMsg) {
				$("#loglist").prepend(_.template( logItemTemplate) ( {logMsg: logMsg, dtFormat: dtFormat, levelFormat: levelFormat} ));
				$("#loglist").listview('refresh');
			}.bind(this);
			
			Logger.addLogListener(logListener);
		},
		render: function() {
			$(this.el).html( this.headerTemplate + this.template + this.menuTemplate );
		}
	});
	
	return View;
});
