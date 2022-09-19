#!/bin/bash
# TASKS:
# 1. read files from media
# 2. loop file contents
# 3. connect to datasource
# 4. SQL insert content as hex block per block
MEDIA_FOLDER="/home/node/media/"
list_media_files=($(ls $MEDIA_FOLDER))
for file in ${list_media_files[*]}
do
    echo $file
done