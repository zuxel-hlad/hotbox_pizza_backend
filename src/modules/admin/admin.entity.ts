import { Role } from '@common/types/role.enum';
import { OrderEntity } from '@modules/order/order.entity';
import { hash } from 'bcrypt';
import { BeforeInsert, Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'admins' })
export class AdminEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column()
  phone: string;

  @Column({ unique: true })
  email: string;

  @Column({ select: false })
  password: string;

  @Column({ type: 'varchar', default: Role.ADMIN })
  role: Role.ADMIN;

  @Column({ default: 0 })
  tokenVersion: number;

  @BeforeInsert()
  async hashPassword() {
    this.password = await hash(this.password, 10);
  }

  @OneToMany(() => OrderEntity, (order) => order.admin)
  orders: OrderEntity[];
}
