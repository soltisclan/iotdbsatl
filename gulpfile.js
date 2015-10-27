var gulp = require('gulp');
var browserify = require('browserify');
var babelify  = require('babelify');
var source = require('vinyl-source-stream');

gulp.task('build-client', function () {
    return browserify({entries: './client/js/dodo.js', debug: true})
        .transform(babelify)
        .bundle()
        .pipe(source('bundle.js'))
        .pipe(gulp.dest('./client/'));
});
