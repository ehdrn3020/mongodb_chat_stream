### 설치
```aiignore
mkdir data
chmod 777 data
sudo docker compose up -d
```

### 확인
```aiignore
sudo docker compose exec mariadb10 mysql -uroot -p -e "SELECT VERSION();"
```