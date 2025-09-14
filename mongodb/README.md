## MongoDB 설정

### ssh 접속
```declarative
ssh -i keypair.pem ec2-user@123.123.123.123
```

### Install 
```declarative
# Docker 설치
sudo yum install -y docker

# Version 확인
docker --version

# Service 파일 확인
ls /usr/lib/systemd/system/ | grep docker


# Docker 실행
sudo systemctl start docker
sudo systemctl enable docker


# MongoDB Docker로 설치

# Container 실행
sudo docker pull mongodb/mongodb-community-server:latest
sudo docker run --name mongodb -p 27017:27017 -d mongodb/mongodb-community-server:latest

# 저장소 추가 - /etc/yum.repos.d/mongodb-org-8.0.repo 파일을 만듬
sudo tee /etc/yum.repos.d/mongodb-org-8.0.repo <<EOF
[mongodb-org-8.0]
name=MongoDB Repository
baseurl=https://repo.mongodb.org/yum/amazon/2023/mongodb-org/8.0/x86_64/
gpgcheck=1
enabled=1
gpgkey=https://pgp.mongodb.com/server-8.0.asc
EOF

# Mongosh 설치 - Container에 들어가지 않고 mongoDB 접속을 위해
sudo yum install -y mongodb-mongosh
mongosh --version

# MongoDB 접속
mongosh --host localhost --port 27017

# 참조
https://www.mongodb.com/ko-kr/docs/manual/tutorial/install-mongodb-community-with-docker/
```

