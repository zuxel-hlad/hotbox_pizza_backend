import { join } from 'path';
import { PostgresDataSourceOptions } from 'typeorm/driver/postgres/PostgresDataSourceOptions';

const config: PostgresDataSourceOptions = {
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  username: 'hotbox_pizza_admin',
  password: '12345678',
  database: 'hotbox_pizza',
  entities: [join(__dirname, '..', '**', '*.entity.{ts,js}')],
  migrations: [join(__dirname, 'migrations', '**/*{.ts,.js}')],
  synchronize: false,
};

export default config;
