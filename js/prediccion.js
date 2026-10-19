/* Resumen del GP: formulario "Vota por tu podio en Monza".
   Muestra el nivel de confianza mientras mueves el deslizador, valida que elijas un piloto
   y guarda la predicción en este navegador para mostrarla al volver. */
(function () {
  'use strict';

  var PitLane = window.PitLane;
  var formulario = document.getElementById('form-prediccion');
  var exito = document.getElementById('prediccion-exito');
  if (!PitLane || !PitLane.validacion || !formulario || !exito) return;

  var almacen = PitLane.almacen;
  var CLAVE = PitLane.CLAVES.prediccion;
  var select = formulario.elements.prediccion;
  var rango = formulario.elements.confianza;
  var salida = document.getElementById('confianza-valor');
  var botonCambiar = document.getElementById('prediccion-cambiar');
  var aviso = document.getElementById('prediccion-aviso');

  formulario.noValidate = true;

  var reglas = {
    prediccion: function (campo) {
      return campo.value ? '' : 'Elige el piloto que crees que ganará en Monza.';
    }
  };
  PitLane.validacion.revisarAlCorregir(formulario, reglas);

  function actualizarConfianza() {
    var texto = rango.value + ' %';
    if (salida) salida.textContent = texto;
    rango.setAttribute('aria-valuetext', texto);
  }
  rango.addEventListener('input', actualizarConfianza);

  function mostrarExito(datos, guardado, enfocar) {
    exito.querySelector('[data-campo="piloto"]').textContent = datos.pilotoNombre;
    exito.querySelector('[data-campo="confianza"]').textContent = datos.confianza + ' %';
    if (aviso) {
      aviso.textContent = guardado
        ? 'La guardamos en este navegador para que la compares con el resultado.'
        : 'Este navegador no permite guardar datos, así que tu predicción se perderá al recargar la página.';
    }
    formulario.hidden = true;
    exito.hidden = false;
    if (enfocar) exito.focus();
  }

  formulario.addEventListener('submit', function (evento) {
    evento.preventDefault();
    if (!PitLane.validacion.validar(formulario, reglas)) return;

    var opcion = select.options[select.selectedIndex];
    var datos = {
      piloto: select.value,
      pilotoNombre: opcion.textContent.trim(),
      confianza: Number(rango.value),
      fecha: new Date().toISOString()
    };
    mostrarExito(datos, almacen.guardar(CLAVE, datos), true);
  });

  if (botonCambiar) {
    botonCambiar.addEventListener('click', function () {
      exito.hidden = true;
      formulario.hidden = false;
      select.focus();
    });
  }

  // Estado inicial: la predicción guardada o, si no hay, tu piloto favorito si está entre las opciones
  var previa = almacen.leer(CLAVE);
  var claveValida = function (valor) {
    return /^[a-z]+$/.test(valor || '') && Boolean(select.querySelector('option[value="' + valor + '"]'));
  };

  if (previa && claveValida(previa.piloto)) {
    select.value = previa.piloto;
    var confianza = Number(previa.confianza);
    if (confianza >= 0 && confianza <= 100) rango.value = String(confianza);
    actualizarConfianza();
    mostrarExito({ pilotoNombre: select.options[select.selectedIndex].textContent.trim(), confianza: rango.value }, true, false);
  } else {
    var pref = almacen.leer(PitLane.CLAVES.preferencias);
    if (pref && claveValida(pref.piloto)) select.value = pref.piloto;
    actualizarConfianza();
  }
})();
