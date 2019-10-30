// Container of all the enviroments
var enviroments = {};

enviroments.staging = {
  'httpPort' : 3010,
  'httpsPort' : 3011,
  'envName' : 'staging',
  'hashingSecret' : 'thisIsASecret',
  'templateGlobals' : {
    'appName' : 'Fictional Store',
    'companyName' : 'FromMedToDev inc.',
    'yearCreated' : '2019',
    'baseUrl' : 'http://localhost:3010/'
  }
};

enviroments.production = {
  'httpPort' : 5010,
  'httpsPort' : 5011,
  'envName' : 'production',
  'hashingSecret' : 'thisIsAlsoASecret',
  'templateGlobals' : {
    'appName' : 'Fictional sStore',
    'companyName' : 'FromMedToDev inc.',
    'yearCreated' : '2019',
    'baseUrl' : 'http://localhost:3010/'
  }
};

var currentEnviroment = typeof(process.env.NODE_ENV) == 'string' ? process.env.NODE_ENV.toLowerCase() : '';

var enviromentToExport = typeof(enviroments[currentEnviroment]) == 'object' ? enviroments[currentEnviroment] : enviroments.staging;

module.exports = enviromentToExport;