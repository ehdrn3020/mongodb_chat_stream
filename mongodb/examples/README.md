## 예제 실행
```declarative
# Mongosh 설치 - Container에 들어가지 않고 mongoDB 접속을 위해
sudo yum install -y mongodb-mongosh
mongosh --version

# 실행
mongosh "mongodb://localhost:27017/chatdb" Aggregation/sample_data.js

# 데이터 Insert 확인
mongosh "mongodb://localhost:27017/chatdb" --eval 'db.chat_messages.countDocuments()'

# 결과 확인
mongoDB Compass로 확인
```