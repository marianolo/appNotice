import dotenv from 'dotenv';

dotenv.config();

class CacheService {
    constructor() {
        // Caché en memoria (objeto simple)
        this.cache = {};
        // Registro de tiempos de expiración
        this.expirations = {};
        
        console.log('Servicio de caché en memoria inicializado');
        
        // Iniciar limpieza periódica de caché expirado
        this.cleanupInterval = setInterval(() => this.cleanupExpired(), 60000); // Limpiar cada minuto
    }

    /**
     * Limpia entradas expiradas del caché
     */
    cleanupExpired() {
        const now = Date.now();
        Object.keys(this.expirations).forEach(key => {
            if (this.expirations[key] <= now) {
                delete this.cache[key];
                delete this.expirations[key];
            }
        });
    }

    /**
     * Obtiene un valor del caché
     * @param {string} key - Clave del caché
     * @returns {Promise<any>} - Valor almacenado o null si no existe
     */
    async get(key) {
        try {
            // Verificar si la clave existe y no ha expirado
            if (key in this.cache) {
                // Verificar expiración
                if (this.expirations[key] && this.expirations[key] <= Date.now()) {
                    // Ha expirado, eliminar
                    delete this.cache[key];
                    delete this.expirations[key];
                    return null;
                }
                return this.cache[key];
            }
            return null;
        } catch (error) {
            console.error('Error al obtener del caché:', {
                key,
                error: error.message,
                stack: error.stack,
                timestamp: new Date().toISOString()
            });
            return null;
        }
    }

    /**
     * Almacena un valor en el caché
     * @param {string} key - Clave del caché
     * @param {any} value - Valor a almacenar
     * @param {number} expiration - Tiempo de expiración en segundos (default: 60)
     * @returns {Promise<boolean>} - True si se almacenó correctamente
     */
    async set(key, value, expiration = 60) { // Reducido de 300 a 60 segundos
        try {
            // Almacenar valor
            this.cache[key] = value;
            
            // Establecer tiempo de expiración
            if (expiration > 0) {
                this.expirations[key] = Date.now() + (expiration * 1000);
            } else {
                // Sin expiración
                delete this.expirations[key];
            }
            
            return true;
        } catch (error) {
            console.error('Error al guardar en caché:', {
                key,
                error: error.message,
                stack: error.stack,
                timestamp: new Date().toISOString()
            });
            return false;
        }
    }

    /**
     * Elimina una o más claves del caché
     * @param {...string} keys - Claves a eliminar
     * @returns {Promise<number>} - Número de claves eliminadas
     */
    async del(...keys) {
        try {
            let deleted = 0;
            keys.forEach(key => {
                if (key in this.cache) {
                    delete this.cache[key];
                    delete this.expirations[key];
                    deleted++;
                }
            });
            return deleted;
        } catch (error) {
            console.error('Error al eliminar del caché:', {
                keys,
                error: error.message,
                stack: error.stack,
                timestamp: new Date().toISOString()
            });
            return 0;
        }
    }

    /**
     * Obtiene claves que coincidan con un patrón
     * @param {string} pattern - Patrón para buscar claves (usando * como comodín)
     * @returns {Promise<string[]>} - Array de claves que coinciden
     */
    async keys(pattern) {
        try {
            // Convertir patrón tipo Redis (*) a expresión regular
            const regex = new RegExp(pattern.replace(/\*/g, '.*'));
            return Object.keys(this.cache).filter(key => regex.test(key));
        } catch (error) {
            console.error(`Error al obtener claves de caché:`, {
                pattern,
                error: error.message,
                stack: error.stack,
                timestamp: new Date().toISOString()
            });
            return [];
        }
    }

    /**
     * Patrón cache-aside para consultas frecuentes
     * @param {string} key - Clave del caché
     * @param {Function} queryFn - Función que devuelve una Promise con los datos
     * @param {number} expiration - Tiempo de expiración en segundos (default: 60)
     * @returns {Promise<any>} - Datos desde caché o función de consulta
     */
    async cachedQuery(key, queryFn, expiration = 60) { // Reducido de 300 a 60 segundos
        try {
            // Intentar obtener de caché primero
            const cachedResult = await this.get(key);
            if (cachedResult !== null) {
                return cachedResult;
            }

            // Si no está en caché, ejecutar consulta
            const result = await queryFn();

            // Guardar resultado en caché (si no es null/undefined)
            if (result !== null && result !== undefined) {
                await this.set(key, result, expiration);
            }

            return result;
        } catch (error) {
            console.error('Error en cachedQuery:', {
                key,
                error: error.message,
                stack: error.stack,
                timestamp: new Date().toISOString()
            });
            throw error;
        }
    }

    /**
     * Obtiene el tiempo restante de vida de una clave (TTL)
     * @param {string} key - Clave a verificar
     * @returns {Promise<number>} - TTL en segundos (-2 si no existe, -1 si no tiene expiración)
     */
    async ttl(key) {
        try {
            if (!(key in this.cache)) {
                return -2; // No existe
            }
            
            if (!(key in this.expirations)) {
                return -1; // No tiene expiración
            }
            
            // Calcular tiempo restante en segundos
            const remaining = Math.ceil((this.expirations[key] - Date.now()) / 1000);
            return remaining > 0 ? remaining : -2; // Si ya expiró, tratar como no existente
        } catch (error) {
            console.error('Error al obtener TTL:', {
                key,
                error: error.message,
                stack: error.stack,
                timestamp: new Date().toISOString()
            });
            return -2;
        }
    }

    /**
     * Limpia todo el caché (¡Usar con precaución!)
     * @returns {Promise<boolean>} - True si se limpió correctamente
     */
    async flush() {
        try {
            this.cache = {};
            this.expirations = {};
            return true;
        } catch (error) {
            console.error('Error al limpiar caché:', {
                error: error.message,
                stack: error.stack,
                timestamp: new Date().toISOString()
            });
            return false;
        }
    }
    
    /**
     * Destruye el servicio de caché y libera recursos
     */
    destroy() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
        }
    }
}

export default new CacheService();