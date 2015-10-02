// Load the http module to create an http server.
var http = require('http');
var mysql = require("mysql");

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

    var html = '<html><body>';
  
    console.dir(request.param);

    if (request.method == 'POST') {
        console.log("POST");
        var body = '';
        request.on('data', function (data) {
            body += data;
            console.log("Partial body: " + body);
        });
        request.on('end', function () {
            console.log("Body: " + body);
        });
        response.writeHead(200, {'Content-Type': 'text/html'});
        response.end('post received');
    }
    else
    {
        console.log("GET");
	executeQuery(function(rows){
		console.log("IN ROWS CALLBACK " + rows); 
		for(var i =0; i<rows.length; i++) {
			html += rows[i].name + ", ";
		}        
  	      	response.writeHead(200, {'Content-Type': 'text/plain'});
        	response.end(html);
	});
    }
});


function executeQuery(callback) {
        console.log("IN executeQuery");
	con.query('SELECT * FROM employees',function(err,rows){
          if(err) throw err;
          console.log("in con.query()"); 
          return callback(rows);
        });
};

// Listen on port 8000, IP defaults to 127.0.0.1
server.listen(8080);

// Put a friendly message on the terminal
console.log("Server running at http://127.0.0.1:8080/");
