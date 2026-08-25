-- Fluxtok v3: self-service SaaS, billing, campaigns and TikTok Shop integration.
ALTER TABLE `companies` ADD COLUMN `onboardingCompleted` BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE `users` ADD COLUMN `lastLoginAt` DATETIME(3) NULL;
ALTER TABLE `products` ADD COLUMN `tiktokProductId` VARCHAR(191) NULL, ADD COLUMN `tiktokSyncedAt` DATETIME(3) NULL;
CREATE INDEX `products_companyId_tiktokProductId_idx` ON `products`(`companyId`,`tiktokProductId`);
ALTER TABLE `contents` ADD COLUMN `tiktokContentId` VARCHAR(191) NULL;

CREATE TABLE `campaigns` (
  `id` VARCHAR(191) NOT NULL,
  `companyId` VARCHAR(191) NOT NULL,
  `productId` VARCHAR(191) NULL,
  `name` VARCHAR(191) NOT NULL,
  `objective` VARCHAR(191) NULL,
  `status` ENUM('DRAFT','ACTIVE','PAUSED','FINISHED') NOT NULL DEFAULT 'DRAFT',
  `startsAt` DATETIME(3) NULL,
  `endsAt` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  INDEX `campaigns_companyId_status_idx`(`companyId`,`status`),
  INDEX `campaigns_companyId_productId_idx`(`companyId`,`productId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `samples` ADD COLUMN `campaignId` VARCHAR(191) NULL;
CREATE INDEX `samples_companyId_campaignId_idx` ON `samples`(`companyId`,`campaignId`);

CREATE TABLE `subscriptions` (
  `id` VARCHAR(191) NOT NULL,
  `companyId` VARCHAR(191) NOT NULL,
  `status` ENUM('TRIALING','ACTIVE','PAST_DUE','CANCELED','EXPIRED') NOT NULL DEFAULT 'TRIALING',
  `plan` ENUM('STARTER','PRO') NOT NULL DEFAULT 'STARTER',
  `trialStartsAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `trialEndsAt` DATETIME(3) NOT NULL,
  `currentPeriodEnd` DATETIME(3) NULL,
  `amount` DECIMAL(10,2) NULL,
  `currency` VARCHAR(191) NOT NULL DEFAULT 'BRL',
  `provider` VARCHAR(191) NULL DEFAULT 'mercadopago',
  `externalSubscriptionId` VARCHAR(191) NULL,
  `cancelAtPeriodEnd` BOOLEAN NOT NULL DEFAULT false,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  UNIQUE INDEX `subscriptions_companyId_key`(`companyId`),
  INDEX `subscriptions_status_idx`(`status`),
  INDEX `subscriptions_externalSubscriptionId_idx`(`externalSubscriptionId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `tiktok_connections` (
  `id` VARCHAR(191) NOT NULL,
  `companyId` VARCHAR(191) NOT NULL,
  `status` ENUM('CONNECTED','ERROR','DISCONNECTED') NOT NULL DEFAULT 'CONNECTED',
  `openId` VARCHAR(191) NULL,
  `sellerName` VARCHAR(191) NULL,
  `sellerBaseRegion` VARCHAR(191) NULL,
  `shopId` VARCHAR(191) NULL,
  `shopName` VARCHAR(191) NULL,
  `shopCipher` VARCHAR(191) NULL,
  `grantedScopes` TEXT NULL,
  `accessTokenEncrypted` TEXT NOT NULL,
  `refreshTokenEncrypted` TEXT NOT NULL,
  `accessTokenExpiresAt` DATETIME(3) NULL,
  `refreshTokenExpiresAt` DATETIME(3) NULL,
  `lastSyncAt` DATETIME(3) NULL,
  `lastError` TEXT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  UNIQUE INDEX `tiktok_connections_companyId_key`(`companyId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `tiktok_oauth_states` (
  `id` VARCHAR(191) NOT NULL,
  `companyId` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191) NOT NULL,
  `stateHash` VARCHAR(191) NOT NULL,
  `expiresAt` DATETIME(3) NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE INDEX `tiktok_oauth_states_stateHash_key`(`stateHash`),
  INDEX `tiktok_oauth_states_companyId_idx`(`companyId`),
  INDEX `tiktok_oauth_states_userId_idx`(`userId`),
  INDEX `tiktok_oauth_states_expiresAt_idx`(`expiresAt`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `audit_logs` (
  `id` VARCHAR(191) NOT NULL,
  `companyId` VARCHAR(191) NULL,
  `userId` VARCHAR(191) NULL,
  `action` VARCHAR(191) NOT NULL,
  `entity` VARCHAR(191) NULL,
  `entityId` VARCHAR(191) NULL,
  `metadata` TEXT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX `audit_logs_companyId_createdAt_idx`(`companyId`,`createdAt`),
  INDEX `audit_logs_userId_createdAt_idx`(`userId`,`createdAt`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `campaigns` ADD CONSTRAINT `campaigns_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `companies`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `campaigns` ADD CONSTRAINT `campaigns_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `samples` ADD CONSTRAINT `samples_campaignId_fkey` FOREIGN KEY (`campaignId`) REFERENCES `campaigns`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `subscriptions` ADD CONSTRAINT `subscriptions_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `companies`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `tiktok_connections` ADD CONSTRAINT `tiktok_connections_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `companies`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `tiktok_oauth_states` ADD CONSTRAINT `tiktok_oauth_states_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `companies`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `tiktok_oauth_states` ADD CONSTRAINT `tiktok_oauth_states_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `audit_logs` ADD CONSTRAINT `audit_logs_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `companies`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- Migra automaticamente empresas da V2 para o novo modelo de assinatura.
INSERT INTO `subscriptions` (`id`,`companyId`,`status`,`plan`,`trialStartsAt`,`trialEndsAt`,`currency`,`provider`,`cancelAtPeriodEnd`,`createdAt`,`updatedAt`)
SELECT CONCAT('sub_', REPLACE(UUID(),'-','')), c.`id`,
  CASE WHEN st.`trialEndsAt` IS NOT NULL AND st.`trialEndsAt` < CURRENT_TIMESTAMP(3) THEN 'EXPIRED' ELSE 'TRIALING' END,
  'STARTER', c.`createdAt`, COALESCE(st.`trialEndsAt`, DATE_ADD(CURRENT_TIMESTAMP(3), INTERVAL 7 DAY)), 'BRL', 'mercadopago', false, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)
FROM `companies` c
LEFT JOIN `subscription_trials` st ON st.`companyId` = c.`id`
WHERE NOT EXISTS (SELECT 1 FROM `subscriptions` s WHERE s.`companyId` = c.`id`);
