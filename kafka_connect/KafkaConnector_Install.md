
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
./confluent-7.9.1/bin/confluent-hub install debezium/debezium-connector-sqlserver:2.5.4

# 설치 확인
ls ./confluent-7.9.1/share/confluent-hub-components/debezium-debezium-connector-sqlserver/

# JAVA Version과 SQL Server Connector
- Debezium SQL Server Connector(2.7.x)는 Java 11
  - 설치 : sudo dnf install -y java-11-amazon-corretto
- Java 8에서 돌려야만 한다면 Debezium의 2.1.x 이하
  - 호환이 잘 안되는 경우, confluent 버전도 변경해야할 수 있음
```

### SQL Server Connector 문서 참조
- https://debezium.io/documentation/reference/3.2/connectors/sqlserver.html#sqlserver-topic-names


## Kafka Connector
### Connector Path 설정
```aiignore
vi /rnd/connector_kafka/confluent-7.9.1/etc/kafka/connect-distributed.properties

# 여러 경로를 쉼표(,)로 구분
plugin.path=/usr/share/java,/rnd/connector_kafka/confluent-7.9.1/share/confluent-hub-components
```

### 실행
```aiignore
# (별도 터미널) Zookeeper/Kafka가 이미 떠 있다고 가정 (또는 Kraft 모드면 브로커만)
# Kafka Connect 실행
JAVA_HOME=/usr/lib/jvm/java-11-amazon-corretto.x86_64 \
PATH=/usr/lib/jvm/java-11-amazon-corretto.x86_64/bin:$PATH \
/rnd/connector_kafka/confluent-7.9.1/bin/connect-distributed \
/rnd/connector_kafka/confluent-7.9.1/etc/kafka/connect-distributed.properties

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