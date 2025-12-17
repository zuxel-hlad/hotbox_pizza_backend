import { OrderStatus, PaymentType } from '@app/order/constants';
import { OrderPizzaDto } from '@app/order/dto';
import { UserEntity } from '@app/user/user.entity';
import { BeforeUpdate, Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

@Entity('order_list')
export class OrderEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  status: OrderStatus;

  @Column()
  paymentType: PaymentType;

  @Column('simple-json')
  pizzas: OrderPizzaDto[];

  @Column()
  primaryPhone: string;

  @Column()
  username: string;

  @Column()
  comment: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;

  @BeforeUpdate()
  updateTimestamp() {
    this.updatedAt = new Date();
  }

  @ManyToOne(() => UserEntity, (user) => user.orders, { nullable: true, onDelete: 'SET NULL' })
  user: UserEntity | null;

  @Column({ nullable: true })
  userId: number | null;
}
