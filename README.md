# mongodb_chat_stream
MongoDB 기반 실시간 채팅 스트리밍

## 목표
- Kafka로 유입되는 채팅 메시지를 MongoDB에 안정적으로 적재
- UI는 빠르게(최근 100개) 보이고, 전체 메시지는 분석/알림에 활용
- 코드 최소화: 수집은 Kafka Connect로, 로직은 MongoDB 기능 중심

# 구성요소
- Kafka: chat-messages 토픽(프로듀서가 메시지 발행)
- Kafka Connect: MongoDB Sink 커넥터 2개
  - Sink #1 → chat_messages (전체 보관)
  - Sink #2 → chat_messages_recent (UI 캐시)
- MongoDB
  - chat_messages (일반 컬렉션, 전체 저장)
  - chat_messages_recent (capped, UI 최근 메시지)
  - chat_word_stats (시간당 단어 통계 결과 저장)
  - alert_keywords (알림 키워드 목록, 선택: MySQL CDC로 동기화)
  - alerts (발생 알림 기록, TTL로 자동 정리)
