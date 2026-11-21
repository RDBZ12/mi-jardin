import { isSupabaseConfigured, supabase } from '../supabase.js';

const form = document.querySelector('#auth-form');
const loginView = document.querySelector('#auth-login-view');
const verifyView = document.querySelector('#verify-view');
const verifyForm = document.querySelector('#verify-form');
const verifyCodeInput = document.querySelector('#verify-code');
const verifyMessage = document.querySelector('#verify-message');
const verifySubmit = document.querySelector('#verify-submit');
const resendCodeButton = document.querySelector('#resend-code');
const resetPasswordView = document.querySelector('#reset-password-view');
const resetPasswordForm = document.querySelector('#reset-password-form');
const resetPasswordInput = document.querySelector('#new-password');
const resetPasswordConfirmInput = document.querySelector('#new-password-confirm');
const resetPasswordMessage = document.querySelector('#reset-password-message');
const resetPasswordSubmit = document.querySelector('#reset-password-submit');
const nameField = document.querySelector('#name-field');
const usernameInput = document.querySelector('#signup-username');
const passwordInput = document.querySelector('#password');
const confirmPasswordField = document.querySelector('#confirm-password-field');
const confirmPasswordInput = document.querySelector('#confirm-password');
const submitButton = document.querySelector('#submit-button');
const message = document.querySelector('#message');
const configNotice = document.querySelector('#config-notice');
const title = document.querySelector('#form-title');
const intro = document.querySelector('#form-intro');
const languageToggles = [...document.querySelectorAll('#language-toggle, #language-toggle-app')];
const themeToggles = [...document.querySelectorAll('#theme-toggle, #theme-toggle-app')];
const passwordToggle = document.querySelector('#password-toggle');
const confirmPasswordToggle = document.querySelector('#confirm-password-toggle');
const forgotButton = document.querySelector('#forgot-button');
const googleButton = document.querySelector('#google-button');
const modeToggle = document.querySelector('#mode-toggle');
const translations = {
  es: {
    loginTitle: 'Bienvenido de nuevo', loginIntro: 'Tus plantas te esperan.',
    signupTitle: 'Crea tu cuenta', signupIntro: 'Empieza a cuidar tu jardín.',
    username: 'Usuario', email: 'Correo electrónico', password: 'Contraseña', confirmPassword: 'Confirmar contraseña',
    login: 'Iniciar sesión', signup: 'Registrarme', forgot: '¿Olvidaste tu contraseña?',
    divider: 'o continúa con', google: 'Google',
    footerLogin: '¿No tienes cuenta?', footerSignup: '¿Ya tienes cuenta?', register: 'Regístrate', backLogin: 'Inicia sesión',
    missingConfig: 'Falta conectar Supabase. Sustituye los valores de ejemplo en mi-jardin/.env y reinicia Vite.',
    missingEmail: 'Escribe tu correo para enviarte el enlace de recuperación.',
    invalidEmail: 'Escribe un correo electrónico válido.', missingUsername: 'Escribe un nombre de usuario.',
    invalidUsername: 'El usuario debe tener entre 3 y 20 caracteres: letras, números, punto, guion o guion bajo.',
    missingPassword: 'Escribe tu contraseña.', shortPassword: 'La contraseña debe tener al menos 6 caracteres.',
    passwordMismatch: 'Las contraseñas no coinciden.',
    usernameHint: '3–20 caracteres: letras, números, punto, guion o guion bajo.',
    usernameShort: 'Te faltan {count} caracteres como mínimo.', usernameShortOne: 'Te falta {count} carácter como mínimo.',
    usernameCharacters: 'Usa solo letras, números, punto, guion o guion bajo.',
    usernameValid: 'Usuario válido.', passwordHint: 'Mínimo 6 caracteres.',
    passwordShort: 'Te faltan {count} caracteres.', passwordShortOne: 'Te falta {count} carácter.', passwordValid: 'Contraseña lista.',
    confirmHint: 'Vuelve a escribir la contraseña.', confirmMismatch: 'Aún no coinciden.', confirmValid: 'Las contraseñas coinciden.',
    resetSent: 'Si el correo está registrado, recibirás un enlace para restablecer la contraseña.',
    accountReady: 'Tu cuenta está lista. Ya puedes empezar a cuidar tu jardín.',
    confirmEmail: 'Cuenta creada. Revisa tu correo para confirmar la dirección antes de iniciar sesión.',
    verifyTitle: 'Verifica tu correo', verifyIntro: 'Escribe el código que recibiste por correo.',
    verifyNotice: 'Si el correo permite el registro, recibirás un código. Revisa también Spam.',
    verifyCode: 'Código de verificación', verifyButton: 'Verificar correo', verifying: 'Verificando…',
    recoveryCodeTitle: 'Introduce el código', recoveryCodeIntro: 'Escribe el código de recuperación recibido.',
    recoveryNotice: 'Si existe una cuenta con ese correo, recibirás un código.',
    resendCode: 'Reenviar código', resendingCode: 'Reenviando…', codeSent: 'Enviamos otro código. Revisa tu correo y Spam.',
    enterCode: 'Escribe el código de 6 dígitos.', invalidCode: 'El código debe tener exactamente 6 dígitos.',
    backToLogin: 'Volver al inicio de sesión',
    resetPasswordTitle: 'Nueva contraseña', resetPasswordIntro: 'Elige una contraseña de al menos 6 caracteres.',
    newPassword: 'Nueva contraseña', resetPasswordButton: 'Guardar contraseña', savingPassword: 'Guardando…',
    shortResetPassword: 'La contraseña debe tener al menos 6 caracteres.',
    resetPasswordMismatch: 'Las contraseñas no coinciden.',
    signedIn: 'Sesión iniciada correctamente.',
    requestError: 'No se pudo completar la solicitud. Inténtalo de nuevo.',
    creating: 'Creando cuenta…', signingIn: 'Ingresando…', sending: 'Enviando…',
    showPassword: 'Mostrar contraseña', hidePassword: 'Ocultar contraseña',
    theme: 'Cambiar tema', language: 'Cambiar idioma',
  },
  en: {
    loginTitle: 'Welcome back', loginIntro: 'Your plants are waiting for you.',
    signupTitle: 'Create your account', signupIntro: 'Start taking care of your garden.',
    username: 'Username', email: 'Email address', password: 'Password', confirmPassword: 'Confirm password',
    login: 'Sign in', signup: 'Create account', forgot: 'Forgot your password?',
    divider: 'or continue with', google: 'Google',
    footerLogin: "Don't have an account?", footerSignup: 'Already have an account?', register: 'Sign up', backLogin: 'Sign in',
    missingConfig: 'Supabase is not connected. Replace the sample values in mi-jardin/.env and restart Vite.',
    missingEmail: 'Enter your email to receive a password reset link.',
    invalidEmail: 'Enter a valid email address.', missingUsername: 'Enter a username.',
    invalidUsername: 'Use 3 to 20 characters: letters, numbers, dots, hyphens, or underscores.',
    missingPassword: 'Enter your password.', shortPassword: 'Password must be at least 6 characters.',
    passwordMismatch: 'Passwords do not match.',
    usernameHint: '3–20 characters: letters, numbers, dots, hyphens, or underscores.',
    usernameShort: '{count} more characters needed.', usernameShortOne: '{count} more character needed.',
    usernameCharacters: 'Use only letters, numbers, dots, hyphens, or underscores.',
    usernameValid: 'Username looks good.', passwordHint: 'At least 6 characters.',
    passwordShort: '{count} more characters needed.', passwordShortOne: '{count} more character needed.', passwordValid: 'Password looks good.',
    confirmHint: 'Enter your password again.', confirmMismatch: 'They do not match yet.', confirmValid: 'Passwords match.',
    resetSent: 'If that email is registered, you will receive a password reset link.',
    accountReady: 'Your account is ready. You can start caring for your garden.',
    confirmEmail: 'Account created. Check your email to confirm your address before signing in.',
    verifyTitle: 'Verify your email', verifyIntro: 'Enter the code sent to your email.',
    verifyNotice: 'If this address can sign up, a code will arrive by email. Check spam too.',
    verifyCode: 'Verification code', verifyButton: 'Verify email', verifying: 'Verifying…',
    recoveryCodeTitle: 'Enter the code', recoveryCodeIntro: 'Enter the recovery code sent to your email.',
    recoveryNotice: 'If an account exists for this email, a code will arrive.',
    resendCode: 'Resend code', resendingCode: 'Sending…', codeSent: 'We sent another code. Check your email and spam.',
    enterCode: 'Enter the 6-digit code.', invalidCode: 'The code must contain exactly 6 digits.',
    backToLogin: 'Back to sign in',
    resetPasswordTitle: 'New password', resetPasswordIntro: 'Choose a password with at least 6 characters.',
    newPassword: 'New password', resetPasswordButton: 'Save password', savingPassword: 'Saving…',
    shortResetPassword: 'Password must be at least 6 characters.',
    resetPasswordMismatch: 'Passwords do not match.',
    signedIn: 'You are signed in.',
    requestError: 'The request could not be completed. Please try again.',
    creating: 'Creating account…', signingIn: 'Signing in…', sending: 'Sending…',
    showPassword: 'Show password', hidePassword: 'Hide password',
    theme: 'Toggle theme', language: 'Change language',
  },
};

