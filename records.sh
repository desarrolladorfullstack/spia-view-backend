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
PGSQL_PARENT_COLUMN="device_key, file_stamp, mime_type, temp_file, orientation"
PGSQL_CROSS_COLUMN="file_key, record_key"
PGSQL_TABLE_NAME="records"
PGSQL_TABLE_PARENT_NAME="files"
PGSQL_TABLE_CROSS_NAME="file_records"
PGSQL_TABLE_SEQUENCE="records_record_id_seq"
PGSQL_TABLE_PARENT_SEQUENCE="files_file_id_seq"
TEMP_INSERT_FILE="temp_insert.sql"
TEMP_SELECT_FILE="temp_select.sql"
TEMP_SELECT_RESULT="temp_select_result.tmp"
list_media_files=($(ls $MEDIA_FOLDER))
for file in ${list_media_files[*]}
do
    {
        file_key="sq1.last_value"
        if [[ "$file" != *"_video" ]] && [[ "$file" != *"_image" ]]
        then
            echo "file rejected: $file"
            continue
        fi
        input=$MEDIA_FOLDER$file
        if test -f "$input"
        then
            echo "$input exists."
        else
            echo "FAILURE: $input Not found!"
            continue
        fi
        line_offset=0
        record_offset=0
        IFS='_' read -ra file_data_split <<< "$file"
        device_id='00030efafb4bd16a7c000400'
        timestamp=$(date '+%s')"000"
        orientation='undefined'
        if [[ "$file" != "file_raw" ]]
        then
            echo "file_data_split: "${file_data_split[*]}
            device_id=${file_data_split[-4]}
            timestamp=${file_data_split[-5]}
            {
              orientation=${file_data_split[-3]}
            } || {
              orientation='both'
            }
        fi
        # BEGIN: validate mime-type
        #mime_type=$(file --mime-type $input)
        #IFS=': ' read -ra mime_type <<< $mime_type
        #mime_type="${mime_type[1]}"
        # END: validate mime-type
        mime_type="image/jpeg"
        if [[ "$file" == *"_video" ]]
        then
          mime_type="application/octet-stream"
          echo ".... $file is a video ...."
        else
          echo ".... $file is an image ...."
        fi
        # BEGIN: validate temp_file
        echo "SELECT * FROM $PGSQL_TABLE_PARENT_NAME WHERE temp_file = '$file';" > $SQL_FOLDER$TEMP_SELECT_FILE
        cat $SQL_FOLDER$TEMP_INSERT_FILE
        cat $SQL_FOLDER$TEMP_SELECT_FILE >> $SQL_FOLDER"inserts_records.sql"
        psql -h $PGSQL_HOST -U $PGSQL_USER -d $PGSQL_DBNAME -p $PGSQL_PORT -f $SQL_FOLDER$TEMP_SELECT_FILE > $SQL_FOLDER$TEMP_SELECT_RESULT
        result=""; while read -r line; do result="$result$line;"; done < $SQL_FOLDER$TEMP_SELECT_RESULT
        if [[ "$result" != *"(0 rows)"* ]]
        then
          IFS=';' read -ra results <<< "$result"
          end_rows=${#results}
          for (( i = 2; i < end_rows; i++ ))
          do
            IFS=' | ' read -ra row <<< "${results[$i]}"
            if [[ "${row[0]}" != "" ]]
            then
              file_id="${row[0]}"
              file_key=$file_id
              echo "file_key exists: $file_id"
              break
            fi
          done
        fi
        # END: validate temp_file
        echo "()=>$input [$device_id, $timestamp,$mime_type,$file,$orientation] reading ... \n"
        if [[ "$file_key" == "" ]] || [[ "$file_key" == "sq1.last_value" ]]
        then
          echo "INSERT INTO $PGSQL_TABLE_PARENT_NAME ($PGSQL_PARENT_COLUMN) VALUES ('$device_id', to_timestamp($timestamp/1000),'$mime_type','$file','$orientation');" > $SQL_FOLDER$TEMP_INSERT_FILE
          cat $SQL_FOLDER$TEMP_INSERT_FILE
          cat $SQL_FOLDER$TEMP_INSERT_FILE >> $SQL_FOLDER"inserts_records.sql"
          psql -h $PGSQL_HOST -U $PGSQL_USER -d $PGSQL_DBNAME -p $PGSQL_PORT -f $SQL_FOLDER$TEMP_INSERT_FILE
        fi
        {  
            lines_insert=($(xxd -p "$input"))
            echo "== WARNING: INSERT FROM HEX STRING =="
            lines_insert=($(cat "$input"))
            line_count=0
            block=""
            block_count=32
            declare -a block_inserts
            lines="";
            for line in ${lines_insert[*]}
            do
              lines="$lines$line"
            done
            #if ((${#block} < ($BYTEBLOCK_LIMIT*2)))
            #then
            #    block+=$line
            #    continue
            #fi
            #    if (($line_count < $block_count))
            #    then
            #        block="$block$line"
            #        line_count=$((line_count + 1))
            #        continue
            #    fi
            #    block_inserts+=(\"$block\")
            #    block=""
            #    line_count=0
            #done 
            #if (($line_count < $block_count))
            #then
            #    block_inserts+=($block)
            #fi
            #for line in ${block_inserts[@]}
            #do
            #   block=$line
                echo "-> ENTIRE MODE: block=\$lines ... lines=\"\$lines\$line\""
                block=$lines
                echo "INSERT INTO $PGSQL_TABLE_NAME ($PGSQL_COLUMN) VALUES ('$block', $record_offset);" > $SQL_FOLDER$TEMP_INSERT_FILE
                echo "INSERT INTO $PGSQL_TABLE_CROSS_NAME ($PGSQL_CROSS_COLUMN) SELECT $file_key, sq2.last_value FROM $PGSQL_TABLE_PARENT_SEQUENCE sq1, $PGSQL_TABLE_SEQUENCE sq2;" >> $SQL_FOLDER$TEMP_INSERT_FILE
                cat $SQL_FOLDER$TEMP_INSERT_FILE
                cat $SQL_FOLDER$TEMP_INSERT_FILE >> $SQL_FOLDER"inserts_records.sql"
                psql -h $PGSQL_HOST -U $PGSQL_USER -d $PGSQL_DBNAME -p $PGSQL_PORT -f $SQL_FOLDER$TEMP_INSERT_FILE
                line_offset=$((line_offset + 1))
                block=""
                line_count=0
            #done
            if test -f "$input"
            then
                echo "$input exists for RM." 
                # rm $input
            else
                echo "RM: $input Not found!"
                continue
            fi
        } || {
            echo "error on Subprocess $input:$line_offset\n"
        }
    } || {
            echo "error on Process $input\n"
    }
done