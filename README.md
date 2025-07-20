# PostyBirb+
**A rewrite of the desktop application [PostyBirb](https://github.com/mvdicarlo/postybirb) using TypeScript, NestJS, React, and Electron.**

## [Commons](/commons)
Shared interfaces, models, etc. between the UI and Backend.

## [Electron-App](/electron-app) (backend)
ElectronJS + NestJs that handles running the local server and the desktop application itself.
This is where all posting magic happens.

## [UI](/ui)
React code that handles UI of the application displayed in the desktop application.

## Configuring for local development

To set up a local copy of PostyBirb for development:

1. clone this repository and `cd` into it.
2. `npm install`
3. `NODE_OPTIONS=--openssl-legacy-provider npm run contribute` to install dependencies in every folder.

> [!NOTE]  
> If you are using node version 16 and below you don't need to set `NODE_OPTIONS` in step 3, just do `npm run contribute` instead.

<details>
  <summary>INSTALL TROUBLESHOOTING</summary>

  ### Common
  If something does not work and you can't determine where error happened (since there is 3 parallel scripts) run `npm run contribute:debug`

  ### ERR_OSSL_EVP_UNSUPPORTED
  <details>
    <summary>Error</summary>

```
Error: error:0308010C:digital envelope routines::unsupported
  at new Hash (node:internal/crypto/hash:71:19)
  at Object.createHash (node:crypto:133:10)
  at module.exports (ui\node_modules\webpack\lib\util\createHash.js:135:53)
  at NormalModule._initBuildHash (ui\node_modules\webpack\lib\NormalModule.js:417:16)
  at ui\node_modules\webpack\lib\NormalModule.js:452:10
  at ui\node_modules\webpack\lib\NormalModule.js:323:13
  at ui\node_modules\loader-runner\lib\LoaderRunner.js:367:11
  at ui\node_modules\loader-runner\lib\LoaderRunner.js:233:18
  at context.callback (ui\node_modules\loader-runner\lib\LoaderRunner.js:111:13)
  at ui\node_modules\babel-loader\lib\index.js:55:103
  at process.processTicksAndRejections (node:internal/process/task_queues:95:5) {    
  opensslErrorStack: [ 'error:03000086:digital envelope routines::initialization error' ],
  library: 'digital envelope routines',
  reason: 'unsupported',
  code: 'ERR_OSSL_EVP_UNSUPPORTED'
}
```
    
  </details>

To fix this error, use `NODE_OPTIONS=--openssl-legacy-provider` before any npm command.
 
</details>

### Start

```
npm run start
```

## Building

To build production vesrion of the PostyBirb, use the following:
```
npm run build
```

Please not that if you have node version 16 and above (you can check that by running `node -v`), you should use  `NODE_OPTIONS=--openssl-legacy-provider npm run build` 
instead.

And then, depending on your build target, use this command:
```
cd electron-app && yarn run release:windows
cd electron-app && yarn run release:linux
cd electron-app && yarn run release:osx
```

## Contribution Guide
_Pending_

If you are interested in adding features or websites to the application, please let me know.

PR branch is develop.

Dont forget to `npm run test --prefix electron-app` before pull 

Also run `npm run codestyle` if you haven't installed eslint and prettier extensions!