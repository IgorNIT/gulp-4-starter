'use strict';

// Defining requirements
const gulp = require('gulp');
const fs = require('fs-extra')
const sass = require('gulp-sass');
const smartgrid = require('smart-grid');

const gulpSequence = require('gulp-sequence');
const browserSync = require('browser-sync').create();

const postcss = require('gulp-postcss');
const autoprefixer = require("autoprefixer");
const mqpacker = require("css-mqpacker");
const cleancss = require('gulp-cleancss');
const gcmq  = require('gulp-group-css-media-queries');
const cssbeautify = require('gulp-cssbeautify');
const uglify = require('gulp-uglify');
const UglifyJS = require("uglify-js");   
const atImport = require("postcss-import");

const inlineSVG = require('postcss-inline-svg');
const objectFitImages = require('postcss-object-fit-images');
const imageInliner = require('postcss-image-inliner');
const imagemin = require('gulp-imagemin');
const pngquant = require('imagemin-pngquant');

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
    js: './assets/js/',
    css: './assets/css/',
    icons: './assets/icons/',    
    img: './assets/img/',
    fonts: './assets/fonts/'
};

let postCssPlugins = [
  autoprefixer({
    browsers: ['last 2 version']
  }),
  mqpacker({
    sort: true
  }),
  atImport(),
  inlineSVG(),
  objectFitImages(),
  imageInliner({
    // Осторожнее с именами файлов картинок! Добавляйте имя блока как префикс к имени картинки.
    assetPaths: [
      'src/blocks/**/img_to_bg/',
    ],
    // Инлайнятся только картинки менее 10 Кб.
    maxFileSize: 10240
  })
];

//---------------SMARTGRID-----------------
var settings = {
    outputStyle: 'scss', /* less || scss || sass || styl */
    columns: 12, /* number of grid columns */
    offset: '0px', /* gutter width px || % */
    mobileFirst: true, /* mobileFirst ? 'min-width' : 'max-width' */
    container: {
        maxWidth: '1170px', /* max-width оn very large screen */
        fields: '30px' /* side fields */
    },
    breakPoints: {
        lg: {
            width: '1200px', /* -> @media (max-width: 1100px) */
        },
        md: {
            width: '992px'
        },
        sm: {
            width: '768px',
            /*fields: '15px'  set fields only if you want to change container.fields */
        },
        xs: {
            width: '576px'
        }
        /*
        We can create any quantity of break points.
 
        some_name: {
            width: 'Npx',
            fields: 'N(px|%|rem)',
            offset: 'N(px|%|rem)'
        }
        */
    }
};
gulp.task('smart', function () {
  smartgrid('./src/scss/mixins', settings);
});

//---------------SASS ==> CSS-----------------
// gulp sass
// Compiles SCSS files in CSS

gulp.task('sass', function () {
    const sass = require('gulp-sass');
    const sourcemaps = require('gulp-sourcemaps');
    console.log('---------- Компиляция стилей');
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
        .pipe(rename('main.css'))
        //.pipe(sourcemaps.write())
        .pipe(size({
          title: 'Size',
          showFiles: true,
          showTotal: false,
        }))
        .pipe(gulp.dest(buildPath.css))
        .pipe(browserSync.stream({match: '**/*.css'}));                
});


//---------------Minifies CSS ----------------
// Minifies CSS files and add map file

gulp.task('cleancss', function(callback){
  if(pathExists(buildPath.css + 'main.css') !== false) {
      console.log('---------- Minifies CSS files');
  return gulp.src(buildPath.css + 'main.css')
    .pipe(sourcemaps.init({loadMaps: true}))    
    .pipe(plumber({ errorHandler: function (error) { swallowError(self, error); } }))
    .pipe(clone())
    .pipe(rename({suffix: '.min'}))
    .pipe(cleancss({compatibility: '*'}))
    .pipe(sourcemaps.write('./'))
    .pipe(size({
          title: 'Size',
          showFiles: true,
          showTotal: false,
        }))
    .pipe(gulp.dest(buildPath.css));
  }
  else {
      console.log('---------- There is no main.css');
      callback();
    }
});


//---------------COPY-JS---------------------------

// Копирование JS
gulp.task('copy:js', function () {

  console.log('---------- Копирование js');
    return gulp.src(srcPath.js + '*.js')
       .pipe(babel({
            presets: ['@babel/env']
        }))
      .pipe(concat('main.js'))      
      .pipe(size({
        title: 'Size',
        showFiles: true,
        showTotal: false,
      }))
    .pipe(gulp.dest(buildPath.js));
});

