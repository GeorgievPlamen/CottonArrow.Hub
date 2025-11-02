# CottonArrow.Hub

## WS with wscat

wscat -c ws://localhost:5000 -s auth -s "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJlNWU1Y2MxNC04NjE1LTQwNGEtYmQxYS0xODA2MjM5ZjAxNDYiLCJ1c2VybmFtZSI6ImpvaG4xLmRvZSIsImlhdCI6MTc2MjA3NDM4NywiZXhwIjoxNzYyMDc3OTg3fQ.udsEvZHdgWloLxELTY-ikFc4Kwl_LLqDr4Og9k7Co34"

## coturn

    docker run -d --name coturn \
      -p 3478:3478 -p 3478:3478/udp \
      -p 5349:5349 -p 5349:5349/udp \
      -p 49160-49200:49160-49200/udp \
      -v $(pwd)/infra/coturn/turnserver.conf:/etc/coturn/turnserver.conf:ro \
      coturn/coturn -c /etc/coturn/turnserver.conf
