const TRADUCCIONES = {
  es: {
    a11y_brillo_ayuda: 'Ajusta la luminosidad de Mi Jardín. El brillo físico se cambia desde el Centro de control del iPhone.',
    menu_titulo: 'Menú', menu_identificar: 'Identificar plantas', menu_historial: 'Historial de cuidados', menu_perfil: 'Perfil', menu_sonidos: 'Sonidos y alertas', menu_datos: 'Datos entre dispositivos', menu_idioma: 'Idioma', menu_salir: 'Cerrar sesión', volver: 'Volver al menú', volverPerfil: 'Volver a Perfil',
    perfil_apariencia_categoria: 'Apariencia', perfil_cuenta_categoria: 'Información personal', perfil_respaldo_categoria: 'Respaldo de mi jardín',
    perfil_titulo: 'Mi Perfil', perfil_nombre: 'Nombre:', perfil_correo: 'Correo:', perfil_plantas: 'Plantas registradas:',
    sonido_titulo: 'Tono de recordatorio', sonido_desc: 'Elige cómo sonarán las alertas de riego en este dispositivo.', sonido_ninguno: 'Ninguno (Silencio)', sonido_digital: 'Digital', sonido_suave: 'Suave', sonido_campana: 'Campana', sonido_probar: 'Probar sonido',
    sync_titulo: 'Datos entre dispositivos', sync_desc: 'Sincroniza tu colección de plantas y cuidados con la nube cuando tengas conexión.', sync_boton: 'Sincronizar ahora', idioma_titulo: 'Idioma de la aplicación', menu_accesibilidad: 'Accesibilidad', a11y_titulo: 'Accesibilidad', a11y_intro: 'Personaliza la lectura y la apariencia de la aplicación.', a11y_brillo: 'Brillo', a11y_fuente: 'Tipo de letra', a11y_fuente_estandar: 'Estándar', a11y_fuente_legible: 'Alta legibilidad', a11y_fuente_espaciada: 'Espaciada', a11y_tamano: 'Tamaño de letra', a11y_normal: 'Normal', a11y_grande: 'Grande', a11y_extra: 'Extra grande', a11y_negritas: 'Negritas', a11y_contraste: 'Alto contraste', a11y_sonidos: 'Sonidos', a11y_narrador: 'Narrador', a11y_probar_sonido: 'Probar sonido', a11y_restablecer: 'Restablecer valores',
  },
  en: {
    a11y_brillo_ayuda: 'Adjusts Mi Jardín brightness. Physical brightness is changed from iPhone Control Center.',
    menu_titulo: 'Menu', menu_identificar: 'Identify plants', menu_historial: 'Care history', menu_perfil: 'Profile', menu_sonidos: 'Sounds & alerts', menu_datos: 'Cross-device data', menu_idioma: 'Language', menu_salir: 'Log out', volver: 'Back to menu', volverPerfil: 'Back to Profile',
    perfil_apariencia_categoria: 'Appearance', perfil_cuenta_categoria: 'Personal information', perfil_respaldo_categoria: 'Garden backup',
    perfil_titulo: 'My Profile', perfil_nombre: 'Name:', perfil_correo: 'Email:', perfil_plantas: 'Registered plants:',
    sonido_titulo: 'Reminder tone', sonido_desc: 'Choose how watering alerts sound on this device.', sonido_ninguno: 'None (Mute)', sonido_digital: 'Digital', sonido_suave: 'Soft', sonido_campana: 'Bell', sonido_probar: 'Test sound',
    sync_titulo: 'Cross-device data', sync_desc: 'Sync your plant collection and care logs with the cloud when online.', sync_boton: 'Sync now', idioma_titulo: 'App language', menu_accesibilidad: 'Accessibility', a11y_titulo: 'Accessibility', a11y_intro: 'Customize how the app looks and reads.', a11y_brillo: 'Brightness', a11y_fuente: 'Font', a11y_fuente_estandar: 'Standard', a11y_fuente_legible: 'High readability', a11y_fuente_espaciada: 'Spaced', a11y_tamano: 'Text size', a11y_normal: 'Normal', a11y_grande: 'Large', a11y_extra: 'Extra large', a11y_negritas: 'Bold text', a11y_contraste: 'High contrast', a11y_sonidos: 'Sounds', a11y_narrador: 'Screen reader', a11y_probar_sonido: 'Test sound', a11y_restablecer: 'Reset values',
  },
};

export function reproducirTono(tipo) {
  if (!tipo || tipo === 'ninguno') return;
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return;
  const ctx = new AudioCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  const ahora = ctx.currentTime;
  if (tipo === 'digital') {
    osc.type = 'square'; osc.frequency.setValueAtTime(880, ahora); osc.frequency.setValueAtTime(1174, ahora + 0.12);
    gain.gain.setValueAtTime(0.08, ahora); gain.gain.exponentialRampToValueAtTime(0.001, ahora + 0.3); osc.start(ahora); osc.stop(ahora + 0.3);
  } else if (tipo === 'suave') {
    osc.type = 'sine'; osc.frequency.setValueAtTime(440, ahora); osc.frequency.exponentialRampToValueAtTime(554, ahora + 0.35);
    gain.gain.setValueAtTime(0.15, ahora); gain.gain.exponentialRampToValueAtTime(0.001, ahora + 0.45); osc.start(ahora); osc.stop(ahora + 0.45);
  } else if (tipo === 'campana') {
    osc.type = 'triangle'; osc.frequency.setValueAtTime(1046.5, ahora);
    gain.gain.setValueAtTime(0.25, ahora); gain.gain.exponentialRampToValueAtTime(0.001, ahora + 0.8); osc.start(ahora); osc.stop(ahora + 0.8);
  }
  osc.onended = () => { void ctx.close(); };
}