let mode = 'login';
let language = localStorage.getItem('mi-jardin-language') || 'es';
let themePreference = localStorage.getItem('mi-jardin-theme-preference') || 'light';
let verificationEmail = '';
let verificationType = 'signup';
let restablecimientoEnCurso = false;

configNotice.hidden = isSupabaseConfigured;
if (!isSupabaseConfigured) configNotice.textContent = translations[language].missingConfig;

function renderCopy() {
  const copy = translations[language];
  const isSignup = mode === 'signup';
  document.documentElement.lang = language;
  title.textContent = isSignup ? copy.signupTitle : copy.loginTitle;
  intro.textContent = isSignup ? copy.signupIntro : copy.loginIntro;
  document.querySelector('#name-label').textContent = copy.username;
  document.querySelector('#email-label').textContent = copy.email;
  document.querySelector('#password-label').textContent = copy.password;
  document.querySelector('#confirm-password-label').textContent = copy.confirmPassword;
  document.querySelector('#verify-title').textContent = verificationType === 'recovery' ? copy.recoveryCodeTitle : copy.verifyTitle;
  document.querySelector('#verify-intro').textContent = verificationType === 'recovery' ? copy.recoveryCodeIntro : copy.verifyIntro;
  document.querySelector('#verify-notice').textContent = verificationType === 'recovery' ? copy.recoveryNotice : copy.verifyNotice;
  document.querySelector('#verify-code-label').textContent = copy.verifyCode;
  document.querySelector('#verify-submit').textContent = copy.verifyButton;
  document.querySelector('#resend-code').textContent = copy.resendCode;
  document.querySelector('#verify-back').textContent = copy.backToLogin;
  document.querySelector('#reset-password-title').textContent = copy.resetPasswordTitle;
  document.querySelector('#reset-password-intro').textContent = copy.resetPasswordIntro;
  document.querySelector('#new-password-label').textContent = copy.newPassword;
  document.querySelector('#new-password-confirm-label').textContent = copy.confirmPassword;
  document.querySelector('#reset-password-submit').textContent = copy.resetPasswordButton;
  document.querySelector('#submit-button').textContent = isSignup ? copy.signup : copy.login;
  document.querySelector('#forgot-button').textContent = copy.forgot;
  document.querySelector('#separator-label').textContent = copy.divider;
  document.querySelector('#google-label').textContent = copy.google;
  document.querySelector('#footer-prompt').textContent = isSignup ? copy.footerSignup : copy.footerLogin;
  modeToggle.textContent = isSignup ? copy.backLogin : copy.register;
  for (const toggle of languageToggles) {
    toggle.textContent = language === 'es' ? 'EN' : 'ES';
    toggle.setAttribute('aria-label', copy.language);
  }
  for (const toggle of themeToggles) {
    toggle.setAttribute('aria-label', copy.theme);
    toggle.title = copy.theme;
    const icon = toggle.querySelector('.theme-icon');
    if (icon) icon.textContent = document.body.dataset.theme === 'dark' ? '☼' : '☾';
  }
  passwordToggle.setAttribute('aria-label', passwordInput.type === 'password' ? copy.showPassword : copy.hidePassword);
  passwordToggle.title = passwordToggle.getAttribute('aria-label');
  confirmPasswordToggle.setAttribute('aria-label', confirmPasswordInput.type === 'password' ? copy.showPassword : copy.hidePassword);
  confirmPasswordToggle.title = confirmPasswordToggle.getAttribute('aria-label');
  document.querySelector('#new-password-toggle').setAttribute('aria-label', resetPasswordInput.type === 'password' ? copy.showPassword : copy.hidePassword);
  document.querySelector('#new-password-confirm-toggle').setAttribute('aria-label', resetPasswordConfirmInput.type === 'password' ? copy.showPassword : copy.hidePassword);
  document.querySelector('#new-password-toggle').title = document.querySelector('#new-password-toggle').getAttribute('aria-label');
  document.querySelector('#new-password-confirm-toggle').title = document.querySelector('#new-password-confirm-toggle').getAttribute('aria-label');
  if (!isSupabaseConfigured) configNotice.textContent = copy.missingConfig;
  actualizarValidacionesRegistro();
}

