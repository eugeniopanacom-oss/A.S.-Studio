// Variables globales para el usuario
let userData = null;
let availableTimeSlots = [];

// Inicialización cuando el DOM está listo
document.addEventListener('DOMContentLoaded', function() {
    // Verificar autenticación
    checkUserAuth();
    
    // Cargar fondo de pantalla
    loadBackgroundImage('user');
    
    // Establecer fecha actual
    const now = new Date();
    document.getElementById('current-date').textContent = now.toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    // Configurar navegación
    setupNavigation();
    
    // Configurar eventos
    setupEventListeners();
    
    // Cargar datos del usuario
    loadUserData();
});

// Verificar autenticación del usuario
async function checkUserAuth() {
    try {
        // Esperar a que Firebase se inicialice
        await new Promise(resolve => {
            const checkAuth = () => {
                if (auth && auth.currentUser) {
                    resolve();
                } else {
                    setTimeout(checkAuth, 100);
                }
            };
            checkAuth();
        });
        
        const user = auth.currentUser;
        
        if (!user) {
            window.location.href = 'index.html';
            return;
        }
        
        // Verificar si el usuario existe en Firestore
        const userDoc = await usersRef.doc(user.uid).get();
        
        if (!userDoc.exists) {
            // Crear registro básico si no existe
            await usersRef.doc(user.uid).set({
                uid: user.uid,
                name: user.displayName || 'Usuario',
                email: user.email || '',
                phone: user.phoneNumber || '',
                role: 'user',
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                isActive: true,
                preferences: {}
            });
        }
        
    } catch (error) {
        console.error('Error al verificar autenticación:', error);
        window.location.href = 'index.html';
    }
}

// Configurar navegación
function setupNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('.content-section');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Remover clase active de todos los enlaces
            navLinks.forEach(l => l.classList.remove('active'));
            
            // Agregar clase active al enlace clickeado
            this.classList.add('active');
            
            // Ocultar todas las secciones
            sections.forEach(section => section.classList.remove('active'));
            
            // Mostrar la sección correspondiente
            const sectionId = this.getAttribute('data-section') + '-section';
            document.getElementById(sectionId).classList.add('active');
            
            // Actualizar título de la sección
            const sectionTitle = this.textContent.trim();
            document.getElementById('section-title').textContent = sectionTitle;
            
            // Cargar datos específicos de la sección
            switch(this.getAttribute('data-section')) {
                case 'appointments':
                    loadUserAppointments();
                    break;
                case 'new-appointment':
                    setupNewAppointmentForm();
                    break;
                case 'history':
                    loadUserHistory();
                    break;
            }
        });
    });
}

// Configurar event listeners
function setupEventListeners() {
    // Botón de cerrar sesión
    document.getElementById('logout-btn').addEventListener('click', logout);
    
    // Botones de editar perfil
    document.getElementById('edit-profile-btn').addEventListener('click', openEditProfileModal);
    document.getElementById('change-password-btn').addEventListener('click', openChangePasswordModal);
    
    // Formulario de edición de perfil
    document.getElementById('edit-profile-form').addEventListener('submit', saveProfileChanges);
    document.getElementById('cancel-edit').addEventListener('click', closeEditProfileModal);
    
    // Formulario de cambio de contraseña
    document.getElementById('change-password-form').addEventListener('submit', changePassword);
    document.getElementById('cancel-password').addEventListener('click', closeChangePasswordModal);
    
    // Preferencias
    document.getElementById('save-preferences').addEventListener('click', savePreferences);
    
    // Filtros de reservas
    document.getElementById('filter-upcoming').addEventListener('click', () => filterUserAppointments('upcoming'));
    document.getElementById('filter-past').addEventListener('click', () => filterUserAppointments('past'));
    document.getElementById('filter-all-user').addEventListener('click', () => filterUserAppointments('all'));
    
    // Formulario de nueva reserva
    document.getElementById('new-appointment-form').addEventListener('submit', confirmNewAppointment);
    document.getElementById('new-appointment-date').addEventListener('change', updateAvailableTimes);
    document.getElementById('new-appointment-service').addEventListener('change', updateAppointmentSummary);
    document.getElementById('new-appointment-barber').addEventListener('change', updateAppointmentSummary);
    
    // Confirmación de reserva
    document.getElementById('confirm-reservation').addEventListener('click', createNewAppointment);
    document.getElementById('cancel-confirmation').addEventListener('click', closeConfirmationModal);
    
    // Cerrar modales al hacer clic en la X
    document.querySelectorAll('.close-modal').forEach(closeBtn => {
        closeBtn.addEventListener('click', function() {
            this.closest('.modal').style.display = 'none';
        });
    });
    
    // Cerrar modales al hacer clic fuera
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                this.style.display = 'none';
            }
        });
    });
}

