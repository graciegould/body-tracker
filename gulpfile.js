import gulp from 'gulp';
import * as sass from 'sass';
import gulpSass from 'gulp-sass';
import sourcemaps from 'gulp-sourcemaps';
import { exec } from 'child_process';

const gulpSassCompiler = gulpSass(sass);

function compileSass() {
    return gulp.src('./src/scss/main.scss')
        .pipe(sourcemaps.init())
        .pipe(gulpSassCompiler().on('error', gulpSassCompiler.logError))
        .pipe(sourcemaps.write('./'))
        .pipe(gulp.dest('./src/css'));
}

function watchFiles() {
    gulp.watch('./src/scss/**/*.scss', compileSass);
}

function runServer() {
    exec('npm run dev', (err, stdout, stderr) => {
        if (err) {
            console.error(err);
            return;
        }
        console.log(stdout);
    });
}   

export default gulp.series(
    compileSass,
    gulp.parallel(watchFiles, runServer)  
);
