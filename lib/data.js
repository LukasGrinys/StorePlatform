const fs = require('fs');
const path = require('path');
const helpers = require('./helpers');

var lib = {};

lib.baseDir = path.join(__dirname,'/../.data/');

// Write data to a file
lib.create = function(dir, file, data, callback) {
    // Open file for writing
    fs.open(lib.baseDir + dir + '/' + file + '.json', 'w', function(err,fileDescriptor) {
        if (!err && fileDescriptor) {
            var stringData = JSON.stringify(data);
            fs.writeFile(fileDescriptor, stringData, function(err) {
                if (!err) {
                    fs.close(fileDescriptor, function(err) {
                        if (!err) {
                            callback(false);
                        } else {
                            callback('Error closing new file');
                        }
                    });
                } else {
                    callback('Error writing to new file');
                }
            })
        } else {
            callback("Could not create a new file, it may already exist", err);
            console.error(err);
        };
    });
};

// read data from a file
lib.read = function(dir, file, callback) {
    fs.readFile(lib.baseDir+dir+"/"+file+".json",'utf-8', function(err, data) {
        if (!err && data) {
            var parsedData = helpers.parseJsonToObject(data);
            callback(false, parsedData);
        } else {
            callback(err,data);
        }
    });
};

// updating a file
lib.update = function(dir, file, data, callback) {
    fs.open(lib.baseDir + dir + "/" + file + ".json", 'r+',function(err,fileDescriptor){
        if (!err && fileDescriptor) {
            var stringData = JSON.stringify(data);
            fs.ftruncate(fileDescriptor, function(err) {
                if (!err) {
                    fs.writeFile(fileDescriptor, stringData, function(err) {
                        if (!err) {
                            fs.close(fileDescriptor, function(err) {
                                if (!err) {
                                    callback(false);
                                } else {
                                    callback('Error closing the file');
                                }
                            })
                        } else {
                            callback('Error writing to existing file')
                        }
                    })
                } else {
                    callback('Error truncating file');
                }
            })
        } else {
            callback('Could not open the file for updating, it may not exist yet')
        }
    });
};

// Deleting a file
lib.delete = function(dir, file, callback) {
    // Unlinking the file
    fs.unlink(lib.baseDir + dir + "/" + file + ".json", function(err) {
        if (!err) {
          callback(false);
        } else {
            callback('Error deleting the file');
        }
    })
};


module.exports = lib;

