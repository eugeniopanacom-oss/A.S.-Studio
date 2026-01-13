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
    
    // Referencias a botones de autenticación
    const loginBtn = document.getElementById('login-btn');
    const registerBtn = document.getElementById('register-btn');
    const googleLoginBtn = document.getElementById('google-login');
    const googleRegisterBtn = document.getElementById('google-register');
    
    // Referencias a autenticación por teléfono
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
    loginTab.addEventListener('click', () => switchAuthForm('login'));
    registerTab.addEventListener('click', () => switchAuthForm('register'));
    goToRegister.addEventListener('click', (e) => {
        e.preventDefault();
        switchAuthForm('register');
    });
    goToLogin.addEventListener('click', (e) => {
        e.preventDefault();
        switchAuthForm('login');
    });
    phoneAuthTrigger.addEventListener('click', () => switchAuthForm('phone'));
    backToLogin.addEventListener('click', () => switchAuthForm('login'));
    
    // Enlace de administrador
    adminLoginLink.addEventListener('click', (e) => {
        e.preventDefault();
        showNotification('Acceso Administrador', 'Por favor, inicia sesión con las credenciales de administrador');
    });
    
    // Iniciar sesión con email y contraseña
    loginBtn.addEventListener('click', loginWithEmail);
    
    // Registro con email y contraseña
    registerBtn.addEventListener('click', registerWithEmail);
    
    // Autenticación con Google
    googleLoginBtn.addEventListener('click', () => signInWithGoogle('login'));
    googleRegisterBtn.addEventListener('click', () => signInWithGoogle('register'));
    
    // Autenticación con teléfono
    sendOtpBtn.addEventListener('click', sendOtp);
    verifyOtpBtn.addEventListener('click', verifyOtp);
    
    // Permitir enviar formularios con Enter
    loginEmail.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') loginWithEmail();
    });
    
    loginPassword.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') loginWithEmail();
    });
    
    // Escuchar cambios en el estado de autenticación
    auth.onAuthStateChanged(handleAuthStateChange);
    
    // Configurar Recaptcha para autenticación telefónica
    renderRecaptcha();
});

// Función para cambiar entre formularios de autenticación
function switchAuthForm(formType) {
    // Ocultar todos los formularios
    document.getElementById('login-form').classList.remove('active');
    document.getElementById('register-form').classList.remove('active');
    document.getElementById('phone-auth-form').classList.remove('active');
    
    // Desactivar todas las pestañas
    document.getElementById('login-tab').classList.remove('active');
    document.getElementById('register-tab').classList.remove('active');
    
    // Mostrar el formulario seleccionado
    if (formType === 'login') {
        document.getElementById('login-form').classList.add('active');
        document.getElementById('login-tab').classList.add('active');
    } else if (formType === 'register') {
        document.getElementById('register-form').classList.add('active');
        document.getElementById('register-tab').classList.add('active');
    } else if (formType === 'phone') {
        document.getElementById('phone-auth-form').classList.add('active');
        document.getElementById('otp-section').style.display = 'none';
        document.getElementById('phone-number').value = '';
        document.getElementById('otp-code').value = '';
    }
}

// Función para iniciar sesión con email y contraseña
async function loginWithEmail() {
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    
    if (!email || !password) {
        showNotification('Error', 'Por favor, completa todos los campos');
        return;
    }
    
    try {
        showLoading(loginBtn, 'Iniciando sesión...');
        
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        const user = userCredential.user;
        
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
        removeLoading(loginBtn, 'Iniciar Sesión');
    }
}

// Función para registrar usuario con email y contraseña
async function registerWithEmail() {
    const name = document.getElementById('register-name').value.trim();
    const email = document.getElementById('register-email').value.trim();
    const phone = document.getElementById('register-phone').value.trim();
    const password = document.getElementById('register-password').value;
    const passwordConfirm = document.getElementById('register-password-confirm').value;
    
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
    
    try {
        showLoading(registerBtn, 'Creando cuenta...');
        
        // Crear usuario en Firebase Auth
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;
        
        // Enviar correo de verificación
        await user.sendEmailVerification();
        
        // Guardar información adicional del usuario en Firestore
        await usersRef.doc(user.uid).set({
            uid: user.uid,
            name: name,
            email: email,
            phone: phone,
            role: 'user', // Rol por defecto
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            isActive: true
        });
        
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
        removeLoading(registerBtn, 'Crear Cuenta');
    }
}

