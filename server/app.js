// Load the http module to create an http server.
var http = require('http');
var mysql = require("mysql");
var url = require("url");

var con = mysql.createConnection({
   host: "dbsiotdb.ctdx7umcipoo.us-west-2.rds.amazonaws.com",
   user: "dbs",
   password: "dbsatlanta",
   database: "iot"
 });

con.connect(function(err){
    if(err){
         console.log('Error ' + err);
         return;
    }
    console.log('Connection established');
 });

var server = http.createServer(function (request, response) {

    var html = '{';
  
    console.dir(request.param);

    var queryObject = url.parse(request.url,true).query;
    console.log(queryObject);

    if (queryObject['device'] == null) {
	con.query('SELECT * FROM cubestate limit 1000;',function(err, rows){
		for(var i =0; i<rows.length; i++) {
			html += "{'deviceID':'" + rows[i].deviceID + "','occupied':'" + rows[i].occupied + "','ts':' " +rows[i].ts + "'},\n";
		}        
  	      	html += '}';
		response.writeHead(200, {'Content-Type': 'application/json'});
        	response.end(html);
	});
    }
    else
    {
	var device = queryObject['device'];
	var state = queryObject['occupied']
	console.log(device + ', ' + state);
	con.query('INSERT INTO cubestate (deviceId, occupied, ts) VALUES (' + con.escape(device) + ',' + con.escape(state) + ', now());', function(err, result) {
		console.log("Err: " + err + ", Res: " + result);
	});
	response.writeHead(200, {'Content-Type': 'application/json'});
        response.end("{'response':'Success'}");
    }
});

// Listen on port 8000, IP defaults to 127.0.0.1
server.listen(8080);

// Put a friendly message on the terminal
console.log("Server running at http://127.0.0.1:8080/");