function aplicarPreferenciaTema(preferencia = themePreference) {
  themePreference = ['light', 'dark', 'system'].includes(preferencia) ? preferencia : 'light';
  localStorage.setItem('mi-jardin-theme-preference', themePreference);
  const sistemaOscuro = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
  const temaAplicado = themePreference === 'system' ? sistemaOscuro ? 'dark' : 'light' : themePreference;
  document.documentElement.dataset.theme = temaAplicado;
  document.body.dataset.theme = temaAplicado;
}

function actualizarAyudaCampo(id, texto, estado) {
  const ayuda = document.querySelector(id);
  ayuda.textContent = texto;
  ayuda.dataset.state = estado;
}

function actualizarValidacionesRegistro() {
  const copy = translations[language];
  const username = usernameInput.value.trim();
  if (!username) {
    actualizarAyudaCampo('#username-feedback', copy.usernameHint, 'neutral');
  } else if (username.length < 3) {
    const faltan = 3 - username.length;
    const texto = faltan === 1 ? copy.usernameShortOne : copy.usernameShort;
    actualizarAyudaCampo('#username-feedback', texto.replace('{count}', String(faltan)), 'invalid');
  } else if (!/^[a-zA-Z0-9._-]+$/.test(username)) {
    actualizarAyudaCampo('#username-feedback', copy.usernameCharacters, 'invalid');
  } else {
    actualizarAyudaCampo('#username-feedback', copy.usernameValid, 'valid');
  }

  if (!passwordInput.value) {
    actualizarAyudaCampo('#password-feedback', copy.passwordHint, 'neutral');
  } else if (passwordInput.value.length < 6) {
    const faltan = 6 - passwordInput.value.length;
    const texto = faltan === 1 ? copy.passwordShortOne : copy.passwordShort;
    actualizarAyudaCampo('#password-feedback', texto.replace('{count}', String(faltan)), 'invalid');
  } else {
    actualizarAyudaCampo('#password-feedback', copy.passwordValid, 'valid');
  }

  if (!confirmPasswordInput.value) {
    actualizarAyudaCampo('#confirm-password-feedback', copy.confirmHint, 'neutral');
  } else if (confirmPasswordInput.value !== passwordInput.value) {
    actualizarAyudaCampo('#confirm-password-feedback', copy.confirmMismatch, 'invalid');
  } else {
    actualizarAyudaCampo('#confirm-password-feedback', copy.confirmValid, 'valid');
  }
}

