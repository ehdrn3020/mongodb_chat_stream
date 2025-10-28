## MSSQL Connector
```aiignore
# 커넥터 추가
curl -s -X POST -H "Content-Type: application/json" --data-binary @/root/mongodb_chat_stream/kafka_connect/mssql_cdc.json http://localhost:8083/connectors | jq
>>>
{
  "name": "mssql-cdc-users",
  "config": {
    "connector.class": "io.debezium.connector.sqlserver.SqlServerConnector",
    "database.hostname": "server_2",
    "database.port": "1433",
    "database.user": "sa",
    "database.password": "mystrongpassword!",
    "database.names": "DemoCdcDB",
    "topic.prefix": "mssql",
    "table.include.list": "dbo.Users",
    "schema.history.internal.kafka.bootstrap.servers": "server_1:9092",
    "schema.history.internal.kafka.topic": "schemahistory.mssql_demo",
    "database.encrypt": "false",
    "name": "mssql-cdc-users"
  },
  "tasks": [],
  "type": "source"
}

# 커넥터 삭제
curl -s -X DELETE http://localhost:8083/connectors/mssql-cdc-users | jq

# 커넥터 재실행
curl -s -X POST http://localhost:8083/connectors/mssql-cdc-users/restart

# 상태 확인
curl -s http://server_1:8083/connectors/mssql-cdc-users/status | jq
{
  "name": "mssql-cdc-users",
  "connector": {
    "state": "RUNNING",
    "worker_id": "server_1:8083"
  },
  "tasks": [
    {
      "id": 0,
      "state": "RUNNING",
      "worker_id": "server_1:8083"
    }
  ],
  "type": "source"
}

# 커넥터가 바라보는 토픽 확인
curl -s http://server_1:8083/connectors/mssql-cdc-users/topics | jq
```

### CDC 확인
```aiignore
# DemoCdcDB.dbo.Users 의 row update 실행
update 작업 실행

# topic message 확인
/rnd/kafka/bin/kafka-console-consumer.sh \
--bootstrap-server localhost:9092 \
--topic mssql.DemoCdcDB.dbo.Users \
--from-beginning

>>>
...
"payload": {
    "before": {
      "UserID": 5,
      "Email": "ddd@example.com",
      "DisplayName": "Demo",
      "IsActive": true,
      "UpdatedAt": 1760274065380
    },
    "after": {
      "UserID": 5,
      "Email": "ddd@example.com",
      "DisplayName": "Demo2",
      "IsActive": true,
      "UpdatedAt": 1760274065380
    },
    "source": {
      "version": "2.5.4.Final",
      "connector": "sqlserver",
      "name": "mssql",
      "ts_ms": 1760274622437,
      "snapshot": "false",
      "db": "DemoCdcDB",
      "sequence": null,
      "schema": "dbo",
      "table": "Users",
      "change_lsn": "00000030:00000e48:0002",
      "commit_lsn": "00000030:00000e48:0003",
      "event_serial_no": 2
    },
    "op": "u",
    "ts_ms": 1760274626610,
    "transaction": null
  }
```

## Mysql Connector
```aiignore

```