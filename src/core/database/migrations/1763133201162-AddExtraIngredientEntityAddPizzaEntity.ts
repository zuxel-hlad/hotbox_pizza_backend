import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddExtraIngredientEntityAddPizzaEntity1763133201162 implements MigrationInterface {
  name = 'AddExtraIngredientEntityAddPizzaEntity1763133201162';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "pizza_list" ("id" SERIAL NOT NULL, "imgUrl" character varying NOT NULL, "name" character varying NOT NULL, "ingredients" text NOT NULL, "calories" integer NOT NULL, "price" integer NOT NULL, "favoritesCount" integer NOT NULL DEFAULT '0', CONSTRAINT "PK_98b86d64a33a0e1d688634045cd" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "extra_ingredients" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "calories" integer NOT NULL, "price" integer NOT NULL, CONSTRAINT "PK_5d16ae462d36e79fcacfe3ea8c9" PRIMARY KEY ("id"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "extra_ingredients"`);
    await queryRunner.query(`DROP TABLE "pizza_list"`);
  }
}
