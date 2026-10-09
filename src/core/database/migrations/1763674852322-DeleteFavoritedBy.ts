import { MigrationInterface, QueryRunner } from 'typeorm';

export class DeleteFavoritedBy1763674852322 implements MigrationInterface {
  name = 'DeleteFavoritedBy1763674852322';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "pizza_list" ALTER COLUMN "imgUrl" SET DEFAULT ''`);
    await queryRunner.query(`ALTER TABLE "pizza_list" DROP COLUMN "ingredients"`);
    await queryRunner.query(`ALTER TABLE "pizza_list" ADD "ingredients" text NOT NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "pizza_list" DROP COLUMN "ingredients"`);
    await queryRunner.query(`ALTER TABLE "pizza_list" ADD "ingredients" json NOT NULL`);
    await queryRunner.query(`ALTER TABLE "pizza_list" ALTER COLUMN "imgUrl" DROP DEFAULT`);
  }
}
