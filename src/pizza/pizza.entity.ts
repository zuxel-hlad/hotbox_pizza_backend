import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('pizza_list')
export class PizzaEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  imgUrl: string;

  @Column()
  name: string;

  @Column('simple-array')
  ingredients: string[];

  @Column()
  calories: number;

  @Column()
  price: number;

  @Column({ default: 0 })
  favoritesCount: number;
}
