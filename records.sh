#!/bin/bash
# :: Please run only with bash ..
# TASKS:
# 1. read files from media
# 2. loop file contents
# 3. connect to datasource
# 4. SQL insert content as hex block per block
BYTEBLOCK_LIMIT=1024
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
    {
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
        if [[ "$file" != "file_raw" ]]
        then
            echo "file_data_split: "${file_data_split[*]}
            device_id=${file_data_split[-2]}
            timestamp=${file_data_split[-3]}
        fi
        mime_type=$(file --mime-type $input)
        IFS=': ' read -ra mime_type <<< $mime_type
        mime_type=${mime_type[1]}
        echo "()=>$input [$device_id, $timestamp] reading ... \n"
        echo "INSERT INTO $PGSQL_TABLE_PARENT_NAME ($PGSQL_PARENT_COLUMN) VALUES ('$device_id', to_timestamp($timestamp/1000),'$mime_type');" > $SQL_FOLDER"temp_insert.sql"
        cat $SQL_FOLDER"temp_insert.sql"
        psql -h $PGSQL_HOST -U $PGSQL_USER -d $PGSQL_DBNAME -p $PGSQL_PORT -f $SQL_FOLDER"temp_insert.sql"
        { 
            # while IFS= read -r line 
            # 8a4a280168a4a2800a28a28016928a2800a28a2800a28a2800a28a4a0028 while join < 1024*2 chars
            # do
            lines_insert=($(xxd -p $input))
            line_count=0
            block=""
            for line in ${lines_insert[*]}
            do
                if ((${#block} < ($BYTEBLOCK_LIMIT*2)))
                then
                    block+=$line
                    continue
                fi
                echo "INSERT INTO $PGSQL_TABLE_NAME ($PGSQL_COLUMN) VALUES ('$block', $record_offset);" > $SQL_FOLDER"temp_insert.sql"
                echo "INSERT INTO $PGSQL_TABLE_CROSS_NAME ($PGSQL_CROSS_COLUMN) SELECT sq1.last_value, sq2.last_value FROM $PGSQL_TABLE_PARENT_SEQUENCE sq1, $PGSQL_TABLE_SEQUENCE sq2;" >> $SQL_FOLDER"temp_insert.sql"
                cat $SQL_FOLDER"temp_insert.sql"
                psql -h $PGSQL_HOST -U $PGSQL_USER -d $PGSQL_DBNAME -p $PGSQL_PORT -f $SQL_FOLDER"temp_insert.sql"
                line_offset=$((line_offset + 1))
                block=""
            done
            # done < "$input"
            rm $input
        } || {
            echo "error on Subprocess $input:$line_offset\n"
        }
    } || {
            echo "error on Process $input\n"
    }
done