function renderizarIdiomaMenu(idioma) {
  const lang = TRADUCCIONES[idioma] ? idioma : 'es';
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const clave = el.getAttribute('data-i18n');
    if (TRADUCCIONES[lang][clave]) el.textContent = TRADUCCIONES[lang][clave];
  });
  document.querySelectorAll('[data-i18n-aria-label]').forEach((el) => {
    const clave = el.getAttribute('data-i18n-aria-label');
    if (TRADUCCIONES[lang][clave]) {
      el.setAttribute('aria-label', TRADUCCIONES[lang][clave]);
      el.title = TRADUCCIONES[lang][clave];
    }
  });
}

export function aplicarIdioma(idioma) {
  const lang = TRADUCCIONES[idioma] ? idioma : 'es';
  localStorage.setItem('mi_jardin_idioma', lang);
  localStorage.setItem('mi-jardin-language', lang);
  document.documentElement.lang = lang;
  renderizarIdiomaMenu(lang);
  document.dispatchEvent(new CustomEvent('mi-jardin-language-change', { detail: { language: lang } }));
}

document.addEventListener('mi-jardin-language-change', (evento) => renderizarIdiomaMenu(evento.detail?.language));

export function inicializarMenuYPreferencias({ onSincronizarManual, onCerrarSesion } = {}) {
  const listaPrincipal = document.getElementById('menu-lista-principal');
  const subvistas = document.querySelectorAll('.subvista');
  if (!listaPrincipal) return;

  document.querySelector('[data-vista="menu"]')?.addEventListener('click', () => {
    subvistas.forEach((subvista) => subvista.classList.add('oculto'));
    listaPrincipal.classList.remove('oculto');
    localStorage.removeItem('mi-jardin-menu-subvista');
  });

  document.querySelectorAll('.menu-fila[data-subvista]').forEach((btn) => {
    btn.onclick = () => {
      listaPrincipal.classList.add('oculto');
      subvistas.forEach((subvista) => subvista.classList.add('oculto'));
      document.getElementById(btn.dataset.subvista)?.classList.remove('oculto');
      localStorage.setItem('mi-jardin-menu-subvista', btn.dataset.subvista);
    };
  });
  document.querySelectorAll('[data-volver]').forEach((btn) => {
    btn.onclick = () => {
      subvistas.forEach((subvista) => subvista.classList.add('oculto'));
      const destino = btn.dataset.volver || 'menu-lista-principal';
      if (destino === 'menu-lista-principal') listaPrincipal.classList.remove('oculto');
      else document.getElementById(destino)?.classList.remove('oculto');
      if (destino === 'menu-lista-principal') localStorage.removeItem('mi-jardin-menu-subvista');
      else localStorage.setItem('mi-jardin-menu-subvista', destino);
    };
  });

  const subvistaGuardada = localStorage.getItem('mi-jardin-menu-subvista');
  if (subvistaGuardada && document.getElementById(subvistaGuardada)) {
    listaPrincipal.classList.add('oculto');
    subvistas.forEach((subvista) => subvista.classList.toggle('oculto', subvista.id !== subvistaGuardada));
  }

  const selectSonido = document.getElementById('select-sonido');
  const estadoSonido = document.getElementById('estado-sonido');
  if (selectSonido) {
    const tonoGuardado = localStorage.getItem('mi_jardin_sonido');
    selectSonido.value = ['ninguno', 'digital', 'suave', 'campana'].includes(tonoGuardado) ? tonoGuardado : 'suave';
    selectSonido.onchange = () => {
      localStorage.setItem('mi_jardin_sonido', selectSonido.value);
      if (estadoSonido) {
        estadoSonido.textContent = document.documentElement.lang === 'en' ? '✓ Saved on this device' : '✓ Preferencia guardada en este dispositivo';
        setTimeout(() => { estadoSonido.textContent = ''; }, 2000);
      }
    };
  }
  document.getElementById('btn-probar-sonido')?.addEventListener('click', () => reproducirTono(selectSonido?.value));

  const btnSync = document.getElementById('btn-sincronizar-ahora');
  const resultadoSync = document.getElementById('resultado-sync');
  if (btnSync) btnSync.onclick = async () => {
    const en = document.documentElement.lang === 'en';
    if (!navigator.onLine) {
      if (resultadoSync) resultadoSync.textContent = en ? '⚠️ No internet connection.' : '⚠️ Sin conexión a internet.';
      return;
    }
    btnSync.disabled = true;
    if (resultadoSync) resultadoSync.textContent = en ? 'Syncing collection and care records...' : 'Sincronizando colección y cuidados...';
    try {
      if (onSincronizarManual) await onSincronizarManual();
      if (resultadoSync) resultadoSync.textContent = en ? `✅ Synced (${new Date().toLocaleTimeString()})` : `✅ Sincronizado (${new Date().toLocaleTimeString()})`;
    } catch (err) {
      if (resultadoSync) resultadoSync.textContent = `❌ ${en ? 'Error' : 'Error'}: ${err.message}`;
    } finally { btnSync.disabled = false; }
  };

  const selectIdioma = document.getElementById('select-idioma');
  if (selectIdioma) {
    const idioma = localStorage.getItem('mi_jardin_idioma') || localStorage.getItem('mi-jardin-language') || 'es';
    selectIdioma.value = idioma;
    aplicarIdioma(idioma);
    selectIdioma.onchange = () => aplicarIdioma(selectIdioma.value);
  }
  const btnSalir = document.getElementById('btn-menu-salir');
  if (btnSalir && onCerrarSesion) btnSalir.onclick = onCerrarSesion;
}
