import { fusebox } from 'fuse-box';
import * as path from 'path';

const fuse = fusebox({
  entry: 'src/main.ts',
  target: 'browser',
  devServer: {
    // open: true,
    httpServer: {
      express: (app, express) => {        
        app.get('/api/events', function (req, res)
        {
          var eventsJson = path.join(__dirname, 'data/events/2021.json');
          var readable = require('fs').createReadStream(eventsJson);
          readable.pipe(res);
        });
        app.get('/api/messages', function (req, res)
        {
          var eventsJson = path.join(__dirname, 'data/events/Event_'+req.query.event_id+'.json');
          var readable = require('fs').createReadStream(eventsJson);
          readable.pipe(res);
        });
      }
    }
  },
  webIndex: {template: 'src/calendar.html'}
});

fuse.runDev();
