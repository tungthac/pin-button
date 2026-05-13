const path = require("path");

module.exports = function (config) {
  config.set({
    frameworks: ["jasmine"],
    proxies: {
      "/src/": "/base/src/",
      "/test/unit/": "/base/test/unit/",
      "/test/helper/": "/base/test/helper/",
      "/node_modules/": "/base/node_modules/"
    },
    files: [
      { pattern: "./test/helper/helper.js" },
      { pattern: "./src/*.css" },
      { pattern: "./src/*.html" },
      { pattern: "./importmap/inject.js" },
      { pattern: "./importmap/importmap.test.js" },
      {
        pattern: "./node_modules/@scalable.software/**/dist/*.js",
        type: "module"
      },
      { pattern: "./src/**/*.js", type: "module" },
      { pattern: "./test/unit/**/*.js", type: "module" }
    ],
    preprocessors: {
      "src/**/!(*.test).js": ["karma-coverage-istanbul-instrumenter"]
    },
    plugins: ["karma-*", require("./tasks/json.reporter.js")],
    reporters: ["spec", "coverage-istanbul", "json"],
    jsonReporter: {
      dir: "./report",
      filename: "component.template.report.json"
    },
    coverageIstanbulInstrumenter: {
      esModules: true
    },
    coverageIstanbulReporter: {
      reports: ["html", "text", "lcovonly"],
      dir: path.join(__dirname, "coverage"),
      skipFilesWithNoCoverage: true
    },
    browsers: ["ChromeHeadless"],
    singleRun: true,
    logLevel: config.LOG_DISABLE
  });
};
