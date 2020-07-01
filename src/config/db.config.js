const DB_USERNAME = process.env.DB_USERNAME || 'admin'
const DB_PASSWORD = process.env.DB_PASSWORD || 'April654321&'
const DB_NAME = process.env.DB_NAME || 'feedback'

export const DB_URL = `mongodb+srv://${DB_USERNAME}:${DB_PASSWORD}>@realmcluster.m9oi2.mongodb.net/${DB_NAME}?retryWrites=true&w=majority`
