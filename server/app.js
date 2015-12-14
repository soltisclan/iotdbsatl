var express = require('express'),
    path = require("path"),
    db = require('./db-loki.js'),
    app = express();

app.use(express.static(path.join(__dirname, '../client')));

app.get('/api', function(request, response){
  //console.log('GET /api with parameters ' + JSON.stringify(request.query));

  // Setting cache to false in Ajax GET requests appends "_={timestamp}"
  // to the GET parameters. We need to ignore this parameter.
  queryParameters = Object.keys(request.query);
  queryParameters.splice(queryParameters.indexOf('_'), 1);

  // Hack to post status through GET. If there are no query parameters in the
  // request, get status of all devices, otherwise post a new status
  if (!queryParameters.length) {
    var size = request.query.size || 100;
    var offset = request.query.offset || 0;

    response.setHeader('Cache-Control', 'no-cache');
    response.json(db.getCurrentStatus(size, offset).map(function(obj) {
      return {
        deviceId: obj.deviceId,
        isOccupied: obj.isOccupied,
        name: (obj.name != null && obj.name != '') ? obj.name : obj.deviceId,
        timestamp: obj.timestamp
      }
    }));
  }
  else {
    var name;
    if (request.query.name != null) name = request.query.name;
    db.upsertStatus(request.query.device, request.query.occupied, name);
    response.sendStatus(200);
  }
});

app.get('/api/history', function(request, response) {
  //console.log('GET /api/history with parameters ' + JSON.stringify(request.query));

  // size: number of results to limit results to
  // offset: starting position to return results of
  var size = request.query.size || 100;
  var offset = request.query.offset || 0;

  response.setHeader('Cache-Control', 'no-cache');
  response.json(db.getHistory(size, offset));
});

app.get('/api/usage', function(request, response) {
  //console.log('GET /api/usage with parameters ' + JSON.stringify(request.query));

  // from & to represent the time range of the data
  var from = request.query.from || 100;
  var to = request.query.to || 0;

  response.setHeader('Cache-Control', 'no-cache');
  response.json(db.getUsage(from, to));
});

module.exports = app;
