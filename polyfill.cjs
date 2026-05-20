// Node.js 22 + undici compatibility fix
// undici references ReadableStream/WritableStream/TransformStream as globals
// at module init time, before Node's global setup is complete.
if (typeof ReadableStream === 'undefined') {
  const w = require('stream/web');
  Object.assign(global, {
    ReadableStream:  w.ReadableStream,
    WritableStream:  w.WritableStream,
    TransformStream: w.TransformStream,
  });
}
