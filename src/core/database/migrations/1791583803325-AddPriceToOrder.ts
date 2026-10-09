import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPriceToOrder1791583803325 implements MigrationInterface {
  name = 'AddPriceToOrder1791583803325';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "order_list" ADD "price" integer NOT NULL DEFAULT '0'`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "order_list" DROP COLUMN "price"`);
  }
}
