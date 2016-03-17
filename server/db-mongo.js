//lets require/import the mongodb native drivers.
var mongodb = require('mongodb');

//We need to work with "MongoClient" interface in order to connect to a mongodb server.
var MongoClient = mongodb.MongoClient;

// Connection URL. This is where your mongodb server is running.
var url = 'mongodb://dbs:iotdbsatl@ds011399.mlab.com:11399/dbs-dod';

// Use connect method to connect to the Server
MongoClient.connect(url, function (err, db) {
  if (err) {
    console.log('Unable to connect to the mongoDB server. Error:', err);
  } else {
    //HURRAY!! We are connected. :)
    console.log('Connection established to', url);
  }
});

var db = {};

db.getCurrentStatus = function(size, offset, callback) {
			
	var statie = new Array();
	MongoClient.connect(url, function (err, db) {
		//console.log("Statie: " + statie.toString());
		if (err) {
			console.log('Unable to connect to the mongoDB server. Error:', err);
		} else {
			//HURRAY!! We are connected. :)
			console.log('Connection established to', url);

			// do some work here with the database.
			var collection = db.collection('currentStatus');

			console.log("Before find()");
			var cursor = collection.find({});
			
			var list = cursor.map(function(item) {
			    return item.id;
			});
			callback(null, list);
			console.log("after find()");
		}
	});	
}

db.getHistory = function(size, offset) {
  return [];
}

db.getUsage = function(from, to) {
  return {};
}

db.upsertStatus = function(deviceId, isOccupied) {
}

module.exports = db;
