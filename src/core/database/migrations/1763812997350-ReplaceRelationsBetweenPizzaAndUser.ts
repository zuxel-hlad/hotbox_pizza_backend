import { MigrationInterface, QueryRunner } from 'typeorm';

export class ReplaceRelationsBetweenPizzaAndUser1763812997350 implements MigrationInterface {
  name = 'ReplaceRelationsBetweenPizzaAndUser1763812997350';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "favorite_pizza" ("usersId" integer NOT NULL, "pizzaListId" integer NOT NULL, CONSTRAINT "PK_590051444b347c3c964b256ddc3" PRIMARY KEY ("usersId", "pizzaListId"))`,
    );
    await queryRunner.query(`CREATE INDEX "IDX_07f806d04a779c89dd62605849" ON "favorite_pizza" ("usersId") `);
    await queryRunner.query(`CREATE INDEX "IDX_6b87c959e162153c8689749d3b" ON "favorite_pizza" ("pizzaListId") `);
    await queryRunner.query(`ALTER TABLE "pizza_list" ADD "favoritedById" integer`);
    await queryRunner.query(
      `ALTER TABLE "pizza_list" ADD CONSTRAINT "FK_d9c0aa861aac7eb46205e1063a9" FOREIGN KEY ("favoritedById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "favorite_pizza" ADD CONSTRAINT "FK_07f806d04a779c89dd62605849d" FOREIGN KEY ("usersId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "favorite_pizza" ADD CONSTRAINT "FK_6b87c959e162153c8689749d3bf" FOREIGN KEY ("pizzaListId") REFERENCES "pizza_list"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "favorite_pizza" DROP CONSTRAINT "FK_6b87c959e162153c8689749d3bf"`);
    await queryRunner.query(`ALTER TABLE "favorite_pizza" DROP CONSTRAINT "FK_07f806d04a779c89dd62605849d"`);
    await queryRunner.query(`ALTER TABLE "pizza_list" DROP CONSTRAINT "FK_d9c0aa861aac7eb46205e1063a9"`);
    await queryRunner.query(`ALTER TABLE "pizza_list" DROP COLUMN "favoritedById"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_6b87c959e162153c8689749d3b"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_07f806d04a779c89dd62605849"`);
    await queryRunner.query(`DROP TABLE "favorite_pizza"`);
  }
}
