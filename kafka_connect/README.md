### Kafka Connector 설치
```aiignore
# confluent hub 설치
cd ~
curl -O https://packages.confluent.io/archive/7.9/confluent-7.9.1.tar.gz
tar xzf confluent-7.9.1.tar.gz

# confluent hub 설치 확인
./confluent-7.9.1/bin/confluent version
```

### PlugIn 설치
```aiignore
# confluent hub client가 설치되어 있을 경우
./confluent-7.9.1/bin/confluent-hub install debezium/debezium-connector-sqlserver:2.7.2

```

### 설치 참조
- https://docs.confluent.io/platform/current/installation/installing_cp/zip-tar.html

### 플러그인 검색
- 어떤 plugin을 confluent에서 설치할 수 있는지 검색가능
- https://www.confluent.io/hub/

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