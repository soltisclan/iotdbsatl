var gulp = require('gulp');
var env = require('gulp-env');
var browserify = require('browserify');
var babelify  = require('babelify');
var source = require('vinyl-source-stream');

gulp.task('build-client', ['set-env'], function () {
    return browserify({entries: './client/js/dodo.js', debug: true})
        .transform(babelify)
        .bundle()
        .pipe(source('bundle.js'))
        .pipe(gulp.dest('./client/'));
});

gulp.task('set-env', function () {
  env({
    vars: {
      NODE_ENV: "development"
    }
  })
});
