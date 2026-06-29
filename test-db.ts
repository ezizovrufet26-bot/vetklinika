import { Pool } from 'pg'
import dotenv from 'dotenv'
dotenv.config()

const connectionString = process.env.DATABASE_URL
console.log('Connecting to:', connectionString?.replace(/:[^:@]+@/, ':***@'))

const pool = new Pool({ connectionString, connectionTimeoutMillis: 5000 })
pool.query('SELECT 1').then(() => {
  console.log('Connection successful!')
  process.exit(0)
}).catch(err => {
  console.error('Connection failed:', err.message)
  process.exit(1)
})
