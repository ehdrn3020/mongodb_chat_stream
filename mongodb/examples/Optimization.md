
## 프로젝션 최적화

```declarative
[1] 옵티마이저를 통해 성능 향상
- 프로젝션 연산자의 파이프단계의 리소스(메모리&네트워크)를 자동적으로 줄여주는 시퀀스 과정을 거침

옵티마이저 (Optimizer)
- MongoDB 내부에서 쿼리를 더 효율적으로 실행하기 위해 파이프라인 순서를 바꾸거나 불필요한 단계를 제거하는 엔진
- 즉 데이터베이스 엔진 내부에 있는 쿼리 최적화기
- 역할
- 순서 조정 (Reordering) : $match를 $project보다 앞으로 옮겨서 필터링을 빨리 수행
- 필드 제한 (Projection Pushdown) : 최종 결과에 필요 없는 필드는 읽지도 않게 만들어 I/O 최소화
- 인덱스 활용 : $match, $sort 조건을 인덱스 스캔으로 바꿔서 빠르게 처리

프로젝션 (Projection)
- MongoDB에서 문서(document)에서 어떤 필드를 보여줄지/숨길지 정하는 동작
- Aggregation 파이프라인에서는 $project, $unset, $addFields, $set 같은 연산자가 프로젝션에 해당

$project
- 필드 포함/제외, 계산된 필드 추가
- 최종 결과 모양을 정의하거나 중간 계산 필드를 만드는 데 사용
{ $project: { name: 1, year: { $year: "$createdAt" } } }

$match
- 옵티마이저가 의존하는 $project보다 앞에 배치되거나, 순서를 변경

$group
- 많은 문서를 처리하므로 보통 $match로 먼저 줄이는 게 유리

$lookup
- join 대상 문서가 많으면 성능 저하 → 앞단에서 $match/$group으로 줄이는 게 핵심



[2] 인덱스 및 문서 필터로 성능 향상
# 예시 쿼리
db.chat_messages.find({ roomId: "room1", ts: { $gte: ISODate("2025-09-17T00:00:00Z") } })

# roomId 기준으로 필터링 후, ts 내림차순 정렬까지 인덱스로 해결 가능
db.chat_messages.createIndex({ roomId: 1, ts: -1 })
```

