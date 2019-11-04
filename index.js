const server = require('./lib/server');
const workers = require('./lib/workers');

var store = {};
store.init = function() {
    server.init();
    workers.init();
};
store.init();
module.exports = store;
