# 커넥터 생성
```aiignore
curl -s -X POST -H "Content-Type: application/json" \
  --data @/mongodb_chat_stream/kafck_connect/mssql-cdc.json \
  http://server_1:8083/connectors | jq

# 상태 확인
curl -s http://server_1:8083/connectors/mssql-cdc-users/status | jq
```
