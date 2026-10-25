import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAdminEntity1792958213046 implements MigrationInterface {
  name = 'AddAdminEntity1792958213046';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "admins" ("id" SERIAL NOT NULL, "firstName" character varying NOT NULL, "lastName" character varying NOT NULL, "phone" character varying NOT NULL, "email" character varying NOT NULL, "password" character varying NOT NULL, "role" character varying NOT NULL DEFAULT 'ADMIN', "tokenVersion" integer NOT NULL DEFAULT '0', CONSTRAINT "UQ_051db7d37d478a69a7432df1479" UNIQUE ("email"), CONSTRAINT "PK_e3b38270c97a854c48d2e80874e" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`ALTER TABLE "users" ADD "role" character varying NOT NULL DEFAULT 'CLIENT'`);
    await queryRunner.query(`ALTER TABLE "order_list" ADD "adminId" integer`);
    await queryRunner.query(
      `ALTER TABLE "order_list" ADD CONSTRAINT "FK_62e26e162cc30d73998b2a0cd0a" FOREIGN KEY ("adminId") REFERENCES "admins"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "order_list" DROP CONSTRAINT "FK_62e26e162cc30d73998b2a0cd0a"`);
    await queryRunner.query(`ALTER TABLE "order_list" DROP COLUMN "adminId"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "role"`);
    await queryRunner.query(`DROP TABLE "admins"`);
  }
}
