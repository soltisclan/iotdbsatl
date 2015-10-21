var express = require('express'),
    mysql = require("mysql"),
    path = require("path"),
    url = require("url"),
    Loki = require('lokijs');

var app = express();
var db = new Loki('../db/storage.json'), statuses;

db.loadDatabase({},function(){
	statuses = db.getCollection('statuses');
	if (statuses){
		console.log('db loaded');
	} else {
		statuses = db.addCollection('statuses');
		console.log('db initialized');
	} 
});


app.use(express.static(path.join(__dirname, '../client')));

app.get('/apix', function(request, response){
    
    if (!Object.keys(request.query).length) {
        // response.json(statuses.data.map(function(obj){
        //     return {ts:obj.timestamp, deviceID:obj.deviceid, occpied:obj.isoccupied};
        // }));
        
        var st = statuses.data.map(function (obj) {
            return { ts: obj.timestamp, deviceID: obj.deviceid, occupied: obj.isoccupied };
        });
        
        var dist = st.reduce(function(memo, status){
            
            var ind = memo.indexOf(memo.find(function(el){return (el.deviceID === status.deviceID);}));
            
            if (ind >= 0){
                if (memo[ind].ts < status.ts){
                    memo[ind] = status;
                }
            } else {
                memo.push(status);
            }
            return memo;
        }, []);
        
        response.setHeader('Cache-Control', 'no-cache');
        response.json(dist);
    } else {
 		statuses.insert(
             {timestamp:new Date(), deviceid: parseInt(request.query.device), isoccupied: parseInt(request.query.occupied)});
		db.save();    
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
        db.save();
        res.sendStatus(200);
	});
    
});


app.get('/api', function(request, response) {
    // var html = '{';
    var queryObject = url.parse(request.url, true).query;
    console.log("Query: " + JSON.stringify(queryObject, null, "\t"));
    console.log("Params: " + JSON.stringify(request.param, null, "\t"));

    if (queryObject.device == null) {
        con.query('SELECT * FROM cubestate limit 1000;', function (err, rows) {

            response.setHeader('Cache-Control', 'no-cache');
            response.json(rows);
        });
    }
    else {
        var device = queryObject.device;
        var state = queryObject.occupied;
        console.log(device + ', ' + state);
        con.query('INSERT INTO cubestate (deviceId, occupied, ts) VALUES (' + device + ',' + state + ', now());', function (err, result) {
            console.log("Err: " + err + ", Res: " + result);
        });
        response.writeHead(200, { 'Content-Type': 'application/json' });
        response.end("{'response':'Success'}");
    }
});

module.exports = app;
