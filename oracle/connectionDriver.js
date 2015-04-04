var oracledb = require('oracledb');
var fs = require('fs');

var credentials_error = function () {
  return console.error("Credentials file not properly formatted. Fool.");
}

function connectObj(user, pass, connect) {
  this.user = user;
  this.password = pass;
  this.connectString = connect;
}

var execute = function (sql) {
  fs.readFile('login.txt', 'utf8', function cb (err, data) {
    if (err) return console.error(err);

    var lines = data.split('\n');
    if (lines.length < 3) { 
      credentials_error(); return;
    }

    var fst = lines[0].split(' '),
        snd = lines[1].split(' '),
        thrd = lines[2].split(' ');

    if (fst.length < 2 || fst[0] != "URL:"
          || snd.length < 2 || snd[0] != "USER:"
          || thrd.length < 2 || thrd[0] != "PASS:") {
      credentials_error(); return;
    }

    db_connect(new connectObj(snd[1], thrd[1], fst[1]), sql);
  });
}

var db_connect = function (creds, sql) {
  oracledb.getConnection(
      creds,
      function(err, connection)
      {
        if (err) {
          console.error(err.message);
          return;
        }

        connection.execute(
          sql,
          function(err, result)
          {
            if (err) {
              console.error(err.message);
              return;
            }
            console.log(result.rows);

            connection.release(
            function(err) 
            {
              if (err) {
                console.error(err.message);
                return;
              }
            });
          });
        });
}

var main = function () {
  execute("SELECT * FROM Business WHERE rownum < 5");
}

if (require.main === module) {
  main();
}
