import gulp from 'gulp';
import gulpSass from 'gulp-sass';
import * as sass from 'sass';
import replace from 'gulp-replace';
import autoprefixer from 'gulp-autoprefixer';
import rename from 'gulp-rename';
import gap from 'gulp-append-prepend';
import extReplace from 'gulp-ext-replace';
import changed from 'gulp-changed';

const sassCompiler = gulpSass(sass);

function compileSass() {
  return (
    gulp
      .src(['./scss/*.scss', '!./scss/mixins.scss'], {
        since: gulp.lastRun(compileSass), // Vérifie les fichiers modifiés depuis la dernière exécution
      })
      .pipe(changed('./assets/'))
      // Insérer mixins et variables
      .pipe(gap.prependFile('./scss/mixins.scss'))
      // Compiler SASS en CSS et remplacer les balises Liquid par des commentaires
      .pipe(replace(/({{)/g, '/* $1'))
      .pipe(replace(/(}})/g, '$1 */'))
      .pipe(replace(/({%)/g, '/* $1'))
      .pipe(replace(/(%})/g, '$1 */'))
      .pipe(sassCompiler.sync({ outputStyle: 'expanded' }).on('error', sassCompiler.logError))
      .pipe(autoprefixer('last 3 version', 'safari 5', 'ie 8', 'ie 9'))
      // Ajustements spécifiques pour les fichiers Liquid
      .pipe(replace('/* {%', '/*! {%'))
      .pipe(replace('%} */', '%} */'))
      .pipe(replace('/* {{', '/*! {{'))
      .pipe(replace('}} */', '}} */'))
      .pipe(replace('/*! {{', ' {{'))
      .pipe(replace('}} */', '}} '))
      .pipe(replace('/*! {%', ' {%'))
      .pipe(replace('%} */', '%} '))
      .pipe(
        rename((path) => {
          path.extname = '.css';
        }),
      )
      .pipe(extReplace('', '.scss'))
      // Enregistrer dans le répertoire des assets
      .pipe(gulp.dest('./assets/'))
  );
}

function watchFiles() {
  gulp.watch(['./scss/*.scss', '!./scss/mixins.scss'], gulp.parallel(compileSass));
}

const defaultTask = gulp.series(watchFiles);

export { compileSass, watchFiles, defaultTask as default };
