import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('order_list')
export class OrderEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  pizzas: number;

  @Column()
  userId: number;

  @Column()
  primaryPhone: string;

  @Column()
  username: string;

  @Column()
  comment: string;
}

// @Column({ default: false })
// cheeseStuffedCrust: boolean;
//
// @Column({ default: false })
// sausageStuffedCrust: boolean;
