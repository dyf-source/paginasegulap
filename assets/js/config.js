var SEGULAP_DEFAULT_WHATSAPP = '5492216746874';

function getWhatsAppNumber() {
  var stored = localStorage.getItem('segulap_whatsapp');
  return stored || SEGULAP_DEFAULT_WHATSAPP;
}

function setWhatsAppNumber(num) {
  localStorage.setItem('segulap_whatsapp', num);
}

/* Sync WhatsApp config from the API server on page load (db.js must be loaded first) */
if (typeof SegulapDB !== 'undefined') {
  SegulapDB.ready(function() {
    if (SegulapDB.isApiAvailable()) {
      SegulapDB.getConfig('whatsapp').then(function(val) {
        if (val) localStorage.setItem('segulap_whatsapp', val);
      }).catch(function(){});
    }
  });
}
