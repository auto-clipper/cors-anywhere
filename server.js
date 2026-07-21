// Listen on a specific host via the HOST environment variable
var host = process.env.HOST || '0.0.0.0';
// Listen on a specific port via the PORT environment variable
var port = process.env.PORT || 8080;

// Grab the blacklist from the command-line so that we can update the blacklist without deploying
// again. CORS Anywhere is open by design, and this blacklist is not used, except for countering
// immediate abuse (e.g. denial of service). If you want to block all origins except for some,
// use originWhitelist instead.
var originBlacklist = parseEnvList(process.env.CORSANYWHERE_BLACKLIST);
var originWhitelist = parseEnvList(process.env.CORSANYWHERE_WHITELIST);
function parseEnvList(env) {
  if (!env) {
    return [];
  }
  return env.split(',');
}

// Set up rate-limiting to avoid abuse of the public CORS Anywhere server.
var checkRateLimit = require('./lib/rate-limit')(process.env.CORSANYWHERE_RATELIMIT);

var cors_proxy = require('./lib/cors-anywhere');
var server = cors_proxy.createServer({
  originBlacklist: originBlacklist,
  originWhitelist: originWhitelist,
  requireHeader: ['origin', 'x-requested-with'],
  checkRateLimit: checkRateLimit,
  removeHeaders: [
    'cookie',
    'cookie2',
    // Strip Heroku-specific headers
    'x-request-start',
    'x-request-id',
    'via',
    'connect-time',
    'total-route-time',
    // Other Heroku added debug headers
    // 'x-forwarded-for',
    // 'x-forwarded-proto',
    // 'x-forwarded-port',
  ],
  redirectSameOrigin: true,
  httpProxyOptions: {
    // Do not add X-Forwarded-For, etc. headers, because Heroku already adds it.
    xfwd: false,
    // Reap stalled origin connections: without these, an origin that stops
    // responding leaves the proxied socket open forever.
    timeout: 120000,
    proxyTimeout: 120000,
  },
});

// Idle/aborted sockets MUST be reaped: each dead socket pins its buffered
// data in kernel TCP memory, and once the box-wide tcp_mem ceiling is hit
// the kernel clamps EVERY connection on the host to a crawl (July 2026
// incident: ~2k leaked sockets held 715MB and throttled the whole server to
// KB/s until a restart). 120s covers slow origin streams; nothing legitimate
// idles longer than that through a CORS proxy.
server.setTimeout(120000, function(socket) {
  socket.destroy();
});

server.listen(port, host, function() {
  console.log('Running CORS Anywhere on ' + host + ':' + port);
});
