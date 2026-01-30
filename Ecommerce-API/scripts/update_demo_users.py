"""
Script to update demo user IDs to have proper usernames and hashed passwords.

This script updates:
- User ID 527823573 → username: suzie
- User ID 597275441 → username: vincent  
- User ID 532608531 → username: larry

Passwords are properly hashed using bcrypt (not stored as plaintext).
"""

import sys
from pathlib import Path

# Add parent directory to path to import app modules
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy.orm import Session
from app.db.database import SessionLocal, engine
from app.models.models import User
from app.core.security import get_password_hash


def update_demo_users():
    """Update demo users with proper usernames and hashed passwords."""
    
    # User mappings: {old_id: (new_username, password, full_name)}
    user_updates = {
        527823573: ("suzie", "iloveSewing", "Sewing Suzie"),
        597275441: ("vincent", "cleanFreak", "Vacuum Vincent"),
        532608531: ("larry", "obsessedLarry", "Laptop Larry"),
    }
    
    db: Session = SessionLocal()
    
    try:
        updated_count = 0
        
        for user_id, (username, password, full_name) in user_updates.items():
            # Find user by ID
            user = db.query(User).filter(User.id == user_id).first()
            
            if user:
                # Hash the password
                hashed_password = get_password_hash(password)
                
                # Update user fields
                user.username = username
                user.password = hashed_password
                user.full_name = full_name
                user.role = "user"
                user.is_active = True
                
                print(f"✓ Updated user ID {user_id} → username: {username}, name: {full_name}")
                updated_count += 1
            else:
                print(f"✗ User ID {user_id} not found in database")
        
        # Commit all changes
        db.commit()
        print(f"\n✓ Successfully updated {updated_count} user(s)")
        print("\nDemo credentials:")
        print("- suzie / iloveSewing")
        print("- vincent / cleanFreak")
        print("- larry / obsessedLarry")
        
    except Exception as e:
        print(f"\n✗ Error updating users: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    print("Updating demo users...\n")
    update_demo_users()
