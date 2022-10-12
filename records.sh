#!/bin/bash
# :: Please run only with bash ..
# TASKS:
# 1. read files from media
# 2. loop file contents
# 3. connect to datasource
# 4. SQL insert content as hex block per block
MEDIA_FOLDER="/home/ubuntu/media/"
if [[ "$1" != "" ]]
then
    MEDIA_FOLDER=$1
fi
SQL_FOLDER="/home/ubuntu/"
if [[ "$2" != "" ]]
then
    SQL_FOLDER=$2
fi
PGSQL_HOST="200.91.236.122"
PGSQL_USER="spiadbadmin"
PGSQL_DBNAME="spiaview"
PGSQL_PORT=5432
PGSQL_COLUMN="content_block, record_offset"
PGSQL_PARENT_COLUMN="device_key, file_stamp, mime_type"
PGSQL_CROSS_COLUMN="file_key, record_key"
PGSQL_TABLE_NAME="records"
PGSQL_TABLE_PARENT_NAME="files"
PGSQL_TABLE_CROSS_NAME="file_records"
PGSQL_TABLE_SEQUENCE="records_record_id_seq"
PGSQL_TABLE_PARENT_SEQUENCE="files_file_id_seq"
list_media_files=($(ls $MEDIA_FOLDER))
for file in ${list_media_files[*]}
do
    if [[ "$file" == "temp_file_raw"* ]]
    then
        continue
    fi
    input=$MEDIA_FOLDER$file
    line_offset=0
    record_offset=0
    IFS='_' read -ra file_data_split <<< "$file"
    device_id='00030efafb4bd16a7c000400'
    timestamp=$(date '+%s')"000"
    if [[ "$file" -ne "file_raw" ]]
    then
        echo "file_data_split: "${file_data_split[*]}
        device_id=${file_data_split[-2]}
        timestamp=${file_data_split[-3]}
    fi
    IFS=': ' read -ra mime_type <<< file --mime-type $input
    mime_type=${mime_type[1]}
    echo "()=>$input [$device_id, $timestamp] reading ... \n"
    echo "INSERT INTO $PGSQL_TABLE_PARENT_NAME ($PGSQL_PARENT_COLUMN) VALUES ('$device_id', '$timestamp','$mime_type');" > $SQL_FOLDER"temp_insert.sql"
    cat temp_insert.sql
    { 
        while IFS= read -r line
        do
            line_insert=($(echo $line | hexdump))
            echo "INSERT INTO $PGSQL_TABLE_NAME ($PGSQL_COLUMN) VALUES ('${line_insert[*]}', $record_offset);" > temp_insert.sql
            echo "INSERT INTO $PGSQL_TABLE_CROSS_NAME ($PGSQL_CROSS_COLUMN) SELECT currval('$PGSQL_TABLE_PARENT_SEQUENCE'), currval('$PGSQL_TABLE_SEQUENCE');" >> $SQL_FOLDER"temp_insert.sql"
            cat temp_insert.sql
            psql -h $PGSQL_HOST -U $PGSQL_USER -d $PGSQL_DBNAME -p $PGSQL_PORT -f $SQL_FOLDER"temp_insert.sql"
            line_offset=$((line_offset + 1))
        done < "$input"
    } || {
        echo "error on $input:$line_offset\n"
    }
done