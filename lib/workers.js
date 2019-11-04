const fs = require('fs');
const util = require('util');
const debug = util.debuglog('workers');

var workers = {};

workers.checkTokens = function(){
    debug("Token cleaning function initialised");
    fs.readdir('./.data/tokens', function(err, files) {
        if (!err && files && files.length > 0) {
            files.forEach(function(file) {
                fs.readFile('./.data/tokens/'+file,'utf-8',function(err, data) {
                    if (!err && data) {
                        var dataobj = JSON.parse(data);
                        if (dataobj.expires < Date.now()) {
                            // Delete the expired token
                            fs.unlink('./.data/tokens/'+file, function(err) {
                                if (!err) {
                                  debug("Token deleted");
                                } else {
                                  debug('Error deleting the file');
                                }
                            })
                        } else {
                            debug("Token is valid");
                        }
                    } else {
                      debug('Error reading the file',err);
                    }
                })
            });
        } else {
         debug("There was an error collecting tokens or the token folder is empty");
        }
    });
};

workers.loop = function() {
    setInterval(function() {
        workers.checkTokens();
    }, 1000*60);
};

workers.init = function() {
    workers.loop();
}
module.exports = workers;
