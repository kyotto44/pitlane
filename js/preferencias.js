/* Preferencias: guarda tu perfil de fan en este navegador y lo aplica al resto del sitio.
   - Piloto y escudería favoritos: se resaltan en Pilotos, Clasificación, Escuderías y Resumen del GP.
   - Nombre y foto: aparecen en el saludo de la barra lateral.
   - Color de acento: es el color del anillo con el que se resaltan tus favoritos.
   - El buscador sugiere pilotos y escuderías y permite marcarlos como favoritos.
   La contraseña nunca se guarda. */
(function () {
  'use strict';

  var PitLane = window.PitLane;
  var formulario = document.getElementById('form-preferencias');
  if (!PitLane || !PitLane.validacion || !formulario) return;

  var almacen = PitLane.almacen;
  var CLAVE = PitLane.CLAVES.preferencias;
  var campos = formulario.elements;
  var estado = document.getElementById('pref-estado');
  var botonBorrar = document.getElementById('pref-restablecer');

  var salidaVolumen = document.getElementById('pref-volumen-valor');
  var salidaColor = document.getElementById('pref-color-valor');

  var vistaFoto = document.getElementById('pref-foto-vista');
  var imagenFoto = document.getElementById('pref-foto-imagen');
  var botonQuitarFoto = document.getElementById('pref-foto-quitar');
  var fotoActual = null;
  var errorFoto = '';

  var buscador = document.getElementById('pref-buscar');
  var estadoBusqueda = document.getElementById('pref-buscar-estado');
  var resultados = document.getElementById('pref-buscar-resultados');

  var TAMANO_MAXIMO_FOTO = 5 * 1024 * 1024;
  var LADO_FOTO = 128;
  var ANIO_MINIMO = 1950;
  var ANIO_MAXIMO = 2026;

  formulario.noValidate = true;

  /* ---------- Validación ---------- */
  var reglas = {
    correo: function (campo) {
      var valor = campo.value.trim();
      if (valor && !PitLane.validacion.esCorreo(valor)) return 'Revisa el correo: debe tener la forma nombre@dominio.com.';
      return '';
    },
    anio: function (campo) {
      if (campo.validity && campo.validity.badInput) return 'Escribe el año solo con números, por ejemplo 2018.';
      if (campo.value === '') return '';
      var anio = Number(campo.value);
      if (!Number.isInteger(anio) || anio < ANIO_MINIMO || anio > ANIO_MAXIMO) {
        return 'Escribe un año entre ' + ANIO_MINIMO + ' y ' + ANIO_MAXIMO + '.';
      }
      return '';
    },
    fecha: function (campo) {
      if (campo.validity && campo.validity.badInput) return 'Escribe una fecha completa (día, mes y año).';
      return '';
    },
    telefono: function (campo) {
      var valor = campo.value.trim();
      if (!valor) return '';
      var digitos = valor.replace(/\D/g, '').length;
      if (!/^[0-9+()\-\s]+$/.test(valor) || digitos < 7 || digitos > 15) {
        return 'Escribe un teléfono válido, por ejemplo +57 300 000 0000.';
      }
      return '';
    },
    foto: function () {
      return errorFoto;
    }
  };
  PitLane.validacion.revisarAlCorregir(formulario, reglas);

  /* ---------- Valores que se muestran al lado de los controles ---------- */
  function actualizarVolumen() {
    var texto = campos.volumen.value + ' %';
    if (salidaVolumen) salidaVolumen.textContent = texto;
    campos.volumen.setAttribute('aria-valuetext', texto);
  }

  function actualizarColor() {
    if (salidaColor) salidaColor.textContent = campos.color.value.toUpperCase();
  }

  campos.volumen.addEventListener('input', actualizarVolumen);
  campos.color.addEventListener('input', actualizarColor);

  /* ---------- Foto de perfil: se recorta a 128x128 para que quepa en el navegador ---------- */
  function mostrarFoto(datosUrl) {
    fotoActual = datosUrl;
    if (datosUrl) {
      imagenFoto.src = datosUrl;
      vistaFoto.hidden = false;
    } else {
      imagenFoto.removeAttribute('src');
      vistaFoto.hidden = true;
    }
  }

  function procesarFoto(archivo) {
    return new Promise(function (resolver, rechazar) {
      var lector = new FileReader();
      lector.onerror = function () {
        rechazar(new Error('lectura'));
      };
      lector.onload = function () {
        var imagen = new Image();
        imagen.onerror = function () {
          rechazar(new Error('imagen'));
        };
        imagen.onload = function () {
          var lado = Math.min(imagen.naturalWidth, imagen.naturalHeight);
          var lienzo = document.createElement('canvas');
          lienzo.width = LADO_FOTO;
          lienzo.height = LADO_FOTO;
          var contexto = lienzo.getContext('2d');
          contexto.drawImage(
            imagen,
            (imagen.naturalWidth - lado) / 2,
            (imagen.naturalHeight - lado) / 2,
            lado,
            lado,
            0,
            0,
            LADO_FOTO,
            LADO_FOTO
          );
          resolver(lienzo.toDataURL('image/jpeg', 0.82));
        };
        imagen.src = lector.result;
      };
      lector.readAsDataURL(archivo);
    });
  }

  campos.foto.addEventListener('change', function () {
    var archivo = campos.foto.files && campos.foto.files[0];
    errorFoto = '';
    if (!archivo) {
      PitLane.validacion.limpiarError(campos.foto);
      return;
    }
    if (!/^image\/(jpeg|png|webp)$/.test(archivo.type)) {
      errorFoto = 'La foto debe ser una imagen JPG, PNG o WebP.';
    } else if (archivo.size > TAMANO_MAXIMO_FOTO) {
      errorFoto = 'La foto pesa más de 5 MB. Elige una más liviana.';
    }
    if (errorFoto) {
      campos.foto.value = '';
      PitLane.validacion.mostrarError(campos.foto, errorFoto);
      return;
    }
    PitLane.validacion.limpiarError(campos.foto);
    procesarFoto(archivo)
      .then(mostrarFoto)
      .catch(function () {
        errorFoto = 'No pudimos leer esa imagen. Prueba con otra foto.';
        campos.foto.value = '';
        PitLane.validacion.mostrarError(campos.foto, errorFoto);
      });
  });

  botonQuitarFoto.addEventListener('click', function () {
    campos.foto.value = '';
    errorFoto = '';
    PitLane.validacion.limpiarError(campos.foto);
    mostrarFoto(null);
    campos.foto.focus();
  });

  /* ---------- Buscador de pilotos y escuderías ---------- */
  function candidatos() {
    var lista = [];
    Array.prototype.forEach.call(campos.piloto.options, function (opcion) {
      if (!opcion.value) return;
      var equipo = opcion.getAttribute('data-escuderia') || '';
      lista.push({ tipo: 'piloto', valor: opcion.value, nombre: opcion.textContent.trim(), detalle: 'Piloto · ' + equipo, texto: opcion.textContent + ' ' + equipo });
    });
    Array.prototype.forEach.call(campos.escuderia.options, function (opcion) {
      if (!opcion.value) return;
      lista.push({ tipo: 'escuderia', valor: opcion.value, nombre: opcion.textContent.trim(), detalle: 'Escudería', texto: opcion.textContent });
    });
    return lista;
  }
  var CANDIDATOS = candidatos();

  function marcarSeleccionados() {
    resultados.querySelectorAll('button').forEach(function (boton) {
      var select = boton.getAttribute('data-tipo') === 'piloto' ? campos.piloto : campos.escuderia;
      boton.setAttribute('aria-pressed', String(select.value === boton.getAttribute('data-valor')));
    });
  }

  function buscar() {
    var consulta = PitLane.normalizar(buscador.value);
    resultados.textContent = '';
    if (consulta.length < 2) {
      estadoBusqueda.textContent = consulta.length ? 'Escribe al menos 2 letras.' : '';
      return [];
    }
    var encontrados = CANDIDATOS.filter(function (item) {
      return PitLane.normalizar(item.texto).indexOf(consulta) !== -1;
    }).slice(0, 6);

    if (!encontrados.length) {
      estadoBusqueda.textContent = 'No hay pilotos ni escuderías que coincidan con «' + buscador.value.trim() + '».';
      return [];
    }
    estadoBusqueda.textContent =
      (encontrados.length === 1 ? '1 resultado' : encontrados.length + ' resultados') + '. Elige uno para marcarlo como favorito.';

    encontrados.forEach(function (item) {
      var li = document.createElement('li');
      var boton = document.createElement('button');
      boton.type = 'button';
      boton.setAttribute('data-tipo', item.tipo);
      boton.setAttribute('data-valor', item.valor);
      var nombre = document.createElement('strong');
      nombre.textContent = item.nombre;
      var detalle = document.createElement('span');
      detalle.textContent = item.detalle;
      boton.appendChild(nombre);
      boton.appendChild(detalle);
      li.appendChild(boton);
      resultados.appendChild(li);
    });
    marcarSeleccionados();
    return encontrados;
  }

  function resaltarTarjeta(campo) {
    var tarjeta = campo.closest('.input-card');
    if (!tarjeta) return;
    tarjeta.classList.add('recien-cambiado');
    window.setTimeout(function () {
      tarjeta.classList.remove('recien-cambiado');
    }, 1400);
  }

  function elegir(tipo, valor) {
    var select = tipo === 'piloto' ? campos.piloto : campos.escuderia;
    select.value = valor;
    var nombre = select.options[select.selectedIndex].textContent.trim();
    resaltarTarjeta(select);
    marcarSeleccionados();
    estadoBusqueda.textContent =
      nombre + (tipo === 'piloto' ? ' quedó como tu piloto favorito.' : ' quedó como tu escudería favorita.') +
      ' Guarda las preferencias para verlo resaltado en el sitio.';
  }

  buscador.addEventListener('input', buscar);

  // Enter en el buscador no envía el formulario: si hay un único resultado, lo elige
  buscador.addEventListener('keydown', function (evento) {
    if (evento.key !== 'Enter') return;
    evento.preventDefault();
    var encontrados = buscar();
    if (encontrados.length === 1) elegir(encontrados[0].tipo, encontrados[0].valor);
  });

  resultados.addEventListener('click', function (evento) {
    var boton = evento.target.closest('button[data-tipo]');
    if (boton) elegir(boton.getAttribute('data-tipo'), boton.getAttribute('data-valor'));
  });

  campos.piloto.addEventListener('change', marcarSeleccionados);
  campos.escuderia.addEventListener('change', marcarSeleccionados);

  /* ---------- Guardar, cargar y borrar ---------- */
  function textoOpcion(select) {
    var opcion = select.options[select.selectedIndex];
    return opcion && opcion.value ? opcion.textContent.trim() : '';
  }

  function recoger() {
    var categoria = formulario.querySelector('input[name="categoria"]:checked');
    return {
      nombre: campos.nombre.value.trim(),
      correo: campos.correo.value.trim(),
      anio: campos.anio.value,
      fecha: campos.fecha.value,
      volumen: Number(campos.volumen.value),
      color: campos.color.value,
      foto: fotoActual,
      telefono: campos.telefono.value.trim(),
      categoria: categoria ? categoria.value : 'f1',
      avisoCarrera: campos.avisoCarrera.checked,
      avisoClasificacion: campos.avisoClasificacion.checked,
      piloto: campos.piloto.value,
      pilotoNombre: textoOpcion(campos.piloto),
      escuderia: campos.escuderia.value,
      escuderiaNombre: textoOpcion(campos.escuderia),
      guardado: new Date().toISOString()
    };
  }

  function elegirOpcion(select, valor) {
    if (/^[a-z0-9]+$/.test(valor || '') && select.querySelector('option[value="' + valor + '"]')) select.value = valor;
  }

  function cargar(pref) {
    elegirOpcion(campos.piloto, pref.piloto);
    elegirOpcion(campos.escuderia, pref.escuderia);
    if (typeof pref.nombre === 'string') campos.nombre.value = pref.nombre;
    if (typeof pref.correo === 'string') campos.correo.value = pref.correo;
    if (pref.anio) campos.anio.value = pref.anio;
    if (pref.fecha) campos.fecha.value = pref.fecha;
    if (typeof pref.volumen === 'number') campos.volumen.value = String(pref.volumen);
    if (/^#[0-9a-f]{6}$/i.test(pref.color || '')) campos.color.value = pref.color;
    if (typeof pref.telefono === 'string') campos.telefono.value = pref.telefono;
    var radio = formulario.querySelector('input[name="categoria"][value="' + (pref.categoria === 'f2' ? 'f2' : 'f1') + '"]');
    if (radio) radio.checked = true;
    if (typeof pref.avisoCarrera === 'boolean') campos.avisoCarrera.checked = pref.avisoCarrera;
    if (typeof pref.avisoClasificacion === 'boolean') campos.avisoClasificacion.checked = pref.avisoClasificacion;
    if (pref.foto && /^data:image\/(jpeg|png|webp);base64,/.test(pref.foto)) mostrarFoto(pref.foto);
  }

  function enlace(href, texto) {
    var a = document.createElement('a');
    a.href = href;
    a.textContent = texto;
    return a;
  }

  function avisarGuardado(pref) {
    estado.classList.remove('es-error');
    estado.textContent = '';
    var favoritos = [pref.pilotoNombre, pref.escuderiaNombre].filter(Boolean);
    estado.appendChild(document.createTextNode('Preferencias guardadas en este navegador. '));
    if (favoritos.length) {
      estado.appendChild(
        document.createTextNode('Tus favoritos (' + favoritos.join(' y ') + ') ya se resaltan con tu color en ')
      );
      estado.appendChild(enlace('pilotos.html', 'Pilotos'));
      estado.appendChild(document.createTextNode(', '));
      estado.appendChild(enlace('clasificacion.html', 'Clasificación'));
      estado.appendChild(document.createTextNode(' y '));
      estado.appendChild(enlace('equipos.html', 'Escuderías'));
      estado.appendChild(document.createTextNode('.'));
    } else {
      estado.appendChild(document.createTextNode('Elige un piloto o una escudería favoritos para verlos resaltados en el sitio.'));
    }
  }

  formulario.addEventListener('submit', function (evento) {
    evento.preventDefault();
    if (!PitLane.validacion.validar(formulario, reglas)) {
      estado.classList.add('es-error');
      estado.textContent = 'Revisa los campos marcados en rojo antes de guardar.';
      return;
    }
    var pref = recoger();
    // La contraseña no se guarda nunca; se limpia el campo después de enviar
    campos.contrasena.value = '';

    if (!almacen.guardar(CLAVE, pref)) {
      estado.classList.add('es-error');
      estado.textContent =
        'No pudimos guardar: este navegador bloquea el almacenamiento local (por ejemplo, en una ventana privada).';
      return;
    }
    if (PitLane.favoritos) PitLane.favoritos.aplicar();
    avisarGuardado(pref);
  });

  botonBorrar.addEventListener('click', function () {
    almacen.borrar(CLAVE);
    formulario.reset();
    errorFoto = '';
    formulario.querySelectorAll('[aria-invalid="true"]').forEach(function (campo) {
      PitLane.validacion.limpiarError(campo);
    });
    mostrarFoto(null);
    buscador.value = '';
    buscar();
    actualizarVolumen();
    actualizarColor();
    if (PitLane.favoritos) PitLane.favoritos.aplicar();
    estado.classList.remove('es-error');
    estado.textContent = 'Se borraron tus preferencias de este navegador. Los valores volvieron a los de fábrica.';
  });

  var guardadas = almacen.leer(CLAVE);
  if (guardadas && typeof guardadas === 'object') cargar(guardadas);
  actualizarVolumen();
  actualizarColor();
})();
