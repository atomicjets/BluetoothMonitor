require.config({
	baseUrl: 'js/',
	paths: {
		jquery: '../lib/jquery/jquery-2.1.4',
		jquerymobile: '../lib/mobile/jquery.mobile-1.4.5',
		underscore: '../lib/underscore/underscore-1.8.3',
		backbone: '../lib/backbone/backbone-1.2.0',
		text: '../lib/requirejs/text',
		q: '../lib/q/q',
		pouchdb: '../lib/pouchdb/pouchdb-5.3.1.min',
		chart: '../lib/chart/Chart.min',
		templates: '../templates'
	}
});
require(['app']);
