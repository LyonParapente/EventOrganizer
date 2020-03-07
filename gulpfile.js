var gulp = require("gulp");
var rename = require('gulp-rename');
var concat = require('gulp-concat');
var browserify = require("browserify");
var source = require('vinyl-source-stream');
var tsify = require("tsify");
var uglify = require('gulp-uglify-es').default;
var sourcemaps = require('gulp-sourcemaps');
var buffer = require('vinyl-buffer');
var sass = require('gulp-sass');
sass.compiler = require('node-sass');
const browserSync = require('browser-sync').create();

var dist = "dist";

gulp.task('copy html', function ()
{
	return gulp.src('src/*.html')
		.pipe(gulp.dest(dist));
});

function bundlejs()
{
	return browserify(
	{
		basedir: '.',
		debug: true,
		entries: ['src/main.ts'],
		cache: {},
		packageCache: {}
	})
	.plugin(tsify)
	.bundle()
	.pipe(source('bundle.min.js'))
	.pipe(buffer())
	.pipe(sourcemaps.init({loadMaps: true}))
	.pipe(uglify())
	.pipe(sourcemaps.write('./'))
	.pipe(gulp.dest(dist));
}

gulp.task("copy fontawesome", function()
{
	return gulp.src('node_modules/@fortawesome/fontawesome-free/css/all.min.css')
		.pipe(rename('fontawesome-all.min.css'))
		.pipe(gulp.dest(dist+"/css/"));
});

gulp.task("copy css themes", function()
{
	return gulp.src('src/css/themes/*')
		.pipe(gulp.dest(dist+"/css/theme/"));
});

gulp.task("copy webfonts", function()
{
	return gulp.src('node_modules/@fortawesome/fontawesome-free/webfonts/*')
		.pipe(gulp.dest(dist+"/webfonts/"));
});

gulp.task("fullcalendar css", function()
{
	var files =
	[
		'node_modules/@fullcalendar/core/main.min.css',
		'node_modules/@fullcalendar/daygrid/main.min.css',
		'node_modules/@fullcalendar/list/main.min.css',
		'node_modules/@fullcalendar/bootstrap/main.min.css'
	];
	return gulp.src(files)
		.pipe(concat('fullcalendar.min.css'))
		.pipe(gulp.dest(dist+"/css/"));
});

gulp.task("scss", function()
{
	return gulp.src('src/css/*.scss')
		//.pipe(sourcemaps.init())
		.pipe(sass({outputStyle: 'compressed'}).on('error', sass.logError))
		//.pipe(sourcemaps.write())
		.pipe(concat('calendar.min.css'))
		.pipe(gulp.dest(dist+"/css/"));
});

function bundlecss()
{
	return gulp.parallel("copy fontawesome", "copy css themes", "copy webfonts", "fullcalendar css", "scss");
}
gulp.task("css", bundlecss());

gulp.task('serve', function()
{
	browserSync.init(
	{
		server:
		{
			baseDir: "dist",
			index: "calendar.html",
			routes:
			{
				"/events": "data/events",
				"/avatars": "data/avatars"
			}
		}
	});
	
	gulp.watch("src/*.html").on('change', gulp.series('copy html', browserSync.reload));
	gulp.watch("src/**/*.ts").on('change', gulp.series(bundlejs, browserSync.reload));
	gulp.watch(["src/css/**/*.scss", "src/css/**/*.css"]).on('change', gulp.series("css", browserSync.reload));
});

gulp.task("default", gulp.series("copy html", gulp.parallel(bundlejs, "css"), "serve"));
