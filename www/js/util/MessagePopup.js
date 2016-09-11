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

define(['jquery'], function($) {
	return {
		create: function(title, msg, html, cb, showCancel) {
			var $popUp = $("<div/>").popup({
				dismissible : false,
				theme : "a",
				overlayTheme : "a",
				transition : "pop"
			}).bind("popupafterclose", function() {
				$(this).remove();
			});			
			$popUp.addClass("ui-content");
			$("<h4/>", {
		        text : title
		    }).appendTo($popUp);
		    if (msg) {
				$("<p/>", {
					text : msg
				}).appendTo($popUp);
		    } else if (html) {
				$("<span/>", {
					html : html
				}).appendTo($popUp);
		    }
			$("<a>", {
				text : "Ok"
			}).buttonMarkup({
				inline : true,
				icon : "check"
			}).bind("click", function() {
				$popUp.popup("close");
				if (cb) cb();
			}).appendTo($popUp);
			
			if (showCancel) {
				$("<a>", {
					text : "Cancel"
				}).buttonMarkup({
					inline : true
				}).bind("click", function() {
					$popUp.popup("close");
				}).appendTo($popUp);
			}
			$popUp.popup("open").trigger("create");
		}
	}
});