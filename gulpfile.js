'use strict';

// Defining requirements
const gulp = require('gulp');
const fs = require('fs-extra')
const sass = require('gulp-sass');

const gulpSequence = require('gulp-sequence');
const browserSync = require('browser-sync').create();

const postcss = require('gulp-postcss');
const autoprefixer = require("autoprefixer");
const mqpacker = require("css-mqpacker");
const gcmq = require('gulp-group-css-media-queries');
const cssbeautify = require('gulp-cssbeautify');
const atImport = require("postcss-import");

const uglify = require('gulp-uglify');
const UglifyJS = require("uglify-js");


const inlineSVG = require('postcss-inline-svg');
const objectFitImages = require('postcss-object-fit-images');
//const imageInliner = require('postcss-image-inliner');
const imagemin = require('gulp-imagemin');
const pngquant  = require('imagemin-pngquant');

const plumber = require('gulp-plumber');
const notify = require('gulp-notify');
const babel = require('gulp-babel');

const concat = require('gulp-concat');
const pathExists = require('path-exists');
const rename = require('gulp-rename');
const size = require('gulp-size');
const del = require('del');
const clone = require('gulp-clone');
const newer = require('gulp-newer');
const sourcemaps = require('gulp-sourcemaps');


const srcPath = {
    css: './src/css/',
    js: './src/js/',
    icons: './src/icons/',
    img: './src/img/',
    fonts: './src/fonts/',
    scss: './src/scss/'
};

const buildPath = {
    js: './build/js/',
    css: './build/css/',
    icons: './build/icons/',
    img: './build/img/',
    fonts: './build/fonts/'
};

let postCssPlugins = [
    autoprefixer({grid: true}),
    mqpacker({
        sort: true
    }),
    atImport(),
    inlineSVG(),
    objectFitImages()
];

//---------------SASS ==> CSS-----------------

function styles() {
    console.log('---------- Compiling styles');
    return gulp.src(srcPath.scss + '/style.scss')
        .pipe(plumber({
            errorHandler: function (err) {
                console.log(err);
                this.emit('end');
            }
        }))
        .pipe(sourcemaps.init())
        .pipe(sass())
        .pipe(postcss(postCssPlugins))
        .pipe(gcmq())
        .pipe(cssbeautify())
        .pipe(rename('style.css'))
        //.pipe(sourcemaps.write())
        .pipe(size({
            title: 'Size',
            showFiles: true,
            showTotal: false,
        }))
        .pipe(gulp.dest(buildPath.css))
        .pipe(browserSync.stream({match: '**/*.css'}));
}

exports.styles = styles;


//--------------- JS (BABEL)---------------------------

function copyjs() {
    console.log('---------- Copy js');
    return gulp.src(srcPath.js + 'main.js')
        .pipe(babel({
            presets: ['@babel/env']
        }))
        .pipe(concat('main.js'))
        .pipe(size({
            title: 'Size',
            showFiles: true,
            showTotal: false,
        }))
        .pipe(gulp.dest(buildPath.js))
}
exports.copyjs = copyjs;


//---------------COPY-FONTS---------------------------

gulp.task('copy:fonts', () => {
    console.log('---------- Copy fonts');
    return gulp.src(srcPath.fonts + '**/*.{ttf,woff,woff2,eot,svg}')
        .pipe(newer(buildPath.fonts))  // only new files
        .pipe(size({
            title: 'Size',
            showFiles: true,
            showTotal: false,
        }))
        .pipe(gulp.dest(buildPath.fonts));
});


//---------------COPY-IMAGES ----------------

gulp.task('img', () => {
    return gulp.src(srcPath.img + '*')
        .pipe(imagemin({
            progressive: true,
            use: [pngquant()],
            interlaced: true
        }))
        .pipe(gulp.dest(buildPath.img));
});


//---------------SVG-SPRITE ----------------


gulp.task('sprite:svg', gulp.series((callback) => {
    const svgstore = require('gulp-svgstore');
    const svgmin = require('gulp-svgmin');
    const cheerio = require('gulp-cheerio');
    if (pathExists(srcPath.icons + '*.svg') !== false) {
        console.log('---------- building SVG sprite');
        return gulp.src(srcPath.icons + '*.svg')
            .pipe(svgmin(function (file) {
                return {
                    plugins: [{
                        cleanupIDs: {
                            minify: true
                        }
                    }]
                }
            }))
            .pipe(svgstore({inlineSvg: true}))
            .pipe(cheerio({
                run: function ($) {
                    $('svg').attr('style', 'display:none');
                },
                parserOptions: {
                    xmlMode: true
                }
            }))
            .pipe(rename('sprite-svg.svg'))
            .pipe(size({
                title: 'Size',
                showFiles: true,
                showTotal: false,
            }))
            .pipe(gulp.dest(buildPath.icons));
    } else {
        console.log('---------- Error, no svg images');
        callback();
    }
}));


//-----GALP WATCH  +  BROWSER  SYNC-------


// Server
gulp.task('server', () => {
    browserSync.init({
        server: buildPath,
        port: 8080,
        startPath: 'index.html',
        open: true,
        notify: false,
    });

    // css
    gulp.watch([`${srcPath.scss}/style.scss`], {events: ['change'], delay: 100}, gulp.series(
        styles,
        reload
    ));

    // html
    gulp.watch([`index.html`], {events: ['change'], delay: 100}, gulp.series(
        reload
    ));

    // js
    gulp.watch([`${srcPath.js}/main.js`], {events: ['all'], delay: 100}, gulp.series(
        copyjs,
        reload
    ));
});

// Reload
function reload(done) {
    browserSync.reload();
    done();
}