// Función para autenticación con Google
async function signInWithGoogle(context) {
    const provider = new firebase.auth.GoogleAuthProvider();
    
    try {
        const userCredential = await auth.signInWithPopup(provider);
        const user = userCredential.user;
        
        // Verificar si el usuario ya existe en Firestore
        const userDoc = await usersRef.doc(user.uid).get();
        
        if (!userDoc.exists) {
            // Si es un nuevo usuario, crear registro en Firestore
            await usersRef.doc(user.uid).set({
                uid: user.uid,
                name: user.displayName || 'Usuario Google',
                email: user.email,
                phone: user.phoneNumber || '',
                role: context === 'register' ? 'user' : 'user',
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                isActive: true
            });
        }
        
        showNotification('Éxito', 'Inicio de sesión con Google exitoso');
        
        // Redirigir según el rol del usuario
        await checkUserRoleAndRedirect(user.uid);
        
    } catch (error) {
        console.error('Error en autenticación con Google:', error);
        showNotification('Error', 'Error al autenticar con Google');
    }
}

// Configurar Recaptcha para autenticación telefónica (versión simplificada)
let recaptchaVerifier;
let confirmationResult;

// Configurar la fecha actual en el footer
const currentYear = new Date().getFullYear();
if (document.getElementById('current-year')) {
    document.getElementById('current-year').textContent = currentYear;
}

function initializeRecaptcha() {
    // Solo inicializar cuando sea necesario
    recaptchaVerifier = new firebase.auth.RecaptchaVerifier('send-otp', {
        'size': 'invisible',
        'callback': function(response) {
            // reCAPTCHA resuelto automáticamente
            console.log('reCAPTCHA resuelto');
        }
    });
}

// Modifica la función sendOtp:
async function sendOtp() {
    const countryCode = document.getElementById('country-code').value;
    const phoneNumber = document.getElementById('phone-number').value.trim();
    const fullPhoneNumber = countryCode + phoneNumber;
    
    if (!phoneNumber) {
        showNotification('Error', 'Por favor, ingresa tu número de teléfono');
        return;
    }
    
    // Validar formato de teléfono básico
    if (phoneNumber.length < 8) {
        showNotification('Error', 'Por favor, ingresa un número de teléfono válido');
        return;
    }
    
    try {
        showLoading(sendOtpBtn, 'Enviando código...');
        
        // Inicializar reCAPTCHA si no está inicializado
        if (!recaptchaVerifier) {
            initializeRecaptcha();
        }
        
        confirmationResult = await auth.signInWithPhoneNumber(fullPhoneNumber, recaptchaVerifier);
        
        // Mostrar sección para ingresar código OTP
        otpSection.style.display = 'block';
        showNotification('Código enviado', 'Se ha enviado un código de verificación a tu teléfono');
        
    } catch (error) {
        console.error('Error al enviar código OTP:', error);
        let errorMessage = 'Error al enviar el código';
        
        switch(error.code) {
            case 'auth/invalid-phone-number':
                errorMessage = 'Número de teléfono inválido';
                break;
            case 'auth/quota-exceeded':
                errorMessage = 'Límite de SMS excedido. Intenta más tarde';
                break;
            case 'auth/captcha-check-failed':
                errorMessage = 'Error en la verificación de seguridad. Recarga la página e intenta nuevamente';
                // Resetear reCAPTCHA
                recaptchaVerifier = null;
                break;
            default:
                errorMessage = `Error: ${error.message}`;
        }
        
        showNotification('Error', errorMessage);
    } finally {
        removeLoading(sendOtpBtn, 'Enviar código');
    }
}

// Función para enviar código OTP
async function sendOtp() {
    const countryCode = document.getElementById('country-code').value;
    const phoneNumber = document.getElementById('phone-number').value.trim();
    const fullPhoneNumber = countryCode + phoneNumber;
    
    if (!phoneNumber) {
        showNotification('Error', 'Por favor, ingresa tu número de teléfono');
        return;
    }
    
    try {
        showLoading(sendOtpBtn, 'Enviando código...');
        
        confirmationResult = await auth.signInWithPhoneNumber(fullPhoneNumber, recaptchaVerifier);
        
        // Mostrar sección para ingresar código OTP
        otpSection.style.display = 'block';
        showNotification('Código enviado', 'Se ha enviado un código de verificación a tu teléfono');
        
    } catch (error) {
        console.error('Error al enviar código OTP:', error);
        let errorMessage = 'Error al enviar el código';
        
        switch(error.code) {
            case 'auth/invalid-phone-number':
                errorMessage = 'Número de teléfono inválido';
                break;
            case 'auth/quota-exceeded':
                errorMessage = 'Límite de SMS excedido. Intenta más tarde';
                break;
            case 'auth/captcha-check-failed':
                errorMessage = 'Error en la verificación de seguridad';
                break;
        }
        
        showNotification('Error', errorMessage);
    } finally {
        removeLoading(sendOtpBtn, 'Enviar código');
    }
}

