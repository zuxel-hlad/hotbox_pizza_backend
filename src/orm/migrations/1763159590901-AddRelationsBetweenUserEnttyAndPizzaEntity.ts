import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRelationsBetweenUserEnttyAndPizzaEntity1763159590901 implements MigrationInterface {
  name = 'AddRelationsBetweenUserEnttyAndPizzaEntity1763159590901';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "users_favorite_pizzas_pizza_list" ("usersId" integer NOT NULL, "pizzaListId" integer NOT NULL, CONSTRAINT "PK_2af5192e179e6e9052fbe380102" PRIMARY KEY ("usersId", "pizzaListId"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_efee6482998475b95529b89739" ON "users_favorite_pizzas_pizza_list" ("usersId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_6ba24de5ab11f993dd5d2574d9" ON "users_favorite_pizzas_pizza_list" ("pizzaListId") `,
    );
    await queryRunner.query(`ALTER TABLE "pizza_list" DROP COLUMN "name"`);
    await queryRunner.query(`ALTER TABLE "pizza_list" ADD "nameEn" character varying NOT NULL`);
    await queryRunner.query(`ALTER TABLE "pizza_list" ADD "nameUa" character varying NOT NULL`);
    await queryRunner.query(
      `ALTER TABLE "users_favorite_pizzas_pizza_list" ADD CONSTRAINT "FK_efee6482998475b95529b897395" FOREIGN KEY ("usersId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "users_favorite_pizzas_pizza_list" ADD CONSTRAINT "FK_6ba24de5ab11f993dd5d2574d99" FOREIGN KEY ("pizzaListId") REFERENCES "pizza_list"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users_favorite_pizzas_pizza_list" DROP CONSTRAINT "FK_6ba24de5ab11f993dd5d2574d99"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users_favorite_pizzas_pizza_list" DROP CONSTRAINT "FK_efee6482998475b95529b897395"`,
    );
    await queryRunner.query(`ALTER TABLE "pizza_list" DROP COLUMN "nameUa"`);
    await queryRunner.query(`ALTER TABLE "pizza_list" DROP COLUMN "nameEn"`);
    await queryRunner.query(`ALTER TABLE "pizza_list" ADD "name" character varying NOT NULL`);
    await queryRunner.query(`DROP INDEX "public"."IDX_6ba24de5ab11f993dd5d2574d9"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_efee6482998475b95529b89739"`);
    await queryRunner.query(`DROP TABLE "users_favorite_pizzas_pizza_list"`);
  }
}
