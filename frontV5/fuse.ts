import { fusebox } from 'fuse-box';
import * as path from 'path';

const fuse = fusebox({
  entry: 'src/main.ts',
  target: 'browser',
  devServer: {
    // open: true,
    httpServer: {
      express: (app, express) => {
        app.use('/avatars/', express.static(path.join(__dirname, 'data/avatars'), {extensions: ['png', 'jpg']}));

        app.use('/static/img/', express.static(path.join(__dirname, 'src/static/img'), {extensions: ['png', 'gif']}));

        app.get('/api/events', function (req: any, res: any)
        {
          var eventsJson = path.join(__dirname, 'data/events/2021.json');
          var readable = require('fs').createReadStream(eventsJson);
          readable.pipe(res);
        });

        app.get('/api/messages', getEvent);
        app.get('/api/event/:eventid', getEvent);

        function getEvent (req: any, res: any)
        {
          var event_id = req.query.event_id || req.params.eventid;
          var eventsJson = path.join(__dirname, 'data/events/Event_'+event_id+'.json');
          var readable = require('fs').createReadStream(eventsJson);
          readable.pipe(res);
        }

        app.get('/api/event/:eventid/notifications_blacklist', function (req: any, res: any)
        {
          res.send('{"message": "Notifications blacklist not setted for this event", "block": false}');
        });

        app.get('/background/:resolution', function (req: any, res: any)
        {
          var bgImg = path.join(__dirname, 'data/background.jpg');
          var readable = require('fs').createReadStream(bgImg);
          readable.pipe(res);
        });

        app.use('/css/themes/', express.static(path.join(__dirname, 'src/css/themes'), {extensions: ['css']}));
      }
    }
  },
  webIndex: {template: 'src/calendar.html'}
});

const isProduction = process.env.NODE_ENV === 'production'; // $Env:NODE_ENV="production"
if (isProduction)
{
  fuse.runProd();
}
else
{
  fuse.runDev();
}
