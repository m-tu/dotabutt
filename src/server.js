let express = require('express');
let app = express();
let http = require('http').Server(app);
let path = require('path');
let pg = require("pg");
let CronJob = require("cron").CronJob;
let request = require("request");

let pool = new pg.Pool({
  user: "postgres",
  password: "postgres",
  database: "dotabutt",
  host: "localhost",
  port: 5432
});

const ENV = app.get('env') || 'prod';

function updatePlayerMMR(playerId) {
  request("https://api.opendota.com/api/players/" + playerId, function(err, response, body) {
    if (!err && response.statusCode == 200) {
      let result = JSON.parse(body);
      let mmr = result.solo_competitive_rank;
      if (mmr) {
        pool.connect((err, client, done) => {
          client.query("INSERT INTO mmr_log (player_id, mmr) VALUES($1, $2)", [playerId, parseInt(mmr)], (err, res) => {
            if (err) console.log(err);
            done();
          });
        });
      }
      console.log(result);
    }
  });
}

function updateMMR() {
  pool.connect((err, client, done) => {
    if (err) {
      return console.error("pg pool error", err);
    }

    client.query("SELECT id FROM player", (err, result) => {
      result.rows.forEach(row => updatePlayerMMR(row.id));
      done();      
    });
  });
}


if (ENV === 'prod') {
  new CronJob("0 * * * *", updateMMR, null, true);
}

let staticResPath = path.join(__dirname, './');
app.use(express.static(staticResPath));

app.get('/', function(req, res){
	res.sendFile(path.join(__dirname, './index.html'));
});

app.get("/mmr", function(req, res) {
  pool.connect((err, client, done) => {
    if (err) {
      res.json([]);
      return;
    } 

    client.query(`SELECT * FROM mmr_log WHERE timestamp >= (now() at time zone 'utc') - interval '1 week'`, (err, sqlResult) => {
      done();
      if (err) {
        res.json([]);
      } else {
      	res.json(sqlResult.rows);
      }
    });
  });
});

app.set('port', process.env.PORT || 8001);
http.listen(app.get('port'), function(){
	console.log('dotabutt listening on *:8001');
});
