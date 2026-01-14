// Variables globales
let appointmentsChart = null;
let currentAppointmentId = null;
let confirmAction = null;

// Inicialización cuando el DOM está listo
document.addEventListener('DOMContentLoaded', function() {
    // Verificar autenticación y rol
    checkAdminAuth();
    
    // Cargar fondo de pantalla
    loadBackgroundImage('admin');
    
    // Establecer fecha actual
    const now = new Date();
    document.getElementById('current-date').textContent = now.toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    // Cargar información del administrador
    loadAdminInfo();
    
    // Configurar navegación
    setupNavigation();
    
    // Configurar eventos de botones
    setupEventListeners();
    
    // Cargar datos iniciales
    loadDashboardData();
    loadAppointments();
    loadCustomers();
    loadBackgroundPreviews();
    
    // Configurar modal de confirmación
    setupConfirmationModal();
});

// Verificar autenticación y rol de administrador
async function checkAdminAuth() {
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
        
        // Verificar si el usuario es administrador
        const userDoc = await usersRef.doc(user.uid).get();
        
        if (!userDoc.exists || userDoc.data().role !== 'admin') {
            showNotification('Acceso denegado', 'No tienes permisos de administrador');
            await auth.signOut();
            window.location.href = 'index.html';
        }
        
    } catch (error) {
        console.error('Error al verificar autenticación:', error);
        window.location.href = 'index.html';
    }
}

// Cargar información del administrador
function loadAdminInfo() {
    const user = auth.currentUser;
    
    if (user) {
        document.getElementById('admin-name').textContent = user.displayName || 'Administrador';
        document.getElementById('admin-email').textContent = user.email || 'eugeniopanacom@gmail.com'
    }
}

// Configurar navegación entre secciones
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
                case 'dashboard':
                    loadDashboardData();
                    break;
                case 'appointments':
                    loadAppointments();
                    break;
                case 'customers':
                    loadCustomers();
                    break;
                case 'backgrounds':
                    loadBackgroundPreviews();
                    break;
                case 'settings':
                    loadSettings();
                    break;
            }
        });
    });
}

// Configurar event listeners
function setupEventListeners() {
    // Botón de cerrar sesión
    document.getElementById('logout-btn').addEventListener('click', logout);
    
    // Botón de actualizar
    document.getElementById('refresh-data').addEventListener('click', function() {
        const activeSection = document.querySelector('.content-section.active').id;
        
        switch(activeSection) {
            case 'dashboard-section':
                loadDashboardData();
                break;
            case 'appointments-section':
                loadAppointments();
                break;
            case 'customers-section':
                loadCustomers();
                break;
        }
        
        showNotification('Actualizado', 'Datos actualizados correctamente');
    });
    
    // Botón de nueva reserva
    document.getElementById('new-appointment-btn').addEventListener('click', openNewAppointmentModal);
    
    // Filtros de reservas
    document.getElementById('filter-today').addEventListener('click', () => filterAppointments('today'));
    document.getElementById('filter-week').addEventListener('click', () => filterAppointments('week'));
    document.getElementById('filter-month').addEventListener('click', () => filterAppointments('month'));
    document.getElementById('filter-all').addEventListener('click', () => filterAppointments('all'));
    
    // Buscador de clientes
    document.getElementById('customer-search').addEventListener('input', searchCustomers);
    
    // Gestión de fondos de pantalla
    document.getElementById('upload-main-bg').addEventListener('click', () => document.getElementById('main-bg-upload').click());
    document.getElementById('upload-user-bg').addEventListener('click', () => document.getElementById('user-bg-upload').click());
    document.getElementById('upload-admin-bg').addEventListener('click', () => document.getElementById('admin-bg-upload').click());
    
    document.getElementById('main-bg-upload').addEventListener('change', (e) => uploadBackgroundImage(e, 'main'));
    document.getElementById('user-bg-upload').addEventListener('change', (e) => uploadBackgroundImage(e, 'user'));
    document.getElementById('admin-bg-upload').addEventListener('change', (e) => uploadBackgroundImage(e, 'admin'));
    
    document.getElementById('reset-main-bg').addEventListener('click', () => resetBackgroundImage('main'));
    document.getElementById('reset-user-bg').addEventListener('click', () => resetBackgroundImage('user'));
    document.getElementById('reset-admin-bg').addEventListener('click', () => resetBackgroundImage('admin'));
    
    // Configuración
    document.getElementById('save-hours').addEventListener('click', saveBusinessHours);
    document.getElementById('add-admin').addEventListener('click', addNewAdmin);
    
    // Modal de reserva
    document.querySelector('.close-modal').addEventListener('click', closeAppointmentModal);
    document.getElementById('cancel-appointment').addEventListener('click', closeAppointmentModal);
    document.getElementById('appointment-form').addEventListener('submit', saveAppointment);
    
    // Establecer fecha mínima para reservas (hoy)
    document.getElementById('appointment-date').min = new Date().toISOString().split('T')[0];
}

