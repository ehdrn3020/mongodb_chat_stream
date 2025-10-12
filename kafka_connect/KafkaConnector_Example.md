# 커넥터 생성
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
```
