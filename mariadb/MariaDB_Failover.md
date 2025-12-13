## GTID 및 트랜잭션 Kafka Message에서 확인
```aiignore
# kafka message
{   ...
    "source": {
        "version": "2.5.4.Final",
        "connector": "mysql",
        "name": "mariadb",
        "ts_ms": 1765623978000,
        "snapshot": "false",
        "db": "cdc_test",
        "sequence": null,
        "table": "demo_title",
        "server_id": 4001,
        "gtid": null,
        "file": "ON.000002",
        "pos": 1971,  # 해당 내용 기억
        "row": 0,
        "thread": null,
        "query": null
    },
    "op": "u",
    "ts_ms": 1765623978742,
    "transaction": null
}

# GTID 정보 확인
SHOW VARIABLES LIKE 'gtid%';
SHOW VARIABLES LIKE 'server_id';

# binlog 파일 확인
SHOW BINARY LOGS;

# binlog 내용 확인
SHOW BINLOG EVENTS IN 'ON.000002' FROM 1971 LIMIT 20;
```


## MariaDB FailOver
### 오프셋 초기화하고 처음부터 다시 구성
```aiignore
# 기존 Debezium 커넥터 완전 삭제
curl -X DELETE http://server1:8083/connectors/mariadb-cdc-live
curl http://server1:8083/connectors

# Kafka Connect 워커를 “새 group.id”로 띄우기
# connect-distributed.propertie 파일
group.id=connect-cdc-test2

offset.storage.topic=connect-offsets-cdc-test2
config.storage.topic=connect-configs-cdc-test2
status.storage.topic=connect-status-cdc-test2

offset.storage.replication.factor=1
config.storage.replication.factor=1
status.storage.replication.factor=1

# Kafka Connect 재시작
/rnd/kafka_connect/default/bin/connect-distributed /rnd/kafka_connect/default/etc/kafka/connect-distributed.properties
```

### 기존 토픽/오프셋 유지하면서 누락없이 CDC
```aiignore
# 실행 조건
- Kafka offset은 절대 수정하지 않음
- Debezium 커넥터 이름/토픽/offset 유지
- DB 쪽이 Debezium이 기대하는 binlog 상태를 만족시켜야 함

# Primary - Replica  설정
- 네트워크 : A → B 복제는 B가 A에 접속한다

# A 서버 설정 (Primary) ( my.cnf 파일 )
[mysqld]
server_id = 4001
log_bin = mariadb-bin
binlog_format = ROW
binlog_row_image = FULL
gtid_strict_mode = ON
gtid_domain_id = 40001
# 이후 재시작

# B 서버 설정 (Replica)
[mysqld]
server_id = 4002
log_bin = mariadb-bin
log_slave_updates = ON
read_only = ON
binlog_format = ROW
binlog_row_image = FULL
gtid_strict_mode = ON
gtid_domain_id = 40001
# 이후 재시작

# B를 A의 Replica로 연결 (GTID 기반)
STOP SLAVE;
RESET SLAVE ALL;
CHANGE MASTER TO
  MASTER_HOST='10.0.0.10',
  MASTER_PORT=3306,
  MASTER_USER='repl',
  MASTER_PASSWORD='ReplPW!',
  MASTER_USE_GTID=slave_pos;
START SLAVE;

# B가 A를 완전히 따라잡았는지 확인
SHOW SLAVE STATUS;
# 테이블의 데이터가 동일한지 확인

# CDC config를 B MariaDB로 연결 후 확인
- "database.hostname" 수정

# A 중단
systemctl stop mariadb   # 또는 컨테이너 stop

# B를 Primary로 “승격”
STOP SLAVE;
SET GLOBAL read_only = OFF;

# 승격 확인
SHOW SLAVE STATUS; # 복제 끊힘
SHOW GLOBAL VARIABLES LIKE 'read_only'; # 읽기전용 비활성화
SHOW VARIABLES LIKE 'log_bin'; # binlog 기록
SHOW MASTER STATUS;

# Failover 후 검증
```