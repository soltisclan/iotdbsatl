var mysql = require("mysql");

// First you need to create a connection to the db
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

con.query('SELECT * FROM employees',function(err,rows){
  if(err) throw err;

  console.log('Data received from Db:\n');
  console.log(rows);
});

 con.end(function(err) {
// The connection is terminated gracefully
 // Ensures all previously enqueued queries are still
 // before sending a COM_QUIT packet to the MySQL server.
  });
