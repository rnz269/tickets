// Purpose of this file: to ensure file-watching refreshes on file change
/* directions:
skaffold auto-throws this file into pod, but nextjs doesn't restart itself
on changes to this file (it does on react files), so need to manually kill
client pod (k delete pod x) and depl will auto-recreate it w/ this file applied
*/

/* details: 
loaded automatically by nextjs when project starts up
next will attempt to read it in, looks at this mw function, and calls it
with a supplied default config will pull all files inside project directory every 300ms
*/

module.exports = {
  webpackDevMiddleware: (config) => {
    config.watchOptions.poll = 300;
    return config;
  },
};
