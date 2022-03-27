const APP_PREFIX = 'onBudget_';
const VERSION = 'version_01';
const CACHE_NAME = APP_PREFIX + VERSION;
const DATA_CACHE_NAME = 'onBudgetData_v1';
const FILES_TO_CACHE = [
    '/',
    './index.html', 
    './css/styles.css', 
    './js/index.js',
    './js/idb.js',
    './service-worker.js',
    './manifest.json'
];

//creates the cache
self.addEventListener('install', function (e) {
    e.waitUntil(
        caches.open(CACHE_NAME).then( cache => {
            console.log('installing cache : ' + CACHE_NAME);
            return cache.addAll(FILES_TO_CACHE);
        })
    )
});


self.addEventListener('activate', function (e) {
    e.waitUntil(
        caches.keys().then(function (keyList) {
            let cacheKeeplist = keyList.filter(function (key) {
                return key.indexOf(APP_PREFIX);
            });
            cacheKeeplist.push(CACHE_NAME);

            return Promise.all(
                keyList.map(function (key, i) {
                    if (cacheKeeplist.indexOf(key) === -1) {
                        console.log('deleting cache : ' + keyList[i]);
                        return caches.delete(keyList[i]);
                    }
                })
            );
        })
    );
});

//this listens for a fetch request and will search cache for that fetch
self.addEventListener('fetch', function (e) {

    console.log('fetch request : ' + e.request.url)

    //save api requests to cache
    if (e.request.url.includes('/api/')) {
        e.respondWith(
            caches
                .open(DATA_CACHE_NAME)
                .then(cache => {
                    return fetch(e.request)
                        .then(response => {
                            // If the response was good, clone it and store it in the cache.
                            if (response.status === 200) {
                                cache.put(e.request.url, response.clone());
                            }

                            return response;
                        })
                        .catch(err => {
                            // Network request failed, try to get it from the cache.
                            return cache.match(e.request);
                        });
                })
                .catch(err => console.log(err))
        );

        return;
    }

    e.respondWith(
        fetch(e.request).catch(function () {
            return caches.match(e.request).then(function (response) {
                if (response) {
                    return response;
                } else if (e.request.headers.get('accept').includes('text/html')) {
                    // return the cached home page for all requests for html pages
                    return caches.match('/');
                }
            });
        })
    );
})