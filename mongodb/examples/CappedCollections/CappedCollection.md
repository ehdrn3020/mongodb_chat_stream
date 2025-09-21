## 고정 컬렉션 (Capped Collections)

```declarative
# 대안
TTL 인덱스를 사용하면 대안이 됨
쓰기 작업을 직렬화(순서보장 목적)하므로 비고정 사이즈 컬렉션보다 동시 삽입, 업데이트 및 삭제 성능이 떨어 짐

# 생성
최대 크기가 100,000바이트인 log라는 고정 사이즈 컬렉션을 생성
db.createCollection("log", { capped: true, size: 100000 } )

# 가장 최근 문서 반환
db.log.find().sort( { $natural: -1 } ).limit(3)

# 고정 컬렉션 check
db.log.isCapped()

# 일반 컬렉션 고정 사이즈 컬렉션으로 convert
db.runCommand( { convertToCapped: "log", size: 100000 } )

# 사이즈 크기 변경
db.runCommand( { collMod: "log", cappedSize: 200000 } )

# 최대 문서 개수 변경
db.runCommand( { collMod: "log", cappedMax: 5000 } )
```