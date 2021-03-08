import { fusebox } from 'fuse-box';

const fuse = fusebox({
  entry: 'src/main.ts',
  target: 'browser',
  devServer: true,
  webIndex: {template: 'src/calendar.html'}
});

fuse.runDev();
