#!/bin/bash
# :: Please run only with bash ..
# TASKS:
# 1. read files from media
# 2. loop file contents
# 3. connect to datasource
# 4. SQL insert content as hex block per block
MEDIA_FOLDER="/home/node/media/"
PGSQL_HOST="192.168.20.109"
list_media_files=($(ls $MEDIA_FOLDER))
for file in ${list_media_files[*]}
do
    input=$MEDIA_FOLDER$file
    line_offset=0
    echo "()=>$input reading ... \n"
    { 
        while IFS= read -r line
        do
            $line_insert=($(echo $line | hexdump))
            echo "INSERT INTO $PGSQL_TABLE_NAME VALUES ('${line_insert[*]}');" > temp_insert.sql
            cat temp_insert.sql
            # psql -h $PGSQL_HOST -U $PGSQL_USER -d $PGSQL_DBNAME -p $PGSQL_PORT -f temp_insert.sql
            line_offset=$((line_offset + 1))
        done < "$input"
    } || {
        echo "error on $input:$line_offset\n"
    }
done