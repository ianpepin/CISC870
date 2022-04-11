console.log("Command line arguments: <input> [<party count> [<computation_id> [<party id>]]]]");

var mpc = require('./mpc');

// Read Command line arguments
var input = process.argv[2];

var party_count = process.argv[3];
if(party_count == null) party_count = 2;
else party_count = parseInt(party_count);

var computation_id = process.argv[4];
if(computation_id == null) computation_id = 'test';

var party_id = process.argv[5];
if(party_id != null) party_id = parseInt(party_id, 10);


var format_2d = function (array_2d){
    var output = "";

    for (var i=0; i < array_2d.length; i++){
        for (var j=0; j < array_2d[i].length; j++){
            output += array_2d[i][j].toString() + ",";
        }
        //remove the last comma and replace it with a new line
        output = output.slice(0, -1) + '\n';
    }
    //remove trailing new line
    return output.slice(0, -1);
}

// JIFF options
var options = { party_count: party_count, party_id: party_id, cypto_provider: true };
options.onConnect = function(jiff_instance) {
    mpc.compute(input).then(function(r){

          if (false) {
            var output = "/home/seed/conclave/party2/.csv";
            var fs = require('fs');
            fs.writeFile(output, format_2d(r) , function(err) {
                if(err) {
                    jiff_instance.disconnect();
                    return console.log(err);
                }
             });
          }
          jiff_instance.disconnect();
    });
};

// Connect
mpc.connect("http://0.0.0.0:9000", computation_id, options);