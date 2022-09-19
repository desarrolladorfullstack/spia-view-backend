#!/bin/bash
# :: Please run only with bash ..
# TASKS:
# 1. read files from media
# 2. loop file contents
# 3. connect to datasource
# 4. SQL insert content as hex block per block
MEDIA_FOLDER="/home/node/media/"
PGSQL_HOST="192.168.20.109"
PGSQL_USER="postgres"
PGSQL_PORT=5432
PGSQL_COLUMN="content_block"
PGSQL_PARENT_COLUMN="device_id, stamp, mime_type"
PGSQL_CROSS_COLUMN="file_id, record_id"
PGSQL_TABLE_NAME="records"
PGSQL_TABLE_PARENT_NAME="files"
PGSQL_TABLE_CROSS_NAME="file_records"
PGSQL_TABLE_SEQUENCE="record_id_seq"
PGSQL_TABLE_PARENT_SEQUENCE="file_id_seq"
list_media_files=($(ls $MEDIA_FOLDER))
for file in ${list_media_files[*]}
do
    input=$MEDIA_FOLDER$file
    line_offset=0
    IFS='_' read -ra file_data_split <<< "$file"
    device_id=${file_data_split[-2]}
    timestamp=${file_data_split[-3]}
    IFS=': ' read -ra mime_type <<< file --mime-type $input
    mime_type=${mime_type[1]}
    echo "()=>$input [$device_id, $timestamp] reading ... \n"
    echo "INSERT INTO $PGSQL_TABLE_PARENT_NAME ($PGSQL_PARENT_COLUMN) VALUES ('$device_id', '$timestamp','$mime_type');" > temp_insert.sql
    { 
        while IFS= read -r line
        do
            line_insert=($(echo $line | hexdump))
            echo "INSERT INTO $PGSQL_TABLE_NAME ($PGSQL_COLUMN) VALUES ('${line_insert[*]}');" > temp_insert.sql
            echo "INSERT INTO $PGSQL_TABLE_CROSS_NAME ($PGSQL_CROSS_COLUMN) SELECT currval('$PGSQL_TABLE_PARENT_SEQUENCE'), currval('$PGSQL_TABLE_SEQUENCE');" >> temp_insert.sql
            cat temp_insert.sql
            # psql -h $PGSQL_HOST -U $PGSQL_USER -d $PGSQL_DBNAME -p $PGSQL_PORT -f temp_insert.sql
            line_offset=$((line_offset + 1))
        done < "$input"
    } || {
        echo "error on $input:$line_offset\n"
    }
done