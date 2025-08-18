// Importo mongoose para manejar la conexión y los modelos de MongoDB.
import mongoose from 'mongoose';

/**
 * Esta función conecta mi aplicación a la base de datos MongoDB usando Mongoose.
 * Lee la URI desde las variables de entorno (process.env.MONGO_URI).
 * Si falla, muestro el error y corto el proceso para no dejar el server "a medias".
 */
export const connectDB = async () => {
  try {
    // Valido que exista la variable MONGO_URI. Si no está, tiro un error descriptivo.
    if (!process.env.MONGO_URI) {
      throw new Error('Falta la variable de entorno MONGO_URI');
    }

    // Opciones recomendadas de Mongoose. Algunas ya son default en v7/v8,
    // pero las dejo explícitas para claridad.
    const options = {
      // Mantengo el parser moderno de la URI (viene por defecto).
      // useNewUrlParser: true,
      // useUnifiedTopology: true,
      // Pool de conexiones (por si el server tiene muchas requests simultáneas).
      maxPoolSize: 10,
      // Tiempo máximo de espera para operaciones (en ms).
      serverSelectionTimeoutMS: 10000,
      // Retries internos (Mongoose maneja reconexiones; con Atlas suele ser estable).
    };

    // Hago la conexión. Si todo va bien, me devuelve la conexión activa.
    const conn = await mongoose.connect(process.env.MONGO_URI, options);

    // Log simple para confirmar que se conectó y a qué host.
    console.log(`✅ MongoDB conectado: ${conn.connection.host}`);

    // (Opcional) Eventos útiles para monitorear el estado de la conexión:
    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️  MongoDB desconectado');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('🔁 MongoDB reconectado');
    });

    // Devuelvo la conexión por si quiero usarla en otro lado (no es obligatorio).
    return conn;
  } catch (err) {
    // Si algo falla, lo muestro bien claro y cierro el proceso con código 1 (error).
    console.error('❌ Error al conectar con MongoDB:', err?.message || err);
    process.exit(1);
  }
};

// (Opcional) Manejo un apagado ordenado para evitar conexiones colgadas.
// Cuando el proceso recibe SIGINT (Ctrl+C) o SIGTERM (shutdown del hosting),
// cierro Mongoose y luego termino el proceso.
const gracefulShutdown = () => {
  mongoose.connection.close(() => {
    console.log('🛑 Conexión a MongoDB cerrada por apagado de la app');
    process.exit(0);
  });
};

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);
