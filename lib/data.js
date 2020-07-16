const fs = require('fs');
const path = require('path');
const Helpers = require('./helpers');

const helpers = new Helpers();

module.exports = class FileEditor {
    constructor() {
        this.baseDir = path.join(__dirname,'/../.data/');
    }

    create(dir, file, data, callback) {
        fs.open(this.baseDir + dir + '/' + file + '.json', 'wx', (err,fileDescriptor) => {
            if (!err && fileDescriptor) {
                var stringData = JSON.stringify(data);
                fs.writeFile(fileDescriptor, stringData, (err) => {
                    if (!err) {
                        fs.close(fileDescriptor, (err) => {
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
                console.error(err);
                callback("Could not create a new file, it may already exist");
            };
        });
    }

    read(dir, file, callback) {
        fs.readFile(this.baseDir+dir+"/"+file+".json",'utf-8', (err, data) => {
            if (!err && data) {
                var parsedData = helpers.parseJsonToObject(data);
                callback(false, parsedData);
            } else {
                callback(err,data);
            }
        });
    };

    update(dir, file, data, callback) {
        fs.open(this.baseDir + dir + "/" + file + ".json", 'r+', (err,fileDescriptor) => {
            if (!err && fileDescriptor) {
                var stringData = JSON.stringify(data);
                fs.ftruncate(fileDescriptor, (err) => {
                    if (!err) {
                        fs.writeFile(fileDescriptor, stringData, (err) => {
                            if (!err) {
                                fs.close(fileDescriptor, (err) => {
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

    delete(dir, file, callback) {
        fs.unlink(this.baseDir + dir + "/" + file + ".json", (err) => {
            if (!err) {
              callback(false);
            } else {
                callback('Error deleting the file');
            }
        })
    };
}
