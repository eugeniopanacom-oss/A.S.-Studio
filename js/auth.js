// FUNCIONES DE UTILIDAD QUE FALTAN
function showLoading(button) {
    if (button) {
        const originalText = button.innerHTML;
        button.innerHTML = '<span class="spinner"></span> Procesando...';
        button.disabled = true;
        button.dataset.originalText = originalText;
    }
}

function hideLoading(button) {
    if (button && button.dataset.originalText) {
        button.innerHTML = button.dataset.originalText;
        button.disabled = false;
    }
}

function showNotification(message, type = 'info') {
    // Crea una notificación básica si no tienes sistema
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px;
        background: ${type === 'error' ? '#f44336' : type === 'success' ? '#4CAF50' : '#2196F3'};
        color: white;
        border-radius: 5px;
        z-index: 1000;
    `;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 5000);
}

function handleAuthStateChange(user) {
    console.log("🔐 Estado de autenticación cambiado:", user ? "Usuario conectado" : "No hay usuario");
    
    const loginSection = document.getElementById('login-section');
    const userSection = document.getElementById('user-section');
    const logoutBtn = document.getElementById('logout-btn');
    
    if (user) {
        // Usuario conectado
        if (loginSection) loginSection.style.display = 'none';
        if (userSection) userSection.style.display = 'block';
        if (logoutBtn) logoutBtn.style.display = 'block';
        
        console.log("👤 Usuario:", user.email);
    } else {
        // Usuario no conectado
        if (loginSection) loginSection.style.display = 'block';
        if (userSection) userSection.style.display = 'none';
        if (logoutBtn) logoutBtn.style.display = 'none';
        
        console.log("👤 No hay usuario conectado");
    }
}

async function checkUserRoleAndRedirect(user) {
    try {
        console.log('🔍 Verificando rol del usuario:', user.email);
        
        if (!window.db) {
            console.warn('Firestore no disponible, redirigiendo a user.html');
            window.location.href = 'user.html';
            return;
        }
        
        // Obtener documento del usuario desde Firestore
        const userDoc = await db.collection('users').doc(user.uid).get();
        
        if (userDoc.exists) {
            const userData = userDoc.data();
            const userRole = userData.role || 'user';
            const isAdmin = userRole === 'admin';
            
            console.log(`🎯 Rol detectado: ${userRole}`, isAdmin ? '(Admin)' : '(Usuario)');
            
            // Redirigir según rol
            if (isAdmin && window.location.pathname !== '/admin.html') {
                console.log('➡️ Redirigiendo admin a admin.html');
                window.location.href = 'admin.html';
            } else if (!isAdmin && window.location.pathname !== '/user.html') {
                console.log('➡️ Redirigiendo usuario a user.html');
                window.location.href = 'user.html';
            } else {
                console.log('✅ Usuario ya está en la página correcta');
            }
        } else {
            // Si no existe documento, crear uno por defecto
            console.log('📝 Creando documento de usuario por defecto');
            await db.collection('users').doc(user.uid).set({
                email: user.email,
                displayName: user.displayName || user.email.split('@')[0],
                role: 'user',
                createdAt: new Date(),
                lastLogin: new Date()
            });
            
            console.log('➡️ Redirigiendo nuevo usuario a user.html');
            window.location.href = 'user.html';
        }
        
    } catch (error) {
        console.error('❌ Error al verificar rol:', error);
        // En caso de error, redirigir a user.html por defecto
        window.location.href = 'user.html';
    }
}

// VARIABLES GLOBALES QUE FALTAN
let registerBtn = document.getElementById('register-btn');
let loginBtn = document.getElementById('login-btn');
let logoutBtn = document.getElementById('logout-btn');

// Si no existen, créalos de forma segura
if (!registerBtn) console.warn('register-btn no encontrado');
if (!loginBtn) console.warn('login-btn no encontrado');
if (!logoutBtn) console.warn('logout-btn no encontrado');

// Referencias a elementos del DOM
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM cargado, configurando eventos...');
    
    // Configurar observer de autenticación
    if (window.auth) {
        auth.onAuthStateChanged(handleAuthStateChange);
    }
    // Establecer año actual
    document.getElementById('current-year').textContent = new Date().getFullYear();
    
    // Referencias a pestañas y formularios
    const loginTab = document.getElementById('login-tab');
    const registerTab = document.getElementById('register-tab');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const phoneAuthForm = document.getElementById('phone-auth-form');
    
    const goToRegister = document.getElementById('go-to-register');
    const goToLogin = document.getElementById('go-to-login');
    const phoneAuthTrigger = document.getElementById('phone-auth-trigger');
    const backToLogin = document.getElementById('back-to-login');
    const adminLoginLink = document.getElementById('admin-login-link');
    
    // Referencias a botones (NO submit)
    const loginBtn = document.getElementById('login-btn');
    const registerBtn = document.getElementById('register-btn');
    const googleLoginBtn = document.getElementById('google-login');
    const googleRegisterBtn = document.getElementById('google-register');
    const sendOtpBtn = document.getElementById('send-otp');
    const verifyOtpBtn = document.getElementById('verify-otp');
    const phoneNumberInput = document.getElementById('phone-number');
    const otpCodeInput = document.getElementById('otp-code');
    const otpSection = document.getElementById('otp-section');
    const countryCodeSelect = document.getElementById('country-code');
    
    // Referencias a campos de formulario
    const loginEmail = document.getElementById('login-email');
    const loginPassword = document.getElementById('login-password');
    const registerName = document.getElementById('register-name');
    const registerEmail = document.getElementById('register-email');
    const registerPhone = document.getElementById('register-phone');
    const registerPassword = document.getElementById('register-password');
    const registerPasswordConfirm = document.getElementById('register-password-confirm');
    
    // Cargar fondo de pantalla
    function loadBackgroundImage() {
        const bgImage = localStorage.getItem('backgroundImage');
        if (bgImage) {
            document.body.style.backgroundImage = `url('${bgImage}')`;
            document.body.style.backgroundSize = 'cover';
            document.body.style.backgroundPosition = 'center';
            document.body.style.backgroundAttachment = 'fixed';
        }
    }
    
    loadBackgroundImage();
    
    // Manejo de cambio de pestañas
    if (loginTab) loginTab.addEventListener('click', (e) => {
        e.preventDefault();
        switchAuthForm('login');
    });
    
    if (registerTab) registerTab.addEventListener('click', (e) => {
        e.preventDefault();
        switchAuthForm('register');
    });
    
    if (goToRegister) goToRegister.addEventListener('click', (e) => {
        e.preventDefault();
        switchAuthForm('register');
    });
    goToLogin.addEventListener('click', (e) => {
        e.preventDefault();
        switchAuthForm('login');
    });
    
    // Enlace de administrador
    if (adminLoginLink) adminLoginLink.addEventListener('click', (e) => {
        e.preventDefault();
        showNotification('Acceso Administrador', 'Por favor, inicia sesión con las credenciales de administrador');
    });
    
    // Iniciar sesión con email y contraseña
    if (loginBtn) loginBtn.addEventListener('click', function(e) {
        console.log("🔑 Botón login clickeado");
        e.preventDefault();
        e.stopPropagation();
        loginWithEmail();
    });
    
    // Registro con email y contraseña
    if (registerBtn) registerBtn.addEventListener('click', function(e) {
        console.log("📝 Botón registro clickeado");
        e.preventDefault();
        e.stopPropagation();
        registerWithEmail();
    });
    
    // Autenticación con Google
    async function signInWithGoogle() {
    const googleBtn = document.getElementById('google-signin-btn');
    
    if (googleBtn) showLoading(googleBtn);
    
    try {
        console.log('🔐 Iniciando sesión con Google...');
        
        if (!window.auth) {
            throw new Error('Firebase Auth no disponible');
        }
        
        // Necesitas agregar el provider de Google
        const provider = new firebase.auth.GoogleAuthProvider();
        
        // Configurar scopes opcionales
        provider.addScope('email');
        provider.addScope('profile');
        
        const result = await auth.signInWithPopup(provider);
        
        // Guardar usuario en Firestore si es nuevo
        if (result.additionalUserInfo.isNewUser && window.db) {
            await db.collection('users').doc(result.user.uid).set({
                email: result.user.email,
                displayName: result.user.displayName,
                photoURL: result.user.photoURL,
                provider: 'google',
                createdAt: new Date(),
                role: 'user'
            });
        }
        
        showNotification('Sesión con Google exitosa', 'success');
        setTimeout(() => {
            window.location.href = 'user.html';
        }, 1500);
        
    } catch (error) {
        console.error('❌ Error con Google Sign-In:', error);
        showNotification('Error con Google: ' + error.message, 'error');
    } finally {
        if (googleBtn) hideLoading(googleBtn);
    }
}
    if (googleLoginBtn) googleLoginBtn.addEventListener('click', (e) => {
        e.preventDefault();
        signInWithGoogle('login');
    });
    
    if (googleRegisterBtn) googleRegisterBtn.addEventListener('click', (e) => {
        e.preventDefault();
        signInWithGoogle('register');
    });
    
    // Autenticación con teléfono
    if (sendOtpBtn) sendOtpBtn.addEventListener('click', (e) => {
        e.preventDefault();
        sendOtp();
    });
    
    if (verifyOtpBtn) verifyOtpBtn.addEventListener('click', (e) => {
        e.preventDefault();
        verifyOtp();
    });
    
    // Permitir enviar formularios con Enter (pero prevenir submit)
    if (loginEmail) loginEmail.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            loginWithEmail();
        }
    });
    
    if (loginPassword) loginPassword.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            loginWithEmail();
        }
    });
    
    // Escuchar cambios en el estado de autenticación
    if (typeof auth !== 'undefined') {
        auth.onAuthStateChanged(handleAuthStateChange);
    } else {
        console.error("❌ auth no está definido");
    }
        
    console.log("✅ Todos los eventos configurados correctamente");
});

// auth.js - VERSIÓN COMPLETA
console.log("auth.js - versión corregida cargada completamente");

// ========== FUNCIONES DE UTILIDAD ==========
function showLoading(button) {
    if (button) {
        const originalText = button.innerHTML;
        button.innerHTML = '<span style="margin-right:8px">⌛</span> Procesando...';
        button.disabled = true;
        button.dataset.originalText = originalText;
    }
}

function hideLoading(button) {
    if (button && button.dataset.originalText) {
        button.innerHTML = button.dataset.originalText;
        button.disabled = false;
    }
}

// Alias para compatibilidad (por si usas removeLoading)
function removeLoading(button) {
    hideLoading(button);
}

function showNotification(message, type = 'info') {
    // Usa alert temporalmente
    alert(`${type === 'error' ? '❌ Error' : type === 'success' ? '✅ Éxito' : 'ℹ️ Info'}: ${message}`);
}

// ========== FUNCIONES PRINCIPALES ==========
async function registerWithEmail(email, password, displayName) {
    const registerBtn = document.getElementById('register-btn');
    
    if (!registerBtn) {
        console.error('register-btn no encontrado');
        return;
    }
    
    showLoading(registerBtn);
    
    try {
        console.log('Registrando:', displayName, email);
        
        // VERIFICA que auth existe
        if (!window.auth || typeof auth.createUserWithEmailAndPassword !== 'function') {
            throw new Error('Firebase Auth no está disponible. ¿Se cargó firebase-config.js?');
        }
        
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        await userCredential.user.updateProfile({ displayName: displayName });
        
        // Guardar en Firestore
        if (window.db) {
            await db.collection('users').doc(userCredential.user.uid).set({
                email: email,
                displayName: displayName,
                createdAt: new Date(),
                role: 'user'
            });
        }
        
        showNotification('Cuenta creada exitosamente', 'success');
        setTimeout(() => {
            window.location.href = 'user.html';
        }, 1500);
        
    } catch (error) {
        console.error('Error al registrar:', error);
        showNotification('Error: ' + error.message, 'error');
    } finally {
        hideLoading(registerBtn);
    }
}

// ========== CONFIGURACIÓN INICIAL ==========
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM cargado, configurando eventos...');
    
    // Verificar que Firebase está disponible
    if (!window.auth) {
        console.warn('⚠️ Auth no está disponible. Verifica el orden de carga de scripts.');
    } else {
        console.log('✅ Auth disponible:', typeof auth);
    }
    
    // Login form
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;
            loginWithEmail(email, password);
        });
    }
    
    // Register form
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const email = document.getElementById('register-email').value;
            const password = document.getElementById('register-password').value;
            const displayName = document.getElementById('register-name').value;
            registerWithEmail(email, password, displayName);
        });
    }
    
    // Logout button (puede no existir en index.html)
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn && window.auth) {
        logoutBtn.addEventListener('click', function() {
            auth.signOut().then(() => {
                window.location.href = 'index.html';
            });
        });
    } else if (!logoutBtn) {
        console.log('ℹ️ logout-btn no encontrado (normal en página de login)');
    }
    
    console.log('✅ Todos los eventos configurados correctamente');
});

// Función para cambiar entre formularios de autenticación
function switchAuthForm(formType) {
    console.log(`🔄 Cambiando a formulario: ${formType}`);
    
    // Ocultar todos los formularios
    const forms = ['login-form', 'register-form', 'phone-auth-form'];
    forms.forEach(id => {
        const form = document.getElementById(id);
        if (form) form.classList.remove('active');
    });
    
    // Desactivar todas las pestañas
    const tabs = ['login-tab', 'register-tab'];
    tabs.forEach(id => {
        const tab = document.getElementById(id);
        if (tab) tab.classList.remove('active');
    });
    
    // Mostrar el formulario seleccionado
    if (formType === 'login') {
        const loginForm = document.getElementById('login-form');
        const loginTab = document.getElementById('login-tab');
        if (loginForm) loginForm.classList.add('active');
        if (loginTab) loginTab.classList.add('active');
    } else if (formType === 'register') {
        const registerForm = document.getElementById('register-form');
        const registerTab = document.getElementById('register-tab');
        if (registerForm) registerForm.classList.add('active');
        if (registerTab) registerTab.classList.add('active');
    } else if (formType === 'phone') {
        const phoneForm = document.getElementById('phone-auth-form');
        if (phoneForm) {
            phoneForm.classList.add('active');
            document.getElementById('otp-section').style.display = 'none';
            document.getElementById('phone-number').value = '';
            document.getElementById('otp-code').value = '';
        }
    }
}

// Función para iniciar sesión con email y contraseña
async function loginWithEmail() {
    console.log("🔐 Intentando login...");

    
    const email = document.getElementById('login-email')?.value.trim();
    const password = document.getElementById('login-password')?.value;
    
    if (!email || !password) {
        showNotification('Error', 'Por favor, completa todos los campos');
        return;
    }
    
    console.log(`📧 Login con: ${email.substring(0, 10)}...`);
    
    try {
        showLoading(loginBtn, 'Iniciando sesión...');
        
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        const user = userCredential.user;
        
        console.log("✅ Login exitoso para:", user.email);
        
        // Verificar si el usuario está verificado
        if (!user.emailVerified) {
            await auth.signOut();
            showNotification('Verificación requerida', 'Por favor, verifica tu correo electrónico antes de iniciar sesión');
            return;
        }
        
        showNotification('Éxito', 'Inicio de sesión exitoso');
        
        // Redirigir según el rol del usuario
        await checkUserRoleAndRedirect(user.uid);
        
    } catch (error) {
        console.error('Error al iniciar sesión:', error);
        let errorMessage = 'Error al iniciar sesión';
        
        switch(error.code) {
            case 'auth/invalid-email':
                errorMessage = 'El correo electrónico no es válido';
                break;
            case 'auth/user-disabled':
                errorMessage = 'Esta cuenta ha sido deshabilitada';
                break;
            case 'auth/user-not-found':
                errorMessage = 'No existe una cuenta con este correo';
                break;
            case 'auth/wrong-password':
                errorMessage = 'Contraseña incorrecta';
                break;
            case 'auth/too-many-requests':
                errorMessage = 'Demasiados intentos fallidos. Intenta más tarde';
                break;
        }
        
        showNotification('Error', errorMessage);
    } finally {
        if (loginBtn) removeLoading(loginBtn, 'Iniciar Sesión');
    }
async function loginWithEmail(email, password) {
    const loginBtn = document.getElementById('login-btn');
    
    if (!loginBtn) {
        console.error('login-btn no encontrado');
        return;
    }
    
    showLoading(loginBtn);
    
    try {
        console.log('🔐 Iniciando sesión:', email);
        
        if (!window.auth) {
            throw new Error('Firebase Auth no disponible');
        }
        
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        const user = userCredential.user;
        
        console.log('✅ Sesión iniciada:', user.email);
        showNotification('Sesión iniciada correctamente', 'success');
        
        // ACTUALIZA ESTA PARTE:
        // En lugar de redirigir directamente, verificar rol
        await checkUserRoleAndRedirect(user);
        
    } catch (error) {
        console.error('❌ Error al iniciar sesión:', error);
        showNotification('Error: ' + error.message, 'error');
    } finally {
        hideLoading(loginBtn);
    }
}

// Función para registrar usuario con email y contraseña
async function registerWithEmail() {
    console.log("📝 Intentando registro...");
    
    const name = document.getElementById('register-name')?.value.trim();
    const email = document.getElementById('register-email')?.value.trim();
    const phone = document.getElementById('register-phone')?.value.trim();
    const password = document.getElementById('register-password')?.value;
    const passwordConfirm = document.getElementById('register-password-confirm')?.value;
    
    // Validaciones
    if (!name || !email || !phone || !password || !passwordConfirm) {
        showNotification('Error', 'Por favor, completa todos los campos');
        return;
    }
    
    if (password !== passwordConfirm) {
        showNotification('Error', 'Las contraseñas no coinciden');
        return;
    }
    
    if (password.length < 6) {
        showNotification('Error', 'La contraseña debe tener al menos 6 caracteres');
        return;
    }
    
    console.log(`📧 Registrando: ${name} (${email})`);
    
    try {
        showLoading(registerBtn, 'Creando cuenta...');
        
        // Crear usuario en Firebase Auth
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;
        
        console.log("✅ Usuario creado en Auth:", user.uid);
        
        // Enviar correo de verificación
        await user.sendEmailVerification();
        
        // Guardar información adicional del usuario en Firestore
        await usersRef.doc(user.uid).set({
            uid: user.uid,
            name: name,
            email: email,
            phone: phone,
            role: 'user',
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            isActive: true
        });
        
        console.log("✅ Usuario guardado en Firestore");
        
        showNotification('Cuenta creada', 'Se ha enviado un correo de verificación a tu dirección de email. Por favor, verifica tu cuenta antes de iniciar sesión.');
        
        // Cerrar sesión para forzar la verificación
        await auth.signOut();
        
        // Cambiar al formulario de login
        switchAuthForm('login');
        
        // Limpiar formulario
        document.getElementById('register-name').value = '';
        document.getElementById('register-email').value = '';
        document.getElementById('register-phone').value = '';
        document.getElementById('register-password').value = '';
        document.getElementById('register-password-confirm').value = '';
        
    } catch (error) {
        console.error('Error al registrar usuario:', error);
        let errorMessage = 'Error al crear la cuenta';
        
        switch(error.code) {
            case 'auth/email-already-in-use':
                errorMessage = 'Este correo electrónico ya está registrado';
                break;
            case 'auth/invalid-email':
                errorMessage = 'El correo electrónico no es válido';
                break;
            case 'auth/operation-not-allowed':
                errorMessage = 'La operación no está permitida';
                break;
            case 'auth/weak-password':
                errorMessage = 'La contraseña es demasiado débil';
                break;
        }
        
        showNotification('Error', errorMessage);
    } finally {
        if (registerBtn) removeLoading(registerBtn, 'Crear Cuenta');
    }
}

// Configurar Recaptcha para autenticación telefónica
let recaptchaVerifier;
let confirmationResult;

// Función para mostrar notificaciones
function showNotification(title, message) {
    console.log(`📢 Notificación: ${title} - ${message}`);
    
    // Si no existe el modal, crearlo
    let notification = document.getElementById('notification-modal');
    
    if (!notification) {
        notification = document.createElement('div');
        notification.id = 'notification-modal';
        notification.className = 'modal';
        notification.innerHTML = `
            <div class="modal-content">
                <span class="close-modal">&times;</span>
                <h3 id="modal-title"></h3>
                <p id="modal-message"></p>
            </div>
        `;
        document.body.appendChild(notification);
        
        // Configurar cerrar modal
        notification.querySelector('.close-modal').addEventListener('click', function() {
            notification.style.display = 'none';
        });
        
        // Cerrar al hacer clic fuera del contenido
        window.addEventListener('click', function(event) {
            if (event.target === notification) {
                notification.style.display = 'none';
            }
        });
    }
    
    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-message').textContent = message;
    notification.style.display = 'flex';
}

console.log("✅ auth.js - versión corregida cargada completamente");
}