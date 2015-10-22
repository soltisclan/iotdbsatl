var express = require('express'),
    mysql = require("mysql"),
    path = require("path"),
    Loki = require('lokijs'),
    app = express(),
    statuses,
    db = new Loki(__dirname + '/../db/statuses.json',
    {
        autoload: true,
        autoloadCallback: dbLoader
    }
);

function dbLoader(){
	statuses = db.getCollection('statuses');
	if (statuses == null) {
		statuses = db.addCollection('statuses');
        db.saveDatabase(function(){console.log('db initialized');});
	}
	console.log('db ready');
}

app.use(express.static(path.join(__dirname, '../client')));

app.get('/api', function(request, response){
    
    if (!Object.keys(request.query).length) {

        console.log('total records: ' + statuses.data.length);
        console.time('mapReduce');
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
        console.timeEnd('mapReduce');
        console.log('distinct records: ' + dist.length);
        response.setHeader('Cache-Control', 'no-cache');
        response.json(dist);
    } else {
 		statuses.insert(
             {timestamp:new Date(), deviceid: parseInt(request.query.device), isoccupied: parseInt(request.query.occupied)});
        db.saveDatabase(function(){console.log('record saved');});   
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
