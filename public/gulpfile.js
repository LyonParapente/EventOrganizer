const gulp = require('gulp');
const browserSync = require('browser-sync').create();

gulp.task('serve', function()
{
	browserSync.init(
	{
		server:
		{
			baseDir: "./"
		}
	});
	
	//gulp.watch("*.scss", ['sass']);
	gulp.watch(["*.js", "*.css", "*.html"]).on('change', browserSync.reload);
});

gulp.task('default', ['serve']);