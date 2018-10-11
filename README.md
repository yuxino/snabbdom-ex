# debugger-template

basic webpack template to debugger source code in browser

``` shell
git clone git@github.com:kirakira-template/debugger-template.git temp
```

copy the file to the open source project, and enjoy it !

If the project is exists `webpack.config.js`, you can just rename to `webpack-debugger.config.js` . 

If you want to use `npm` or `yarn` to `debugger` , you need to install first , and add `script` to `package.json`.

### package.json

``` js
script: {
  debugger: 'webpack-dev-server --open'
}
```
