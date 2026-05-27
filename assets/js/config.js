var SEGULAP_DEFAULT_WHATSAPP = '5492216746874';

function getWhatsAppNumber() {
  var stored = localStorage.getItem('segulap_whatsapp');
  return stored || SEGULAP_DEFAULT_WHATSAPP;
}

function setWhatsAppNumber(num) {
  localStorage.setItem('segulap_whatsapp', num);
}
