const server = require('./lib/server');
var store = {};
store.init = function() {
    server.init();
};
store.init();
module.exports = store;
