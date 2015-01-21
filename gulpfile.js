var gulp = require('gulp'),
	coffee = require('gulp-coffee');

gulp.task('coffee', function() {
	gulp.src('./src/*.litcoffee')
		.pipe(coffee({bare: true}))
		.pipe(gulp.dest('./build/'))
	gulp.src('./src/*.coffee')
		.pipe(coffee({bare: true}))
		.pipe(gulp.dest('./build/'))
});

gulp.task('default', ['coffee']);

