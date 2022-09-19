#!/bin/bash
# :: Please run only with bash ..
# TASKS:
# 1. read files from media
# 2. loop file contents
# 3. connect to datasource
# 4. SQL insert content as hex block per block
MEDIA_FOLDER="/home/node/media/"
list_media_files=($(ls $MEDIA_FOLDER))
for file in ${list_media_files[*]}
do
    $input=$MEDIA_FOLDER$file
    line_offset=0
    echo "()=>$input reading ... \n"
    { 
        while IFS= read -r line
        do
            echo "$line"
            line_offset=$((line_offset + 1))
        done < "$input"
    } || {
        echo "error on $input:$line_offset\n"
    }
done