// Función para verificar código OTP
async function verifyOtp() {
    const otpCode = document.getElementById('otp-code').value.trim();
    
    if (!otpCode) {
        showNotification('Error', 'Por favor, ingresa el código de verificación');
        return;
    }
    
    try {
        showLoading(verifyOtpBtn, 'Verificando...');
        
        const result = await confirmationResult.confirm(otpCode);
        const user = result.user;
        
        // Verificar si el usuario ya existe en Firestore
        const userDoc = await usersRef.doc(user.uid).get();
        
        if (!userDoc.exists) {
            // Si es un nuevo usuario, crear registro en Firestore
            await usersRef.doc(user.uid).set({
                uid: user.uid,
                name: 'Usuario Teléfono',
                email: '',
                phone: user.phoneNumber,
                role: 'user',
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                isActive: true
            });
        }
        
        showNotification('Éxito', 'Autenticación telefónica exitosa');
        
        // Redirigir según el rol del usuario
        await checkUserRoleAndRedirect(user.uid);
        
    } catch (error) {
        console.error('Error al verificar código OTP:', error);
        showNotification('Error', 'Código de verificación incorrecto o expirado');
    } finally {
        removeLoading(verifyOtpBtn, 'Verificar código');
    }
}

// Función para manejar cambios en el estado de autenticación
function handleAuthStateChange(user) {
    if (user) {
        // Usuario autenticado
        console.log('Usuario autenticado:', user.uid);
        
        // Verificar si el correo está verificado (excepto para autenticación telefónica)
        if (user.providerData[0].providerId !== 'phone' && !user.emailVerified) {
            auth.signOut();
            showNotification('Verificación requerida', 'Por favor, verifica tu correo electrónico antes de iniciar sesión');
        }
    } else {
        // Usuario no autenticado
        console.log('Usuario no autenticado');
    }
}

// Función para verificar el rol del usuario y redirigir
async function checkUserRoleAndRedirect(uid) {
    try {
        const userDoc = await usersRef.doc(uid).get();
        
        if (userDoc.exists) {
            const userData = userDoc.data();
            
            // Redirigir según el rol
            if (userData.role === 'admin') {
                window.location.href = 'admin.html';
            } else {
                window.location.href = 'user.html';
            }
        } else {
            // Si no existe en Firestore, crear registro básico
            await usersRef.doc(uid).set({
                uid: uid,
                name: 'Usuario',
                email: auth.currentUser?.email || '',
                phone: auth.currentUser?.phoneNumber || '',
                role: 'user',
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                isActive: true
            });
            
            window.location.href = 'user.html';
        }
    } catch (error) {
        console.error('Error al verificar rol de usuario:', error);
        showNotification('Error', 'Error al verificar permisos de usuario');
    }
}

// Función para cargar imagen de fondo
async function loadBackgroundImage(page) {
    try {
        const configDoc = await siteConfigRef.get();
        
        if (configDoc.exists) {
            const configData = configDoc.data();
            const backgroundUrl = configData[`${page}Background`];
            
            if (backgroundUrl) {
                document.body.style.backgroundImage = `url('${backgroundUrl}')`;
            }
        }
    } catch (error) {
        console.error('Error al cargar imagen de fondo:', error);
    }
}

// Funciones auxiliares para UI
function showLoading(button, text) {
    button.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${text}`;
    button.disabled = true;
}

function removeLoading(button, originalText) {
    button.innerHTML = originalText;
    button.disabled = false;
}

function showNotification(title, message) {
    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-message').textContent = message;
    document.getElementById('notification-modal').style.display = 'flex';
}

// Cerrar modal al hacer clic en la X
document.querySelector('.close-modal').addEventListener('click', function() {
    document.getElementById('notification-modal').style.display = 'none';
});

// Cerrar modal al hacer clic fuera del contenido
window.addEventListener('click', function(event) {
    const modal = document.getElementById('notification-modal');
    if (event.target === modal) {
        modal.style.display = 'none';
    }
});