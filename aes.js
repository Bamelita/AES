/**
 * Módulo principal de cifrado/descifrado
 * @module CipherModule
 */

// DOM Elements
const elements = {
  messageInput: document.getElementById('message'),
  keyInput: document.getElementById('key'),
  output: document.getElementById('output'),
  algorithmSelect: document.getElementById('algorithm'),
  copyBtn: document.getElementById('copyBtn'),
  clearBtn: document.getElementById('clearBtn'),
  toggleKey: document.getElementById('toggleKey'),
  algorithmInfo: document.getElementById('algorithm-info'),
  encryptBtn: document.getElementById('encryptBtn'),
  decryptBtn: document.getElementById('decryptBtn'),
  swapBtn: document.getElementById('swapBtn'),
  statusMessage: document.getElementById('statusMessage'),
  claveContainer: document.querySelector('.clave-container'),
  themeToggle: document.getElementById('themeToggle')
};

// Configuración global
const CONFIG = {
  algorithmDescriptions: {
    AES: 'AES-256: Estándar avanzado de cifrado. 256-bit. Seguro y rápido.',
    TripleDES: 'Triple DES: 3 pasadas de DES. 168-bit. Más lento pero compatible.',
    Rabbit: 'Rabbit: Cifrado de flujo. Muy rápido para textos largos.',
    RC4: 'RC4: Cifrado de flujo. Simple pero con vulnerabilidades. No usar en producción.',
    Base64: 'Base64: Codificación (no cifrado) a texto ASCII.',
    URL: 'Codificación URL: Para uso en URLs.',
    Hex: 'Hexadecimal: Base 16.',
    Binary: 'Binario: Base 2.'
  },
  algorithmsWithKey: ['AES', 'TripleDES', 'Rabbit', 'RC4'],
  algorithmsWithoutKey: ['Base64', 'URL', 'Hex', 'Binary'],
  keyDerivation: {
    AES: { keySize: 256, iterations: 1000 },
    TripleDES: { keySize: 192, iterations: 1000 }
  }
};

/**
 * Deriva una clave segura a partir de la clave ingresada
 */
function deriveKey(key, salt, { keySize, iterations }) {
  return CryptoJS.PBKDF2(key, salt, {
    keySize: keySize / 32,
    iterations,
    hasher: CryptoJS.algo.SHA256
  });
}

/**
 * Muestra un mensaje de estado
 */
function showStatus(msg, type = 'info') {
  elements.statusMessage.textContent = msg;
  elements.statusMessage.className = `status-message ${type}`;
  elements.statusMessage.style.display = 'block';
  setTimeout(() => elements.statusMessage.style.display = 'none', 5000);
}

/**
 * Muestra u oculta el campo de clave
 */
function toggleKeyInputVisibility() {
  const algorithm = elements.algorithmSelect.value;
  elements.claveContainer.classList.toggle(
    'hidden',
    CONFIG.algorithmsWithoutKey.includes(algorithm)
  );
}

/**
 * Muestra la descripción del algoritmo seleccionado
 */
function showAlgorithmInfo() {
  const algorithm = elements.algorithmSelect.value;
  elements.algorithmInfo.textContent = CONFIG.algorithmDescriptions[algorithm] || '';
  toggleKeyInputVisibility();
}

/**
 * Valida que se haya ingresado mensaje y clave (si aplica)
 */
function validateInput(isEncrypt) {
  const message = elements.messageInput.value.trim();
  const key = elements.keyInput.value.trim();
  const algorithm = elements.algorithmSelect.value;

  if (!message) {
    showStatus('❌ Por favor ingresa un mensaje', 'error');
    return false;
  }

  if (CONFIG.algorithmsWithKey.includes(algorithm) && !key) {
    showStatus(`⚠️ Ingresa la clave para ${algorithm}`, 'error');
    return false;
  }

  return true;
}

/**
 * Cifra el mensaje usando el algoritmo seleccionado
 */
