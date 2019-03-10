const gulp = require('gulp');
const browserSync = require('browser-sync').create();
const fs = require('fs');
const rename = require('gulp-rename');
const util = require('util');
const path = require('path');

const toCopy =
{
	FullCalendar_js:
	{
		src:
		[
			'node_modules/fullcalendar/dist/fullcalendar.js',
			'node_modules/fullcalendar/dist/fullcalendar.min.js'
		],
		dest: 'js/libs/'
	},
	FullCalendar_js_locale:
	{
		src: 'node_modules/fullcalendar/dist/locale/fr.js',
		dest: 'js/libs/',
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
		dest: 'css/'
	},
	jQuery:
	{
		src:
		[
			'node_modules/jquery/dist/jquery.min.js',
			'node_modules/jquery/dist/jquery.min.map'
		],
		dest: 'js/libs'
	},
	moment:
	{
		src:
		[
			'node_modules/moment/min/moment.min.js',
			'node_modules/moment/min/moment-with-locales.min.js'
		],
		dest: 'js/libs/'
	}
};

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
			baseDir: "./",
			index: "calendar.dev.html"
		}
	});
	
	//gulp.watch("*.scss", ['sass']);
	gulp.watch(["*.html", "js/**/*.js", "css/*.css"]).on('change', browserSync.reload);
});

exports.default = gulp.series('copy', 'serve');
