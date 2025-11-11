import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitSchema1762559714264 implements MigrationInterface {
  name = 'InitSchema1762559714264';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "users" ("id" SERIAL NOT NULL, "email" character varying NOT NULL, "username" character varying NOT NULL, "birthDate" character varying NOT NULL DEFAULT '', "bonuses" integer NOT NULL DEFAULT '150', "image" character varying NOT NULL DEFAULT '', "phone" character varying NOT NULL DEFAULT '', "password" character varying NOT NULL, "tokenVersion" integer NOT NULL DEFAULT '0', CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "users"`);
  }
}