// Configurar modal de confirmación
function setupConfirmationModal() {
    const confirmModal = document.getElementById('confirm-modal');
    const confirmCancelBtn = document.getElementById('confirm-cancel');
    const confirmOkBtn = document.getElementById('confirm-ok');
    
    confirmCancelBtn.addEventListener('click', () => {
        confirmModal.style.display = 'none';
        confirmAction = null;
    });
    
    confirmOkBtn.addEventListener('click', () => {
        if (confirmAction) {
            confirmAction();
        }
        confirmModal.style.display = 'none';
        confirmAction = null;
    });
    
    // Cerrar modal al hacer clic fuera
    window.addEventListener('click', (e) => {
        if (e.target === confirmModal) {
            confirmModal.style.display = 'none';
            confirmAction = null;
        }
    });
}

// Mostrar modal de confirmación
function showConfirmation(title, message, action) {
    document.getElementById('confirm-title').textContent = title;
    document.getElementById('confirm-message').textContent = message;
    document.getElementById('confirm-modal').style.display = 'flex';
    confirmAction = action;
}

// Cargar datos del dashboard
async function loadDashboardData() {
    try {
        // Obtener estadísticas
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        // Contar reservas totales
        const totalAppointmentsSnapshot = await appointmentsRef.get();
        document.getElementById('total-appointments').textContent = totalAppointmentsSnapshot.size;
        
        // Contar reservas de hoy
        const todayAppointmentsSnapshot = await appointmentsRef
            .where('date', '>=', today)
            .where('date', '<', tomorrow)
            .get();
        document.getElementById('today-appointments').textContent = todayAppointmentsSnapshot.size;
        
        // Contar clientes registrados
        const customersSnapshot = await usersRef.where('role', '==', 'user').get();
        document.getElementById('total-customers').textContent = customersSnapshot.size;
        
        // Contar reservas pendientes (estado: pending)
        const pendingAppointmentsSnapshot = await appointmentsRef
            .where('status', '==', 'pending')
            .get();
        document.getElementById('pending-appointments').textContent = pendingAppointmentsSnapshot.size;
        
        // Cargar reservas recientes
        loadRecentAppointments();
        
        // Cargar gráfico
        loadAppointmentsChart();
        
    } catch (error) {
        console.error('Error al cargar datos del dashboard:', error);
        showNotification('Error', 'No se pudieron cargar los datos del dashboard');
    }
}

// Cargar reservas recientes
async function loadRecentAppointments() {
    try {
        const appointmentsSnapshot = await appointmentsRef
            .orderBy('date', 'desc')
            .limit(10)
            .get();
        
        const tbody = document.querySelector('#recent-appointments tbody');
        tbody.innerHTML = '';
        
        if (appointmentsSnapshot.empty) {
            tbody.innerHTML = '<tr><td colspan="5" class="no-data">No hay reservas recientes</td></tr>';
            return;
        }
        
        appointmentsSnapshot.forEach(doc => {
            const appointment = doc.data();
            const row = createAppointmentRow(doc.id, appointment, 'recent');
            tbody.appendChild(row);
        });
        
    } catch (error) {
        console.error('Error al cargar reservas recientes:', error);
    }
}

