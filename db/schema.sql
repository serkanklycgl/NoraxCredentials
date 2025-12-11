-- Norax Credentials DB schema
-- Run against database: NoraxCredentials

IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Categories]') AND type IN (N'U'))
BEGIN
    CREATE TABLE [dbo].[Categories](
        [Id] UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
        [Name] NVARCHAR(100) NOT NULL UNIQUE,
        [Description] NVARCHAR(500) NULL,
        [SortOrder] INT NOT NULL CONSTRAINT DF_Categories_SortOrder DEFAULT 99
    );
END
GO

IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Credentials]') AND type IN (N'U'))
BEGIN
    CREATE TABLE [dbo].[Credentials](
        [Id] UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
        [CategoryId] UNIQUEIDENTIFIER NOT NULL,
        [Name] NVARCHAR(150) NOT NULL,
        [HostOrUrl] NVARCHAR(200) NULL,
        [Username] NVARCHAR(150) NULL,
        [EncryptedPassword] NVARCHAR(MAX) NULL,
        [EncryptedConnectionString] NVARCHAR(MAX) NULL,
        [EncryptedNotes] NVARCHAR(MAX) NULL,
        [AppName] NVARCHAR(200) NULL,
        [AppLink] NVARCHAR(300) NULL,
        [AccountFirstName] NVARCHAR(100) NULL,
        [AccountLastName] NVARCHAR(100) NULL,
        [AccountEmail] NVARCHAR(200) NULL,
        [AccountRole] NVARCHAR(100) NULL,
        [ServerVpnRequired] BIT NULL,
        [CreatedAtUtc] DATETIME2 NOT NULL CONSTRAINT DF_Credentials_Created DEFAULT SYSUTCDATETIME(),
        [UpdatedAtUtc] DATETIME2 NOT NULL CONSTRAINT DF_Credentials_Updated DEFAULT SYSUTCDATETIME()
    );

    ALTER TABLE [dbo].[Credentials] WITH CHECK ADD CONSTRAINT [FK_Credentials_Categories] FOREIGN KEY([CategoryId])
        REFERENCES [dbo].[Categories] ([Id]) ON DELETE CASCADE;

    CREATE INDEX IX_Credentials_CategoryId ON [dbo].[Credentials]([CategoryId]);
END
GO

-- Ensure new columns exist for category-specific fields
IF COL_LENGTH('dbo.Credentials', 'AppName') IS NULL
    ALTER TABLE [dbo].[Credentials] ADD [AppName] NVARCHAR(200) NULL;
IF COL_LENGTH('dbo.Credentials', 'AppLink') IS NULL
    ALTER TABLE [dbo].[Credentials] ADD [AppLink] NVARCHAR(300) NULL;
IF COL_LENGTH('dbo.Credentials', 'AccountFirstName') IS NULL
    ALTER TABLE [dbo].[Credentials] ADD [AccountFirstName] NVARCHAR(100) NULL;
IF COL_LENGTH('dbo.Credentials', 'AccountLastName') IS NULL
    ALTER TABLE [dbo].[Credentials] ADD [AccountLastName] NVARCHAR(100) NULL;
IF COL_LENGTH('dbo.Credentials', 'AccountEmail') IS NULL
    ALTER TABLE [dbo].[Credentials] ADD [AccountEmail] NVARCHAR(200) NULL;
IF COL_LENGTH('dbo.Credentials', 'AccountRole') IS NULL
    ALTER TABLE [dbo].[Credentials] ADD [AccountRole] NVARCHAR(100) NULL;
IF COL_LENGTH('dbo.Credentials', 'ServerVpnRequired') IS NULL
    ALTER TABLE [dbo].[Credentials] ADD [ServerVpnRequired] BIT NULL;
GO

-- Ensure sort order column exists for categories
IF COL_LENGTH('dbo.Categories', 'SortOrder') IS NULL
BEGIN
    ALTER TABLE [dbo].[Categories] ADD [SortOrder] INT NOT NULL CONSTRAINT DF_Categories_SortOrder DEFAULT 99;
