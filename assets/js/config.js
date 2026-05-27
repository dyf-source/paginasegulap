var SEGULAP_DEFAULT_WHATSAPP = '5492216746874';

function getWhatsAppNumber(callback) {
  SegulapDB.getConfig('whatsapp').then(function(val) {
    if (callback) callback(val || SEGULAP_DEFAULT_WHATSAPP);
  });
}

function setWhatsAppNumber(num, callback) {
  SegulapDB.setConfig('whatsapp', num).then(function() {
    if (callback) callback();
  });
}

function getWhatsAppNumberSync() {
  var stored = localStorage.getItem('segulap_whatsapp_legacy');
  return stored || SEGULAP_DEFAULT_WHATSAPP;
}
