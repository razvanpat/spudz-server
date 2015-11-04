var gulp = require('gulp');
var mocha = require('gulp-mocha');
var shell = require('gulp-shell');

gulp.task('default', function() {
	console.log('yeah, it works');
});

gulp.task('test', function() {
  return gulp.src('test/*', {read: false})
      .pipe(mocha({reporter: 'spec'}));
});

gulp.task('load', shell.task([
  'node test_load/test_load.js'
]));

gulp.task('serve', shell.task([
  'node src/index.js'
]));