// Crear fila de reserva para tabla
function createAppointmentRow(id, appointment, context = 'full') {
    const row = document.createElement('tr');
    
    // Formatear fecha
    const date = appointment.date.toDate();
    const formattedDate = date.toLocaleDateString('es-ES');
    const formattedTime = date.toLocaleTimeString('es-ES', { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
    
    // Determinar clase de estado
    let statusClass = '';
    let statusText = '';
    
    switch(appointment.status) {
        case 'pending':
            statusClass = 'status-pending';
            statusText = 'Pendiente';
            break;
        case 'confirmed':
            statusClass = 'status-confirmed';
            statusText = 'Confirmada';
            break;
        case 'completed':
            statusClass = 'status-completed';
            statusText = 'Completada';
            break;
        case 'cancelled':
            statusClass = 'status-cancelled';
            statusText = 'Cancelada';
            break;
    }
    
    if (context === 'recent') {
        // Fila para tabla de reservas recientes (dashboard)
        row.innerHTML = `
            <td>${appointment.clientName}</td>
            <td>${formattedDate}</td>
            <td>${formattedTime}</td>
            <td><span class="status-badge ${statusClass}">${statusText}</span></td>
            <td>
                <button class="btn-table btn-edit" onclick="editAppointment('${id}')">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-table btn-complete" onclick="completeAppointment('${id}')">
                    <i class="fas fa-check"></i>
                </button>
            </td>
        `;
    } else {
        // Fila para tabla completa de reservas
        row.innerHTML = `
            <td>${id.substring(0, 8)}...</td>
            <td>${appointment.clientName}</td>
            <td>${appointment.clientPhone}</td>
            <td>${formattedDate}</td>
            <td>${formattedTime}</td>
            <td>${appointment.service}</td>
            <td>${appointment.barber}</td>
            <td><span class="status-badge ${statusClass}">${statusText}</span></td>
            <td>
                <button class="btn-table btn-edit" onclick="editAppointment('${id}')">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-table btn-complete" onclick="completeAppointment('${id}')">
                    <i class="fas fa-check"></i>
                </button>
                <button class="btn-table btn-delete" onclick="deleteAppointment('${id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
    }
    
    return row;
}

// Cargar gráfico de reservas
async function loadAppointmentsChart() {
    try {
        // Obtener reservas de los últimos 30 días
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const appointmentsSnapshot = await appointmentsRef
            .where('date', '>=', thirtyDaysAgo)
            .get();
        
        // Preparar datos para el gráfico
        const dailyCounts = {};
        
        appointmentsSnapshot.forEach(doc => {
            const appointment = doc.data();
            const date = appointment.date.toDate();
            const dateString = date.toISOString().split('T')[0];
            
            dailyCounts[dateString] = (dailyCounts[dateString] || 0) + 1;
        });
        
        // Ordenar fechas
        const dates = Object.keys(dailyCounts).sort();
        const counts = dates.map(date => dailyCounts[date]);
        
        // Obtener contexto del canvas
        const ctx = document.getElementById('appointments-chart').getContext('2d');
        
        // Destruir gráfico anterior si existe
        if (appointmentsChart) {
            appointmentsChart.destroy();
        }
        
        // Crear nuevo gráfico
        appointmentsChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: dates.map(date => new Date(date).toLocaleDateString('es-ES', { 
                    month: 'short', 
                    day: 'numeric' 
                })),
                datasets: [{
                    label: 'Reservas por día',
                    data: counts,
                    borderColor: 'rgba(233, 69, 96, 1)',
                    backgroundColor: 'rgba(233, 69, 96, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: {
                            color: '#ccc'
                        }
                    }
                },
                scales: {
                    x: {
                        grid: {
                            color: 'rgba(255, 255, 255, 0.05)'
                        },
                        ticks: {
                            color: '#aaa'
                        }
                    },
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(255, 255, 255, 0.05)'
                        },
                        ticks: {
                            color: '#aaa'
                        }
                    }
                }
            }
        });
        
    } catch (error) {
        console.error('Error al cargar gráfico de reservas:', error);
    }
}

// Cargar todas las reservas
async function loadAppointments(filter = 'all') {
    try {
        let query = appointmentsRef.orderBy('date', 'desc');
        
        // Aplicar filtros de fecha
        const now = new Date();
        
        if (filter === 'today') {
            const today = new Date(now);
            today.setHours(0, 0, 0, 0);
            
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            
            query = query.where('date', '>=', today).where('date', '<', tomorrow);
        } else if (filter === 'week') {
            const weekAgo = new Date(now);
            weekAgo.setDate(weekAgo.getDate() - 7);
            query = query.where('date', '>=', weekAgo);
        } else if (filter === 'month') {
            const monthAgo = new Date(now);
            monthAgo.setMonth(monthAgo.getMonth() - 1);
            query = query.where('date', '>=', monthAgo);
        }
        
        const appointmentsSnapshot = await query.get();
        const tbody = document.querySelector('#appointments-table tbody');
        tbody.innerHTML = '';
        
        if (appointmentsSnapshot.empty) {
            tbody.innerHTML = '<tr><td colspan="9" class="no-data">No hay reservas</td></tr>';
            return;
        }
        
        appointmentsSnapshot.forEach(doc => {
            const appointment = doc.data();
            const row = createAppointmentRow(doc.id, appointment);
            tbody.appendChild(row);
        });
        
    } catch (error) {
        console.error('Error al cargar reservas:', error);
        showNotification('Error', 'No se pudieron cargar las reservas');
    }
}

// Filtrar reservas
function filterAppointments(filterType) {
    // Actualizar botones activos
    document.querySelectorAll('.btn-filter').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`filter-${filterType}`).classList.add('active');
    
    // Cargar reservas con filtro
    loadAppointments(filterType);
}

// Abrir modal para nueva reserva
function openNewAppointmentModal() {
    currentAppointmentId = null;
    document.getElementById('modal-appointment-title').textContent = 'Nueva Reserva';
    document.getElementById('appointment-form').reset();
    
    // Establecer fecha mínima (hoy)
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('appointment-date').value = today;
    
    // Establecer hora por defecto (próxima hora en punto)
    const nextHour = new Date();
    nextHour.setHours(nextHour.getHours() + 1, 0, 0, 0);
    document.getElementById('appointment-time').value = nextHour.toTimeString().substring(0, 5);
    
    document.getElementById('appointment-modal').style.display = 'flex';
}

// Cerrar modal de reserva
function closeAppointmentModal() {
    document.getElementById('appointment-modal').style.display = 'none';
    currentAppointmentId = null;
}

// Guardar reserva (nueva o edición)
async function saveAppointment(e) {
    e.preventDefault();
    
    // Obtener datos del formulario
    const clientName = document.getElementById('client-name').value.trim();
    const clientPhone = document.getElementById('client-phone').value.trim();
    const appointmentDate = document.getElementById('appointment-date').value;
    const appointmentTime = document.getElementById('appointment-time').value;
    const serviceType = document.getElementById('service-type').value;
    const barber = document.getElementById('barber').value;
    const notes = document.getElementById('notes').value.trim();
    
    // Validaciones
    if (!clientName || !clientPhone || !appointmentDate || !appointmentTime || !serviceType || !barber) {
        showNotification('Error', 'Por favor, completa todos los campos obligatorios');
        return;
    }
    
    // Combinar fecha y hora
    const dateTime = new Date(`${appointmentDate}T${appointmentTime}`);
    
    // Verificar que la fecha no sea en el pasado
    if (dateTime < new Date()) {
        showNotification('Error', 'No se pueden crear reservas en fechas pasadas');
        return;
    }
    
    try {
        const appointmentData = {
            clientName,
            clientPhone,
            date: dateTime,
            service: serviceType,
            barber,
            notes,
            status: 'pending',
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        if (currentAppointmentId) {
            // Actualizar reserva existente
            await appointmentsRef.doc(currentAppointmentId).update(appointmentData);
            showNotification('Éxito', 'Reserva actualizada correctamente');
        } else {
            // Crear nueva reserva
            await appointmentsRef.add(appointmentData);
            showNotification('Éxito', 'Reserva creada correctamente');
        }
        
        // Cerrar modal y actualizar datos
        closeAppointmentModal();
        loadAppointments();
        loadDashboardData();
        
    } catch (error) {
        console.error('Error al guardar reserva:', error);
        showNotification('Error', 'No se pudo guardar la reserva');
    }
}

// Editar reserva
async function editAppointment(id) {
    try {
        const appointmentDoc = await appointmentsRef.doc(id).get();
        
        if (!appointmentDoc.exists) {
            showNotification('Error', 'La reserva no existe');
            return;
        }
        
        const appointment = appointmentDoc.data();
        currentAppointmentId = id;
        
        // Llenar formulario con datos de la reserva
        document.getElementById('modal-appointment-title').textContent = 'Editar Reserva';
        document.getElementById('client-name').value = appointment.clientName || '';
        document.getElementById('client-phone').value = appointment.clientPhone || '';
        
        // Formatear fecha y hora
        const date = appointment.date.toDate();
        document.getElementById('appointment-date').value = date.toISOString().split('T')[0];
        document.getElementById('appointment-time').value = date.toTimeString().substring(0, 5);
        
        document.getElementById('service-type').value = appointment.service || '';
        document.getElementById('barber').value = appointment.barber || '';
        document.getElementById('notes').value = appointment.notes || '';
        
        // Mostrar modal
        document.getElementById('appointment-modal').style.display = 'flex';
        
    } catch (error) {
        console.error('Error al cargar reserva para editar:', error);
        showNotification('Error', 'No se pudo cargar la reserva');
    }
}

// Completar reserva
async function completeAppointment(id) {
    showConfirmation(
        'Completar Reserva',
        '¿Estás seguro de que deseas marcar esta reserva como completada?',
        async () => {
            try {
                await appointmentsRef.doc(id).update({
                    status: 'completed',
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                
                showNotification('Éxito', 'Reserva marcada como completada');
                loadAppointments();
                loadDashboardData();
                
            } catch (error) {
                console.error('Error al completar reserva:', error);
                showNotification('Error', 'No se pudo completar la reserva');
            }
        }
    );
}

// Eliminar reserva
async function deleteAppointment(id) {
    showConfirmation(
        'Eliminar Reserva',
        '¿Estás seguro de que deseas eliminar esta reserva? Esta acción no se puede deshacer.',
        async () => {
            try {
                await appointmentsRef.doc(id).delete();
                showNotification('Éxito', 'Reserva eliminada correctamente');
                loadAppointments();
                loadDashboardData();
                
            } catch (error) {
                console.error('Error al eliminar reserva:', error);
                showNotification('Error', 'No se pudo eliminar la reserva');
            }
        }
    );
}

// Cargar clientes
async function loadCustomers() {
    try {
        const customersSnapshot = await usersRef.where('role', '==', 'user').get();
        const tbody = document.querySelector('#customers-table tbody');
        tbody.innerHTML = '';
        
        if (customersSnapshot.empty) {
            tbody.innerHTML = '<tr><td colspan="8" class="no-data">No hay clientes registrados</td></tr>';
            return;
        }
        
        // Para cada cliente, contar sus reservas
        for (const doc of customersSnapshot.docs) {
            const customer = doc.data();
            
            // Contar reservas del cliente
            const appointmentsSnapshot = await appointmentsRef
                .where('clientPhone', '==', customer.phone)
                .get();
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${doc.id.substring(0, 8)}...</td>
                <td>${customer.name}</td>
                <td>${customer.email || 'No especificado'}</td>
                <td>${customer.phone || 'No especificado'}</td>
                <td>${appointmentsSnapshot.size}</td>
                <td>${customer.createdAt ? customer.createdAt.toDate().toLocaleDateString('es-ES') : 'N/A'}</td>
                <td>
                    <span class="status-badge ${customer.isActive ? 'status-completed' : 'status-cancelled'}">
                        ${customer.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                </td>
                <td>
                    <button class="btn-table btn-edit" onclick="editCustomer('${doc.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-table btn-delete" onclick="deleteCustomer('${doc.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            
            tbody.appendChild(row);
        }
        
    } catch (error) {
        console.error('Error al cargar clientes:', error);
        showNotification('Error', 'No se pudieron cargar los clientes');
    }
}

// Buscar clientes
function searchCustomers() {
    const searchTerm = document.getElementById('customer-search').value.toLowerCase();
    const rows = document.querySelectorAll('#customers-table tbody tr');
    
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm) ? '' : 'none';
    });
}

// Editar cliente (función de ejemplo)
function editCustomer(customerId) {
    showNotification('Funcionalidad en desarrollo', 'La edición de clientes estará disponible próximamente');
}

// Eliminar cliente
async function deleteCustomer(customerId) {
    showConfirmation(
        'Eliminar Cliente',
        '¿Estás seguro de que deseas eliminar este cliente? También se eliminarán todas sus reservas.',
        async () => {
            try {
                // Eliminar reservas del cliente primero
                const customerDoc = await usersRef.doc(customerId).get();
                if (customerDoc.exists) {
                    const customer = customerDoc.data();
                    
                    // Buscar y eliminar reservas del cliente
                    const appointmentsSnapshot = await appointmentsRef
                        .where('clientPhone', '==', customer.phone)
                        .get();
                    
                    const batch = db.batch();
                    appointmentsSnapshot.forEach(doc => {
                        batch.delete(doc.ref);
                    });
                    
                    await batch.commit();
                }
                
                // Eliminar cliente
                await usersRef.doc(customerId).delete();
                
                showNotification('Éxito', 'Cliente eliminado correctamente');
                loadCustomers();
                loadDashboardData();
                
            } catch (error) {
                console.error('Error al eliminar cliente:', error);
                showNotification('Error', 'No se pudo eliminar el cliente');
            }
        }
    );
}

// Cargar vistas previas de fondos
async function loadBackgroundPreviews() {
    try {
        const configDoc = await siteConfigRef.get();
        
        if (configDoc.exists) {
            const configData = configDoc.data();
            
            // Mostrar vista previa para cada página
            const pages = ['main', 'user', 'admin'];
            
            pages.forEach(page => {
                const previewDiv = document.getElementById(`${page}-bg-preview`);
                const imageUrl = configData[`${page}Background`];
                
                if (imageUrl) {
                    previewDiv.innerHTML = `<img src="${imageUrl}" alt="Fondo ${page}">`;
                } else {
                    previewDiv.innerHTML = `<div class="no-image">
                        <i class="fas fa-image"></i>
                        <p>No hay imagen configurada</p>
                    </div>`;
                }
            });
        }
        
    } catch (error) {
        console.error('Error al cargar vistas previas de fondos:', error);
    }
}

// Subir imagen de fondo
async function uploadBackgroundImage(event, page) {
    const file = event.target.files[0];
    
    if (!file) return;
    
    // Validar tipo de archivo
    if (!file.type.match('image.*')) {
        showNotification('Error', 'Por favor, selecciona un archivo de imagen');
        return;
    }
    
    // Validar tamaño (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
        showNotification('Error', 'La imagen no debe superar los 5MB');
        return;
    }
    
    try {
        showNotification('Subiendo...', 'Subiendo imagen, por favor espera');
        
        // Crear referencia en Storage
        const storageRef = storage.ref();
        const imageRef = storageRef.child(`backgrounds/${page}_${Date.now()}_${file.name}`);
        
        // Subir archivo
        const uploadTask = await imageRef.put(file);
        const downloadURL = await uploadTask.ref.getDownloadURL();
        
        // Guardar URL en Firestore
        await siteConfigRef.set({
            [`${page}Background`]: downloadURL
        }, { merge: true });
        
        // Actualizar vista previa
        const previewDiv = document.getElementById(`${page}-bg-preview`);
        previewDiv.innerHTML = `<img src="${downloadURL}" alt="Fondo ${page}">`;
        
        showNotification('Éxito', 'Imagen de fondo actualizada correctamente');
        
    } catch (error) {
        console.error('Error al subir imagen de fondo:', error);
        showNotification('Error', 'No se pudo subir la imagen de fondo');
    }
}

// Restablecer imagen de fondo por defecto
async function resetBackgroundImage(page) {
    showConfirmation(
        'Restablecer fondo',
        `¿Estás seguro de que deseas restablecer el fondo de la página ${page} a su valor por defecto?`,
        async () => {
            try {
                // Eliminar referencia de Firestore
                await siteConfigRef.set({
                    [`${page}Background`]: firebase.firestore.FieldValue.delete()
                }, { merge: true });
                
                // Actualizar vista previa
                const previewDiv = document.getElementById(`${page}-bg-preview`);
                previewDiv.innerHTML = `<div class="no-image">
                    <i class="fas fa-image"></i>
                    <p>No hay imagen configurada</p>
                </div>`;
                
                showNotification('Éxito', 'Fondo restablecido correctamente');
                
            } catch (error) {
                console.error('Error al restablecer fondo:', error);
                showNotification('Error', 'No se pudo restablecer el fondo');
            }
        }
    );
}

// Cargar configuración
async function loadSettings() {
    // Esta función cargaría la configuración actual desde Firestore
    // Por ahora, solo muestra los valores por defecto
}

// Guardar horarios de trabajo
async function saveBusinessHours() {
    const openingTime = document.getElementById('opening-time').value;
    const closingTime = document.getElementById('closing-time').value;
    const slotDuration = document.getElementById('slot-duration').value;
    
    try {
        await siteConfigRef.set({
            businessHours: {
                opening: openingTime,
                closing: closingTime,
                slotDuration: parseInt(slotDuration)
            }
        }, { merge: true });
        
        showNotification('Éxito', 'Horarios guardados correctamente');
        
    } catch (error) {
        console.error('Error al guardar horarios:', error);
        showNotification('Error', 'No se pudieron guardar los horarios');
    }
}

// Agregar nuevo administrador
async function addNewAdmin() {
    const newAdminEmail = document.getElementById('new-admin-email').value.trim();
    
    if (!newAdminEmail) {
        showNotification('Error', 'Por favor, ingresa un correo electrónico');
        return;
    }
    
    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newAdminEmail)) {
        showNotification('Error', 'Por favor, ingresa un correo electrónico válido');
        return;
    }
    
    try {
        // Buscar usuario por email
        const usersSnapshot = await usersRef.where('email', '==', newAdminEmail).get();
        
        if (usersSnapshot.empty) {
            showNotification('Error', 'No se encontró un usuario con ese correo');
            return;
        }
        
        // Actualizar rol a administrador
        const userDoc = usersSnapshot.docs[0];
        await usersRef.doc(userDoc.id).update({
            role: 'admin',
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        document.getElementById('new-admin-email').value = '';
        showNotification('Éxito', 'Administrador agregado correctamente');
        
        // Recargar lista de administradores
        loadAdminList();
        
    } catch (error) {
        console.error('Error al agregar administrador:', error);
        showNotification('Error', 'No se pudo agregar el administrador');
    }
}

// Cargar lista de administradores
async function loadAdminList() {
    try {
        const adminsSnapshot = await usersRef.where('role', '==', 'admin').get();
        const adminListDiv = document.getElementById('admin-list');
        
        if (adminsSnapshot.empty) {
            adminListDiv.innerHTML = '<p class="no-data">No hay administradores</p>';
            return;
        }
        
        let html = '';
        adminsSnapshot.forEach(doc => {
            const admin = doc.data();
            html += `
                <div class="admin-item">
                    <div class="admin-info">
                        <strong>${admin.name}</strong>
                        <span>${admin.email}</span>
                    </div>
                    ${doc.id !== auth.currentUser.uid ? `
                        <button class="btn-table btn-delete" onclick="removeAdmin('${doc.id}')">
                            <i class="fas fa-times"></i>
                        </button>
                    ` : ''}
                </div>
            `;
        });
        
        adminListDiv.innerHTML = html;
        
    } catch (error) {
        console.error('Error al cargar lista de administradores:', error);
    }
}

// Eliminar administrador
async function removeAdmin(adminId) {
    showConfirmation(
        'Remover Administrador',
        '¿Estás seguro de que deseas remover los permisos de administrador a este usuario?',
        async () => {
            try {
                await usersRef.doc(adminId).update({
                    role: 'user',
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                
                showNotification('Éxito', 'Administrador removido correctamente');
                loadAdminList();
                
            } catch (error) {
                console.error('Error al remover administrador:', error);
                showNotification('Error', 'No se pudo remover el administrador');
            }
        }
    );
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

// Función para cargar imagen de fondo (similar a la de auth.js)
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

// Función para mostrar notificaciones (similar a la de auth.js)
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