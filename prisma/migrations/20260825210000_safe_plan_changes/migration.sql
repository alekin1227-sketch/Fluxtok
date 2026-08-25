ALTER TABLE `subscriptions`
  ADD COLUMN `pendingPlan` ENUM('STARTER','PRO') NULL,
  ADD COLUMN `pendingAmount` DECIMAL(10,2) NULL,
  ADD COLUMN `pendingProvider` VARCHAR(191) NULL,
  ADD COLUMN `pendingExternalSubscriptionId` VARCHAR(191) NULL,
  ADD COLUMN `pendingCreatedAt` DATETIME(3) NULL;

CREATE INDEX `subscriptions_pendingExternalSubscriptionId_idx`
  ON `subscriptions`(`pendingExternalSubscriptionId`);
