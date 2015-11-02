var gulp = require('gulp');
var mocha = require('gulp-mocha');

gulp.task('default', function() {
	console.log('yeah, it works');
});

gulp.task('test', function() {
  return gulp.src('test/*', {read: false})
      .pipe(mocha({reporter: 'spec'}));
});