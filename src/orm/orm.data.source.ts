import ormConfig from '@app/orm/orm.config';
import { DataSource } from 'typeorm';

export default new DataSource(ormConfig);