END
GO

IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Users]') AND type IN (N'U'))
BEGIN
    CREATE TABLE [dbo].[Users](
        [Id] UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
        [Email] NVARCHAR(200) NOT NULL UNIQUE,
        [PasswordHash] NVARCHAR(500) NOT NULL,
        [Role] NVARCHAR(100) NOT NULL DEFAULT 'Admin',
        [CreatedAtUtc] DATETIME2 NOT NULL CONSTRAINT DF_Users_Created DEFAULT SYSUTCDATETIME()
    );
END
GO

IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[UserCredentialAccesses]') AND type IN (N'U'))
BEGIN
    CREATE TABLE [dbo].[UserCredentialAccesses](
        [UserId] UNIQUEIDENTIFIER NOT NULL,
        [CredentialId] UNIQUEIDENTIFIER NOT NULL,
        [GrantedAtUtc] DATETIME2 NOT NULL CONSTRAINT DF_UserCredentialAccesses_Granted DEFAULT SYSUTCDATETIME(),
        CONSTRAINT [PK_UserCredentialAccesses] PRIMARY KEY ([UserId], [CredentialId])
    );

    ALTER TABLE [dbo].[UserCredentialAccesses] WITH CHECK ADD CONSTRAINT [FK_UserCredentialAccesses_Users] FOREIGN KEY([UserId])
        REFERENCES [dbo].[Users] ([Id]) ON DELETE CASCADE;

    ALTER TABLE [dbo].[UserCredentialAccesses] WITH CHECK ADD CONSTRAINT [FK_UserCredentialAccesses_Credentials] FOREIGN KEY([CredentialId])
        REFERENCES [dbo].[Credentials] ([Id]) ON DELETE CASCADE;

    CREATE INDEX IX_UserCredentialAccesses_CredentialId ON [dbo].[UserCredentialAccesses]([CredentialId]);
END
GO

IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[CredentialFiles]') AND type IN (N'U'))
BEGIN
    CREATE TABLE [dbo].[CredentialFiles](
        [Id] UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
        [CredentialId] UNIQUEIDENTIFIER NOT NULL,
        [FileName] NVARCHAR(255) NOT NULL,
        [ContentType] NVARCHAR(200) NOT NULL,
        [Size] BIGINT NOT NULL,
        [FilePath] NVARCHAR(400) NOT NULL,
        [UploadedAtUtc] DATETIME2 NOT NULL CONSTRAINT DF_CredentialFiles_Uploaded DEFAULT SYSUTCDATETIME()
    );

    ALTER TABLE [dbo].[CredentialFiles] WITH CHECK ADD CONSTRAINT [FK_CredentialFiles_Credentials] FOREIGN KEY([CredentialId])
        REFERENCES [dbo].[Credentials] ([Id]) ON DELETE CASCADE;

    CREATE INDEX IX_CredentialFiles_CredentialId ON [dbo].[CredentialFiles]([CredentialId]);
END
GO

-- Ensure FilePath column exists if table already created with Data column
IF COL_LENGTH('dbo.CredentialFiles', 'FilePath') IS NULL
BEGIN
    ALTER TABLE [dbo].[CredentialFiles] ADD [FilePath] NVARCHAR(400) NOT NULL CONSTRAINT DF_CredentialFiles_FilePath DEFAULT '';
END
GO

-- Drop legacy inline data column if it exists (files are stored on disk now)
IF COL_LENGTH('dbo.CredentialFiles', 'Data') IS NOT NULL
BEGIN
    ALTER TABLE [dbo].[CredentialFiles] DROP COLUMN [Data];
END
GO

-- Seed base categories if they do not exist
IF NOT EXISTS (SELECT 1 FROM [dbo].[Categories] WHERE [Id] = '70763946-c3b3-4518-aba0-2d09f5068e17')
    INSERT INTO [dbo].[Categories] ([Id], [Name], [Description], [SortOrder])
    VALUES ('70763946-c3b3-4518-aba0-2d09f5068e17', N'Sunucular', N'RDP, SSH, DB erişimleri', 1);
