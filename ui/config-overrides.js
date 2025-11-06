const { override, addBabelPlugins, babelInclude } = require('customize-cra');
const path = require('path');

module.exports = override(
  // Add Babel plugins for decorators and class properties
  ...addBabelPlugins(
    ['@babel/plugin-proposal-decorators', { legacy: true }],
    ['@babel/plugin-transform-class-properties', { loose: true }],
    ['@babel/plugin-transform-private-methods', { loose: true }],
    '@babel/plugin-transform-nullish-coalescing-operator',
    '@babel/plugin-transform-logical-assignment-operators'
  ),
  // Include misskey-js and megalodon dependencies in Babel transpilation
  babelInclude([
    path.resolve('src'),
    path.resolve('node_modules/misskey-js'),
    path.resolve('node_modules/megalodon'),
  ])
);
