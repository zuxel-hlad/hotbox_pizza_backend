import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('extra_ingredients')
export class ExtraIngredientEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  nameEn: string;

  @Column()
  nameUa: string;

  @Column()
  calories: number;

  @Column()
  price: number;
}
