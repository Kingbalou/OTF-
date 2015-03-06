#!/bin/bash
#set -x
# REF http://dev.petitchevalroux.net/linux/tester-son-serveur-http-linux.159.html
#store=( none memory redis mongo)
# ab -n 100 -c 100 -p post_data  -T application/x-www-form-urlencoded http://localhost:3000/signupAccount
store=(./bin/www )
concurrency=( 1 10 )
total_req="200"
url="http://localhost:3000/signupAccount"
post_file_data="post_data"
path_result="."

for c in "${concurrency[@]}"
do
	echo "Concurrency: ${c}"
	for s in "${store[@]}"
	do
		echo -n -e "${s}-${c}\t"
		node "${s}" &
		PID=$!
		sleep 5 # so the server can settle
		#ab -c ${c} -n 10000 http://localhost:5000/ 2>/dev/null | grep "Requests per second" | cut -c 22-40
		ab -c ${c} -n ${total_req} -p ${post_file_data} -T application/x-www-form-urlencoded ${url} > ${path_result}/otf-cluster-concurent-${c}.txt
		cat  ${path_result}/otf-cluster-concurent-${c}.txt
		kill $PID
		wait $PID > /dev/null
	done
done