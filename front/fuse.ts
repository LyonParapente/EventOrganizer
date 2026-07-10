import { fusebox } from 'fuse-box';
import { IPublicConfig } from 'fuse-box/config/IConfig';
import * as path from 'path';
import * as fs from 'fs';
const copydir = require('copy-dir');

// Build modes, selected with NODE_ENV ($Env:NODE_ENV="production"):
// - 'production':   compile once, minified, into ../back/static/ (deploy)
// - 'fullstack':    compile in watch mode into ../back/static/, Flask serves everything (docker compose up)
// - anything else:  mock mode, standalone dev server on http://localhost:4444 with a fake API

const dist_folder = '../back/static/';
const dist_bundles = {
  distRoot: dist_folder,
  app: 'app.js',
  vendor: 'vendor.js',
  styles: 'styles.css'
};

function common (overrides: IPublicConfig): IPublicConfig
{
  return Object.assign(<IPublicConfig>{
    entry: 'src/main.ts',
    target: 'browser',
    resources: {
      resourceFolder: './resources/',
      resourcePublicRoot: '/static/resources',
    },
    stylesheet: {
      macros: {
        // Fix images not loaded by fusebox because having an '@' inside
        "@": ""
      }
    }
  }, overrides);
}

// One-shot minified build, what production serves
function buildProduction ()
{
  copyStaticAssets();

  const fuse = fusebox(common({
    webIndex: {template: 'src/calendar.html'}
  }));
  fuse.runProd({manifest: false, bundles: dist_bundles}).then(() =>
  {
    // Cleanup unecessary files
    fs.unlinkSync(dist_folder+'index.html');
    fs.unlinkSync(dist_folder+'manifest-browser.json');
  });
}

// Watch mode compiling into back/static/, so that Flask serves fresh bundles
// against the real API (used by docker compose up)
function watchFullstack ()
{
  copyStaticAssets();

  // Development builds inject CSS at runtime through app.js: keep the
  // styles.css referenced by the Flask templates present so it doesn't 404.
  if (!fs.existsSync(dist_folder+'styles.css'))
  {
    fs.writeFileSync(dist_folder+'styles.css', '');
  }

  const fuse = fusebox(common({
    webIndex: false,
    watcher: {
      enabled: true,
      // File events don't always propagate through bind mounts: CHOKIDAR_USEPOLLING=1 as a fallback
      chokidarOptions: process.env.CHOKIDAR_USEPOLLING ? {usePolling: true, interval: 500} : {}
    }
  }));
  fuse.runDev({manifest: false, bundles: dist_bundles});
}

// Standalone dev server on http://localhost:4444, no back needed (see mockApi)
function serveMock ()
{
  const destDir = 'src/css/';
  if (!fs.existsSync(destDir))
  {
    fs.mkdirSync(destDir);
  }
  fs.copyFileSync('node_modules/bootstrap/dist/css/bootstrap.min.css', destDir+'bootstrap.min.css'); // we manually load bootstrap for theme selection
  fs.copyFileSync('node_modules/bootstrap/dist/css/bootstrap.min.css.map', destDir+'bootstrap.min.css.map');

  const fuse = fusebox(common({
    webIndex: {template: 'src/calendar.html'},
    devServer: {
      // open: true,
      httpServer: {
        express: mockApi
      }
    }
  }));
  fuse.runDev();
}

// Fake API for the mock server: static assets + recorded JSON responses from data/
function mockApi (app: any, express: any)
{
  app.use('/avatars/', express.static(path.join(__dirname, 'data/avatars'), {extensions: ['png', 'jpg']}));

  app.use('/static/img/', express.static(path.join(__dirname, 'src/static/img'), {extensions: ['png', 'gif']}));

  app.get('/api/events', function (req: any, res: any)
  {
    var eventsJson = path.join(__dirname, 'data/events/2021.json');
    var readable = fs.createReadStream(eventsJson);
    readable.pipe(res);
  });

  app.get('/api/messages', getEvent);
  app.get('/api/event/:eventid', getEvent);

  function getEvent (req: any, res: any)
  {
    var event_id = req.query.event_id || req.params.eventid;
    var eventsJson = path.join(__dirname, 'data/events/Event_'+event_id+'.json');
    var readable = fs.createReadStream(eventsJson);
    readable.pipe(res);
  }

  app.get('/api/event/:eventid/notifications_blocklist', function (req: any, res: any)
  {
    res.send('{"message": "Notifications blocklist not setted for this event", "block": false}');
  });

  app.get('/background/:resolution', function (req: any, res: any)
  {
    var bgImg = path.join(__dirname, 'data/background.jpg');
    var readable = fs.createReadStream(bgImg);
    readable.pipe(res);
  });

  app.use('/static/css/', express.static(path.join(__dirname, 'src/css'), {extensions: ['css']})); // bootstrap + theme
  app.use('/static/resources/', express.static(path.join(__dirname, 'dist/resources')));
  app.use('/static/css/leaflet/', express.static(path.join(__dirname, 'node_modules/leaflet/dist/images'), {extensions: ['png']}));
}

function copyStaticAssets ()
{
  fs.copyFileSync('node_modules/bootstrap/dist/css/bootstrap.min.css', dist_folder+'css/bootstrap.min.css'); // we manually load bootstrap for theme selection
  fs.copyFileSync('node_modules/bootstrap/dist/css/bootstrap.min.css.map', dist_folder+'css/bootstrap.min.css.map');
  copydir.sync('src/css/theme', dist_folder+'css/theme');
  copydir.sync('node_modules/leaflet/dist/images', dist_folder+'css/leaflet');

  // for specific pages: login, register, ...
  fs.copyFileSync('node_modules/@fortawesome/fontawesome-free/css/all.min.css', dist_folder+'css/fontawesome-all.min.css');
  copydir.sync('node_modules/@fortawesome/fontawesome-free/webfonts', dist_folder+'webfonts');
}

// Fix for images not loaded on mobile (remove @ so that fusebox load them)
fs.copyFileSync('node_modules/esri-leaflet-geocoder/dist/img/loading@2x.gif', 'node_modules/esri-leaflet-geocoder/dist/img/loading2x.gif');
fs.copyFileSync('node_modules/esri-leaflet-geocoder/dist/img/search@2x.png', 'node_modules/esri-leaflet-geocoder/dist/img/search2x.png');
fs.copyFileSync('node_modules/esri-leaflet-geocoder/dist/img/search@2x-disabled.png', 'node_modules/esri-leaflet-geocoder/dist/img/search2x-disabled.png');
fs.copyFileSync('node_modules/leaflet-fullscreen/dist/fullscreen@2x.png', 'node_modules/leaflet-fullscreen/dist/fullscreen2x.png');

switch (process.env.NODE_ENV)
{
  case 'production': buildProduction(); break;
  case 'fullstack': watchFullstack(); break;
  default: serveMock(); break;
}
