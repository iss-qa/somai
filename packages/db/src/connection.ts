import mongoose from 'mongoose'

let isConnected = false

export async function connectDB(uri: string, dbName?: string) {
  if (isConnected) return
  // Se o usuario passou DB_MONGO (ou se a URI nao tem /<db> no path),
  // forcamos o dbName aqui — sem isso, Atlas conecta no banco default `test`
  // e nada e encontrado.
  const opts = dbName ? { dbName } : undefined
  await mongoose.connect(uri, opts)
  isConnected = true
  const conn = mongoose.connection
  console.log(
    `MongoDB conectado — host=${conn.host} db=${conn.name || dbName || '(default)'}`,
  )
}