function encryptMessage() {
  if (!validateInput(true)) return;

  const message = elements.messageInput.value.trim();
  const key = elements.keyInput.value.trim();
  const algorithm = elements.algorithmSelect.value;

  try {
    let result;
    const iv = CryptoJS.lib.WordArray.random(16); // 128-bit IV
    const salt = CryptoJS.lib.WordArray.random(16); // 128-bit salt

    switch (algorithm) {
      case 'AES': {
        const derivedKey = deriveKey(key, salt, CONFIG.keyDerivation.AES);
        const cipher = CryptoJS.AES.encrypt(message, derivedKey, { iv });
        result = JSON.stringify({
          algorithm,
          salt: salt.toString(CryptoJS.enc.Hex),
          iv: iv.toString(CryptoJS.enc.Hex),
          ciphertext: cipher.toString()
        }, null, 2);
        break;
      }

      case 'TripleDES': {
        const cipher = CryptoJS.TripleDES.encrypt(message, key, { iv });
        result = JSON.stringify({
          algorithm,
          iv: iv.toString(CryptoJS.enc.Hex),
          ciphertext: cipher.toString()
        }, null, 2);
        break;
      }

      case 'Rabbit': {
        const cipher = CryptoJS.Rabbit.encrypt(message, key, { iv });
        result = JSON.stringify({
          algorithm,
          iv: iv.toString(CryptoJS.enc.Hex),
          ciphertext: cipher.toString()
        }, null, 2);
        break;
      }

      case 'RC4': {
        const cipher = CryptoJS.RC4.encrypt(message, key);
        result = JSON.stringify({
          algorithm,
          ciphertext: cipher.toString()
        }, null, 2);
        break;
      }

      case 'Base64':
        result = CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse(message));
        break;

      case 'URL':
        result = encodeURIComponent(message);
        break;

      case 'Hex':
        result = CryptoJS.enc.Hex.stringify(CryptoJS.enc.Utf8.parse(message));
        break;

      case 'Binary':
        result = Array.from(message)
          .map(c => c.charCodeAt(0).toString(2).padStart(8, '0'))
          .join(' ');
        break;
    }

    elements.output.value = result;
    showStatus('✅ Mensaje cifrado correctamente', 'success');
  } catch (error) {
    showStatus(`❌ Error al cifrar: ${error.message}`, 'error');
  }
}

/**
 * Descifra el mensaje cifrado
 */
function decryptMessage() {
  if (!validateInput(false)) return;

  const algorithm = elements.algorithmSelect.value;
  const key = elements.keyInput.value.trim();
  const rawInput = elements.messageInput.value.trim();

  try {
    let encryptedData = CONFIG.algorithmsWithKey.includes(algorithm)
      ? JSON.parse(rawInput)
      : rawInput;

    let decrypted;

    switch (algorithm) {
      case 'AES': {
        const salt = CryptoJS.enc.Hex.parse(encryptedData.salt);
        const iv = CryptoJS.enc.Hex.parse(encryptedData.iv);
        const derivedKey = deriveKey(key, salt, CONFIG.keyDerivation.AES);
        const result = CryptoJS.AES.decrypt(encryptedData.ciphertext, derivedKey, { iv });
        decrypted = result.toString(CryptoJS.enc.Utf8);
        break;
      }

      case 'TripleDES': {
        const iv = CryptoJS.enc.Hex.parse(encryptedData.iv);
        const result = CryptoJS.TripleDES.decrypt(encryptedData.ciphertext, key, { iv });
        decrypted = result.toString(CryptoJS.enc.Utf8);
        break;
      }

      case 'Rabbit': {
        const iv = CryptoJS.enc.Hex.parse(encryptedData.iv);
        const result = CryptoJS.Rabbit.decrypt(encryptedData.ciphertext, key, { iv });
        decrypted = result.toString(CryptoJS.enc.Utf8);
        break;
      }

      case 'RC4': {
        const result = CryptoJS.RC4.decrypt(encryptedData.ciphertext, key);
        decrypted = result.toString(CryptoJS.enc.Utf8);
        break;
      }

      case 'Base64':
        decrypted = CryptoJS.enc.Base64.parse(encryptedData).toString(CryptoJS.enc.Utf8);
        break;

      case 'URL':
        decrypted = decodeURIComponent(encryptedData);
        break;

      case 'Hex':
        decrypted = CryptoJS.enc.Hex.parse(encryptedData).toString(CryptoJS.enc.Utf8);
        break;

      case 'Binary':
        decrypted = encryptedData
          .split(' ')
          .map(b => String.fromCharCode(parseInt(b, 2)))
          .join('');
        break;
    }

    elements.output.value = decrypted;
    showStatus('✅ Mensaje descifrado correctamente', 'success');
  } catch (error) {
    showStatus(`❌ Error al descifrar: ${error.message}`, 'error');
  }
}

/**
 * Alterna visibilidad de la clave
 */
function togglePasswordVisibility() {
  const input = elements.keyInput;
  const isPassword = input.type === 'password';
  input.type = isPassword ? 'text' : 'password';
  elements.toggleKey.innerHTML = isPassword ? '👁️‍🗨️ Ocultar' : '👁️ Mostrar';
}

// Configuración de eventos
document.addEventListener('DOMContentLoaded', () => {
  elements.encryptBtn.addEventListener('click', encryptMessage);
  elements.decryptBtn.addEventListener('click', decryptMessage);
  elements.toggleKey.addEventListener('click', togglePasswordVisibility);
  elements.algorithmSelect.addEventListener('change', showAlgorithmInfo);
  elements.clearBtn.addEventListener('click', () => {
    elements.messageInput.value = '';
    elements.output.value = '';
    elements.keyInput.value = '';
    showStatus('🧹 Campos limpiados', 'info');
  });
  elements.copyBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(elements.output.value).then(() =>
      showStatus('📋 Resultado copiado', 'success')
    );
  });
  showAlgorithmInfo(); // Inicial
});

