#!/bin/bash

# Script to update demo user credentials in the database
# This updates user IDs 527823573, 597275441, and 532608531 
# to have proper usernames (suzie, vincent, larry) with hashed passwords

echo "Updating demo user credentials..."
echo ""

cd Ecommerce-API

# Run the update script
python scripts/update_demo_users.py

echo ""
echo "Done!"
