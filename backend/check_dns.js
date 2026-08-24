const dns = require('dns');

dns.resolveSrv('_mongodb._tcp.cluster0.nadsz43.mongodb.net', (err, addresses) => {
  if (err) {
    console.error('SRV lookup failed:', err.message);
    // Try custom Google DNS lookup
    const { Resolver } = require('dns');
    const resolver = new Resolver();
    resolver.setServers(['8.8.8.8', '1.1.1.1']);
    resolver.resolveSrv('_mongodb._tcp.cluster0.nadsz43.mongodb.net', (err2, addrs2) => {
      if (err2) {
        console.error('Google DNS SRV lookup failed:', err2.message);
      } else {
        console.log('Google DNS SRV addresses:', addrs2);
      }
    });
  } else {
    console.log('SRV addresses:', addresses);
  }
});
