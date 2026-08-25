CREATE TABLE `companies` (
  `id` VARCHAR(191) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `slug` VARCHAR(191) NOT NULL,
  `active` BOOLEAN NOT NULL DEFAULT true,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  UNIQUE INDEX `companies_slug_key`(`slug`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `users` (
  `id` VARCHAR(191) NOT NULL,
  `companyId` VARCHAR(191) NULL,
  `name` VARCHAR(191) NOT NULL,
  `email` VARCHAR(191) NOT NULL,
  `passwordHash` VARCHAR(191) NOT NULL,
  `role` ENUM('SUPERADMIN','COMPANY_ADMIN','MEMBER') NOT NULL DEFAULT 'MEMBER',
  `active` BOOLEAN NOT NULL DEFAULT true,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  UNIQUE INDEX `users_email_key`(`email`),
  INDEX `users_companyId_idx`(`companyId`),
  INDEX `users_role_idx`(`role`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `creators` (
  `id` VARCHAR(191) NOT NULL,
  `companyId` VARCHAR(191) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `handle` VARCHAR(191) NOT NULL,
  `profileUrl` VARCHAR(191) NULL,
  `niche` VARCHAR(191) NULL,
  `followers` INTEGER NULL,
  `contact` VARCHAR(191) NULL,
  `contactOrigin` VARCHAR(191) NULL,
  `notes` TEXT NULL,
  `status` ENUM('FOUND','CONTACTED','RESPONDED','INTERESTED','PARTNERSHIP_ACCEPTED','ACTIVE_COLLABORATION','FINISHED','NOT_INTERESTED') NOT NULL DEFAULT 'FOUND',
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  UNIQUE INDEX `creators_companyId_handle_key`(`companyId`,`handle`),
  INDEX `creators_companyId_status_idx`(`companyId`,`status`),
  INDEX `creators_companyId_name_idx`(`companyId`,`name`),
  INDEX `creators_companyId_niche_idx`(`companyId`,`niche`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `products` (
  `id` VARCHAR(191) NOT NULL,
  `companyId` VARCHAR(191) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `sku` VARCHAR(191) NULL,
  `photoUrl` VARCHAR(191) NULL,
  `cost` DECIMAL(10,2) NULL,
  `tiktokUrl` VARCHAR(191) NULL,
  `active` BOOLEAN NOT NULL DEFAULT true,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  INDEX `products_companyId_name_idx`(`companyId`,`name`),
  INDEX `products_companyId_active_idx`(`companyId`,`active`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `samples` (
  `id` VARCHAR(191) NOT NULL,
  `companyId` VARCHAR(191) NOT NULL,
  `creatorId` VARCHAR(191) NOT NULL,
  `productId` VARCHAR(191) NOT NULL,
  `sentAt` DATETIME(3) NULL,
  `trackingCode` VARCHAR(191) NULL,
  `carrier` VARCHAR(191) NULL,
  `expectedAt` DATETIME(3) NULL,
  `receivedAt` DATETIME(3) NULL,
  `contentDueAt` DATETIME(3) NULL,
  `notes` TEXT NULL,
  `status` ENUM('PREPARING','SENT','IN_TRANSIT','RECEIVED','WAITING_CONTENT','CONTENT_PUBLISHED','CANCELED') NOT NULL DEFAULT 'PREPARING',
  `statusChangedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  INDEX `samples_companyId_status_idx`(`companyId`,`status`),
  INDEX `samples_companyId_creatorId_idx`(`companyId`,`creatorId`),
  INDEX `samples_companyId_productId_idx`(`companyId`,`productId`),
  INDEX `samples_companyId_contentDueAt_idx`(`companyId`,`contentDueAt`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `contents` (
  `id` VARCHAR(191) NOT NULL,
  `companyId` VARCHAR(191) NOT NULL,
  `creatorId` VARCHAR(191) NOT NULL,
  `productId` VARCHAR(191) NOT NULL,
  `sampleId` VARCHAR(191) NULL,
  `kind` ENUM('VIDEO','LIVE','OTHER') NOT NULL,
  `publishedAt` DATETIME(3) NOT NULL,
  `url` VARCHAR(191) NOT NULL,
  `views` INTEGER NULL,
  `sales` INTEGER NULL,
  `revenue` DECIMAL(12,2) NULL,
  `notes` TEXT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  INDEX `contents_companyId_publishedAt_idx`(`companyId`,`publishedAt`),
  INDEX `contents_companyId_creatorId_idx`(`companyId`,`creatorId`),
  INDEX `contents_companyId_productId_idx`(`companyId`,`productId`),
  INDEX `contents_companyId_sampleId_idx`(`companyId`,`sampleId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `settings` (
  `id` VARCHAR(191) NOT NULL,
  `companyId` VARCHAR(191) NOT NULL,
  `defaultContentDays` INTEGER NOT NULL DEFAULT 14,
  `warningDaysBeforeDue` INTEGER NOT NULL DEFAULT 3,
  `inactiveCreatorDays` INTEGER NOT NULL DEFAULT 30,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  UNIQUE INDEX `settings_companyId_key`(`companyId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `subscription_trials` (
  `id` VARCHAR(191) NOT NULL,
  `companyId` VARCHAR(191) NOT NULL,
  `trialEndsAt` DATETIME(3) NULL,
  `note` VARCHAR(191) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  UNIQUE INDEX `subscription_trials_companyId_key`(`companyId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `sessions` (
  `id` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191) NOT NULL,
  `tokenHash` VARCHAR(191) NOT NULL,
  `expiresAt` DATETIME(3) NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE INDEX `sessions_tokenHash_key`(`tokenHash`),
  INDEX `sessions_userId_idx`(`userId`),
  INDEX `sessions_expiresAt_idx`(`expiresAt`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `password_reset_tokens` (
  `id` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191) NOT NULL,
  `tokenHash` VARCHAR(191) NOT NULL,
  `expiresAt` DATETIME(3) NOT NULL,
  `usedAt` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE INDEX `password_reset_tokens_tokenHash_key`(`tokenHash`),
  INDEX `password_reset_tokens_userId_idx`(`userId`),
  INDEX `password_reset_tokens_expiresAt_idx`(`expiresAt`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `login_rate_limits` (
  `key` VARCHAR(191) NOT NULL,
  `attempts` INTEGER NOT NULL DEFAULT 0,
  `windowStart` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `blockedUntil` DATETIME(3) NULL,
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`key`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `users` ADD CONSTRAINT `users_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `companies`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `creators` ADD CONSTRAINT `creators_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `companies`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `products` ADD CONSTRAINT `products_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `companies`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `samples` ADD CONSTRAINT `samples_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `companies`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `samples` ADD CONSTRAINT `samples_creatorId_fkey` FOREIGN KEY (`creatorId`) REFERENCES `creators`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `samples` ADD CONSTRAINT `samples_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `contents` ADD CONSTRAINT `contents_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `companies`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `contents` ADD CONSTRAINT `contents_creatorId_fkey` FOREIGN KEY (`creatorId`) REFERENCES `creators`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `contents` ADD CONSTRAINT `contents_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `contents` ADD CONSTRAINT `contents_sampleId_fkey` FOREIGN KEY (`sampleId`) REFERENCES `samples`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `settings` ADD CONSTRAINT `settings_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `companies`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `subscription_trials` ADD CONSTRAINT `subscription_trials_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `companies`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `sessions` ADD CONSTRAINT `sessions_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `password_reset_tokens` ADD CONSTRAINT `password_reset_tokens_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
