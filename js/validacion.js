/* Validación de formularios: muestra los errores en línea, debajo de cada campo, sin alert().
   Cada error queda enlazado al campo con aria-describedby y el campo se marca con aria-invalid. */
(function () {
  'use strict';

  var PitLane = (window.PitLane = window.PitLane || {});

  var CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  function idError(campo) {
    return (campo.id || campo.name) + '-error';
  }

  // El mensaje va al final del contenedor del campo (grupo del formulario o tarjeta)
  function contenedor(campo) {
    return campo.closest('.grupo-formulario, .input-card') || campo.parentNode;
  }

  function quitarDeDescripcion(campo, id) {
    var ids = (campo.getAttribute('aria-describedby') || '').split(/\s+/).filter(function (valor) {
      return valor && valor !== id;
    });
    if (ids.length) {
      campo.setAttribute('aria-describedby', ids.join(' '));
    } else {
      campo.removeAttribute('aria-describedby');
    }
  }

  function mostrarError(campo, mensaje) {
    var id = idError(campo);
    var error = document.getElementById(id);
    if (!error) {
      error = document.createElement('p');
      error.className = 'error-campo';
      error.id = id;
      contenedor(campo).appendChild(error);
    }
    error.textContent = mensaje;
    campo.setAttribute('aria-invalid', 'true');
    quitarDeDescripcion(campo, id);
    var actuales = campo.getAttribute('aria-describedby');
    campo.setAttribute('aria-describedby', actuales ? actuales + ' ' + id : id);
  }

  function limpiarError(campo) {
    var id = idError(campo);
    var error = document.getElementById(id);
    if (error) error.remove();
    campo.removeAttribute('aria-invalid');
    quitarDeDescripcion(campo, id);
  }

  /* Valida un formulario con un mapa { nombreDelCampo: función(campo) -> mensaje | '' }.
     Devuelve true si todo está bien; si no, enfoca el primer campo con error. */
  function validar(formulario, reglas) {
    var primero = null;
    Object.keys(reglas).forEach(function (nombre) {
      var campo = formulario.elements[nombre];
      if (!campo) return;
      var mensaje = reglas[nombre](campo);
      if (mensaje) {
        mostrarError(campo, mensaje);
        if (!primero) primero = campo;
      } else {
        limpiarError(campo);
      }
    });
    if (primero) primero.focus();
    return !primero;
  }

  /* Cuando un campo ya mostró un error, se vuelve a revisar mientras la persona lo corrige */
  function revisarAlCorregir(formulario, reglas) {
    function revisar(evento) {
      var campo = evento.target;
      var regla = reglas[campo.name];
      if (!regla || campo.getAttribute('aria-invalid') !== 'true') return;
      var mensaje = regla(campo);
      if (mensaje) {
        mostrarError(campo, mensaje);
      } else {
        limpiarError(campo);
      }
    }
    formulario.addEventListener('input', revisar);
    formulario.addEventListener('change', revisar);
  }

  PitLane.validacion = {
    esCorreo: function (texto) {
      return CORREO.test(String(texto).trim());
    },
    mostrarError: mostrarError,
    limpiarError: limpiarError,
    validar: validar,
    revisarAlCorregir: revisarAlCorregir
  };
})();
