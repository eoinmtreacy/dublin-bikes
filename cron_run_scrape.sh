#!/bin/bash

# Activate the Conda environment
source /home/ubuntu/miniconda3/bin conn-test

# Run the Python script
python /home/ubuntu/comp30380-dublin-bikes/script.py dublin

# Deactivate the Conda environment
conda deactivate
