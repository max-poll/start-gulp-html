// VARIABLES & PATHS

const preprocessorCSS  = 'sass', // Preprocessor (sass, scss)
    preprocessorHTML   = 'html', // HTML preprocessor (gulp-htmlmin)
    fileswatch         = 'txt,json,md,woff2', // List of files extensions for watching & hard reload (comma separated)
    imageswatch        = 'jpg,jpeg,png,webp,svg', // List of images extensions for watching & compression (comma separated)
    srcDir             = 'src', // Base directory path without «/» at the end
    distDir            = 'dist', // Base directory path without «/» at the end
    online             = true; // If «false» - Browsersync will work offline without internet connection

const paths = {

    scripts: {
        src: [
            // 'node_modules/jquery/dist/jquery.min.js', // npm vendor example (npm i --save-dev jquery)
            srcDir + '/js/common.js' // app.js. Always at the end
        ],
        dest: distDir + '/js', // Deploy js folder
    },

    template: {
		src:   srcDir + '/' + preprocessorHTML + '/**/*',
		dest: distDir + '/', // Deploy html folder
	},

    styles: {
        src:   srcDir + '/' + preprocessorCSS + '/main.*',
        dest: distDir + '/css', // Deploy css folder
    },

    images: {
        src:   srcDir + '/images/**/*',
        dest: distDir + '/images', // Deploy images folder
    },

    deploy: {
        hostname:    'login@yousite.com', // Deploy hostname
        destination: 'yousite/public_html/', // Deploy destination
        include:     [/* 'some.file' */], // Included files to deploy
        exclude:     [ '**/Thumbs.db', '**/*.DS_Store' ], // Excluded files from deploy
    },

    cssOutputName:      'styles.min.css',
    jsOutputName:       'common.min.js',

}

const options = {

    PreprocessorHTML: {
        collapseWhitespace: true
    },

    PreprocessorCSS: {
        outputStyle: 'compressed'
    }
}

// LOGIC

const { src, dest, parallel, series, watch } = require('gulp'),
      // template preprocessing packages
      html         = require('gulp-htmlmin'),
      // template preprocessing packages

      // css preprocessing packages
      sass         = require('gulp-sass'), // Default
      // scss         = require('gulp-sass'),
      // css preprocessing packages

      cleancss     = require('gulp-clean-css'),
      concat       = require('gulp-concat'),
      browserSync  = require('browser-sync').create(),
      uglify       = require('gulp-uglify-es').default,
      autoprefixer = require('gulp-autoprefixer'),
      imagemin     = require('gulp-imagemin'),
      newer        = require('gulp-newer'),
      rsync        = require('gulp-rsync'),
      del          = require('del');

function browsersync() {
    browserSync.init({
        server: { baseDir: distDir + '/' },
        notify: false,
        online: online
    })
}

function scripts() {
    return src(paths.scripts.src)
    .pipe(concat(paths.jsOutputName))
    .pipe(uglify())
    .pipe(dest(paths.scripts.dest))
    .pipe(browserSync.stream())
}

function styles() {
    return src(paths.styles.src)
    .pipe(eval(preprocessorCSS)(options.PreprocessorCSS))
    .pipe(concat(paths.cssOutputName))
    .pipe(autoprefixer({ overrideBrowserslist: ['last 10 versions'], grid: true }))
    .pipe(cleancss( {level: { 1: { specialComments: 0 } },/* format: 'beautify' */ }))
    .pipe(dest(paths.styles.dest))
    .pipe(browserSync.stream())
}

function template() {
    return src(paths.template.src)
    .pipe(eval(preprocessorHTML)(options.PreprocessorHTML))
    .pipe(dest(paths.template.dest))
    .pipe(browserSync.stream())
}

function images() {
    return src(paths.images.src)
    .pipe(newer(paths.images.dest))
    .pipe(imagemin())
    .pipe(dest(paths.images.dest))
}

function cleanimg() {
    return del('' + paths.images.dest + '/**/*', { force: true })
}

function deploy() {
    return src(distDir + '/')
    .pipe(rsync({
        root: distDir + '/',
        hostname: paths.deploy.hostname,
        destination: paths.deploy.destination,
        include: paths.deploy.include,
        exclude: paths.deploy.exclude,
        recursive: true,
        archive: true,
        silent: false,
        compress: true
    }))
}

function startwatch() {
    watch(srcDir  + '/' + preprocessorHTML + '/**/*', {usePolling: true}, template);
    watch(srcDir  + '/' + preprocessorCSS + '/**/*', {usePolling: true}, styles);
    watch(srcDir  + '/images/**/*.{' + imageswatch + '}', {usePolling: true}, images);
    watch(distDir  + '/**/*.{' + fileswatch + '}', {usePolling: true}).on('change', browserSync.reload);
    watch([srcDir + '/js/**/*.js', '!' + paths.scripts.dest + '/*.min.js'], {usePolling: true}, scripts);
}

exports.browsersync = browsersync;
exports.assets      = series(cleanimg, template, styles, scripts, images);
exports.template    = template;
exports.styles      = styles;
exports.scripts     = scripts;
exports.images      = images;
exports.cleanimg    = cleanimg;
exports.deploy      = deploy;
exports.default     = parallel(images, template, styles, scripts, browsersync, startwatch);
