/* Favoritos: lee las preferencias guardadas (página Preferencias) y las refleja en el sitio.
   - Resalta tu piloto ([data-piloto]) y tu escudería ([data-escuderia]) en Pilotos, Clasificación,
     Escuderías y Resumen del GP.
   - Muestra un saludo con tu perfil al final de la barra lateral (también en el menú móvil).
   - Usa el "color de acento del panel" para el anillo de resaltado. */
(function () {
  'use strict';

  var PitLane = (window.PitLane = window.PitLane || {});
  if (!PitLane.almacen) return;

  var COLOR_VALIDO = /^#[0-9a-f]{6}$/i;

  function limpiar() {
    document.querySelectorAll('.marca-favorito').forEach(function (marca) {
      marca.remove();
    });
    document.querySelectorAll('.es-favorito, .fila-favorita, .escuderia-favorita').forEach(function (elemento) {
      elemento.classList.remove('es-favorito', 'fila-favorita', 'escuderia-favorita');
    });
    var perfil = document.querySelector('.sidebar-perfil');
    if (perfil) perfil.remove();
    document.documentElement.style.removeProperty('--color-favorito');
  }

  function crearMarca(texto) {
    var marca = document.createElement('span');
    marca.className = 'marca-favorito';
    marca.textContent = texto;
    return marca;
  }

  function resaltarPiloto(clave) {
    document.querySelectorAll('[data-piloto="' + clave + '"]').forEach(function (elemento) {
      var marca = crearMarca('Tu piloto');
      if (elemento.tagName === 'TD') {
        var fila = elemento.closest('tr');
        if (fila) fila.classList.add('fila-favorita');
        elemento.appendChild(marca);
        return;
      }
      elemento.classList.add('es-favorito');
      var destino = elemento.querySelector('.parrilla-datos') || elemento;
      destino.appendChild(marca);
    });
  }

  function resaltarEscuderia(clave) {
    document.querySelectorAll('[data-escuderia="' + clave + '"]').forEach(function (elemento) {
      if (elemento.tagName === 'TD') {
        // En tablas basta un punto de color; el texto oculto lo anuncia a los lectores de pantalla
        elemento.classList.add('escuderia-favorita');
        var oculto = document.createElement('span');
        oculto.className = 'marca-favorito sr-only';
        oculto.textContent = ' (tu escudería)';
        elemento.appendChild(oculto);
        return;
      }
      elemento.classList.add('es-favorito');
      elemento.appendChild(crearMarca('Tu escudería'));
    });
  }

  function crearPerfil(pref) {
    var barra = document.getElementById('menu-lateral');
    if (!barra) return;

    var nombre = (pref.nombre || '').trim();
    var datos = [pref.pilotoNombre, pref.escuderiaNombre].filter(Boolean).join(' · ');
    if (!nombre && !datos && !pref.foto) return;

    var enlace = document.createElement('a');
    enlace.className = 'sidebar-perfil';
    enlace.href = 'preferencias.html';

    var avatar;
    if (pref.foto && /^data:image\/(jpeg|png|webp);base64,/.test(pref.foto)) {
      avatar = document.createElement('img');
      avatar.src = pref.foto;
      avatar.alt = '';
      avatar.width = 40;
      avatar.height = 40;
    } else {
      avatar = document.createElement('span');
      avatar.setAttribute('aria-hidden', 'true');
      avatar.textContent = (nombre || 'F').charAt(0).toUpperCase();
    }
    avatar.className = 'sidebar-perfil-foto';

    var texto = document.createElement('span');
    texto.className = 'sidebar-perfil-texto';

    var saludo = document.createElement('span');
    saludo.className = 'sidebar-perfil-saludo';
    saludo.textContent = 'Hola, ' + (nombre || 'fan');

    var detalle = document.createElement('span');
    detalle.className = 'sidebar-perfil-datos';
    detalle.textContent = datos ? 'Tus favoritos: ' + datos : 'Editar preferencias';

    var accion = document.createElement('span');
    accion.className = 'sr-only';
    accion.textContent = '. Editar preferencias';

    texto.appendChild(saludo);
    texto.appendChild(detalle);
    if (datos) texto.appendChild(accion);
    enlace.appendChild(avatar);
    enlace.appendChild(texto);
    barra.appendChild(enlace);
  }

  function aplicar() {
    limpiar();
    var pref = PitLane.almacen.leer(PitLane.CLAVES.preferencias);
    if (!pref || typeof pref !== 'object') return;

    if (pref.color && COLOR_VALIDO.test(pref.color)) {
      document.documentElement.style.setProperty('--color-favorito', pref.color);
    }
    if (pref.piloto && /^[a-z]+$/.test(pref.piloto)) resaltarPiloto(pref.piloto);
    if (pref.escuderia && /^[a-z]+$/.test(pref.escuderia)) resaltarEscuderia(pref.escuderia);
    crearPerfil(pref);
  }

  PitLane.favoritos = { aplicar: aplicar };
  aplicar();
})();
