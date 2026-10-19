/* PitLane: utilidades compartidas.
   - PitLane.almacen: lee y guarda en localStorage sin romper la página si el navegador lo bloquea
     (modo privado, cookies desactivadas, cuota llena).
   - PitLane.normalizar: compara textos sin tildes ni mayúsculas. */
(function () {
  'use strict';

  var PitLane = (window.PitLane = window.PitLane || {});

  PitLane.CLAVES = {
    preferencias: 'pitlane.preferencias',
    club: 'pitlane.club',
    prediccion: 'pitlane.prediccion'
  };

  PitLane.almacen = {
    leer: function (clave) {
      try {
        var valor = window.localStorage.getItem(clave);
        return valor ? JSON.parse(valor) : null;
      } catch (error) {
        return null;
      }
    },
    guardar: function (clave, valor) {
      try {
        window.localStorage.setItem(clave, JSON.stringify(valor));
        return true;
      } catch (error) {
        return false;
      }
    },
    borrar: function (clave) {
      try {
        window.localStorage.removeItem(clave);
        return true;
      } catch (error) {
        return false;
      }
    }
  };

  PitLane.normalizar = function (texto) {
    return String(texto || '')
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .trim();
  };

  PitLane.movimientoReducido = function () {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  };
})();
