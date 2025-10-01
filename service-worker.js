const CACHE_NAME='clantical-v1';
const ASSETS=[
  './',
  './index.html','./music.html','./videos.html','./about.html','./contact.html','./hire.html',
  './assets/css/styles.css','./assets/js/main.js'
];
self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(ASSETS)));
});
self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k)))));
});
self.addEventListener('fetch',event=>{
  event.respondWith(
    caches.match(event.request).then(res=>res||fetch(event.request).then(resp=>{
      const copy=resp.clone();
      caches.open(CACHE_NAME).then(cache=>cache.put(event.request,copy));
      return resp;
    }).catch(()=>res))
  );
});


