cd /rnd/kafka_connect/default
nohup ./bin/connect-distributed \
  /rnd/kafka_connect/default/etc/kafka/connect-distributed.properties \
  > /rnd/kafka_connect/default/logs/connect.out 2>&1 &
echo $! > /rnd/kafka_connect/default/connect.pid
disown