import { PizzaEntity } from '@app/pizza/pizza.entity';
import { hash } from 'bcrypt';
import { BeforeInsert, Column, Entity, JoinTable, ManyToMany, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'users' })
export class UserEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  email: string;

  @Column()
  username: string;

  @Column({ default: '' })
  birthDate: string;

  @Column({ default: 150 })
  bonuses: number;

  @Column({ default: '' })
  image: string;

  @Column({ default: '' })
  phone: string;

  @Column({ select: false })
  password: string;

  @Column({ default: 0 })
  tokenVersion: number;

  @BeforeInsert()
  async hashPassword() {
    this.password = await hash(this.password, 10);
  }

  @ManyToMany(() => PizzaEntity, (pizza) => pizza.favoritedBy, { onDelete: 'CASCADE' })
  @JoinTable({ name: 'favorite_pizza' })
  favoritePizza: PizzaEntity[];
}