// Cargar datos del usuario
async function loadUserData() {
    try {
        const user = auth.currentUser;
        
        if (!user) return;
        
        // Obtener datos del usuario de Firestore
        const userDoc = await usersRef.doc(user.uid).get();
        
        if (userDoc.exists) {
            userData = userDoc.data();
            
            // Mostrar información en el perfil
            document.getElementById('user-name').textContent = userData.name;
            document.getElementById('user-email').textContent = userData.email;
            
            document.getElementById('profile-name').textContent = userData.name;
            document.getElementById('profile-email').textContent = userData.email;
            document.getElementById('profile-phone').textContent = userData.phone || 'No especificado';
            document.getElementById('profile-joined').textContent = userData.createdAt 
                ? userData.createdAt.toDate().toLocaleDateString('es-ES')
                : 'Fecha no disponible';
            
            // Contar reservas del usuario
            const appointmentsSnapshot = await appointmentsRef
                .where('clientPhone', '==', userData.phone)
                .get();
            
            document.getElementById('profile-total-appointments').textContent = appointmentsSnapshot.size;
            
            // Cargar preferencias
            loadUserPreferences();
            
            // Cargar reservas
            loadUserAppointments();
            
        }
        
    } catch (error) {
        console.error('Error al cargar datos del usuario:', error);
        showNotification('Error', 'No se pudieron cargar los datos del perfil');
    }
}

// Cargar preferencias del usuario
function loadUserPreferences() {
    if (!userData.preferences) return;
    
    const prefs = userData.preferences;
    
    if (prefs.preferredBarber) {
        document.getElementById('preferred-barber').value = prefs.preferredBarber;
    }
    
    if (prefs.preferredService) {
        document.getElementById('preferred-service').value = prefs.preferredService;
    }
    
    if (prefs.notifications) {
        document.getElementById('notify-email').checked = prefs.notifications.email || false;
        document.getElementById('notify-sms').checked = prefs.notifications.sms || false;
    }
}

