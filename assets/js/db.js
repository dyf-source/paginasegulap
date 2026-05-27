var API_BASE = window.SEGULAP_API_URL || (window.location.protocol === 'file:' ? 'http://localhost:3000' : '');

var SegulapDB = (function() {
  var readyCallbacks = [];
  var ready = false;
  var useApi = false;

  function api(method, path, body) {
    var opts = {
      method: method,
      headers: { 'Accept': 'application/json' },
      cache: 'no-store'
    };
    if (body !== undefined) {
      opts.headers['Content-Type'] = 'application/json';
      opts.body = JSON.stringify(body);
    }
    return fetch(API_BASE + '/api' + path, opts).then(function(r) {
      if (!r.ok) return r.json().then(function(e) { throw new Error(e.error || r.statusText); });
      return r.json();
    });
  }

  function init() {
    api('GET', '/health').then(function() {
      useApi = true;
      ready = true;
      while (readyCallbacks.length) readyCallbacks.shift()();
    }).catch(function() {
      useApi = false;
      ready = true;
      while (readyCallbacks.length) readyCallbacks.shift()();
    });
  }

  if (document.readyState === 'complete') init();
  else window.addEventListener('load', init);

  return {
    ready: function(cb) {
      if (ready) { cb(); return; }
      readyCallbacks.push(cb);
    },
    isApiAvailable: function() { return useApi; },
    getProducts: function() {
      return api('GET', '/products');
    },
    getCategories: function() {
      return api('GET', '/categories');
    },
    addProduct: function(product) {
      return api('POST', '/products', product).then(function(r) { return r.id; });
    },
    updateProduct: function(id, product) {
      return api('PUT', '/products/' + id, product);
    },
    deleteProduct: function(id) {
      return api('DELETE', '/products/' + id);
    },
    getConfig: function(key) {
      return api('GET', '/config/' + key).then(function(r) { return r.value; });
    },
    setConfig: function(key, value) {
      return api('PUT', '/config/' + key, { value: String(value) });
    },
    getAllProductsJSON: function() {
      return api('GET', '/products/export').then(function(data) { return JSON.stringify(data, null, 2); });
    },
    importProducts: function(data) {
      return api('POST', '/products/import', data).then(function(r) { return r.count; });
    }
  };
})();
