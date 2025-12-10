-- Norax Credentials DB schema
-- Run against database: NoraxCredentials

IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Categories]') AND type IN (N'U'))
BEGIN
    CREATE TABLE [dbo].[Categories](
        [Id] UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
        [Name] NVARCHAR(100) NOT NULL UNIQUE,
        [Description] NVARCHAR(500) NULL
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

-- Seed base categories if they do not exist
IF NOT EXISTS (SELECT 1 FROM [dbo].[Categories] WHERE [Id] = '70763946-c3b3-4518-aba0-2d09f5068e17')
    INSERT INTO [dbo].[Categories] ([Id], [Name], [Description])
    VALUES ('70763946-c3b3-4518-aba0-2d09f5068e17', N'Sunucular', N'RDP, SSH, DB erişimleri');
ELSE
    UPDATE [dbo].[Categories] SET [Name] = N'Sunucular' WHERE [Id] = '70763946-c3b3-4518-aba0-2d09f5068e17';

IF NOT EXISTS (SELECT 1 FROM [dbo].[Categories] WHERE [Id] = '1510d449-f3ae-4ec9-97a7-efb4d7741d97')
    INSERT INTO [dbo].[Categories] ([Id], [Name], [Description])
    VALUES ('1510d449-f3ae-4ec9-97a7-efb4d7741d97', N'Üçüncü Parti Uygulamalar', N'ChatGPT, Exchange, İsimTescil vb.');

IF NOT EXISTS (SELECT 1 FROM [dbo].[Categories] WHERE [Id] = '5e191328-f4a1-4dc1-8ae2-cd7a0ee9102a')
    INSERT INTO [dbo].[Categories] ([Id], [Name], [Description])
    VALUES ('5e191328-f4a1-4dc1-8ae2-cd7a0ee9102a', N'İç Uygulamalar', N'Şirket içi yazılımlar ve servis hesapları');
GO

IF NOT EXISTS (SELECT 1 FROM [dbo].[Categories] WHERE [Id] = '65f9fbfc-a0d1-4f42-ac9f-f703beb6b624')
    INSERT INTO [dbo].[Categories] ([Id], [Name], [Description])
    VALUES ('65f9fbfc-a0d1-4f42-ac9f-f703beb6b624', N'Veri Tabanları', N'SQL, NoSQL ve veri ambarı erişimleri');
GO

-- Seed admin user (email: admin@norax.com, password: NoraxAdmin!2024)
IF NOT EXISTS (SELECT 1 FROM [dbo].[Users] WHERE [Email] = 'admin@norax.com')
BEGIN
    INSERT INTO [dbo].[Users] ([Id], [Email], [PasswordHash], [Role], [CreatedAtUtc])
    VALUES ('1f9d86c6-5e1f-4d71-8fc8-6d5d0c2fcbe9', 'admin@norax.com', '120000.+RT6FY0zID//OpkRc933Dw==.4rDURl0o/5lAdM5uclJ0QPPD4eDGy42phPQmeMKNavo=', 'Admin', SYSUTCDATETIME());
END
GO
