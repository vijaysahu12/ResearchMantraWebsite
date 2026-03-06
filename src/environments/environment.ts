// The file contents for the current environment will overwrite these during build.
// The build system defaults to the dev environment which uses `environment.ts`, but if you do
// `ng build --env=prod` then `environment.prod.ts` will be used instead.
// The list of which env maps to which file can be found in `.angular-cli.json`.

export const environment = {
  production: false,
  signalRURL: 'https://localhost:44380/notification',
  apiurl: 'https://localhost:44380/api/',
  // apiurl:'http://free.kingresearch.co.in/api/'
  // mobilePushNotificationUrl: 'http://testmobileapi.kingresearch.co.in/api/',
  mobilePushNotificationUrl: 'https://localhost:7001/api/',
  mobileBaseUrl: 'http://product.researchmantra.in/api/',
  gupshupApiKey: 'dd2noa4nnfdfmbchbch8mmtm0rr0kzdb',
  azureBlobUrl: 'https://communitypostdata.blob.core.windows.net/mobileapptest/'
};
