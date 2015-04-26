var oracledb = require('oracledb');
var fs = require('fs');

var credentials_error = function () {
  return console.error("Credentials file not properly formatted. Fool.");
}

/* Create object with credentials */
function connectObj(user, pass, connect) {
  this.user = user;
  this.password = pass;
  this.connectString = connect;
}

/* Function called from outside. i.e. db(sql, func, res) in app */
var execute = function (sql, res, func) {
  /* Parse credentials file */
  fs.readFile('./oracle/login.txt', 'utf8', function cb (err, data) {
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

    /* This callback now directs to the connection function, passing in
     * a credentials object, the sql to execute, the function to execute upon 
     * completion (provided by the app), and the primary argument to 
     * the callback function that initiated this whole clusterfuck */
    db_connect(new connectObj(snd[1], thrd[1], fst[1]), sql, res, func);
  });
}

var db_connect = function (creds, sql, res, func) {
  /* Establish a connection to oracle */
  oracledb.getConnection(
      creds,
      function(err, connection)
      {
        if (err) {
          console.error(err.message);
          return;
        }

        /* Execute that sql! */
        connection.execute(
          sql,
          function(err, result)
          {
            if (err) {
              console.error(err.message);
              return;
            }
            /* Commit transaction */
            connection.commit(
              function(err) {
                if (err) {
                  console.error(err.message);
                  return;
                }
                /* Close connection*/
                connection.release(
                  function (err) {
                    if (err) {
                      console.error(err.message);
                      return;
                    }
                    func(res, result); // Here's that function the app needs performed!
                  }
               );
            });
          });
     });
}

/* For testing */
var main = function () {
  execute("SELECT * FROM Business WHERE rownum < 5");
}

if (require.main === module) {
  main();
}

module.exports = execute;
