'use strict';

module.exports = function (grunt) {

    // load all grunt tasks matching the `grunt-*` pattern automatically
    require('load-grunt-tasks')(grunt);

    // Time how long tasks take. Can help when optimizing build times
    require('time-grunt')(grunt);

    // Configurable paths
    var config = {
        app: 'www_src',
        dist: 'www'
    };

    // Define the configuration for all the tasks
    grunt.initConfig({

        // Project settings
        config: config,

        // Watches files for changes and runs tasks based on the changed files
        watch: {
            livereload: {
                options: {
                    livereload: '<%= connect.options.livereload %>'
                },
                files: [
                    '<%= config.app %>/{,page/,page/*/}*.html',
                    '<%= config.app %>/static/css/{,*/}*.css',
                    '<%= config.app %>/static/img/{,*/}*.*',
                    '<%= config.app %>/build/{,*/}*.js'
                ]
            }
        },


        // Copy files
        copy: {
            dev: {
                files: [{
                    expand: true,
                    dot: true,
                    cwd: '<%= config.app %>',
                    dest: '<%= config.dist %>',
                    src: [
                        '**'
                    ]
                }]
            },
            dist: {
                files: [{
                    expand: true,
                    dot: true,
                    cwd: '<%= config.app %>',
                    dest: '<%= config.dist %>',
                    src: [
                        '*.{ico,png,txt}',
                        'static/img/{,*/}*.*',
                        'static/fonts/{,*/}*.*',
                        '{,page/,page/*/}*.html',
                        'build/{,*/}*.*',
                        '!build/.module-cache/*.*'
                    ]
                }]
            }
        },

        // The actual grunt server settings
        connect: {
            options: {
                port: 9000,
                open: true,
                livereload: 35729,
                // Change this to '0.0.0.0' to access the server from outside
                hostname: 'localhost'
            },
            dev: {
                options: {
                    base: '<%= config.app %>'
                }
            },
            dist: {
                options: {
                    base: '<%= config.dist %>',
                    livereload: false,
                    keepalive:true
                }
            }
        },

        // Empties folders to start fresh
        clean: {
            dist: {
                files: [{
                    dot: true,
                    src: [
                        '<%= config.dist %>/*',
                        '!<%= config.dist %>/.git*'
                    ]
                }]
            }
        },

        // Renames files for browser caching purposesw
        rev: {
            dist: {
                files: {
                    src: [
                        '<%= config.dist %>/static/css/{,*/}*.css',
                        '<%= config.dist %>/*.{ico,png}'
                    ]
                }
            }
        },

        // Reads HTML for usemin blocks to enable smart builds that automatically
        // concat, minify and revision files. Creates configurations in memory so
        // additional tasks can operate on them
        useminPrepare: {
            options: {
                dest: '<%= config.dist %>'
            },
            html: '<%= config.app %>/index.html'
        },

        // Performs rewrites based on rev and the useminPrepare configuration
        usemin: {
            options: {
                assetsDirs: ['<%= config.dist %>', '<%= config.dist %>/static/img/']
            },
            html: ['<%= config.dist %>/{,page/,page/*/}*.html'],
            css: ['<%= config.dist %>/static/css/{,*/}*.css']
        },

        // The following *-min tasks produce minified files in the dist folder
        imagemin: {
            dist: {
                files: [{
                    expand: true,
                    cwd: '<%= config.app %>/static/img/',
                    src: '{,*/}*.{gif,jpeg,jpg,png}',
                    dest: '<%= config.dist %>/static/img/'
                }]
            }
        },

        htmlmin: {
            dist: {
                options: {
                    collapseBooleanAttributes: true,
                    collapseWhitespace: true,
                    removeComments: true,
                    minifyJS:true,
                    minifyCSS:true
                },
                files: [{
                    expand: true,
                    cwd: '<%= config.dist %>',
                    src: '{,page/,page/*/}*.html',
                    dest: '<%= config.dist %>'
                }]
            }
        }

    });

    //copy source code to www,then cordova build,and android project can import into eclipse to debug
    grunt.registerTask('build-src', [
        'clean:dist',
        'copy:dev',
    ]);

    //copy minified code to www,and finally into android project
    grunt.registerTask('build', [
        'clean:dist',
        'useminPrepare',
        'imagemin',
        'concat',
        'cssmin',
        'uglify',
        'copy:dist',
        'rev',
        'usemin',
        'htmlmin'
    ]);

    grunt.registerTask('debug', [
        'build-src',
        'connect:dev',
        'watch'
    ]);
    grunt.registerTask('run', [
        'build',
        'connect:dist'
    ]);
};
