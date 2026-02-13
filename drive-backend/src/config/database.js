const env = require('./env');

const sslConfig = env.DB_SSL ? {
    ssl: {
        require: true,
        rejectUnauthorized: false,
    },
} : {};

const baseConfig = env.DATABASE_URL ? {
    url: env.DATABASE_URL,
    dialect: 'postgres',
    dialectOptions: sslConfig,
} : {
    username: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
    host: env.DB_HOST,
    port: env.DB_PORT,
    dialect: 'postgres',
    dialectOptions: sslConfig,
};

module.exports = {
    development: {
        ...baseConfig,
        logging: console.log,
    },
    test: {
        ...baseConfig,
        database: env.DATABASE_URL ? undefined : `${env.DB_NAME}_test`,
        logging: false,
    },
    production: {
        ...baseConfig,
        logging: false,
        pool: {
            max: 10,
            min: 0,
            acquire: 30000,
            idle: 10000,
        },
    },
};