function setMode(nextMode) {
  mode = nextMode;
  const isSignup = mode === 'signup';
  nameField.hidden = !isSignup;
  usernameInput.required = isSignup;
  confirmPasswordField.hidden = !isSignup;
  confirmPasswordInput.required = isSignup;
  passwordInput.autocomplete = isSignup ? 'new-password' : 'current-password';
  passwordInput.type = 'password';
  confirmPasswordInput.type = 'password';
  if (!isSignup) confirmPasswordInput.value = '';
  document.querySelector('#forgot-row').hidden = isSignup;
  renderCopy();
  message.textContent = '';
  message.removeAttribute('data-error');
}

modeToggle.addEventListener('click', () => setMode(mode === 'login' ? 'signup' : 'login'));
languageToggles.forEach((toggle) => toggle.addEventListener('click', () => {
  language = language === 'es' ? 'en' : 'es';
  localStorage.setItem('mi-jardin-language', language);
  renderCopy();
  document.dispatchEvent(new CustomEvent('mi-jardin-language-change', { detail: { language } }));
}));

document.addEventListener('mi-jardin-language-change', (evento) => {
  if (!['es', 'en'].includes(evento.detail?.language)) return;
  language = evento.detail.language;
  localStorage.setItem('mi-jardin-language', language);
  renderCopy();
});

themeToggles.forEach((toggle) => toggle.addEventListener('click', () => {
  const preference = document.body.dataset.theme === 'light' ? 'dark' : 'light';
  aplicarPreferenciaTema(preference);
  renderCopy();
  document.dispatchEvent(new CustomEvent('mi-jardin-theme-change', { detail: { theme: preference } }));
}));

document.addEventListener('mi-jardin-theme-change', (evento) => {
  aplicarPreferenciaTema(evento.detail?.theme);
  renderCopy();
});

