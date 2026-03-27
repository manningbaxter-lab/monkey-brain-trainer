self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("fetch", event => {
  event.respondWith(
    caches.open("mbt").then(cache =>
      cache.match(event.request).then(
        res =>
          res ||
          fetch(event.request).then(net => {
            cache.put(event.request, net.clone());
            return net;
          })
      )
    )
  );
});
