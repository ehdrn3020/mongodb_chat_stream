
## confluent PlugIn
### PlugIn 설치
```aiignore
# confluent hub 설치
mkdir connector_kafka & cd connector_kafka
curl -O https://packages.confluent.io/archive/7.9/confluent-7.9.1.tar.gz
tar xzf confluent-7.9.1.tar.gz

# confluent hub 설치 확인
./confluent-7.9.1/bin/confluent version
```

### PlugIn 설치 참조
- https://docs.confluent.io/platform/current/installation/installing_cp/zip-tar.html

### PlugIn 검색
- 어떤 plugin을 confluent에서 설치할 수 있는지 검색가능
- https://www.confluent.io/hub/


## Kafka Config ( 선택 - Single Broker 일 때 )
```aiignore
# kafka/config/server.properties 파일 아래 내용으로 수정
# 싱글 브로커용 필수
offsets.topic.replication.factor=1
offsets.topic.num.partitions=50

# 트랜잭션 로그도 싱글에 맞춤(선택이지만 권장)
transaction.state.log.replication.factor=1
transaction.state.log.min.isr=1

# (선택) 자동생성 켜두고 싶으면
# auto.create.topics.enable=true
```


## Source Connect
### SQL Server Source 설치
```aiignore
# Debezium SQL Server Source 설치
/rnd/connector_kafka/confluent-7.9.1/bin/confluent-hub install debezium/debezium-connector-sqlserver:2.5.4

# 설치 확인
ls /rnd/connector_kafka/confluent-7.9.1/share/confluent-hub-components/debezium-debezium-connector-sqlserver/

# JAVA Version과 SQL Server Connector
- Debezium SQL Server Connector(2.7.x)는 Java 11
  - 설치 : sudo dnf install -y java-11-amazon-corretto
- Java 8에서 돌려야만 한다면 Debezium의 2.1.x 이하
  - 호환이 잘 안되는 경우, confluent 버전도 변경해야할 수 있음
```

### SQL Server Connector 문서 참조
- https://debezium.io/documentation/reference/3.2/connectors/sqlserver.html#sqlserver-topic-names


### MariaDB Source 설치
```aiignore
curl -LO https://repo1.maven.org/maven2/io/debezium/debezium-connector-mysql/2.5.4.Final/debezium-connector-mysql-2.5.4.Final-plugin.tar.gz
tar -xzf debezium-connector-mysql-2.5.4.Final-plugin.tar.gz -C /rnd/connector_kafka/plugins

# 설치 확인
ll /rnd/connector_kafka/plugins/
>>> debezium-connector-mysql
```


## Kafka Connector
### Connector Path 설정
```aiignore
vi /rnd/connector_kafka/confluent-7.9.1/etc/kafka/connect-distributed.properties

# kafka cluster에 맞게 아래 정보 수정
bootstrap.servers
group.id

# 여러 경로를 쉼표(,)로 구분
plugin.path=/usr/share/java,/rnd/connector_kafka/confluent-7.9.1/share/confluent-hub-components

# The server time zone value 'KST' 에러 일경우
SET GLOBAL time_zone = '+09:00';
```

### 실행
```aiignore
# (별도 터미널) Zookeeper/Kafka가 이미 떠 있다고 가정 (또는 Kraft 모드면 브로커만)
# Kafka Connect 실행
JAVA_HOME=/usr/lib/jvm/java-11-amazon-corretto.x86_64 \
PATH=/usr/lib/jvm/java-11-amazon-corretto.x86_64/bin:$PATH \
/rnd/connector_kafka/confluent-7.9.1/bin/connect-distributed \
/rnd/connector_kafka/confluent-7.9.1/etc/kafka/connect-distributed.properties

# 실행 커맨드
/rnd/kafka_connect/default/bin/connect-distributed /rnd/kafka_connect/default/etc/kafka/connect-distributed.properties

# Connector 실행 확인
curl http://server1:8083/connectors

# 플러그인 목록 확인
curl -s http://server_1:8083/connector-plugins | jq
[
  {
    "class": "io.debezium.connector.sqlserver.SqlServerConnector",
    "type": "source",
    "version": "2.5.4.Final"
  },...
]

# 또는 
curl -s http://server_1:8083/connector-plugins | grep -i sqlserver

# 생성 토픽 확인
/rnd/kafka/bin/kafka-topics.sh --bootstrap-server localhost:9092 --list
>>>
connect-configs : 모든 커넥터와 태스크의 구성(Configuration) 정보를 저장
connect-offsets : Source 커넥터의 데이터 처리 진행 상황(Offset)을 저장
connect-status : 커넥터와 태스크의 현재 런타임 상태(Status)를 저장
```

### 동작 개요
```aiignore
         ┌───────────────────────────────────────────┐
         │                SQL Server                 │
         │  - FULL recovery                          │
         │  - CDC enabled (DB & tables)              │
         │  - Agent running                          │
         └───────────────┬─────────┬────────────────┘
                         Snapshot  │  CDC (LSN Stream)
                                   └───────────┐
                                               ▼
                                   Debezium SQL Server
                                   Connector (Kafka Connect)
                                   - Snapshot (blocking/incremental/ad-hoc)
                                   - Change tables & LSN
                                   - Schema history
                                              │
                     ┌────────────────────────┼────────────────────────┐
                     ▼                        ▼                        ▼
            Data change topics        Schema history topic     Txn metadata topic
         <srv>.<sch>.<tbl>           schema-changes.<srv>        tx-meta.<srv>
```