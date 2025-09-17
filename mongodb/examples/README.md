```declarative
# 실행
mongosh "mongodb://localhost:27017/chatdb" Aggregation/sample_data.js

# 데이터 Insert 확인
mongosh "mongodb://localhost:27017/chatdb" --eval 'db.chat_messages.countDocuments()'

# 확인
mongoDB Compass로 확인
```