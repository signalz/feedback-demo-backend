// const DB_USERNAME = process.env.DB_USERNAME || 'admin';
// const DB_PASSWORD = process.env.DB_PASSWORD || 'April654321&';
const DB_NAME = process.env.DB_NAME || 'feedback';

const DB_URL = `mongodb://localhost:27017/${DB_NAME}`;

export default DB_URL;
