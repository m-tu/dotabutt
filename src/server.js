let express = require('express');
let  app = express();
let  http = require('http').Server(app);
let  path = require('path');

let staticResPath = path.join(__dirname, './');
app.use(express.static(staticResPath));

app.get('/', function(req, res){
	res.sendFile(path.join(__dirname, './index.html'));
});

http.listen(8001, function(){
	console.log('listening on *:8001');
});