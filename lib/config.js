var enviroments = {};

enviroments.development = {
  'httpPort' : 3000,
  'httpsPort' : 3001,
  'envName' : 'development',
  'hashingSecret' : 'thisIsASecret',
  'templateGlobals' : {
    'appName' : 'Online Store Platform',
    'companyName' : 'Lukas Grinys',
    'yearCreated' : '2019-2020',
    'baseUrl' : 'http://localhost:3000/'
  }
};

enviroments.production = {
  'httpPort' : process.env.PORT,
  'httpsPort' : process.env.PORT,
  'envName' : 'production',
  'hashingSecret' : 'thisIsAlsoASecret',
  'templateGlobals' : {
    'appName' : 'Online Store Platform',
    'companyName' : 'Lukas Grinys',
    'yearCreated' : '2019-2020',
    'baseUrl' : 'http://localhost:5000/'
  }
};

var currentEnviroment = typeof(process.env.NODE_ENV) == 'string' ? process.env.NODE_ENV.toLowerCase() : '';
var enviromentToExport = typeof(enviroments[currentEnviroment]) == 'object' ? enviroments[currentEnviroment] : enviroments.development;

module.exports = enviromentToExport;