// The file contents for the current environment will overwrite these during build.
// The build system defaults to the dev environment which uses `environment.ts`, but if you do
// `ng build --env=prod` then `environment.prod.ts` will be used instead.
// The list of which env maps to which file can be found in `.angular-cli.json`.

export const environment = {
  production: false,
  signalRURL: 'https://localhost:44380/notification',
  apiurl: 'https://crmapi.researchmantra.in/api/',
  websiteBlogApiUrl: 'http://127.0.0.1:5087/api/',
  // apiurl:'http://free.kingresearch.co.in/api/'
  // mobilePushNotificationUrl: 'http://testmobileapi.kingresearch.co.in/api/',
  mobilePushNotificationUrl: 'https://localhost:7001/api/',
  mobileBaseUrl: 'http://product.researchmantra.in/api/',
  gatewayUrl: ' https://localhost:7159/gateway/',
  gupshupApiKey: '',
  azureBlobUrl: 'https://communitypostdata.blob.core.windows.net/mobileapptest/'
};
