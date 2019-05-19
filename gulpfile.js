const gulp = require('gulp');
const browserSync = require('browser-sync').create();
const fs = require('fs');
const rename = require('gulp-rename');
const util = require('util');
const path = require('path');

const front = 'front/';

const toCopy =
{
	FullCalendar_js:
	{
		src:
		[
			'node_modules/fullcalendar/dist/fullcalendar.js',
			'node_modules/fullcalendar/dist/fullcalendar.min.js'
		],
		dest: front+'js/libs/'
	},
	FullCalendar_js_locale:
	{
		src: 'node_modules/fullcalendar/dist/locale/fr.js',
		dest: front+'js/libs/',
		rename: function (path)
		{
			path.basename = 'fullcalendar-locale-fr';
			path.extname = ".js";
		}
	},
	FullCalendar_css:
	{
		src:
		[
			'node_modules/fullcalendar/dist/fullcalendar.css',
			'node_modules/fullcalendar/dist/fullcalendar.min.css'
		],
		dest: front+'css/'
	},
	jQuery:
	{
		src:
		[
			'node_modules/jquery/dist/jquery.min.js',
			'node_modules/jquery/dist/jquery.min.map'
		],
		dest: front+'js/libs'
	},
	moment:
	{
		src:
		[
			'node_modules/moment/min/moment.min.js',
			'node_modules/moment/min/moment-with-locales.min.js'
		],
		dest: front+'js/libs/'
	},
	leaflet_js:
	{
		src:
		[
			'node_modules/leaflet/dist/leaflet.js',
			'node_modules/esri-leaflet/dist/esri-leaflet.js',
			'node_modules/esri-leaflet-geocoder/dist/esri-leaflet-geocoder.js',
			'node_modules/leaflet-fullscreen/dist/Leaflet.fullscreen.min.js'
		],
		dest: front+'js/libs/'
	},
	leaflet_css:
	{
		src: 'node_modules/leaflet/dist/leaflet.css',
		dest: front+'css/leaflet/'
	},
	leaflet_geocoder_css:
	{
		src: 'node_modules/esri-leaflet-geocoder/dist/esri-leaflet-geocoder.css',
		dest: front+'css/leaflet/geocoder/'
	},
	leaflet_fullscreen_css:
	{
		src:
		[
			'node_modules/leaflet-fullscreen/dist/leaflet.fullscreen.css',
			'node_modules/leaflet-fullscreen/dist/fullscreen.png',
			'node_modules/leaflet-fullscreen/dist/fullscreen@2x.png'
		],
		dest: front+'css/leaflet/fullscreen/'
	},
	colorpicker_css:
	{
		
		src: 'node_modules/bootstrap-colorpicker/dist/css/bootstrap-colorpicker.min.css',
		dest: front+'css/'
	},
	colorpicker_js:
	{
		
		src: 'node_modules/bootstrap-colorpicker/dist/js/bootstrap-colorpicker.min.js',
		dest: front+'js/libs/'
	}
};

gulp.task('copy-leaflet-images', function (done)
{
	return gulp.src('node_modules/leaflet/dist/images/*').pipe(gulp.dest(front+'css/leaflet/images/'));
});
gulp.task('copy-leaflet-geocoder-images', function (done)
{
	return gulp.src('node_modules/esri-leaflet-geocoder/dist/img/*').pipe(gulp.dest(front+'css/leaflet/geocoder/img/'));
});

gulp.task('copy', function (done)
{
	for (var category in toCopy)
	{
		var block = toCopy[category];
		var shouldCopy = false;

		var sourceList = Array.isArray(block.src) ? block.src : [block.src];
		sourceList.forEach(source =>
		{
			var sourceStats = fs.statSync(source);
			var sourceCtime = new Date(util.inspect(sourceStats.ctime));

			var dest = block.dest;
			if (block.rename)
			{
				// Compte dest after rename
				var extname = path.extname(source);
				var p = {basename: path.basename(source, extname), extname: extname};
				block.rename(p);
				dest += p.basename + p.extname;
			}
			else
			{
				dest += source;
			}

			if (fs.existsSync(dest))
			{
				// Compare source & dest stats
				var destStats = fs.statSync(dest);
				var destMtime = new Date(util.inspect(destStats.mtime));
				/*console.log("source", source, "dest", dest);
				console.log("source time: ", sourceCtime);
				console.log("dest time: ", destMtime);*/
				if (destMtime < sourceCtime)
				{
					shouldCopy = true;
				}
			}
			else
			{
				shouldCopy = true;
			}
		});

		if (shouldCopy)
		{
			var res = gulp.src(block.src);
			if (block.rename)
			{
				res = res.pipe(rename(block.rename))
			}
			res.pipe(gulp.dest(block.dest));
		}
	}
	done();
});

gulp.task('serve', function()
{
	browserSync.init(
	{
		server:
		{
			baseDir: "front",
			index: "calendar.dev.html",
			routes:
			{
				"/events": "data/events",
				"/avatars": "data/avatars"
			}
		}
	});
	
	//gulp.watch("*.scss", ['sass']);
	gulp.watch(["*.html", "js/**/*.js", "css/*.css"]).on('change', browserSync.reload);
});

exports.default = gulp.series('copy', 'serve');