// Конкатенация и углификация Javascript
/*
gulp.task('js', function () {
  const code = (buildPath.js + 'main.js');
  const result = UglifyJS.minify(code);
  console.log('---------- uglify js');
    return gulp.src(code)
        .pipe(plumber({
          errorHandler: function(err) {
            notify.onError({
              title: 'Javascript uglify error',
              message: err.message
            })(err);
            this.emit('end');
          }
        }))
        fs.move(result, buildPath.js + 'main.min.js')
        .pipe(size({
          title: 'Size',
          showFiles: true,
          showTotal: false,
        }))
        .pipe(gulp.dest(buildPath.js));
  });


*/
//---------------COPY-FONTS---------------------------

gulp.task('copy:fonts', function () {
  console.log('---------- Копирование шрифтов');
  return gulp.src(srcPath.fonts + '*.{ttf,woff,woff2,eot,svg}')
    .pipe(newer(buildPath.fonts))  // оставить в потоке только изменившиеся файлы
    .pipe(size({
      title: 'Size',
      showFiles: true,
      showTotal: false,
    }))
    .pipe(gulp.dest(buildPath.fonts));
});


//---------------COPY-IMAGES ----------------


// Копирование изображений
gulp.task('copy:img', function () {
  console.log('---------- Копирование изображений');
  return gulp.src(srcPath.img + '*.{jpg,jpeg,gif,png,svg}')
    .pipe(newer(buildPath.img))  // оставить в потоке только изменившиеся файлы
    .pipe(size({
      title: 'Size',
      showFiles: true,
      showTotal: false,
    }))
    .pipe(gulp.dest(buildPath.img));
});

// Использование: folder=src/img npm start img:opt


gulp.task('img', function () {
  const imagemin = require('gulp-imagemin');
  const pngquant = require('imagemin-pngquant');
 
    return gulp.src(srcPath.img+ '*.{jpg,jpeg,gif,png,svg}')
  .pipe(imagemin())
  .pipe(gulp.dest(buildPath.img));
});



//---------------SVG-SPRITE ----------------


gulp.task('sprite:svg', function (callback) {
    const svgstore = require('gulp-svgstore');
    const svgmin = require('gulp-svgmin');
    const cheerio = require('gulp-cheerio');
    if(pathExists(srcPath.icons + '*.svg') !== false) {
      console.log('---------- Сборка SVG спрайта');
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
        .pipe(svgstore({ inlineSvg: true }))
        .pipe(cheerio({
          run: function($) {
            $('svg').attr('style',  'display:none');
          },
          parserOptions: {
            xmlMode: true
          }
        }))
        .pipe(rename('sprite-svg.svg.php'))
        .pipe(size({
          title: 'Size',
          showFiles: true,
          showTotal: false,
        }))
        .pipe(gulp.dest(buildPath.icons));
    }
    else {
      console.log('---------- Сборка SVG спрайта: ОТМЕНА, нет картинок');
      callback();
    }
});

//---------------BUILD ----------------

// Сборка всего
gulp.task('build', function (callback) {
  gulpSequence(
    'clean',
    'sprite:svg',
    ['sass', 'cleancss', 'copy:img', "img", 'copy:js', 'js', 'copy:fonts'],
    callback
  );
});

// Очистка папки сборки
gulp.task('clean', function () {
  console.log('---------- Очистка папки сборки');
  return del(buildPath + '/**/*');
});



//-----GALP WATCH  +  BROWSER  SYNC-------



// Локальный сервер, слежение
gulp.task('server', ['sass'], function() {  
    browserSync.init({
             server: {
            baseDir: "./"
        }
        });
 

  // Слежение за стилями
  gulp.watch(srcPath.scss + '/style.scss', ['watch:sass']);

  // Слежение за шрифтами
  gulp.watch(srcPath.fonts + '*.{ttf,woff,woff2,eot,svg}', ['watch:fonts']);

  // Слежение за изображениями
  gulp.watch(srcPath.img + '/**/*.{jpg,jpeg,gif,png,svg}', ['watch:img']);
 
  // Слежение за JS
  gulp.watch(srcPath.js + '*.js', ['watch:js']); 

  // Слежение за html
  gulp.watch('index.html', ['watch:html']);

  // Слежение за PHP
  gulp.watch('./*.php', ['watch:php']);

  // Слежение за SVG (спрайты)
    gulp.watch('*.svg', {cwd: srcPath.icons}, ['watch:sprite:svg']); 
});


// Браузерсинк с 3-м галпом — такой браузерсинк...
gulp.task('watch:img', ['copy:img'], reload);
gulp.task('watch:fonts', ['copy:fonts'], reload);
gulp.task('watch:js', ['copy:js'], reload);;
gulp.task('watch:sprite:svg', ['sprite:svg'], reload);
gulp.task('watch:html', reload);
gulp.task('watch:php', reload);
gulp.task('watch:sass', ['sass'], reload);

// Перезагрузка браузера
function reload (done) {
  browserSync.reload();
  done();
}
gulp.task('s', function() {  
    browserSync.init({
              proxy: "http://localhost/wordpress/",
              notify: false 
    });
});