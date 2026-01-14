// Referencias a elementos del DOM
document.addEventListener('DOMContentLoaded', function() {
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
    loadBackgroundImage('main');
    
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
    
    // Configurar Recaptcha para autenticación telefónica
    if (typeof firebase !== 'undefined') {
        renderRecaptcha();
    }
    
    console.log("✅ Todos los eventos configurados correctamente");
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

function renderRecaptcha() {
    if (typeof firebase === 'undefined') {
        console.error("❌ Firebase no está disponible para recaptcha");
        return;
    }
    
    try {
        recaptchaVerifier = new firebase.auth.RecaptchaVerifier('send-otp', {
            'size': 'invisible',
            'callback': function(response) {
                console.log("✅ reCAPTCHA resuelto");
                sendOtp();
            }
        });
        
        recaptchaVerifier.render().then(() => {
            console.log("✅ reCAPTCHA renderizado");
        });
    } catch (error) {
        console.error("❌ Error al renderizar recaptcha:", error);
    }
}

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