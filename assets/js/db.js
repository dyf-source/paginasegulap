var SegulapDB = (function() {
  var DB_NAME = 'SegulapDB';
  var DB_VERSION = 1;
  var db = null;
  var ready = false;
  var queue = [];

  function execQueue() {
    while (queue.length) { queue.shift()(); }
  }

  function open(resolve) {
    if (db && ready) { resolve(db); return; }
    queue.push(function() { resolve(db); });
    if (ready) return;
    ready = true;
    var req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = function(e) {
      var d = e.target.result;
      if (!d.objectStoreNames.contains('products')) {
        d.createObjectStore('products', { keyPath: 'id', autoIncrement: true });
      }
      if (!d.objectStoreNames.contains('config')) {
        d.createObjectStore('config', { keyPath: 'key' });
      }
      var tx = e.target.transaction;
      tx.objectStore('config').put({ key: 'whatsapp', value: '5492216746874' });
      if (typeof productosData !== 'undefined' && typeof categories !== 'undefined') {
        var store = tx.objectStore('products');
        var countReq = store.count();
        countReq.onsuccess = function() {
          if (countReq.result === 0) {
            productosData.forEach(function(p) { store.add(p); });
          }
        };
      }
    };
    req.onsuccess = function(e) {
      db = e.target.result;
      db.onversionchange = function() { db.close(); };
      execQueue();
    };
    req.onerror = function(e) {
      console.error('SegulapDB error:', e.target.error);
    };
  }

  function readyPromise() {
    return new Promise(function(resolve) { open(resolve); });
  }

  return {
    ready: function(cb) {
      if (db && ready) { cb(db); return; }
      queue.push(function() { cb(db); });
      if (!ready) open(null);
    },
    getProducts: function() {
      return new Promise(function(resolve, reject) {
        readyPromise().then(function(d) {
          var tx = d.transaction('products', 'readonly');
          var store = tx.objectStore('products');
          var req = store.getAll();
          req.onsuccess = function() { resolve(req.result); };
          req.onerror = function() { reject(req.error); };
        });
      });
    },
    getCategories: function() {
      return new Promise(function(resolve) {
        if (typeof categories !== 'undefined') { resolve(categories); return; }
        resolve([]);
      });
    },
    addProduct: function(product) {
      return new Promise(function(resolve, reject) {
        readyPromise().then(function(d) {
          var tx = d.transaction('products', 'readwrite');
          var store = tx.objectStore('products');
          var req = store.add(product);
          req.onsuccess = function() { resolve(req.result); };
          req.onerror = function() { reject(req.error); };
        });
      });
    },
    updateProduct: function(id, product) {
      return new Promise(function(resolve, reject) {
        readyPromise().then(function(d) {
          var tx = d.transaction('products', 'readwrite');
          var store = tx.objectStore('products');
          product.id = id;
          var req = store.put(product);
          req.onsuccess = function() { resolve(); };
          req.onerror = function() { reject(req.error); };
        });
      });
    },
    deleteProduct: function(id) {
      return new Promise(function(resolve, reject) {
        readyPromise().then(function(d) {
          var tx = d.transaction('products', 'readwrite');
          var store = tx.objectStore('products');
          var req = store.delete(id);
          req.onsuccess = function() { resolve(); };
          req.onerror = function() { reject(req.error); };
        });
      });
    },
    getConfig: function(key) {
      return new Promise(function(resolve, reject) {
        readyPromise().then(function(d) {
          var tx = d.transaction('config', 'readonly');
          var store = tx.objectStore('config');
          var req = store.get(key);
          req.onsuccess = function() { resolve(req.result ? req.result.value : null); };
          req.onerror = function() { reject(req.error); };
        });
      });
    },
    setConfig: function(key, value) {
      return new Promise(function(resolve, reject) {
        readyPromise().then(function(d) {
          var tx = d.transaction('config', 'readwrite');
          var store = tx.objectStore('config');
          var req = store.put({ key: key, value: value });
          req.onsuccess = function() { resolve(); };
          req.onerror = function() { reject(req.error); };
        });
      });
    },
    getAllProductsJSON: function() {
      return this.getProducts().then(function(products) {
        return JSON.stringify(products, null, 2);
      });
    },
    importProducts: function(data) {
      return new Promise(function(resolve, reject) {
        readyPromise().then(function(d) {
          var tx = d.transaction('products', 'readwrite');
          var store = tx.objectStore('products');
          var clearReq = store.clear();
          clearReq.onsuccess = function() {
            var added = 0;
            data.forEach(function(p, i) {
              var req = store.add(p);
              req.onsuccess = function() {
                added++;
                if (added === data.length) resolve(data.length);
              };
            });
            if (data.length === 0) resolve(0);
          };
          clearReq.onerror = function() { reject(clearReq.error); };
        });
      });
    }
  };
})();