ELSE
    UPDATE [dbo].[Categories] SET [Name] = N'Sunucular', [SortOrder] = 1 WHERE [Id] = '70763946-c3b3-4518-aba0-2d09f5068e17';

IF NOT EXISTS (SELECT 1 FROM [dbo].[Categories] WHERE [Id] = '65f9fbfc-a0d1-4f42-ac9f-f703beb6b624')
    INSERT INTO [dbo].[Categories] ([Id], [Name], [Description], [SortOrder])
    VALUES ('65f9fbfc-a0d1-4f42-ac9f-f703beb6b624', N'Veri Tabanları', N'SQL, NoSQL ve veri ambarı erişimleri', 2);
ELSE
    UPDATE [dbo].[Categories] SET [Name] = N'Veri Tabanları', [SortOrder] = 2 WHERE [Id] = '65f9fbfc-a0d1-4f42-ac9f-f703beb6b624';

IF NOT EXISTS (SELECT 1 FROM [dbo].[Categories] WHERE [Id] = '5e191328-f4a1-4dc1-8ae2-cd7a0ee9102a')
    INSERT INTO [dbo].[Categories] ([Id], [Name], [Description], [SortOrder])
    VALUES ('5e191328-f4a1-4dc1-8ae2-cd7a0ee9102a', N'İç Uygulamalar', N'Şirket içi yazılımlar ve servis hesapları', 3);
ELSE
    UPDATE [dbo].[Categories] SET [Name] = N'İç Uygulamalar', [SortOrder] = 3 WHERE [Id] = '5e191328-f4a1-4dc1-8ae2-cd7a0ee9102a';

IF NOT EXISTS (SELECT 1 FROM [dbo].[Categories] WHERE [Id] = '1510d449-f3ae-4ec9-97a7-efb4d7741d97')
    INSERT INTO [dbo].[Categories] ([Id], [Name], [Description], [SortOrder])
    VALUES ('1510d449-f3ae-4ec9-97a7-efb4d7741d97', N'Dış Uygulamalar', N'ChatGPT, Exchange, İsimTescil vb.', 4);
ELSE
    UPDATE [dbo].[Categories] SET [Name] = N'Dış Uygulamalar', [SortOrder] = 4 WHERE [Id] = '1510d449-f3ae-4ec9-97a7-efb4d7741d97';

IF NOT EXISTS (SELECT 1 FROM [dbo].[Categories] WHERE [Id] = '0c3a5a6a-6c9f-4c7c-8f6a-7c5f12b6c111')
    INSERT INTO [dbo].[Categories] ([Id], [Name], [Description], [SortOrder])
    VALUES ('0c3a5a6a-6c9f-4c7c-8f6a-7c5f12b6c111', N'VPN Bilgileri', N'VPN erişimleri ve istemci dosyaları', 5);
ELSE
    UPDATE [dbo].[Categories] SET [Name] = N'VPN Bilgileri', [SortOrder] = 5 WHERE [Id] = '0c3a5a6a-6c9f-4c7c-8f6a-7c5f12b6c111';
GO

-- Seed admin user (email: admin@norax.com, password: NoraxAdmin!2024)
IF NOT EXISTS (SELECT 1 FROM [dbo].[Users] WHERE [Email] = 'admin@norax.com')
BEGIN
    INSERT INTO [dbo].[Users] ([Id], [Email], [PasswordHash], [Role], [CreatedAtUtc])
    VALUES ('1f9d86c6-5e1f-4d71-8fc8-6d5d0c2fcbe9', 'admin@norax.com', '120000.+RT6FY0zID//OpkRc933Dw==.4rDURl0o/5lAdM5uclJ0QPPD4eDGy42phPQmeMKNavo=', 'Admin', SYSUTCDATETIME());
END
GO