// Guardar preferencias del usuario
async function savePreferences() {
    try {
        const preferredBarber = document.getElementById('preferred-barber').value;
        const preferredService = document.getElementById('preferred-service').value;
        const notifyEmail = document.getElementById('notify-email').checked;
        const notifySms = document.getElementById('notify-sms').checked;
        
        await usersRef.doc(auth.currentUser.uid).update({
            preferences: {
                preferredBarber,
                preferredService,
                notifications: {
                    email: notifyEmail,
                    sms: notifySms
                }
            },
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        showNotification('Éxito', 'Preferencias guardadas correctamente');
        
    } catch (error) {
        console.error('Error al guardar preferencias:', error);
        showNotification('Error', 'No se pudieron guardar las preferencias');
    }
}

// Abrir modal para editar perfil
function openEditProfileModal() {
    if (!userData) return;
    
    document.getElementById('edit-name').value = userData.name;
    document.getElementById('edit-phone').value = userData.phone || '';
    document.getElementById('edit-profile-modal').style.display = 'flex';
}

// Cerrar modal de edición de perfil
function closeEditProfileModal() {
    document.getElementById('edit-profile-modal').style.display = 'none';
}

// Guardar cambios en el perfil
async function saveProfileChanges(e) {
    e.preventDefault();
    
    const name = document.getElementById('edit-name').value.trim();
    const phone = document.getElementById('edit-phone').value.trim();
    
    if (!name || !phone) {
        showNotification('Error', 'Por favor, completa todos los campos');
        return;
    }
    
    try {
        await usersRef.doc(auth.currentUser.uid).update({
            name,
            phone,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        // Actualizar datos locales
        userData.name = name;
        userData.phone = phone;
        
        // Actualizar interfaz
        document.getElementById('user-name').textContent = name;
        document.getElementById('profile-name').textContent = name;
        document.getElementById('profile-phone').textContent = phone;
        
        showNotification('Éxito', 'Perfil actualizado correctamente');
        closeEditProfileModal();
        
    } catch (error) {
        console.error('Error al actualizar perfil:', error);
        showNotification('Error', 'No se pudo actualizar el perfil');
    }
}

// Abrir modal para cambiar contraseña
function openChangePasswordModal() {
    document.getElementById('change-password-modal').style.display = 'flex';
}

// Cerrar modal de cambio de contraseña
function closeChangePasswordModal() {
    document.getElementById('change-password-form').reset();
    document.getElementById('change-password-modal').style.display = 'none';
}

// Cambiar contraseña
async function changePassword(e) {
    e.preventDefault();
    
    const currentPassword = document.getElementById('current-password').value;
    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    
    // Validaciones
    if (!currentPassword || !newPassword || !confirmPassword) {
        showNotification('Error', 'Por favor, completa todos los campos');
        return;
    }
    
    if (newPassword !== confirmPassword) {
        showNotification('Error', 'Las nuevas contraseñas no coinciden');
        return;
    }
    
    if (newPassword.length < 6) {
        showNotification('Error', 'La nueva contraseña debe tener al menos 6 caracteres');
        return;
    }
    
    try {
        const user = auth.currentUser;
        const email = user.email;
        
        // Reautenticar al usuario
        const credential = firebase.auth.EmailAuthProvider.credential(email, currentPassword);
        await user.reauthenticateWithCredential(credential);
        
        // Cambiar contraseña
        await user.updatePassword(newPassword);
        
        showNotification('Éxito', 'Contraseña cambiada correctamente');
        closeChangePasswordModal();
        
    } catch (error) {
        console.error('Error al cambiar contraseña:', error);
        
        let errorMessage = 'No se pudo cambiar la contraseña';
        
        switch(error.code) {
            case 'auth/wrong-password':
                errorMessage = 'La contraseña actual es incorrecta';
                break;
            case 'auth/weak-password':
                errorMessage = 'La nueva contraseña es demasiado débil';
                break;
            case 'auth/requires-recent-login':
                errorMessage = 'Por seguridad, debes volver a iniciar sesión para cambiar la contraseña';
                break;
        }
        
        showNotification('Error', errorMessage);
    }
}

// Cargar reservas del usuario
async function loadUserAppointments(filter = 'upcoming') {
    try {
        if (!userData || !userData.phone) {
            document.getElementById('user-appointments').innerHTML = 
                '<div class="no-data">No tienes reservas</div>';
            return;
        }
        
        let query = appointmentsRef
            .where('clientPhone', '==', userData.phone)
            .orderBy('date', 'desc');
        
        const now = new Date();
        
        if (filter === 'upcoming') {
            query = query.where('date', '>=', now);
        } else if (filter === 'past') {
            query = query.where('date', '<', now);
        }
        // 'all' no aplica filtro de fecha
        
        const appointmentsSnapshot = await query.get();
        const appointmentsContainer = document.getElementById('user-appointments');
        
        if (appointmentsSnapshot.empty) {
            appointmentsContainer.innerHTML = '<div class="no-data">No tienes reservas</div>';
            return;
        }
        
        let html = '';
        
        appointmentsSnapshot.forEach(doc => {
            const appointment = doc.data();
            html += createAppointmentCard(doc.id, appointment);
        });
        
        appointmentsContainer.innerHTML = html;
        
        // Agregar event listeners a los botones de las tarjetas
        document.querySelectorAll('.cancel-appointment-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const appointmentId = this.getAttribute('data-id');
                cancelAppointment(appointmentId);
            });
        });
        
    } catch (error) {
        console.error('Error al cargar reservas del usuario:', error);
        document.getElementById('user-appointments').innerHTML = 
            '<div class="error">Error al cargar las reservas</div>';
    }
}

// Crear tarjeta de reserva para usuario
function createAppointmentCard(id, appointment) {
    const date = appointment.date.toDate();
    const now = new Date();
    const isPast = date < now;
    
    // Formatear fecha y hora
    const formattedDate = date.toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    const formattedTime = date.toLocaleTimeString('es-ES', { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
    
    // Determinar estado y clase
    let statusText = '';
    let statusClass = '';
    let canCancel = false;
    
    switch(appointment.status) {
        case 'pending':
            statusText = 'Pendiente';
            statusClass = 'status-pending';
            canCancel = !isPast;
            break;
        case 'confirmed':
            statusText = 'Confirmada';
            statusClass = 'status-confirmed';
            canCancel = !isPast;
            break;
        case 'completed':
            statusText = 'Completada';
            statusClass = 'status-completed';
            break;
        case 'cancelled':
            statusText = 'Cancelada';
            statusClass = 'status-cancelled';
            break;
    }
    
    // Mapear nombres de servicios
    const serviceNames = {
        'corte': 'Corte de cabello',
        'barba': 'Arreglo de barba',
        'combo': 'Corte + Barba',
        'tinte': 'Tinte de cabello',
        'facial': 'Tratamiento facial'
    };
    
    // Mapear nombres de barberos
    const barberNames = {
        'juan': 'Juan Pérez',
        'carlos': 'Carlos Gómez',
        'miguel': 'Miguel Rodríguez'
    };
    
    return `
        <div class="appointment-card ${isPast ? 'past' : ''}">
            <div class="appointment-header">
                <h3>${formattedDate}</h3>
                <span class="status-badge ${statusClass}">${statusText}</span>
            </div>
            
            <div class="appointment-details">
                <div class="detail">
                    <i class="fas fa-clock"></i>
                    <span>${formattedTime}</span>
                </div>
                
                <div class="detail">
                    <i class="fas fa-cut"></i>
                    <span>${serviceNames[appointment.service] || appointment.service}</span>
                </div>
                
                <div class="detail">
                    <i class="fas fa-user"></i>
                    <span>${barberNames[appointment.barber] || appointment.barber}</span>
                </div>
                
                ${appointment.notes ? `
                <div class="detail">
                    <i class="fas fa-sticky-note"></i>
                    <span>${appointment.notes}</span>
                </div>
                ` : ''}
            </div>
            
            ${canCancel ? `
            <div class="appointment-actions">
                <button class="btn-secondary cancel-appointment-btn" data-id="${id}">
                    <i class="fas fa-times"></i> Cancelar Reserva
                </button>
            </div>
            ` : ''}
        </div>
    `;
}

// Filtrar reservas del usuario
function filterUserAppointments(filterType) {
    // Actualizar botones activos
    document.querySelectorAll('.btn-filter').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`filter-${filterType}`).classList.add('active');
    
    // Cargar reservas con filtro
    loadUserAppointments(filterType);
}

// Cancelar reserva del usuario
async function cancelAppointment(appointmentId) {
    showConfirmation(
        'Cancelar Reserva',
        '¿Estás seguro de que deseas cancelar esta reserva?',
        async () => {
            try {
                await appointmentsRef.doc(appointmentId).update({
                    status: 'cancelled',
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                
                showNotification('Éxito', 'Reserva cancelada correctamente');
                loadUserAppointments();
                
            } catch (error) {
                console.error('Error al cancelar reserva:', error);
                showNotification('Error', 'No se pudo cancelar la reserva');
            }
        }
    );
}

// Configurar formulario de nueva reserva
function setupNewAppointmentForm() {
    // Establecer fecha mínima (hoy) y máxima (30 días en el futuro)
    const today = new Date();
    const maxDate = new Date();
    maxDate.setDate(today.getDate() + 30);
    
    const dateInput = document.getElementById('new-appointment-date');
    dateInput.min = today.toISOString().split('T')[0];
    dateInput.max = maxDate.toISOString().split('T')[0];
    dateInput.value = today.toISOString().split('T')[0];
    
    // Cargar horas disponibles
    updateAvailableTimes();
    
    // Aplicar preferencias del usuario si existen
    if (userData && userData.preferences) {
        const prefs = userData.preferences;
        
        if (prefs.preferredBarber) {
            document.getElementById('new-appointment-barber').value = prefs.preferredBarber;
        }
        
        if (prefs.preferredService) {
            document.getElementById('new-appointment-service').value = prefs.preferredService;
        }
    }
    
    // Actualizar resumen
    updateAppointmentSummary();
}

// Actualizar horas disponibles según la fecha seleccionada
async function updateAvailableTimes() {
    const dateInput = document.getElementById('new-appointment-date');
    const timeSelect = document.getElementById('new-appointment-time');
    const selectedBarber = document.getElementById('new-appointment-barber').value;
    
    if (!dateInput.value) return;
    
    try {
        // Mostrar estado de carga
        timeSelect.innerHTML = '<option value="">Cargando horas disponibles...</option>';
        timeSelect.disabled = true;
        
        // Obtener horarios de negocio desde configuración
        let openingTime = '09:00';
        let closingTime = '20:00';
        let slotDuration = 30; // minutos
        
        const configDoc = await siteConfigRef.get();
        if (configDoc.exists() && configDoc.data().businessHours) {
            const hours = configDoc.data().businessHours;
            openingTime = hours.opening || openingTime;
            closingTime = hours.closing || closingTime;
            slotDuration = hours.slotDuration || slotDuration;
        }
        
        // Convertir horas a minutos desde medianoche
        const openingMinutes = timeToMinutes(openingTime);
        const closingMinutes = timeToMinutes(closingTime);
        
        // Generar slots de tiempo
        const slots = [];
        for (let minutes = openingMinutes; minutes < closingMinutes; minutes += slotDuration) {
            slots.push(minutesToTime(minutes));
        }
        
        // Obtener reservas existentes para la fecha seleccionada
        const selectedDate = new Date(dateInput.value);
        selectedDate.setHours(0, 0, 0, 0);
        
        const nextDay = new Date(selectedDate);
        nextDay.setDate(nextDay.getDate() + 1);
        
        let appointmentsQuery = appointmentsRef
            .where('date', '>=', selectedDate)
            .where('date', '<', nextDay)
            .where('status', 'in', ['pending', 'confirmed']);
        
        // Si se seleccionó un barbero específico, filtrar por barbero
        if (selectedBarber) {
            appointmentsQuery = appointmentsQuery.where('barber', '==', selectedBarber);
        }
        
        const appointmentsSnapshot = await appointmentsQuery.get();
        
        // Crear conjunto de horas ocupadas
        const bookedTimes = new Set();
        appointmentsSnapshot.forEach(doc => {
            const appointment = doc.data();
            const appointmentTime = appointment.date.toDate();
            const timeString = appointmentTime.toTimeString().substring(0, 5);
            bookedTimes.add(timeString);
        });
        
        // Filtrar slots disponibles
        const availableSlots = slots.filter(slot => !bookedTimes.has(slot));
        
        // Actualizar select de horas
        timeSelect.innerHTML = '';
        
        if (availableSlots.length === 0) {
            timeSelect.innerHTML = '<option value="">No hay horas disponibles</option>';
        } else {
            timeSelect.innerHTML = '<option value="">Seleccionar hora</option>';
            availableSlots.forEach(slot => {
                const option = document.createElement('option');
                option.value = slot;
                option.textContent = slot;
                timeSelect.appendChild(option);
            });
        }
        
        timeSelect.disabled = false;
        
        // Actualizar resumen
        updateAppointmentSummary();
        
    } catch (error) {
        console.error('Error al cargar horas disponibles:', error);
        timeSelect.innerHTML = '<option value="">Error al cargar horas</option>';
    }
}

// Convertir tiempo (HH:MM) a minutos desde medianoche
function timeToMinutes(timeString) {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
}

// Convertir minutos desde medianoche a tiempo (HH:MM)
function minutesToTime(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

// Actualizar resumen de la reserva
function updateAppointmentSummary() {
    const date = document.getElementById('new-appointment-date').value;
    const time = document.getElementById('new-appointment-time').value;
    const service = document.getElementById('new-appointment-service').value;
    const barber = document.getElementById('new-appointment-barber').value;
    
    // Precios de servicios
    const servicePrices = {
        'corte': 15,
        'barba': 10,
        'combo': 20,
        'tinte': 25,
        'facial': 30
    };
    
    // Nombres de servicios
    const serviceNames = {
        'corte': 'Corte de cabello',
        'barba': 'Arreglo de barba',
        'combo': 'Corte + Barba',
        'tinte': 'Tinte de cabello',
        'facial': 'Tratamiento facial'
    };
    
    // Nombres de barberos
    const barberNames = {
        'juan': 'Juan Pérez',
        'carlos': 'Carlos Gómez',
        'miguel': 'Miguel Rodríguez',
        '': 'Cualquier barbero disponible'
    };
    
    // Actualizar detalles del resumen
    document.getElementById('summary-date').textContent = date 
        ? new Date(date).toLocaleDateString('es-ES')
        : '-';
    
    document.getElementById('summary-time').textContent = time || '-';
    document.getElementById('summary-service').textContent = service ? serviceNames[service] : '-';
    document.getElementById('summary-barber').textContent = barberNames[barber] || '-';
    
    // Calcular y mostrar total
    const total = servicePrices[service] || 0;
    document.getElementById('summary-total').textContent = `$${total}`;
}

// Confirmar nueva reserva (mostrar modal de confirmación)
function confirmNewAppointment(e) {
    e.preventDefault();
    
    // Obtener datos del formulario
    const date = document.getElementById('new-appointment-date').value;
    const time = document.getElementById('new-appointment-time').value;
    const service = document.getElementById('new-appointment-service').value;
    const barber = document.getElementById('new-appointment-barber').value;
    const notes = document.getElementById('new-appointment-notes').value.trim();
    
    // Validaciones
    if (!date || !time || !service) {
        showNotification('Error', 'Por favor, completa todos los campos obligatorios');
        return;
    }
    
    // Combinar fecha y hora
    const dateTime = new Date(`${date}T${time}`);
    
    // Verificar que la fecha no sea en el pasado
    if (dateTime < new Date()) {
        showNotification('Error', 'No se pueden crear reservas en fechas pasadas');
        return;
    }
    
    // Mostrar modal de confirmación con los detalles
    const serviceNames = {
        'corte': 'Corte de cabello',
        'barba': 'Arreglo de barba',
        'combo': 'Corte + Barba',
        'tinte': 'Tinte de cabello',
        'facial': 'Tratamiento facial'
    };
    
    const barberNames = {
        'juan': 'Juan Pérez',
        'carlos': 'Carlos Gómez',
        'miguel': 'Miguel Rodríguez',
        '': 'Cualquier barbero disponible'
    };
    
    const servicePrices = {
        'corte': 15,
        'barba': 10,
        'combo': 20,
        'tinte': 25,
        'facial': 30
    };
    
    const total = servicePrices[service] || 0;
    
    const confirmationHTML = `
        <div class="confirmation-details">
            <div class="detail">
                <strong>Fecha:</strong> ${new Date(date).toLocaleDateString('es-ES')}
            </div>
            <div class="detail">
                <strong>Hora:</strong> ${time}
            </div>
            <div class="detail">
                <strong>Servicio:</strong> ${serviceNames[service]}
            </div>
            <div class="detail">
                <strong>Barbero:</strong> ${barberNames[barber]}
            </div>
            ${notes ? `
            <div class="detail">
                <strong>Notas:</strong> ${notes}
            </div>
            ` : ''}
            <div class="detail total">
                <strong>Total a pagar:</strong> $${total}
            </div>
            <p class="confirmation-note">
                <i class="fas fa-info-circle"></i> El pago se realiza en el local al momento del servicio.
            </p>
        </div>
    `;
    
    document.getElementById('appointment-confirmation-details').innerHTML = confirmationHTML;
    document.getElementById('confirm-appointment-modal').style.display = 'flex';
    
    // Guardar datos temporalmente para usarlos al confirmar
    window.tempAppointmentData = { date, time, service, barber, notes, dateTime };
}

// Cerrar modal de confirmación
function closeConfirmationModal() {
    document.getElementById('confirm-appointment-modal').style.display = 'none';
    window.tempAppointmentData = null;
}

// Crear nueva reserva
async function createNewAppointment() {
    if (!window.tempAppointmentData || !userData) {
        showNotification('Error', 'Datos de reserva no disponibles');
        return;
    }
    
    const { date, time, service, barber, notes, dateTime } = window.tempAppointmentData;
    
    try {
        // Crear reserva en Firestore
        await appointmentsRef.add({
            clientName: userData.name,
            clientPhone: userData.phone,
            clientEmail: userData.email,
            date: dateTime,
            service,
            barber: barber || 'any',
            notes,
            status: 'pending',
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            userId: auth.currentUser.uid
        });
        
        showNotification('Éxito', 'Reserva creada correctamente');
        
        // Cerrar modal y limpiar formulario
        closeConfirmationModal();
        document.getElementById('new-appointment-form').reset();
        
        // Actualizar datos
        setupNewAppointmentForm();
        loadUserAppointments();
        
        // Actualizar contador en perfil
        const appointmentsSnapshot = await appointmentsRef
            .where('clientPhone', '==', userData.phone)
            .get();
        
        document.getElementById('profile-total-appointments').textContent = appointmentsSnapshot.size;
        
    } catch (error) {
        console.error('Error al crear reserva:', error);
        showNotification('Error', 'No se pudo crear la reserva');
    }
}

// Cargar historial del usuario
async function loadUserHistory() {
    try {
        if (!userData || !userData.phone) {
            document.querySelector('#history-table tbody').innerHTML = 
                '<tr><td colspan="6" class="no-data">No tienes reservas anteriores</td></tr>';
            return;
        }
        
        const appointmentsSnapshot = await appointmentsRef
            .where('clientPhone', '==', userData.phone)
            .orderBy('date', 'desc')
            .get();
        
        const tbody = document.querySelector('#history-table tbody');
        tbody.innerHTML = '';
        
        if (appointmentsSnapshot.empty) {
            tbody.innerHTML = '<tr><td colspan="6" class="no-data">No tienes reservas anteriores</td></tr>';
            return;
        }
        
        // Precios de servicios
        const servicePrices = {
            'corte': 15,
            'barba': 10,
            'combo': 20,
            'tinte': 25,
            'facial': 30
        };
        
        // Nombres de servicios
        const serviceNames = {
            'corte': 'Corte de cabello',
            'barba': 'Arreglo de barba',
            'combo': 'Corte + Barba',
            'tinte': 'Tinte de cabello',
            'facial': 'Tratamiento facial'
        };
        
        // Nombres de barberos
        const barberNames = {
            'juan': 'Juan Pérez',
            'carlos': 'Carlos Gómez',
            'miguel': 'Miguel Rodríguez',
            'any': 'Cualquiera'
        };
        
        appointmentsSnapshot.forEach(doc => {
            const appointment = doc.data();
            const date = appointment.date.toDate();
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${date.toLocaleDateString('es-ES')}</td>
                <td>${date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</td>
                <td>${serviceNames[appointment.service] || appointment.service}</td>
                <td>${barberNames[appointment.barber] || appointment.barber}</td>
                <td>
                    <span class="status-badge status-${appointment.status}">
                        ${appointment.status === 'pending' ? 'Pendiente' : 
                          appointment.status === 'confirmed' ? 'Confirmada' :
                          appointment.status === 'completed' ? 'Completada' : 'Cancelada'}
                    </span>
                </td>
                <td>$${servicePrices[appointment.service] || 0}</td>
            `;
            
            tbody.appendChild(row);
        });
        
    } catch (error) {
        console.error('Error al cargar historial:', error);
        document.querySelector('#history-table tbody').innerHTML = 
            '<tr><td colspan="6" class="error">Error al cargar el historial</td></tr>';
    }
}

// Cerrar sesión
async function logout() {
    try {
        await auth.signOut();
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Error al cerrar sesión:', error);
        showNotification('Error', 'No se pudo cerrar la sesión');
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

// Función para mostrar notificaciones
function showNotification(title, message) {
    // Crear elemento de notificación si no existe
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
        notification.querySelector('.close-modal').addEventListener('click', () => {
            notification.style.display = 'none';
        });
        
        // Cerrar al hacer clic fuera
        window.addEventListener('click', (e) => {
            if (e.target === notification) {
                notification.style.display = 'none';
            }
        });
    }
    
    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-message').textContent = message;
    notification.style.display = 'flex';
}

// Función para mostrar confirmación
function showConfirmation(title, message, action) {
    // Crear modal de confirmación si no existe
    let confirmModal = document.getElementById('confirm-modal');
    
    if (!confirmModal) {
        confirmModal = document.createElement('div');
        confirmModal.id = 'confirm-modal';
        confirmModal.className = 'modal';
        confirmModal.innerHTML = `
            <div class="modal-content">
                <h3 id="confirm-title"></h3>
                <p id="confirm-message"></p>
                <div class="modal-actions">
                    <button id="confirm-cancel" class="btn-secondary">Cancelar</button>
                    <button id="confirm-ok" class="btn-primary">Aceptar</button>
                </div>
            </div>
        `;
        document.body.appendChild(confirmModal);
        
        // Configurar botones
        confirmModal.querySelector('#confirm-cancel').addEventListener('click', () => {
            confirmModal.style.display = 'none';
        });
        
        confirmModal.querySelector('#confirm-ok').addEventListener('click', () => {
            if (window.confirmAction) {
                window.confirmAction();
            }
            confirmModal.style.display = 'none';
        });
        
        // Cerrar al hacer clic fuera
        window.addEventListener('click', (e) => {
            if (e.target === confirmModal) {
                confirmModal.style.display = 'none';
            }
        });
    }
    
    document.getElementById('confirm-title').textContent = title;
    document.getElementById('confirm-message').textContent = message;
    window.confirmAction = action;
    confirmModal.style.display = 'flex';
}