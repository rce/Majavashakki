module.exports = function(grunt) {
  "use strict";

  grunt.initConfig({
    clean: {
      src: ["./dist"]
    },
    copy: {
      build: {
        files: [
             {
                expand: true,
                cwd: "./public",
                src: ["**"],
                dest: "./dist/public"
            },
            {
                expand:true,
                cwd: "src/server",
                src: "*.json",
                dest: "./dist/server"
            }
        ]
      }
    },
    ts: {
      app: {
        files: [
            {
                src: [
                  "src/\*\*/\*.ts",
                  "src/\*\*/\*.tsx",
                  "!src/.baseDir.ts"
                ],
                dest: "./dist"
            }
        ],
        options: {
          jsx: "react",
          fast: "never",
          module: "commonjs",
          target: "es6",
          sourceMap: false,
          rootDir: "src"
        }
      }
    },
    browserify: {
         dist: {
            options: {
               transform: [
                  ["babelify"]
               ]
            },
            files: {
               // if the source file has an extension of es6 then
               // we change the name of the source file accordingly.
               // The result file's extension is always .js
               "./dist/public/bundle.js": ["./dist/client/*.js"]
            }
        }
    },
    watch: {
      ts: {
        files: ["ts", "tsx", "json"].map(ext => "**/*." + ext),
        tasks: ["ts", "browserify"]
      },
      public: {
        files: ["public/**/*"],
        tasks: ["copy"]
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks("grunt-browserify");
  grunt.loadNpmTasks("grunt-contrib-copy");
  grunt.loadNpmTasks("grunt-contrib-watch");
  grunt.loadNpmTasks("grunt-ts");

  //Main build task
  grunt.registerTask("default", [
    "clean",
    "copy",
    "ts",
    "browserify"
  ]);

  grunt.registerTask("compile", [
    "ts"
  ]);

  grunt.registerTask("bundle", [
    "browserify"
  ]);

  //TODO Setup and test WATCHER tasks
  //TODO do we need anything special for JSX? probably not o.O
};