const dotenv = require('dotenv');

dotenv.config();

const resolveDatabaseName = () =>
  process.env.DB_DATABASE || process.env.DB_NAME || 'pelea_castillos';

const resolveHost = () => process.env.DB_HOST || '127.0.0.1';

const buildConfig = () => {
  if (process.env.DATABASE_URL) {
    return {
      use_env_variable: 'DATABASE_URL',
      dialect: 'postgres'
    };
  }

  const baseConfig = {
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || null,
    database: resolveDatabaseName(),
    host: resolveHost(),
    dialect: 'postgres'
  };

  if (process.env.DB_PORT) {
    baseConfig.port = Number(process.env.DB_PORT);
  }

  return baseConfig;
};

module.exports = {
  development: buildConfig(),
  test: buildConfig(),
  production: buildConfig()
};
