var ua = require('./index')

var MB = '';

for (var i = 0; i < 1024 * 1024; ++i)
  MB += '1';

setInterval(function() {
  ua({
    'app':'test',
    'log':MB
  })
}, 1000);