window.matchMedia?.('(prefers-color-scheme: dark)').addEventListener('change', () => {
  if (themePreference === 'system') {
    aplicarPreferenciaTema('system');
    renderCopy();
  }
});

passwordToggle.addEventListener('click', () => {
  passwordInput.type = passwordInput.type === 'password' ? 'text' : 'password';
  renderCopy();
});

confirmPasswordToggle.addEventListener('click', () => {
  confirmPasswordInput.type = confirmPasswordInput.type === 'password' ? 'text' : 'password';
  renderCopy();
});

usernameInput.addEventListener('input', actualizarValidacionesRegistro);
passwordInput.addEventListener('input', actualizarValidacionesRegistro);
confirmPasswordInput.addEventListener('input', actualizarValidacionesRegistro);

function showMessage(text, isError = false) {
  message.textContent = text;
  if (isError) message.dataset.error = 'true';
  else message.removeAttribute('data-error');
}

function mostrarVerificacion(email, tipo = 'signup') {
  verificationType = tipo;
  restablecimientoEnCurso = tipo === 'recovery';
  loginView.hidden = true;
  verifyView.hidden = false;
  resetPasswordView.hidden = true;
  document.querySelector('#verify-email').textContent = email;
  verifyCodeInput.value = '';
  verifyMessage.textContent = '';
  verifyMessage.removeAttribute('data-error');
  renderCopy();
  verifyCodeInput.focus();
}

document.querySelector('#verify-back').addEventListener('click', () => {
  verifyView.hidden = true;
  resetPasswordView.hidden = true;
  loginView.hidden = false;
  restablecimientoEnCurso = false;
  verificationEmail = '';
  verifyMessage.textContent = '';
  verifyCodeInput.value = '';
  setMode('login');
});

verifyForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const copy = translations[language];
  const token = verifyCodeInput.value.trim();
  verifyMessage.textContent = '';
  verifyMessage.removeAttribute('data-error');

  if (!verificationEmail) {
    verifyMessage.textContent = copy.enterCode;
    verifyMessage.dataset.error = 'true';
    return;
  }
  if (!/^\d{6}$/.test(token)) {
    verifyMessage.textContent = copy.invalidCode;
    verifyMessage.dataset.error = 'true';
    return;
  }
  if (!requireSupabase()) return;

  verifySubmit.disabled = true;
  verifySubmit.textContent = copy.verifying;
  try {
    const { error } = await supabase.auth.verifyOtp({
      email: verificationEmail,
      token,
      type: verificationType,
    });
    if (error) throw error;
    if (verificationType === 'recovery') {
      verifyView.hidden = true;
      resetPasswordView.hidden = false;
      resetPasswordForm.reset();
      resetPasswordMessage.textContent = '';
      resetPasswordInput.focus();
    }
  } catch (error) {
    verifyMessage.textContent = error.message || copy.requestError;
    verifyMessage.dataset.error = 'true';
  } finally {
    verifySubmit.disabled = false;
    verifySubmit.textContent = translations[language].verifyButton;
  }
});

resendCodeButton.addEventListener('click', async () => {
  const copy = translations[language];
  if (!verificationEmail) return;
  if (!requireSupabase()) return;

  resendCodeButton.disabled = true;
  resendCodeButton.textContent = copy.resendingCode;
  verifyMessage.textContent = '';
  verifyMessage.removeAttribute('data-error');
  try {
    const resultado = verificationType === 'recovery'
      ? await supabase.auth.resetPasswordForEmail(verificationEmail, { redirectTo: window.location.origin })
      : await supabase.auth.resend({ type: 'signup', email: verificationEmail });
    const { error } = resultado;
    if (error) throw error;
    verifyMessage.textContent = copy.codeSent;
  } catch (error) {
    verifyMessage.textContent = error.message || copy.requestError;
    verifyMessage.dataset.error = 'true';
  } finally {
    resendCodeButton.disabled = false;
    resendCodeButton.textContent = translations[language].resendCode;
  }
});

document.querySelector('#new-password-toggle').addEventListener('click', () => {
  resetPasswordInput.type = resetPasswordInput.type === 'password' ? 'text' : 'password';
  renderCopy();
});

document.querySelector('#new-password-confirm-toggle').addEventListener('click', () => {
  resetPasswordConfirmInput.type = resetPasswordConfirmInput.type === 'password' ? 'text' : 'password';
  renderCopy();
});

resetPasswordForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const copy = translations[language];
  const password = resetPasswordInput.value;
  resetPasswordMessage.textContent = '';
  resetPasswordMessage.removeAttribute('data-error');

  if (password.length < 6) {
    resetPasswordMessage.textContent = copy.shortResetPassword;
    resetPasswordMessage.dataset.error = 'true';
    return;
  }
  if (password !== resetPasswordConfirmInput.value) {
    resetPasswordMessage.textContent = copy.resetPasswordMismatch;
    resetPasswordMessage.dataset.error = 'true';
    return;
  }
  if (!requireSupabase()) return;

  resetPasswordSubmit.disabled = true;
  resetPasswordSubmit.textContent = copy.savingPassword;
  try {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw error;
    restablecimientoEnCurso = false;
    window.history.replaceState({ vista: 'app' }, '', `${window.location.pathname}${window.location.search}#jardin`);
    window.location.reload();
  } catch (error) {
    resetPasswordMessage.textContent = error.message || copy.requestError;
    resetPasswordMessage.dataset.error = 'true';
  } finally {
    resetPasswordSubmit.disabled = false;
    resetPasswordSubmit.textContent = translations[language].resetPasswordButton;
  }
});

function requireSupabase() {
  if (isSupabaseConfigured) return true;
  configNotice.hidden = false;
  showMessage(translations[language].missingConfig, true);
  return false;
}

document.querySelector('#forgot-button').addEventListener('click', async () => {
  const copy = translations[language];
  const email = document.querySelector('#email').value.trim();
  if (!email) return showMessage(copy.missingEmail, true);
  if (!requireSupabase()) return;

  forgotButton.disabled = true;
  forgotButton.textContent = copy.sending;
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin });
    if (error) throw error;
    verificationEmail = email;
    mostrarVerificacion(email, 'recovery');
  } catch (error) {
    showMessage(error.message || copy.requestError, true);
  } finally {
    forgotButton.disabled = false;
    renderCopy();
  }
});

googleButton.addEventListener('click', async () => {
  if (!requireSupabase()) return;
  try {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
    if (error) throw error;
  } catch (error) {
    showMessage(error.message || translations[language].requestError, true);
  }
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  message.textContent = '';
  message.removeAttribute('data-error');

  const formData = new FormData(form);
  const email = String(formData.get('email')).trim();
  const password = String(formData.get('password'));
  const username = String(formData.get('username') || '').trim();
  const confirmPassword = String(formData.get('confirmPassword') || '');

  if (!email) return showMessage(translations[language].missingEmail, true);
  if (!document.querySelector('#email').checkValidity()) return showMessage(translations[language].invalidEmail, true);
  if (!password) return showMessage(translations[language].missingPassword, true);
  if (mode === 'signup') {
    if (!username) return showMessage(translations[language].missingUsername, true);
    if (!/^[a-zA-Z0-9._-]{3,20}$/.test(username)) return showMessage(translations[language].invalidUsername, true);
    if (password.length < 6) return showMessage(translations[language].shortPassword, true);
    if (password !== confirmPassword) return showMessage(translations[language].passwordMismatch, true);
  }

  if (!requireSupabase()) return;

  submitButton.disabled = true;
  submitButton.textContent = mode === 'signup' ? translations[language].creating : translations[language].signingIn;

  try {
    if (mode === 'signup') {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { username, nombre_completo: username } },
      });
      if (error) throw error;
      if (data.session) {
        showMessage(translations[language].accountReady);
      } else {
        verificationEmail = email;
        mostrarVerificacion(email);
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      showMessage(translations[language].signedIn);
    }
  } catch (error) {
    showMessage(error.message || translations[language].requestError, true);
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = mode === 'signup' ? translations[language].signup : translations[language].login;
  }
});

export function limpiarFormulariosAuth() {
  form.reset();
  verifyForm.reset();
  resetPasswordForm.reset();
  verificationEmail = '';
  verificationType = 'signup';
  restablecimientoEnCurso = false;
  verifyView.hidden = true;
  resetPasswordView.hidden = true;
  loginView.hidden = false;
  setMode('login');
  showMessage('');
  verifyMessage.textContent = '';
  verifyMessage.removeAttribute('data-error');
  resetPasswordMessage.textContent = '';
  resetPasswordMessage.removeAttribute('data-error');
}

export function estaRestableciendoContrasena() {
  return restablecimientoEnCurso;
}

export function inicializarAutenticacion(contexto = {}) {
  aplicarPreferenciaTema(themePreference);
  renderCopy();
  contexto.limpiarFormulariosAuth = limpiarFormulariosAuth;
  return limpiarFormulariosAuth;
}

