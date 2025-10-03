### 동작
```aiignore
Debezium SQL Server 커넥터는 JDBC로 DB를 조회
- CDC 변경 테이블(cdc.*_CT) 
- LSN 매핑 테이블(cdc.lsn_time_mapping)
  - LSN은 ‘진행 위치(offset)’를 나타내는 지표로 사용 -> kafka offset과 비교
  
CDC 2가지 방식
- JDBC Polling : 애플리케이션이 주기적으로 SELECT 해서 '바뀐 줄'만 찾아내는 방식
- SQLServer CDC + Agent :트랜잭션 로그를 Agent가 읽어 변경 이력을 cdc 테이블에 적재하고, 커넥터가 거기서 읽는 방식
```

### 프로세스 도식화
```aiignore
[애플리케이션 트랜잭션]
    │
    ▼
┌──────────────────────────┐
│     SQL Server (Primary) │ 
│  ─────────────────────── │
│  1) 트랜잭션 로그(LSN)     │
│  2) SQL Server Agent 잡   │─┐   (CDC Capture/Cleanup)
│     - capture job         │ │   - 로그에서 변경 추출
│     - cleanup job         │ │   - 보존기간 지난 데이터 정리
│  3) cdc.<table>_CT 테이블  │◀┘   (변경 이력 저장)
└──────────────────────────┘
                │
                │ (T-SQL로 CDC 데이터/함수 조회)
                ▼
        ┌────────────────────────────┐
        │ Kafka CDC Connector        │  (예: Debezium SQL Server Connector
        │  - 초기 스냅샷 수행           │       또는 Confluent SQL Server CDC)
        │  - LSN 기반 스트리밍 구독     │
        │  - 커넥터 오프셋 유지         │───▶  __consumer_offsets (Kafka 내부)
        └────────────────────────────┘
                │
                │ (레코드 전송: INSERT/UPDATE/DELETE, key/value, op, ts_ms 등)
                ▼
         ┌─────────────────┐
         │ Kafka Topic(s)  │  (테이블별/스키마별 토픽)
         └─────────────────┘
```

### Enabling CDC on the SQL Server database
```aiignore
설정 변경
- EXEC sys.sp_cdc_enable_db; 를 실행
  - 해당 데이터베이스 내에 cdc 스키마와 여러 메타/변경 테이블이 만들어 짐
- EXEC sys.sp_cdc_enable_db 실행 후 SQL Server를 재시작할 필요는 없음
- SQL Server Agent 서비스가 실행 중이어야 함
  - mssql-conf로 sqlagent.enabled true 설정

생성되는 예시)
- 메타: cdc.captured_columns, cdc.change_tables, cdc.lsn_time_mapping …
- 각 테이블별 변경 데이터: cdc.<capture_instance>_CT
```

### SQL Server Always On (복제본 CDC테이블 읽기)
```aiignore
- Debezium 커넥터는 읽기 전용 연결로 Secondary에 붙어서 CDC 테이블을 조회하는 방식

# 도식화
          (로그 스캔/캡처)                 (AG 복제)
 [Primary DB] ──SQL Server Agent──> [CDC 테이블] ───────────► [Secondary DB]
     │                                                     (읽기 전용)
     │
     └─(관리/쓰기 가능)

                           (읽기 전용 쿼리)
                   Debezium Connector (Kafka Connect)
                           └────────────► Secondary의 CDC 테이블 읽기
                                              │
                                              ▼
                                         Kafka 토픽        

# 순서                                         
[Primary DB] --> (CDC 캡처/Agent)--> [CDC 변경테이블 생성/갱신] 
--> (AG 복제)--> [Secondary DB(읽기전용)]
--> Debezium 커넥터 (applicationIntent=ReadOnly) 가 조회 → Kafka
```

### Install
```aiignore
# 저장소 추가
sudo rpm --import https://packages.microsoft.com/keys/microsoft.asc
sudo tee /etc/yum.repos.d/mssql-server.repo <<EOF
[mssql-server]
name=Microsoft SQL Server
baseurl=https://packages.microsoft.com/rhel/8/mssql-server-2019
enabled=1
gpgcheck=1
gpgkey=https://packages.microsoft.com/keys/microsoft.asc
EOF

sudo dnf makecache
sudo dnf install -y mssql-server

# 관련 패키지 설치
sudo dnf install compat-openssl11
sudo dnf install -y openldap-compat
sudo ln -s /usr/lib64/libssl.so.3 /opt/mssql/lib/libssl.so
sudo ln -s /usr/lib64/libcrypto.so.3 /opt/mssql/lib/libcrypto.so

# 설치
sudo /opt/mssql/bin/mssql-conf setup

# 버전 관련 정보
- SQL Server 2017부터 linux를 지원 함
- SQL Server 2017은 python2에 의존적

# 설치 확인
ll /usr/lib/systemd/system/mssql-server.service
sudo systemctl status mssql-server

# 설치 OS
- Amazon Linux 2 패키지 호환성 문제가 일어날 수 있음
- Ubuntu 20.04/22.04에서 설치하기를 권장
```

### Install Docker
```aiignore
# 도커 설치
sudo dnf install -y docker
sudo systemctl enable --now docker
sudo usermod -aG docker $USER   # 현재 유저를 docker 그룹에 추가(재로그인 필요)

# 도커 컴포즈 설치
VER=v2.29.2   # 원하면 최신으로 바꿔도 됨

sudo mkdir -p /usr/libexec/docker/cli-plugins
sudo curl -SL \
  https://github.com/docker/compose/releases/download/$VER/docker-compose-linux-x86_64 \
  -o /usr/libexec/docker/cli-plugins/docker-compose
sudo chmod +x /usr/libexec/docker/cli-plugins/docker-compose

docker compose version

# 컨테이너 설치
cd mongodb_chat_stream/sqlserver/
mkdir -p ./data ./backup
sudo chmod -R 777 ./data ./backup

docker compose up -d

# 컨테이너 안 접속 테스트
docker exec -it mssql2019 /bin/bash
/opt/mssql-tools18/bin/sqlcmd -S localhost,1433 -U SA -P 'mystrongpassword!' -C -Q "SELECT @@VERSION"
1> SELECT name FROM sys.databases ORDER BY name;
2> GO

# SQL Agent 로그 확인
docker logs --tail=200 mssql2019
docker exec -it mssql2019 bash -lc 'tail -n 100 /var/opt/mssql/log/sqlagent.out'

# 컨테이너 정지
docker compose down
```