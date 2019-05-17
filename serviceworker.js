"use strict";
const CACHE_NAME = "static-cache-v1";

self.addEventListener("install", event => {
  console.log("[ServiceWorker] Installed");
});

self.addEventListener("activate", evt => {
  console.log("[ServiceWorker] Activate");
  evt.waitUntil(
    caches.keys().then(keyList => {
      return Promise.all(
        keyList.map(key => {
          if (key !== CACHE_NAME) {
            console.log("[ServiceWorker] Removing old cache", key);
            return caches.delete(key);
          }
        })
      );
    })
  );
});

self.addEventListener("fetch", evt => {
  console.log("[ServiceWorker] Fetch", evt.request.url);
  // load from
  evt.respondWith(
    (() => {
      if (navigator.onLine) {
        return fetch(evt.request).then(resp => {
          let respClone = resp.clone();
          if (resp.status === 200) {
            console.log("[ServiceWorker] Updating cache");
            caches
              .open(CACHE_NAME)
              .then(cache => cache.put(evt.request.url, respClone));
          }
          return resp;
        });
      } else {
        console.log(
          "[ServiceWorker] is offline. Loading from cache if available."
        );
        return caches.match(evt.request).then(resp => resp);
      }
    })() // immediate call
  );
});
