const app = require('./app');
const db = require('./models');
const dotenv = require('dotenv');

dotenv.config();

const PORT = process.env.PORT || process.env.DB_PORT || 3000;

db.sequelize
  .authenticate()
  .then(() => {
    console.log('Connection to the database has been established successfully');
    app.listen(PORT, (err) => {
      if (err) {
        console.error('Failed', err);
        return;
      }
      console.log(`Listening on port ${PORT}`);
    });
  })
  .catch((err) => console.error('Unable to connect to database:', err));