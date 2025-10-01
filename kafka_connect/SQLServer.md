### 동작
```aiignore
SQL Server 커넥터는 “트랜잭션 로그 파일을 직접” 읽지 않음

Debezium SQL Server 커넥터는 JDBC로 DB를 조회
- CDC 변경 테이블(cdc.*_CT) 
- LSN 매핑 테이블(cdc.lsn_time_mapping)
  - LSN은 ‘진행 위치(offset)’를 나타내는 지표로 사용 -> kafka offset과 비교
```

### Enabling CDC on the SQL Server database
```aiignore
- EXEC sys.sp_cdc_enable_db; 를 실행하면, 
  해당 데이터베이스 내에 cdc 스키마와 여러 메타/변경 테이블이 만들어 짐
- EXEC sys.sp_cdc_enable_db 실행 후 SQL Server를 재시작할 필요는 없음
- 다만 SQL Server Agent 서비스가 실행 중이어야 함

생성되는 예시)
- 메타: cdc.captured_columns, cdc.change_tables, cdc.lsn_time_mapping …
- 각 테이블별 변경 데이터: cdc.<capture_instance>_CT
```

### SQL Server Always On (복제본 CDC테이블 읽기)
```aiignore
- Debezium 커넥터는 읽기 전용 연결로 Secondary에 붙어서 CDC 테이블을 조회

# 도식화
          (로그 스캔/캡처)                 (AG 복제)
 [Primary DB] ──SQL Server Agent──> [CDC 테이블] ───────────► [Secondary DB]
     │                                                     (읽기 전용)
     │
     └─(관리/쓰기 가능)

                           (읽기 전용 쿼리)
                   Debezium Connector (Kafka Connect)
                           └────────────► Secondary의 CDC 테이블 읽기
                                              │
                                              ▼
                                         Kafka 토픽        

# 순서                                         
[Primary DB] --> (CDC 캡처/Agent)--> [CDC 변경테이블 생성/갱신] 
--> (AG 복제)--> [Secondary DB(읽기전용)]
--> Debezium 커넥터 (applicationIntent=ReadOnly) 가 조회 → Kafka
```