/**
 * Controlador del botón para mostrar/ocultar clave
 */
function togglePasswordVisibility() {
  const input = elements.keyInput;
  const isPassword = input.type === 'password';
  
  input.type = isPassword ? 'text' : 'password';
  elements.toggleKey.innerHTML = isPassword ? '👁️‍🗨️ Ocultar' : '👁️ Mostrar';
}

// Configuración de eventos
document.addEventListener('DOMContentLoaded', () => {
  // Event listeners principales
  elements.encryptBtn.addEventListener('click', encryptMessage);
  elements.decryptBtn.addEventListener('click', decryptMessage);
  elements.algorithmSelect.addEventListener('change', showAlgorithmInfo);
  elements.toggleKey.addEventListener('click', togglePasswordVisibility);
  
  // Botones adicionales
  elements.copyBtn.addEventListener('click', async () => {
    if (!elements.output.value.trim()) return showStatus('❌ No hay contenido para copiar', 'error');
    await navigator.clipboard.writeText(elements.output.value);
    showStatus('✅ Copiado al portapapeles', 'success');
  });
  
  elements.clearBtn.addEventListener('click', () => {
    elements.messageInput.value = '';
    elements.keyInput.value = '';
    elements.output.value = '';
    showStatus('🧹 Campos limpiados', 'info');
  });
  
  elements.swapBtn.addEventListener('click', () => {
    [elements.messageInput.value, elements.output.value] = 
      [elements.output.value, elements.messageInput.value];
    
    // Limpiar campo opuesto si está vacío
    if (elements.output.value === "") {
      elements.messageInput.value = "";
    }
    
    showStatus('⇄ Campos intercambiados', 'info');
  });
  
  elements.themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    elements.themeToggle.textContent = isDark ? '🌞 Modo claro' : '🌙 Modo oscuro';
    showStatus('🌗 Tema cambiado','info');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  });
  
  // Cargar tema guardado
  if (localStorage.getItem('theme') === 'dark') {
    document.body.classList.add('dark-mode');
    elements.themeToggle.textContent = '🌞 Modo claro';
  }
  
  // Inicialización inicial
  showAlgorithmInfo();
});

// Service Worker Registration
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => console.log('Service Worker registrado con éxito:', registration))
      .catch(error => console.error('Error al registrar el Service Worker:', error));
  });
}

/**
 * Módulo de reconocimiento de voz
 */
const VoiceModule = {
  recognition: null,
  isListening: false,

  init() {
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      this.setupRecognition();
      this.setupEventListeners();
    } else {
      this.disableVoiceFeatures();
    }
  },

  setupRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.recognition = new SpeechRecognition();
    this.recognition.continuous = true;
    this.recognition.interimResults = false;
    this.recognition.lang = 'es-ES';

    this.recognition.onstart = () => {
      this.isListening = true;
      showStatus('🎤 Escuchando... Habla ahora', 'info');
    };

    this.recognition.onresult = (e) => {
      const transcript = Array.from(e.results)
        .map(result => result[0].transcript)
        .join('');
      elements.messageInput.value += transcript;
    };

    this.recognition.onerror = (e) => {
      showStatus(`❌ Error de voz: ${e.error}`, 'error');
      this.toggleControls(false);
    };

    this.recognition.onend = () => {
      if (this.isListening) {
        showStatus('✅ Dictado completado', 'success');
        this.toggleControls(false);
      }
    };
  },

  setupEventListeners() {
    document.getElementById('startDictation').addEventListener('click', () => this.start());
    document.getElementById('stopDictation').addEventListener('click', () => this.stop());
  },

  start() {
    try {
      this.recognition.start();
      this.toggleControls(true);
    } catch (error) {
      showStatus('❌ Error al iniciar el micrófono', 'error');
    }
  },

  stop() {
    this.recognition.stop();
    this.toggleControls(false);
  },

  toggleControls(listening) {
    this.isListening = listening;
    document.getElementById('startDictation').disabled = listening;
    document.getElementById('stopDictation').disabled = !listening;
  },

  disableVoiceFeatures() {
    document.getElementById('startDictation').disabled = true;
    document.getElementById('stopDictation').disabled = true;
    showStatus('⚠️ Dictado por voz no soportado en este navegador', 'error');
  }
  
};

// Inicializar al cargar la página
document.addEventListener('DOMContentLoaded', () => {
  VoiceModule.init();
});
