/* Ventanas emergentes (Circuitos, Fichas rápidas y Resumen del GP).
   Las ventanas funcionan solo con CSS (:target), así que sin JavaScript siguen abriendo y cerrando.
   Este archivo agrega lo que el CSS no puede hacer:
   - mueve el foco al botón de cerrar al abrir y lo devuelve al enlace que la abrió al cerrar;
   - Escape cierra la ventana;
   - Tab no se escapa de la ventana mientras está abierta;
   - la página de fondo no se desplaza. */
(function () {
  'use strict';

  var modales = document.querySelectorAll('.modal[id]');
  if (!modales.length) return;

  var abierta = null;
  var origen = null;

  function enfocables(modal) {
    return Array.prototype.slice.call(
      modal.querySelectorAll('.modal-contenido a[href], .modal-contenido button:not([disabled]), .modal-contenido [tabindex]:not([tabindex="-1"])')
    );
  }

  function modalDelHash() {
    var id = decodeURIComponent(window.location.hash.slice(1));
    if (!id) return null;
    var elemento = document.getElementById(id);
    return elemento && elemento.classList.contains('modal') ? elemento : null;
  }

  function sincronizar() {
    var modal = modalDelHash();
    if (modal === abierta) return;

    if (abierta && !modal) {
      document.documentElement.classList.remove('modal-abierto');
      var volver = origen;
      abierta = null;
      origen = null;
      if (volver && document.contains(volver)) volver.focus();
      return;
    }

    if (modal) {
      abierta = modal;
      document.documentElement.classList.add('modal-abierto');
      var cerrar = modal.querySelector('.modal-cerrar') || enfocables(modal)[0];
      // Se espera un cuadro para que la ventana ya sea visible y pueda recibir el foco
      window.requestAnimationFrame(function () {
        if (cerrar) cerrar.focus({ preventScroll: true });
      });
    }
  }

  // Recordar qué enlace abrió la ventana para devolverle el foco
  document.addEventListener('click', function (evento) {
    var enlace = evento.target.closest('a[href^="#modal-"]');
    if (enlace) origen = enlace;
  });

  function cerrarVentana() {
    // Igual que los enlaces "Cerrar" del HTML: el hash #cerrar no apunta a ninguna ventana
    window.location.hash = 'cerrar';
  }

  document.addEventListener('keydown', function (evento) {
    if (!abierta) return;

    if (evento.key === 'Escape') {
      evento.preventDefault();
      cerrarVentana();
      return;
    }

    if (evento.key !== 'Tab') return;
    var lista = enfocables(abierta);
    if (!lista.length) return;
    var primero = lista[0];
    var ultimo = lista[lista.length - 1];
    var activo = document.activeElement;

    if (evento.shiftKey && (activo === primero || !abierta.contains(activo))) {
      evento.preventDefault();
      ultimo.focus();
    } else if (!evento.shiftKey && (activo === ultimo || !abierta.contains(activo))) {
      evento.preventDefault();
      primero.focus();
    }
  });

  window.addEventListener('hashchange', sincronizar);
  sincronizar();
})();
