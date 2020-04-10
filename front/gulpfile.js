var gulp = require("gulp");
var rename = require('gulp-rename');
var concat = require('gulp-concat');
var browserify = require("browserify");
var source = require('vinyl-source-stream');
var tsify = require("tsify");
var tslint = require("gulp-tslint");
var uglify = require('gulp-uglify-es').default;
var uglifycss = require('gulp-uglifycss');
var sourcemaps = require('gulp-sourcemaps');
var buffer = require('vinyl-buffer');
var sass = require('gulp-sass');
sass.compiler = require('node-sass');
const browserSync = require('browser-sync').create();

var dist = "dist",
	dist_js = dist+"/js/",
	dist_css = dist+"/css/";

gulp.task('copy html', function ()
{
	return gulp.src('src/*.html')
		.pipe(gulp.dest(dist));
});

gulp.task('copy js', function ()
{
	var files =
	[
		'node_modules/jquery/dist/jquery.slim.min.js',
		'node_modules/jquery/dist/jquery.slim.min.map',
		'node_modules/bootstrap/dist/js/bootstrap.bundle.min.js', // need Popper 1.x for sortie_category
		'node_modules/bootstrap/dist/js/bootstrap.bundle.min.js.map',
		'node_modules/bootstrap-colorpicker/dist/js/bootstrap-colorpicker.min.js',
		'node_modules/bootstrap-colorpicker/dist/js/bootstrap-colorpicker.min.js.map'
	];
	return gulp.src(files)
		.pipe(gulp.dest(dist_js));
});

gulp.task('copy js html5tooltips', function ()
{
	return gulp.src('node_modules/html5tooltipsjs/html5tooltips.js')
		.pipe(uglify())
		.pipe(rename('html5tooltips.min.js'))
		.pipe(gulp.dest(dist_js));
});

gulp.task('copy js leaflet', function ()
{
	var files =
	[
		'node_modules/leaflet/dist/leaflet.js',
		'node_modules/esri-leaflet/dist/esri-leaflet.js',
		'node_modules/esri-leaflet/dist/esri-leaflet.js.map',
		'node_modules/esri-leaflet-geocoder/dist/esri-leaflet-geocoder.js',
		'node_modules/esri-leaflet-geocoder/dist/esri-leaflet-geocoder.js.map',
		'node_modules/leaflet-fullscreen/dist/Leaflet.fullscreen.min.js'
	];
	return gulp.src(files)
		.pipe(gulp.dest(dist_js));
});

function compile_js()
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
	.pipe(gulp.dest(dist_js));
}

gulp.task('tslint', function ()
{
	return gulp.src('src/**/*.ts', { base: '.' })
		.pipe(tslint())
		.pipe(tslint.report({emitError: false}));
});

gulp.task("copy css fontawesome", function ()
{
	return gulp.src('node_modules/@fortawesome/fontawesome-free/css/all.min.css')
		.pipe(rename('fontawesome-all.min.css'))
		.pipe(gulp.dest(dist_css));
});

gulp.task("copy css bootstrap-colorpicker", function ()
{
	var files =
	[
		'node_modules/bootstrap-colorpicker/dist/css/bootstrap-colorpicker.min.css',
		'node_modules/bootstrap-colorpicker/dist/css/bootstrap-colorpicker.min.css.map'
	];
	return gulp.src(files)
		.pipe(gulp.dest(dist_css));
});

gulp.task("copy css html5tooltips", function ()
{
	var files =
	[
		'node_modules/html5tooltipsjs/html5tooltips.css',
		'node_modules/html5tooltipsjs/html5tooltips.animation.css'
	];
	return gulp.src(files)
		.pipe(concat('html5tooltips.min.css'))
		.pipe(uglifycss())
		.pipe(gulp.dest(dist_css));
});

