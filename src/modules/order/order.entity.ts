import { OrderPizzaDto } from '@modules/order/dto/order-pizza.dto';
import { OrderStatus, PaymentType } from '@modules/order/order.constants';
import { UserEntity } from '@modules/user/user.entity';
import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('order_list')
export class OrderEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar' })
  status: OrderStatus;

  @Column({ type: 'varchar' })
  paymentType: PaymentType;

  @Column('simple-json')
  pizzas: OrderPizzaDto[];

  @Column()
  primaryPhone: string;

  @Column()
  username: string;

  @Column()
  comment: string;

  @Column({ type: 'int', default: 0 })
  price: number;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;

  @ManyToOne(() => UserEntity, (user) => user.orders, { nullable: true, onDelete: 'SET NULL' })
  user: UserEntity | null;

  @Column({ nullable: true })
  userId: number | null;
}
