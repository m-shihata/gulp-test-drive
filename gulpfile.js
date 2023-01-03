const gulp = require('gulp');
const nunjucksRender = require('gulp-nunjucks-render');
const removeEmptyLines = require('gulp-remove-empty-lines');
const cachebust = require('gulp-cache-bust'); // to fix css/js cache issues in the browser
const sass = require('gulp-sass')(require('node-sass'));
const browserSync = require('browser-sync').create();
const useref = require('gulp-useref');
const uglify = require('gulp-uglify');
const gulpIf = require('gulp-if');
const cssnano = require('gulp-cssnano');
const imagemin = require('gulp-imagemin');
const runSequence = require('gulp4-run-sequence');
const cache = require('gulp-cache');
const clean = require('gulp-clean');

/* Helpers */

const cleanDir = path => {
  return gulp
    .src(path, {
      read: false,
      allowEmpty: true,
    })
    .pipe(clean());
};

/* For Development */

gulp.task('clean:public', () => cleanDir('public'));

gulp.task('html:public', function () {
  return gulp
    .src('src/html/*.html')
    .pipe(
      nunjucksRender({
        path: 'src/html',
        manageEnv: env => {
          env.addGlobal('current_year', new Date().getFullYear());
        },
      })
    )
    .pipe(removeEmptyLines())
    .pipe(
      cachebust({
        type: 'timestamp',
      })
    )
    .pipe(gulp.dest('public'))
    .pipe(
      browserSync.reload({
        stream: true,
      })
    )
    .on('error', function (error) {
      console.log(error);
      this.emit('end');
    });
});

gulp.task('css:public', function () {
  return gulp
    .src('src/scss/**/*.scss')
    .pipe(sass())
    .pipe(gulp.dest('public/css'))
    .pipe(
      browserSync.reload({
        stream: true,
      })
    );
});

gulp.task('js:public', function () {
  cleanDir('public/js');
  return gulp
    .src('src/js/**/*')
    .pipe(gulp.dest('public/js'))
    .pipe(
      browserSync.reload({
        stream: true,
      })
    );
});

gulp.task('images:public', function () {
  cleanDir('public/images');
  return gulp
    .src('src/images/**/*')
    .pipe(gulp.dest('public/images'))
    .pipe(
      browserSync.reload({
        stream: true,
      })
    );
});

gulp.task('fonts:public', function () {
  cleanDir('public/fonts');
  return gulp
    .src('src/fonts/**/*')
    .pipe(gulp.dest('public/fonts'))
    .pipe(
      browserSync.reload({
        stream: true,
      })
    );
});

gulp.task('browserSync', function () {
  browserSync.init({
    injectChanges: false,
    notify: false,
    server: {
      baseDir: 'public',
    },
  });
});

gulp.task('watch:src', function () {
  // Generates html and reloads the browser whenever html files change in src/html
  gulp.watch('src/html/**/*.html', gulp.series(['html:public']));
  // Generates css and reloads the browser whenever scss files change in src/scss
  gulp.watch('src/scss/**/*.scss', gulp.series(['css:public']));
  // Copies js, images, fonts files to public/js and reloads the browser whenever js files change in src/js
  gulp.watch('src/js/**/*.js', gulp.series(['js:public']));
  gulp.watch('src/images/**/*', gulp.series(['images:public']));
  gulp.watch('src/fonts/**/*', gulp.series(['fonts:public']));
});

// $ gulp
// serves the project
gulp.task('default', function (callback) {
  runSequence(
    'clean:public',
    [
      'html:public',
      'css:public',
      'js:public',
      'images:public',
      'fonts:public',
      'browserSync',
      'watch:src',
    ],
    callback
  );
});

/* For Production */

gulp.task('clean:dist', () => cleanDir('dist'));

gulp.task('useref:dist', function () {
  return gulp
    .src('public/*.html')
    .pipe(
      useref({
        transformPath: function (filePath) {
          return filePath.split('?')[0];
        },
      })
    )
    .pipe(gulpIf('*.js', uglify()))
    .pipe(gulpIf('*.css', cssnano()))
    .pipe(gulp.dest('dist'));
});

gulp.task('images:dist', function () {
  return gulp
    .src('public/images/**/*.+(png|jpg|gif|svg)')
    .pipe(
      cache(
        imagemin({
          interlaced: true,
        })
      )
    )
    .pipe(gulp.dest('dist/images'));
});

gulp.task('fonts:dist', function () {
  return gulp.src('public/fonts/**/*').pipe(gulp.dest('dist/fonts'));
});

// $ gulp build
// minifies files for production
gulp.task('build', function (callback) {
  runSequence(
    'clean:public', 
    ['html:public', 'css:public', 'js:public', 'images:public', 'fonts:public'], // update public folder
    'clean:dist',
    ['useref:dist', 'images:dist', 'fonts:dist'],
    callback
  );
});
