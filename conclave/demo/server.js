var express = require('express');
var app = express();
var http = require('http').Server(app);

var JIFFServer = require('/home/seed/conclave/jiff//lib/jiff-server');
var jiff_instance = new JIFFServer(http, { logs: true });

var jiffBigNumberServer = require('/home/seed/conclave/jiff/lib/ext/jiff-server-bignumber');
jiff_instance.apply_extension(jiffBigNumberServer);

app.use("/home/seed/conclave/jiff//demos", express.static("demos"));
app.use("/home/seed/conclave/jiff//lib", express.static("lib"));
app.use("/home/seed/conclave/jiff//lib/ext", express.static("lib/ext"));
app.use("/home/seed/conclave/jiff/bignumber.js", express.static("node_modules/bignumber.js"));

http.listen(9000, function()
{
	console.log('listening on *:9000');
});
