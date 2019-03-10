const gulp = require('gulp');
const browserSync = require('browser-sync').create();

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
	gulp.watch(["*.html", "js/*.js", "css/*.css"]).on('change', browserSync.reload);
});

exports.default = gulp.series('serve');
