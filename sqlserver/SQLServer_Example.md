### DB/테이블 생성 + CDC 활성화
```aiignore
# 데모 DB 생성 & (권장) FULL 복구 모델
CREATE DATABASE DemoCdcDB;
ALTER DATABASE DemoCdcDB SET RECOVERY FULL;

# DB 레벨 CDC 활성화
USE DemoCdcDB;
EXEC sys.sp_cdc_enable_db;

# 유저 테이블 생성(기본키/인덱스 중요)
CREATE TABLE dbo.Users (
  UserID      INT            NOT NULL PRIMARY KEY,
  Email       NVARCHAR(255)  NOT NULL UNIQUE,
  DisplayName NVARCHAR(100)  NOT NULL,
  IsActive    BIT            NOT NULL DEFAULT(1),
  UpdatedAt   DATETIME2(3)   NOT NULL DEFAULT(sysutcdatetime())
);

# 샘플 데이터
INSERT INTO dbo.Users(UserID, Email, DisplayName)
VALUES (1,'alice@example.com','Alice'),
       (2,'bob@example.com','Bob');

# 테이블 레벨 CDC 활성화(읽기 역할 함께 생성)
EXEC sys.sp_cdc_enable_table
     @source_schema = N'dbo',
     @source_name   = N'Users',
     @role_name     = N'cdc_reader',
     @supports_net_changes = 1;

# cdc 아래 메타데이터 및 변경 테이블들 생성 확인
## 추적 중인 컬럼 목록
SELECT * FROM cdc.captured_columns
SELECT * FROM cdc.change_tables;
SELECT * FROM cdc.index_columns
SELECT * FROM cdc.dbo_Users_CT;

# CDC 적용 확인
INSERT INTO dbo.Users(UserID, Email, DisplayName) VALUES (3,'bbb@example.com','BOB');
SELECT * FROM cdc.dbo_Users_CT;
```

### CDC 활성화 확인
```aiignore
# EXEC sys.sp_cdc_enable_db; 이후

# CDC 활성화 확인
SELECT name, is_cdc_enabled
FROM sys.databases
WHERE name = 'DemoCdcDB';

# Agent Running 확인
SELECT servicename, status_desc
FROM sys.dm_server_services
WHERE servicename LIKE 'SQL Server Agent%';
```

### 테이블 구조
```aiignore
DemoCdcDB > Schemas > cdc : CDC를 켜면 DB 안에 cdc 스키마가 생기고, 다음과 같은 시스템 테이블이 생성
ㄴ cdc.change_tables, cdc.captured_columns : 어떤 테이블/컬럼을 CDC로 추적 중인지 메타데이터
ㄴ cdc.lsn_time_mapping : LSN(로그 시퀀스 번호) ↔ 시간 매핑
ㄴ cdc.ddl_history, cdc.index_columns 등 : DDL/인덱스 관련 메타
ㄴ cdc.<capture_instance>_CT : 소스 테이블(예:dbo.Users)에서 발생한 INSERT / UPDATE / DELETE를 행 단위로 적재
  ㄴ 테이블 CDC까지 활성화 설정이 필요

DemoCdcDB > Database triggers > tr_MScdc_ddl_event
ㄴ CDC가 DDL(스키마 변경) 이벤트를 메타에 기록하기 위해 자동으로 추가하는 DB 수준 트리거입니다.
```

### Debezium(Connect)용 권한 계정 준비
```aiignore
USE DemoCdcDB;
CREATE LOGIN debezium WITH PASSWORD = 'StrongPassword!123';
CREATE USER  debezium FOR LOGIN debezium;

# CDC 읽기 역할 부여
EXEC sp_addrolemember 'cdc_reader', 'debezium';

# 테이블 SELECT 권한
GRANT SELECT ON dbo.Users TO debezium;
# 메타 조회용
GRANT VIEW DATABASE STATE TO debezium;
```
