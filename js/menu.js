/* Menú móvil: el botón "Menú" del header abre la barra lateral como panel en pantallas de hasta 850px.
   Teclado: Escape cierra, Tab recorre solo el panel mientras está abierto y el foco vuelve al botón al cerrar. */
(function () {
  'use strict';

  var boton = document.querySelector('.menu-boton');
  var panel = document.getElementById('menu-lateral');
  if (!boton || !panel) return;

  var principal = document.getElementById('contenido');
  var consulta = window.matchMedia('(max-width: 850px)');
  var abierto = false;

  var velo = document.createElement('div');
  velo.className = 'menu-velo';
  velo.setAttribute('aria-hidden', 'true');
  document.body.appendChild(velo);

  function enfocables() {
    return Array.prototype.slice.call(panel.querySelectorAll('a[href], button:not([disabled])'));
  }

  function abrir() {
    abierto = true;
    panel.classList.add('abierto');
    velo.classList.add('visible');
    boton.setAttribute('aria-expanded', 'true');
    document.documentElement.classList.add('menu-abierto');
    if (principal) principal.inert = true;

    var lista = enfocables();
    if (lista.length) lista[0].focus();
  }

  function cerrar(devolverFoco) {
    if (!abierto) return;
    abierto = false;
    panel.classList.remove('abierto');
    velo.classList.remove('visible');
    boton.setAttribute('aria-expanded', 'false');
    document.documentElement.classList.remove('menu-abierto');
    if (principal) principal.inert = false;
    if (devolverFoco) boton.focus();
  }

  boton.addEventListener('click', function () {
    if (abierto) {
      cerrar(true);
    } else {
      abrir();
    }
  });

  velo.addEventListener('click', function () {
    cerrar(true);
  });

  // Al elegir una sección el panel se cierra (útil si el enlace es la página actual)
  panel.addEventListener('click', function (evento) {
    if (abierto && evento.target.closest('a')) cerrar(false);
  });

  document.addEventListener('keydown', function (evento) {
    if (!abierto) return;

    if (evento.key === 'Escape') {
      evento.preventDefault();
      cerrar(true);
      return;
    }

    if (evento.key !== 'Tab') return;

    // Trampa de foco: el ciclo es botón -> enlaces del panel -> botón
    var lista = [boton].concat(enfocables());
    var primero = lista[0];
    var ultimo = lista[lista.length - 1];
    var activo = document.activeElement;

    if (evento.shiftKey && activo === primero) {
      evento.preventDefault();
      ultimo.focus();
    } else if (!evento.shiftKey && activo === ultimo) {
      evento.preventDefault();
      primero.focus();
    } else if (lista.indexOf(activo) === -1) {
      evento.preventDefault();
      primero.focus();
    }
  });

  // Si la pantalla crece por encima de 850px la barra lateral vuelve a ser fija
  function alCambiarTamano(cambio) {
    if (!cambio.matches) cerrar(false);
  }

  if (consulta.addEventListener) {
    consulta.addEventListener('change', alCambiarTamano);
  } else if (consulta.addListener) {
    consulta.addListener(alCambiarTamano);
  }
})();
