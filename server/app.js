var express = require('express'),
    mysql = require("mysql"),
    path = require("path"),
    Loki = require('lokijs'),
    app = express(),
    //statuses,
    db = new Loki(__dirname + '/../db/statuses.json',
    {
        autoload: true,
        autoloadCallback: dbLoader
    }
);

app.use(express.static(path.join(__dirname, '../client')));

function dbLoader(){

  initializeDb();
	//statuses = db.getCollection('statuses');
	// if (statuses == null) {
	// 	statuses = db.addCollection('statuses');
  //       db.saveDatabase(function(){console.log('db initialized');});
	// }
	console.log('db ready');
}

// If any of the collections we need does not exist in the database,
// create them
function initializeDb() {
  var collections = ['statuses', 'currentStatus', 'statusHistory'];
  for (var i in collections) {
    if(db.listCollections().filter(function(dbCollection) {
      return dbCollection.name == collections[i];
    }).length == 0) {
      db.addCollection(collections[i]);
      console.log('Created collection ' + collections[i]);
    }
  }
  db.saveDatabase(function() {
    console.log('DB initialized');
    console.log(db.listCollections());
  });
}

function getCurrentStatus(size, offset) {
  // size: number of results to limit results to
  // offset: starting position to return results of
  var currentStatuses = db.getCollection('currentStatus');
  return currentStatuses.chain().simplesort('deviceId').offset(offset).limit(size).data();
}

function upsertStatus(deviceId, isOccupied) {
  // statuses.insert({
  //   timestamp: new Date(),
  //   deviceid: deviceId,
  //   isoccupied: isOccupied
  // });

  var currentStatusCollection = db.getCollection('currentStatus');
  var device = currentStatusCollection.findOne({'deviceId' : deviceId});
  if(device == null) {
    // Insert
    var newDevice = {
      deviceId: deviceId,
      isOccupied: isOccupied,
      timestamp: new Date()
    };
    currentStatusCollection.insert(newDevice);
    console.log('Inserted ' + JSON.stringify(newDevice));
  }
  else {
    // Update
    device.isOccupied = isOccupied;
    device.timestamp = new Date();
    console.log('Updated status of ' + deviceId + ' to ' + isOccupied);
  }

  insertHistory(deviceId, isOccupied);

  db.saveDatabase(function() {
    console.log('DB saved');
  });
}

function insertHistory(deviceId, isOccupied) {
  // If status has changed since the last update from this device, calculate
  // the time span between status changes, otherwise or if this is a new
  // device, just insert a history record
  var statusHistory = db.getCollection('statusHistory');
  var timeSince = 0;
  var lastUpdate = statusHistory.chain().find({'deviceId': deviceId}).simplesort('timestamp', true).limit(1).data();

  if(lastUpdate.length > 0 && lastUpdate[0].timestamp != null && lastUpdate[0].isOccupied != isOccupied) {
    timeSince = new Date() - new Date(lastUpdate[0].timestamp);
  }

  var historyEntry = {
    deviceId: deviceId,
    timestamp: new Date(),
    isOccupied: isOccupied,
    timeSince: timeSince
  };
  statusHistory.insert(historyEntry);
}

function getHistory(size, offset) {
  // size: number of results to limit results to
  // offset: starting position to return results of
  var statusHistory = db.getCollection('statusHistory');
  return statusHistory.chain().simplesort('$loki', true).offset(offset).limit(size).data();
}

app.get('/api/history', function(request, response) {
  // size: number of results to limit results to
  // offset: starting position to return results of
  console.log('GET /api/history with parameters ' + JSON.stringify(request.query));

  var size = request.query.size || 100;
  var offset = request.query.offset || 0;

  response.setHeader('Cache-Control', 'no-cache');
  response.json(getHistory(size, offset));
});


app.get('/api', function(request, response){
  console.log('GET /api with parameters ' + JSON.stringify(request.query));

  // Setting cache to false in Ajax GET requests appends "_={timestamp}"
  // to the GET parameters. We need to ignore this parameter.
  queryParameters = Object.keys(request.query);
  queryParameters.splice(queryParameters.indexOf('_'), 1);

  // Hack to post status through GET. If there are no query parameters in the
  // request, get status of all devices, otherwise post a new status
  if (!queryParameters.length) {
    // console.log('total records: ' + statuses.data.length);
    // console.time('mapReduce');
    // var st = statuses.data.map(function (obj) {
    //   return { ts: obj.timestamp, deviceID: obj.deviceid, occupied: obj.isoccupied };
    // });
    //
    // var dist = st.reduce(function(memo, status){
    //
    //   var ind = memo.indexOf(memo.find(function(el){return (el.deviceID === status.deviceID);}));
    //
    //   if (ind >= 0){
    //     if (memo[ind].ts < status.ts){
    //       memo[ind] = status;
    //     }
    //   } else {
    //     memo.push(status);
    //   }
    //   return memo;
    // }, []);
    // console.timeEnd('mapReduce');
    // console.log('distinct records: ' + dist.length);

    var size = request.query.size || 100;
    var offset = request.query.offset || 0;

    response.setHeader('Cache-Control', 'no-cache');
    response.json(getCurrentStatus(size, offset).map(function(obj) {
      return {
        deviceID: obj.deviceId,
        occupied: obj.isOccupied,
        ts: obj.timestamp
      }
    }));
  }
  else {
    // statuses.insert(
    //   {timestamp:new Date(), deviceid: parseInt(request.query.device), isoccupied: parseInt(request.query.occupied)});
    //   db.saveDatabase(function(){console.log('record saved');});
    upsertStatus(request.query.device, request.query.occupied == true);
    response.sendStatus(200);
  }
});

var con = mysql.createConnection({
        host: process.env.MYSQL_HOST,
        user: process.env.MYSQL_USER,
        password: process.env.MYSQL_PASSWORD,
        database: process.env.MYSQL_DATABASE
    });

con.connect(function(err){
    if(err){
         console.log('Error ' + err);
         return;
    }
    console.log('Connection established');
 });

app.get('/loadfromsql', function(req, res){

	con.query('SELECT * FROM cubestate limit 1000;',function(err, rows){
        rows.forEach( function(row){
                statuses.insert({timestamp: row.ts, deviceid: row.deviceID, isoccupied: row.occupied});
            }
        );
        db.saveDatabase(function(){console.log('loaded from sql');});
        res.sendStatus(200);
	});

});

module.exports = app;
