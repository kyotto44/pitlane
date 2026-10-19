/* Club de fans: valida el registro, lo guarda en este navegador (localStorage) y muestra la confirmación.
   Si ya te registraste antes, la página abre directamente en la confirmación con opción de editar. */
(function () {
  'use strict';

  var PitLane = window.PitLane;
  var formulario = document.getElementById('form-club');
  var exito = document.getElementById('club-exito');
  if (!PitLane || !PitLane.validacion || !formulario || !exito) return;

  var almacen = PitLane.almacen;
  var CLAVE = PitLane.CLAVES.club;
  var botonEditar = document.getElementById('club-editar');
  var aviso = document.getElementById('club-aviso');

  formulario.noValidate = true;

  var reglas = {
    nombre: function (campo) {
      var valor = campo.value.trim();
      if (!valor) return 'Escribe tu nombre completo.';
      if (valor.length < 3) return 'El nombre debe tener al menos 3 caracteres.';
      return '';
    },
    correo: function (campo) {
      var valor = campo.value.trim();
      if (!valor) return 'Escribe tu correo electrónico.';
      if (!PitLane.validacion.esCorreo(valor)) return 'Revisa el correo: debe tener la forma nombre@dominio.com.';
      return '';
    },
    escuderia: function (campo) {
      return campo.value ? '' : 'Elige tu escudería favorita.';
    },
    terminos: function (campo) {
      return campo.checked ? '' : 'Para unirte al club debes aceptar recibir las novedades por correo.';
    }
  };

  PitLane.validacion.revisarAlCorregir(formulario, reglas);

  function textoOpcion(select) {
    var opcion = select.options[select.selectedIndex];
    return opcion && opcion.value ? opcion.textContent.trim() : '';
  }

  function rellenar(datos) {
    formulario.elements.nombre.value = datos.nombre || '';
    formulario.elements.correo.value = datos.correo || '';
    formulario.elements.escuderia.value = datos.escuderia || '';
    formulario.elements.gp.value = datos.gp || '';
    formulario.elements.mensaje.value = datos.mensaje || '';
    formulario.elements.terminos.checked = Boolean(datos.terminos);
  }

  function pintarExito(datos) {
    exito.querySelectorAll('[data-campo]').forEach(function (nodo) {
      nodo.textContent = datos[nodo.getAttribute('data-campo')] || '';
    });
  }

  function mostrarExito(datos, guardado, enfocar) {
    pintarExito(datos);
    if (aviso) {
      aviso.textContent = guardado
        ? 'Tus datos quedaron guardados solo en este navegador.'
        : 'Este navegador no permite guardar datos, así que tu registro se perderá al recargar la página.';
    }
    formulario.hidden = true;
    exito.hidden = false;
    if (enfocar) exito.focus();
  }

  function mostrarFormulario() {
    exito.hidden = true;
    formulario.hidden = false;
    formulario.elements.nombre.focus();
  }

  formulario.addEventListener('submit', function (evento) {
    evento.preventDefault();
    if (!PitLane.validacion.validar(formulario, reglas)) return;

    var datos = {
      nombre: formulario.elements.nombre.value.trim(),
      correo: formulario.elements.correo.value.trim(),
      escuderia: formulario.elements.escuderia.value,
      escuderiaNombre: textoOpcion(formulario.elements.escuderia),
      gp: formulario.elements.gp.value.trim(),
      mensaje: formulario.elements.mensaje.value.trim(),
      terminos: true,
      fecha: new Date().toISOString()
    };
    var guardado = almacen.guardar(CLAVE, datos);
    mostrarExito(datos, guardado, true);
  });

  if (botonEditar) botonEditar.addEventListener('click', mostrarFormulario);

  // Estado inicial: registro previo o, si no hay, escudería favorita de Preferencias
  var previo = almacen.leer(CLAVE);
  if (previo && previo.nombre && previo.correo) {
    rellenar(previo);
    mostrarExito(previo, true, false);
  } else {
    var pref = almacen.leer(PitLane.CLAVES.preferencias);
    if (pref) {
      var select = formulario.elements.escuderia;
      if (/^[a-z]+$/.test(pref.escuderia || '') && select.querySelector('option[value="' + pref.escuderia + '"]')) select.value = pref.escuderia;
      if (pref.nombre && !formulario.elements.nombre.value) formulario.elements.nombre.value = pref.nombre;
      if (pref.correo && !formulario.elements.correo.value) formulario.elements.correo.value = pref.correo;
    }
  }
})();