gulp.task("copy css leaflet", function ()
{
	return gulp.src('node_modules/leaflet/dist/leaflet.css').pipe(gulp.dest(dist+"/css/leaflet/"));
});
gulp.task("copy leaflet-images", function ()
{
	return gulp.src('node_modules/leaflet/dist/images/*').pipe(gulp.dest(dist+'/css/leaflet/images/'));
});
gulp.task("copy css leaflet-geocoder", function ()
{
	return gulp.src('node_modules/esri-leaflet-geocoder/dist/esri-leaflet-geocoder.css').pipe(gulp.dest(dist+'/css/leaflet/geocoder/'));
});
gulp.task("copy leaflet-geocoder-images", function ()
{
	return gulp.src('node_modules/esri-leaflet-geocoder/dist/img/*').pipe(gulp.dest(dist+'/css/leaflet/geocoder/img/'));
});
gulp.task("copy leaflet-fullscreen-images", function ()
{
	var files =
	[
		'node_modules/leaflet-fullscreen/dist/leaflet.fullscreen.css',
		'node_modules/leaflet-fullscreen/dist/fullscreen.png',
		'node_modules/leaflet-fullscreen/dist/fullscreen@2x.png'
	];
	return gulp.src(files).pipe(gulp.dest(dist+'/css/leaflet/fullscreen/'));
});
function bundle_leaflet_css()
{
	return gulp.series("copy css leaflet", "copy leaflet-images", "copy css leaflet-geocoder", "copy leaflet-geocoder-images", "copy leaflet-fullscreen-images");
}

gulp.task("copy css themes", function ()
{
	return gulp.src('src/css/themes/*')
		.pipe(gulp.dest(dist+"/css/theme/"));
});

gulp.task("copy webfonts", function ()
{
	return gulp.src('node_modules/@fortawesome/fontawesome-free/webfonts/*')
		.pipe(gulp.dest(dist+"/webfonts/"));
});

gulp.task("fullcalendar css", function ()
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
		.pipe(gulp.dest(dist_css));
});

gulp.task("scss", function ()
{
	return gulp.src('src/css/*.scss')
		//.pipe(sourcemaps.init())
		.pipe(sass({outputStyle: 'compressed'}).on('error', sass.logError))
		//.pipe(sourcemaps.write())
		.pipe(concat('calendar.min.css'))
		.pipe(gulp.dest(dist_css));
});

function bundle_css ()
{
	return gulp.parallel(
		gulp.series(
			"copy css fontawesome",
			"copy css bootstrap-colorpicker",
			"copy css themes",
			"copy webfonts",
			"fullcalendar css"
		),
		"scss",
		"copy css html5tooltips",
		bundle_leaflet_css()
	);
}
gulp.task("css", bundle_css());

function bundle_js ()
{
	return gulp.parallel(
		"copy js",
		compile_js,
		"copy js html5tooltips",
		"copy js leaflet"
	);
}

gulp.task('serve', function ()
{
	var SPA = "calendar.html";
	browserSync.init(
	{
		ghostMode: false,
		server:
		{
			baseDir: "dist",
			index: SPA,
			routes:
			{
				"/events": "data/events",
				"/avatars": "data/avatars"
			}
		},

		// Routing
		middleware: function (req, res, next)
		{
			if (req.url === '/planning' ||
				req.url === '/event:new' ||
				req.url.match(/event:[0-9]+$/) ||
				req.url.match(/[0-9]{4}-[0-9]{2}$/))
			{
				console.log(req.url);
				req.url = '/'+SPA;
			}
			return next();
		}
	});
	
	gulp.watch("src/*.html").on('change', gulp.series('copy html', browserSync.reload));
	gulp.watch("src/**/*.ts").on('change', gulp.series("tslint", bundle_js(), browserSync.reload));
	gulp.watch(["src/css/**/*.scss", "src/css/**/*.css"]).on('change', gulp.series("css", browserSync.reload));
});

gulp.task("default", gulp.series("copy html", "tslint", gulp.parallel(bundle_js(), "css"), "serve"));
