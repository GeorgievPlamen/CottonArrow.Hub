# CottonArrow.Hub

## WS with wscat

wscat -c ws://localhost:5000 -s auth -s "$token"

## coturn

    docker run -d --name coturn \
      -p 3478:3478 -p 3478:3478/udp \
      -p 5349:5349 -p 5349:5349/udp \
      -p 49160-49200:49160-49200/udp \
      -v $(pwd)/infra/coturn/turnserver.conf:/etc/coturn/turnserver.conf:ro \
      coturn/coturn -c /etc/coturn/turnserver.conf
