import { fusebox } from 'fuse-box';
import * as path from 'path';
import * as fs from 'fs';
const copydir = require('copy-dir');

function getConfig (withDevServer: boolean)
{
  return fusebox(
  {
    entry: 'src/main.ts',
    target: 'browser',
    devServer: withDevServer ? {
      // open: true,
      httpServer: {
        express: (app, express) => {
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
      }
    } : false,
    webIndex: {template: 'src/calendar.html'},
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
  });
}

// Fix for images not loaded on mobile (remove @ so that fusebox load them)
fs.copyFileSync('node_modules/esri-leaflet-geocoder/dist/img/loading@2x.gif', 'node_modules/esri-leaflet-geocoder/dist/img/loading2x.gif');
fs.copyFileSync('node_modules/esri-leaflet-geocoder/dist/img/search@2x.png', 'node_modules/esri-leaflet-geocoder/dist/img/search2x.png');
fs.copyFileSync('node_modules/esri-leaflet-geocoder/dist/img/search@2x-disabled.png', 'node_modules/esri-leaflet-geocoder/dist/img/search2x-disabled.png');
fs.copyFileSync('node_modules/leaflet-fullscreen/dist/fullscreen@2x.png', 'node_modules/leaflet-fullscreen/dist/fullscreen2x.png');


const isProduction = process.env.NODE_ENV === 'production'; // $Env:NODE_ENV="production"
var fuse = getConfig(!isProduction);

if (isProduction)
{
  var dist_folder = '../back/static/';
  fs.copyFileSync('node_modules/bootstrap/dist/css/bootstrap.min.css', dist_folder+'css/bootstrap.min.css'); // we manually load bootstrap for theme selection
  fs.copyFileSync('node_modules/bootstrap/dist/css/bootstrap.min.css.map', dist_folder+'css/bootstrap.min.css.map');
  copydir.sync('src/css/theme', dist_folder+'css/theme');
  copydir.sync('node_modules/leaflet/dist/images', dist_folder+'css/leaflet');

  // for specific pages: login, register, ...
  fs.copyFileSync('node_modules/@fortawesome/fontawesome-free/css/all.min.css', dist_folder+'css/fontawesome-all.min.css');
  copydir.sync('node_modules/@fortawesome/fontawesome-free/webfonts', dist_folder+'webfonts');

  fuse.runProd({
    manifest: false,
    bundles: {
      distRoot: dist_folder,
      app: 'app.js',
      vendor: 'vendor.js',
      styles: 'styles.css'
    }
  }).then(() =>
  {
    // Cleanup unecessary files
    fs.unlinkSync(dist_folder+'index.html');
    fs.unlinkSync(dist_folder+'manifest-browser.json');
  });
}
else
{
  var destDir = 'src/css/';
  if (!fs.existsSync(destDir))
  {
    fs.mkdirSync(destDir);
  }
  fs.copyFileSync('node_modules/bootstrap/dist/css/bootstrap.min.css', destDir+'bootstrap.min.css'); // we manually load bootstrap for theme selection
  fs.copyFileSync('node_modules/bootstrap/dist/css/bootstrap.min.css.map', destDir+'bootstrap.min.css.map');

  fuse.runDev();
}
