"use strict";
const APP_SHELL_CACHE_NAME = "static-cache-v0.2";
const DYNAMIC_RES_CAHCE_NAME = "dynamic-cache-v.0q2";
const appShellResourceList = ["/index.html", "/app.css"];

self.addEventListener("install", event => {
  console.log("[ServiceWorker] Installed");
  event.waitUntil(
    caches.open(APP_SHELL_CACHE_NAME).then(cache => {
      return cache.addAll(appShellResourceList);
    })
  );
});

self.addEventListener("activate", evt => {
  console.log("[ServiceWorker] Activate");
  evt.waitUntil(
    caches.keys().then(keyList => {
      return Promise.all(
        keyList.map(key => {
          if (key !== APP_SHELL_CACHE_NAME) {
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
    caches.match(evt.request).then(resp => {
      if (resp) {
        if (navigator.onLine) {
          doFetch(evt);
        }
        console.log("[ServiceWorker] respondind from cache", evt.request.url);
        return resp;
      }
      return doFetch(evt);
    })
  );
});

function doFetch(evt) {
  /*fetch(evt.request).then(function(response) {
    return caches.open(DYNAMIC_RES_CAHCE_NAME).then(function(cache) {
      console.log("[Service Worker] Caching new resource: " + evt.request.url);
      cache.put(evt.request, response.clone());
      return response;
    });
  });*/

  return fetch(evt.request).then(resp => {
    if (!resp || resp.status !== 200) {
      return resp;
    }
    let respClone = resp.clone();
    caches.open(DYNAMIC_RES_CAHCE_NAME).then(cache => {
      console.log("[Service Worker] Caching new resource: " + evt.request.url);
      cache.put(evt.request, respClone);
    });
    return resp;
  });
}
