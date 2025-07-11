import express from 'express';
import dotenv from 'dotenv';
import http from 'http';
import cors from 'cors';
import cron from 'node-cron';

dotenv.config();

import { connectDB } from './config/db.js';
import { errorMiddleware } from './utils/errorHandler.js';
import cacheService from './services/cacheService.js';
import NotificationService from './services/notificationService.js';
import ApiNewsService from './services/ApiNewsService.js'; 

// Importar rutas
import newsRoutes from './routes/newsRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import authRoutes from './routes/authRoutes.js';
import newsServiceRoutes from './routes/newsServiceRoutes.js';
import userRoutes from './routes/userRoutes.js';
import apiNewsRoutes from './routes/apiNewsRoutes.js';
import categoryRoutes from "./routes/categoryRoutes.js";

// Función para sincronizar noticias de API 
const startNewsSync = async () => {
  try {
    const gnewsCategories = ['general', 'world', 'nation', 'business', 
                            'technology', 'entertainment', 'sports', 
                            'science', 'health'];
    
    for (const category of gnewsCategories) {
      try {
        await ApiNewsService.fetchAndSaveNews(category);
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (categoryError) {}
    }
    
    cron.schedule('0 */12 * * *', async () => {
      try {
        for (const category of gnewsCategories) {
          try {
            await ApiNewsService.fetchAndSaveNews(category);
            await new Promise(resolve => setTimeout(resolve, 1000));
          } catch (syncError) {}
        }
      } catch (error) {}
    });
  } catch (error) {}
};

// Inicializar la aplicación
const app = express();
const server = http.createServer(app);

// Inicializar servicio de notificaciones
const notificationService = new NotificationService(server);

// Configurar CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Middleware para parsear JSON
app.use(express.json());

// Conectar a la base de datos
connectDB();

// Configurar rutas
app.use('/api/news', newsRoutes);
app.use('/api/admin/news', adminRoutes);
app.use('/api/news/services', newsServiceRoutes);
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/news-api', apiNewsRoutes);
app.use('/api/category', categoryRoutes);

// Ruta de prueba para verificar que el servidor está funcionando
app.get('/api/test', (req, res) => {
  res.json({ message: 'API funcionando correctamente' });
});

// Middleware de manejo de errores
app.use(errorMiddleware);

// Puerto del servidor
const PORT = process.env.PORT || 5000;

// Iniciar el servidor
server.listen(PORT, () => {
  notificationService.setupPeriodicChecks();
  startNewsSync();
});

export default app;