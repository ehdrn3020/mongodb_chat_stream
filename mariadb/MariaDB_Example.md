## MariaDB 설정 확인
```aiignore
# my.cnf log_bin이 설정되었는지 확인
SELECT variable_value as "BINARY LOGGING STATUS (log-bin) ::"
FROM information_schema.global_variables WHERE variable_name='log_bin';

show global variables like '%GTID%';
```