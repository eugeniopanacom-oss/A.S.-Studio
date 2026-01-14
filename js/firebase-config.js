// firebase-config.js - ARCHIVO REAL DE CONFIGURACIÓN
console.log("🔥 firebase-config.js cargado");

// CONFIGURACIÓN DE FIREBASE - TUS DATOS REALES (los que ya tienes)
const firebaseConfig = {
    apiKey: "AIzaSyB3xCos-qTAOs8VIgcZk3ntUnPeI13YqR8",
    authDomain: "as-studio-d02c4.firebaseapp.com",
    projectId: "as-studio-d02c4",
    storageBucket: "as-studio-d02c4.firebasestorage.app",
    messagingSenderId: "1021827477452",
    appId: "1:1021827477452:web:4bd7fa03063720f1cdb769",
};

// INICIALIZACIÓN CON MANEJO DE ERRORES
try {
    console.log("🔄 Verificando Firebase SDK...");
    
    if (typeof firebase === 'undefined') {
        throw new Error("Firebase SDK no está cargado");
    }
    
    // Inicializar solo si no está inicializado
    let app;
    if (!firebase.apps.length) {
        console.log("🚀 Inicializando Firebase App...");
        app = firebase.initializeApp(firebaseConfig);
        console.log("✅ Firebase App inicializada:", app.name);
    } else {
        app = firebase.app();
        console.log("ℹ️ Usando Firebase App existente:", app.name);
    }
    
    // CREAR VARIABLES GLOBALES CON VERIFICACIÓN
    window.auth = firebase.auth();
    window.db = firebase.firestore();
    window.storage = firebase.storage();
    
    console.log("✅ Servicios de Firebase creados:");
    console.log("   - auth:", typeof auth);
    console.log("   - db:", typeof db);
    console.log("   - storage:", typeof storage);
    
    // CONFIGURAR REFERENCIAS A COLECCIONES
    window.usersRef = db.collection("users");
    window.appointmentsRef = db.collection("appointments");
    window.siteConfigRef = db.collection("siteConfig");
    
    console.log("✅ Referencias a colecciones creadas");
    
    // CONFIGURAR PERSISTENCIA
    auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL)
        .then(() => console.log("💾 Persistencia de Auth configurada"))
        .catch(err => console.warn("⚠️ Error en persistencia Auth:", err.message));
    
    db.enablePersistence()
        .then(() => console.log("💾 Persistencia de Firestore activada"))
        .catch(err => {
            if (err.code === 'failed-precondition') {
                console.warn("⚠️ Persistencia Firestore: Múltiples pestañas abiertas");
            } else if (err.code === 'unimplemented') {
                console.warn("⚠️ Persistencia Firestore no soportada");
            }
        });
    
    console.log("🎉 Configuración de Firebase COMPLETADA");
    
} catch (error) {
    console.error("❌ ERROR CRÍTICO en firebase-config.js:", error.message);
    console.error("Detalles:", error);
    
    // Crear objetos vacíos para evitar errores en otros archivos
    window.auth = { 
        currentUser: null,
        onAuthStateChanged: (callback) => { callback(null); return () => {}; },
        signInWithEmailAndPassword: () => Promise.reject(new Error("Firebase no inicializado")),
        createUserWithEmailAndPassword: () => Promise.reject(new Error("Firebase no inicializado")),
        signOut: () => Promise.reject(new Error("Firebase no inicializado"))
    };
    
    window.db = {
        collection: () => ({
            doc: () => ({
                get: () => Promise.reject(new Error("Firebase no inicializado")),
                set: () => Promise.reject(new Error("Firebase no inicializado"))
            })
        })
    };
    
    window.storage = {};
    window.usersRef = {};
    window.appointmentsRef = {};
    window.siteConfigRef = { get: () => Promise.reject(new Error("Firebase no inicializado")) };
    
    console.warn("⚠️ Objetos de Firebase creados como placeholders");
}