/* Tabla ordenable (mejora progresiva): convierte los encabezados de las tablas con [data-ordenable]
   en botones. Cada clic ordena por esa columna y el siguiente invierte el orden.
   Sin JavaScript la tabla se ve igual, en el orden original (por posición). */
(function () {
  'use strict';

  var colator = new Intl.Collator('es', { sensitivity: 'base', numeric: true });

  function valorCelda(fila, indice, tipo) {
    var celda = fila.cells[indice];
    // Se ignoran las etiquetas "Tu piloto" que agrega favoritos.js
    var texto = '';
    celda.childNodes.forEach(function (nodo) {
      if (nodo.nodeType === 1 && nodo.classList.contains('marca-favorito')) return;
      texto += nodo.textContent;
    });
    texto = texto.trim();
    if (tipo === 'numero') {
      var numero = parseFloat(texto.replace(',', '.'));
      return isNaN(numero) ? 0 : numero;
    }
    return texto;
  }

  function prepararTabla(tabla) {
    var cuerpo = tabla.tBodies[0];
    var encabezados = Array.prototype.slice.call(tabla.tHead.rows[0].cells);
    if (!cuerpo || !encabezados.length) return;

    // Posición original de cada fila: sirve para desempatar (por ejemplo, Russell y Hamilton con 183 pts)
    Array.prototype.forEach.call(cuerpo.rows, function (fila, i) {
      fila.setAttribute('data-orden-original', String(i));
    });

    var anuncio = document.createElement('p');
    anuncio.className = 'sr-only';
    anuncio.setAttribute('aria-live', 'polite');
    tabla.parentNode.insertBefore(anuncio, tabla.nextSibling);

    var pista = document.createElement('p');
    pista.className = 'pista-ayuda';
    pista.textContent = 'Toca o haz clic en un encabezado para ordenar la tabla.';
    tabla.parentNode.parentNode.insertBefore(pista, tabla.parentNode.nextSibling);

    function ordenar(indice, direccion) {
      var th = encabezados[indice];
      var tipo = th.getAttribute('data-tipo') || 'texto';
      var factor = direccion === 'ascending' ? 1 : -1;
      var filas = Array.prototype.slice.call(cuerpo.rows);

      filas.sort(function (a, b) {
        var va = valorCelda(a, indice, tipo);
        var vb = valorCelda(b, indice, tipo);
        var resultado = tipo === 'numero' ? va - vb : colator.compare(va, vb);
        if (resultado === 0) {
          return Number(a.getAttribute('data-orden-original')) - Number(b.getAttribute('data-orden-original'));
        }
        return resultado * factor;
      });

      var fragmento = document.createDocumentFragment();
      filas.forEach(function (fila) {
        fragmento.appendChild(fila);
      });
      cuerpo.appendChild(fragmento);

      encabezados.forEach(function (otro) {
        otro.removeAttribute('aria-sort');
      });
      th.setAttribute('aria-sort', direccion);

      if (!(window.PitLane && window.PitLane.movimientoReducido && window.PitLane.movimientoReducido())) {
        cuerpo.classList.remove('recien-ordenado');
        void cuerpo.offsetWidth;
        cuerpo.classList.add('recien-ordenado');
      }

      anuncio.textContent =
        'Tabla ordenada por ' + th.getAttribute('data-nombre') + ', ' +
        (direccion === 'ascending'
          ? (tipo === 'numero' ? 'de menor a mayor.' : 'de la A a la Z.')
          : (tipo === 'numero' ? 'de mayor a menor.' : 'de la Z a la A.'));
    }

    encabezados.forEach(function (th, indice) {
      var nombre = th.textContent.trim();
      th.setAttribute('data-nombre', nombre);
      th.classList.add('ordenable');

      var boton = document.createElement('button');
      boton.type = 'button';
      boton.className = 'orden-boton';
      boton.textContent = nombre;
      var icono = document.createElement('span');
      icono.className = 'orden-icono';
      icono.setAttribute('aria-hidden', 'true');
      boton.appendChild(icono);

      th.textContent = '';
      th.appendChild(boton);

      boton.addEventListener('click', function () {
        var actual = th.getAttribute('aria-sort');
        var inicial = th.getAttribute('data-orden-inicial') === 'descendente' ? 'descending' : 'ascending';
        var direccion = actual ? (actual === 'ascending' ? 'descending' : 'ascending') : inicial;
        ordenar(indice, direccion);
      });
    });

    // Estado inicial: la tabla ya viene ordenada por la primera columna (posición)
    encabezados[0].setAttribute('aria-sort', 'ascending');
  }

  document.querySelectorAll('table[data-ordenable]').forEach(function (tabla) {
    if (tabla.tHead && tabla.tBodies.length) prepararTabla(tabla);
  });
})();
