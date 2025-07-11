import { Server } from 'socket.io';
import News from '../models/News.js';
import User from '../models/User.js';

class NotificationService {
    constructor(httpServer) {
        // Inicializar Socket.IO
        this.io = new Server(httpServer, {
            cors: {
                origin: process.env.FRONTEND_URL || '*',
                methods: ["GET", "POST"]
            }
        });

        // Manejar conexiones de socket
        this.io.on('connection', this.handleConnection.bind(this));
    }

    // Manejar conexión de socket
    handleConnection(socket) {
        console.log('Cliente conectado');

        socket.on('authenticate', async (token) => {
            try {
                const user = this.verifyToken(token);
                if (user) {
                    socket.join(user.id.toString());
                    console.log(`Usuario ${user.id} autenticado`);
                }
            } catch (error) {
                console.error('Error de autenticación:', error);
            }
        });

        socket.on('disconnect', () => {
            console.log('Cliente desconectado');
        });
    }

    verifyToken(token) {
        // Implementa la lógica para verificar el token
        return null; // Placeholder
    }

    async notifyNewNews(news) {
        try {
            const admins = await User.findAll({ where: { rol: 'admin' } });

            admins.forEach(admin => {
                this.sendNotification(admin.id, {
                    type: 'new_news',
                    message: `Nueva noticia creada: ${news.titulo}`,
                    newsId: news.id
                });
            });
        } catch (error) {
            console.error('Error en notificación de nueva noticia:', error);
        }
    }

    async notifyPendingNews() {
        try {
            const pendingCount = await News.count({ where: { estado: 'pendiente' } });

            if (pendingCount > 0) {
                const admins = await User.findAll({ where: { rol: 'admin' } });

                admins.forEach(admin => {
                    this.sendNotification(admin.id, {
                        type: 'pending_news',
                        message: `Tienes ${pendingCount} noticias pendientes de revisión`,
                        count: pendingCount
                    });
                });
            }
        } catch (error) {
            console.error('Error en notificación de noticias pendientes:', error);
        }
    }

    sendNotification(userId, notification) {
        this.io.to(userId.toString()).emit('notification', notification);
    }

    setupPeriodicChecks() {
        setInterval(() => {
            this.notifyPendingNews();
        }, 60 * 60 * 1000);
    }
}

// Exportar la clase, no la instancia
export default NotificationService;
