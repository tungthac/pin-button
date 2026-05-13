const fs = require("fs");
const path = require("path");

function jsonReporter(config) {
  var results = [];
  var dir = "";

  this.createReportDirectory = () => {
    dir = config?.jsonReporter?.dir ?? "./output";
    fs.mkdirSync(dir, { recursive: true });
    return this;
  };
  this.writeReportToFile = () => {
    let filename = config?.jsonReporter?.filename ?? "test.report.json";
    let filepath = path.join(dir, filename);
    fs.writeFileSync(filepath, JSON.stringify(results, null, 2));
  };

  this.onRunComplete = (browsers, result) =>
    this.createReportDirectory().writeReportToFile();

  this.onSpecComplete = (
    browser,
    { description, suite, success, properties }
  ) =>
    properties &&
    properties.type &&
    properties.spec &&
    results.push({
      type: properties.type,
      spec: properties.spec,
      definition: [...suite, description],
      status: success === true ? "pass" : "fail",
    });
}

jsonReporter.$inject = ["config"];

module.exports = {
  "reporter:json": ["type", jsonReporter],
};
