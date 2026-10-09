import ormConfig from '@core/database/database.config';
import { DataSource } from 'typeorm';

export default new DataSource(ormConfig);
