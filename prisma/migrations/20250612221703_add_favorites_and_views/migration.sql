/*
  Warnings:

  - You are about to drop the column `message` on the `messages` table. All the data in the column will be lost.
  - You are about to drop the column `property_id` on the `messages` table. All the data in the column will be lost.
  - You are about to drop the column `recipient_id` on the `messages` table. All the data in the column will be lost.
  - You are about to drop the column `subject` on the `messages` table. All the data in the column will be lost.
  - The `listing_type` column on the `properties` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `properties` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `role` column on the `users` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `viewing_requests` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `content` to the `messages` table without a default value. This is not possible if the table is not empty.
  - Added the required column `conversation_id` to the `messages` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `messages` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "messages" DROP CONSTRAINT "messages_property_id_fkey";

-- DropForeignKey
ALTER TABLE "messages" DROP CONSTRAINT "messages_recipient_id_fkey";

-- AlterTable
ALTER TABLE "messages" DROP COLUMN "message",
DROP COLUMN "property_id",
DROP COLUMN "recipient_id",
DROP COLUMN "subject",
ADD COLUMN     "admin_broadcast_id" INTEGER,
ADD COLUMN     "content" TEXT NOT NULL,
ADD COLUMN     "conversation_id" INTEGER NOT NULL,
ADD COLUMN     "is_delivered" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "is_system_message" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "messageType" TEXT NOT NULL DEFAULT 'TEXT',
ADD COLUMN     "metadata" TEXT,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "properties" DROP COLUMN "listing_type",
ADD COLUMN     "listing_type" TEXT NOT NULL DEFAULT 'SALE',
ALTER COLUMN "price" SET DATA TYPE DECIMAL(65,30),
ALTER COLUMN "lot_size" SET DATA TYPE DECIMAL(65,30),
ALTER COLUMN "latitude" SET DATA TYPE DECIMAL(65,30),
ALTER COLUMN "longitude" SET DATA TYPE DECIMAL(65,30),
DROP COLUMN "status",
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'ACTIVE';

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "is_banned" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "is_online" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "is_suspended" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "last_seen" TIMESTAMP(3),
ADD COLUMN     "suspended_until" TIMESTAMP(3),
DROP COLUMN "role",
ADD COLUMN     "role" TEXT NOT NULL DEFAULT 'CLIENT';

-- AlterTable
ALTER TABLE "viewing_requests" ALTER COLUMN "preferred_date" SET DATA TYPE TIMESTAMP(3),
DROP COLUMN "status",
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'PENDING';

-- DropEnum
DROP TYPE "ListingType";

-- DropEnum
DROP TYPE "PropertyStatus";

-- DropEnum
DROP TYPE "Role";

-- DropEnum
DROP TYPE "ViewingStatus";

-- CreateTable
CREATE TABLE "conversations" (
    "id" SERIAL NOT NULL,
    "initiator_id" INTEGER NOT NULL,
    "receiver_id" INTEGER NOT NULL,
    "property_id" INTEGER,
    "subject" TEXT,
    "last_message_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "can_receiver_reply" BOOLEAN NOT NULL DEFAULT true,
    "admin_restricted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_broadcasts" (
    "id" SERIAL NOT NULL,
    "sender_id" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "subject" TEXT,
    "message_type" TEXT NOT NULL DEFAULT 'NOTIFICATION',
    "recipient_ids" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admin_broadcasts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_penalties" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "admin_id" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_penalties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_activities" (
    "id" SERIAL NOT NULL,
    "admin_id" INTEGER NOT NULL,
    "action" TEXT NOT NULL,
    "target_type" TEXT NOT NULL,
    "target_id" TEXT NOT NULL,
    "details" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_favorites" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "property_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_favorites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "property_views" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "property_id" INTEGER NOT NULL,
    "viewed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "property_views_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_favorites_user_id_property_id_key" ON "user_favorites"("user_id", "property_id");

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_initiator_id_fkey" FOREIGN KEY ("initiator_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_receiver_id_fkey" FOREIGN KEY ("receiver_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_admin_broadcast_id_fkey" FOREIGN KEY ("admin_broadcast_id") REFERENCES "admin_broadcasts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_broadcasts" ADD CONSTRAINT "admin_broadcasts_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_penalties" ADD CONSTRAINT "user_penalties_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_activities" ADD CONSTRAINT "admin_activities_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_favorites" ADD CONSTRAINT "user_favorites_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_favorites" ADD CONSTRAINT "user_favorites_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "property_views" ADD CONSTRAINT "property_views_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "property_views" ADD CONSTRAINT "property_views_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;
