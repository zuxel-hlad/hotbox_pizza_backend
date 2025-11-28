import { PizzaIngredient } from '@app/pizza/types/pizza.ingredient.interface';
import { UserEntity } from '@app/user/user.entity';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

@Entity('pizza_list')
export class PizzaEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ default: '' })
  imgUrl: string;

  @Column()
  nameEn: string;

  @Column()
  nameUa: string;

  @Column('simple-json')
  ingredients: PizzaIngredient[];

  @Column()
  calories: number;

  @Column()
  price: number;

  @Column({ default: 0 })
  favoritesCount: number;

  @ManyToOne(() => UserEntity, (user) => user.favoritePizza, { onDelete: 'CASCADE' })
  favoritedBy: UserEntity[];
}
