"""
Integration test demonstrating orchestrator service through user journey phases
This is a demo that shows how recommendations adapt as users interact with the system
"""

import time
import asyncio
from datetime import datetime
from typing import Optional
import sys
from pathlib import Path

# Ensure project root is on sys.path when running this file directly
PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from app.services.orchestrator_service import get_orchestrator_service, RecommendationMode
from app.services.neo4j_service import get_neo4j_service
from app.services.events import EventService
from app.db.database import SessionLocal
from app.models.models import User, Product
from app.schemas.events import EventCreate
from sqlalchemy import select


def print_separator(title: str):
    """Print a visual separator with title"""
    print("\n" + "="*80)
    print(f"  {title}")
    print("="*80 + "\n")


def get_product_name(product_id: int, db) -> str:
    """Get product name from database"""
    try:
        result = db.execute(select(Product).where(Product.product_id == product_id))
        product = result.scalar_one_or_none()
        if product:
            return product.title[:60] + ("..." if len(product.title) > 60 else "")
        return f"Product #{product_id}"
    except Exception:
        return f"Product #{product_id}"


def print_recommendations(recs: list, phase: str, show_details: bool = True, db=None):
    """Pretty print recommendations"""
    print(f"\n📦 {phase} - Found {len(recs)} recommendations:\n")
    
    for i, rec in enumerate(recs[:10], 1):  # Show top 10
        product_id = rec.get('product_id')
        score = rec.get('score', 0)
        source = rec.get('source', 'unknown')
        reason = rec.get('reason', 'No reason provided')
        
        # Get product name from payload or database
        product_name = None
        if 'payload' in rec and rec['payload']:
            product_name = rec['payload'].get('title', '')
        elif db:
            product_name = get_product_name(product_id, db)
        
        if product_name:
            title_short = product_name[:60] + ("..." if len(product_name) > 60 else "")
            print(f"{i}. {title_short}")
            print(f"   Product ID: {product_id} | Score: {score:.4f}")
        else:
            print(f"{i}. Product #{product_id}")
            print(f"   Score: {score:.4f}")
        
        print(f"   Source: {source} | {reason}")
        
        if show_details and 'payload' in rec and rec['payload']:
            payload = rec['payload']
            price = payload.get('price', 'N/A')
            print(f"   Price: ${price}")
        print()


def get_or_create_test_user(db) -> Optional[User]:
    """Get or create a test user for the demo"""
    # Try to find an existing user
    result = db.execute(select(User).limit(1))
    user = result.scalar_one_or_none()
    
    if user:
        print(f"✓ Using existing user: ID={user.id}, Email={user.email}")
        return user
    
    # Create a new test user if none exists
    print("⚠ No users found in database. Please create a user first.")
    return None


def get_sample_products(db, limit: int = 20) -> list[Product]:
    """Get sample products from database"""
    result = db.execute(select(Product).limit(limit))
    products = result.scalars().all()
    return list(products)


def simulate_product_view(user_id: int, product_id: int):
    """Simulate a user viewing a product"""
    try:
        session_id = f"session_{user_id}_{int(time.time())}"
        
        # Use EventService just like the router does
        event = EventCreate(
            user_id=user_id,
            product_id=product_id,
            event_type="view",
            event_time=datetime.utcnow(),
            user_session=session_id
        )
        EventService.create_event(event, token=None)
        
        print(f"  ✓ Logged view event: User {user_id} viewed Product {product_id}")
    except Exception as e:
        print(f"  ✗ Error logging view: {e}")


def simulate_product_purchase(user_id: int, product_id: int):
    """Simulate a user purchasing a product"""
    try:
        session_id = f"session_{user_id}_{int(time.time())}"
        
        # Use EventService just like the router does
        event = EventCreate(
            user_id=user_id,
            product_id=product_id,
            event_type="purchase",
            event_time=datetime.utcnow(),
            user_session=session_id
        )
        EventService.create_event(event, token=None)
        
        print(f"  ✓ Logged purchase event: User {user_id} purchased Product {product_id}")
    except Exception as e:
        print(f"  ✗ Error logging purchase: {e}")


def test_orchestrator_user_journey_demo():
    """
    Integration test demonstrating the orchestrator service through a complete user journey.
    
    Journey:
    1. Cold Start - New user with no history
    2. Browsing - User views several products
    3. Post-Purchase - User makes a purchase
    
    At each phase, we show how recommendations adapt.
    """
    print_separator("🚀 ORCHESTRATOR SERVICE USER JOURNEY DEMO")
    print(f"Start Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("\nThis demo simulates a real user journey through different recommendation phases")
    print("and shows how the orchestrator adapts recommendations based on user behavior.\n")
    
    # Initialize services
    orchestrator = get_orchestrator_service()
    neo4j = get_neo4j_service()
    db = SessionLocal()
    
    try:
        # Get test user and products
        print_separator("📋 SETUP")
        user = get_or_create_test_user(db)
        if not user:
            print("❌ Cannot proceed without a user. Please ensure database has users.")
            return
        
        user_id = user.id
        
        # Clean up any previous test data for this user (for fresh demo)
        print(f"🧹 Cleaning up previous test data for user {user_id}...")
        try:
            with neo4j.driver.session() as session:
                result = session.run("""
                    MATCH (u:User {user_id: $user_id})-[r:INTERACTED]->()
                    DELETE r
                    RETURN count(r) as deleted
                """, user_id=user_id)
                deleted = result.single()["deleted"]
                print(f"   Deleted {deleted} previous interactions from Neo4j")
        except Exception as e:
            print(f"   Warning: Could not clean Neo4j data: {e}")
        
        products = get_sample_products(db, limit=20)
        
        if len(products) < 5:
            print("❌ Not enough products in database. Please ensure at least 5 products exist.")
            return
        
        print(f"✓ Found {len(products)} products in database")
        print(f"✓ Using user ID: {user_id}")
        
        # ===================================================================
        # PHASE 1: COLD START - New user, no interaction history
        # ===================================================================
        print_separator("🆕 PHASE 1: COLD START")
        print("Scenario: New user just landed on the site")
        print("Expected: Popular/trending products to help user discover items\n")
        
        time.sleep(1)  # Simulate page load
        
        mode, context = orchestrator.determine_user_mode(user_id)
        print(f"Detected Mode: {mode}")
        print(f"Context: {context}\n")
        
        result = orchestrator.get_orchestrated_recommendations(
            user_id=user_id,
            total_limit=15,
            include_reasons=True
        )
        
        print(f"Strategy: {result['strategy']}")
        print(f"Sources Used: {', '.join(result['sources_used'])}")
        print_recommendations(result['recommendations'], "COLD START RECOMMENDATIONS", db=db)
        
        time.sleep(2)
        
        # ===================================================================
        # PHASE 2: BROWSING - User explores products
        # ===================================================================
        print_separator("🔍 PHASE 2: BROWSING")
        print("Scenario: User starts browsing and viewing products")
        print("Expected: Diverse recommendations based on viewed items\n")
        
        # Simulate viewing 5 products
        viewed_products = products[:5]
        print("User is browsing the following products:\n")
        
        for i, product in enumerate(viewed_products, 1):
            print(f"{i}. Product #{product.product_id}: {product.title[:60]}...")
            print(f"   Category: {product.category}, Price: ${product.price}")
            simulate_product_view(user_id, product.product_id)
            time.sleep(0.5)  # Simulate time between views
        
        print("\n⏳ Processing events...")
        time.sleep(1)
        
        # Get recommendations after browsing
        print("\n📊 Getting recommendations after browsing activity...\n")
        
        mode, context = orchestrator.determine_user_mode(user_id)
        print(f"Detected Mode: {mode}")
        print(f"Context: {context}\n")
        
        result = orchestrator.get_orchestrated_recommendations(
            user_id=user_id,
            total_limit=15,
            mmr_diversity=0.7,  # High diversity for exploration
            include_reasons=True
        )
        
        print(f"Strategy: {result['strategy']}")
        print(f"Sources Used: {', '.join(result['sources_used'])}")
        print_recommendations(result['recommendations'], "BROWSING MODE RECOMMENDATIONS", db=db)
        
        # Show user history
        print("\n📜 User's recent history:")
        history = neo4j.get_user_history(user_id, limit=10)
        for h in history[:5]:
            print(f"  - {h.get('event_type', 'unknown').upper()}: Product #{h.get('product_id')}")
        
        time.sleep(3)
        
        # ===================================================================
        # PHASE 3: MORE BROWSING - User continues exploring
        # ===================================================================
        print_separator("🔍 PHASE 3: CONTINUED BROWSING")
        print("Scenario: User views a few more products in different categories")
        print("Expected: Recommendations adapt to include more diverse items\n")
        
        # View 3 more products
        additional_products = products[5:8]
        print("User continues browsing:\n")
        
        for i, product in enumerate(additional_products, 1):
            print(f"{i}. Product #{product.product_id}: {product.title[:60]}...")
            simulate_product_view(user_id, product.product_id)
            time.sleep(0.5)
        
        print("\n⏳ Processing events...")
        time.sleep(1)
        
        result = orchestrator.get_orchestrated_recommendations(
            user_id=user_id,
            total_limit=15,
            mmr_diversity=0.7,
            include_reasons=True
        )
        
        print(f"Strategy: {result['strategy']}")
        print(f"Sources Used: {', '.join(result['sources_used'])}")
        print_recommendations(result['recommendations'], "UPDATED BROWSING RECOMMENDATIONS", db=db)
        
        time.sleep(2)
        
        # ===================================================================
        # PHASE 4: PURCHASE - User makes a purchase
        # ===================================================================
        print_separator("🛒 PHASE 4: POST-PURCHASE")
        print("Scenario: User decides to purchase a product")
        print("Expected: Complementary products that pair well with purchase\n")
        
        # Purchase a product that's likely to have co-purchase data
        # Use a trending product from the bulk dataset instead of the viewed jeans
        print("🔍 Finding a product with rich purchase history...")
        trending_products = neo4j.get_trending_products(limit=20, event_types=["purchase"])
        
        # Try to find one with good co-purchase data
        purchased_product = None
        for trend in trending_products:
            test_complementary = neo4j.get_complementary_products(
                product_id=trend["product_id"],
                limit=1
            )
            if test_complementary:
                # Found one with co-purchase data!
                # Get the product from our DB
                result = db.execute(select(Product).where(Product.product_id == trend["product_id"]))
                db_product = result.scalar_one_or_none()
                if db_product:
                    purchased_product = db_product
                    print(f"✓ Found product with co-purchase patterns: {purchased_product.title[:70]}")
                    break
        
        # Fallback to the first viewed product if we couldn't find one
        if not purchased_product:
            print("⚠ No products with co-purchase data found, using viewed product")
            purchased_product = viewed_products[0]
        
        print(f"\n🎉 User is purchasing Product #{purchased_product.product_id}")
        print(f"   {purchased_product.title[:70]}...")
        print(f"   Price: ${purchased_product.price}\n")
        
        simulate_product_purchase(user_id, purchased_product.product_id)
        
        print("⏳ Processing purchase event...")
        time.sleep(1)
        
        # Get recommendations after purchase
        print("\n📊 Getting recommendations after purchase...\n")
        
        mode, context = orchestrator.determine_user_mode(user_id, lookback_hours=1)
        print(f"Detected Mode: {mode}")
        print(f"Context: {context}\n")
        
        result = orchestrator.get_orchestrated_recommendations(
            user_id=user_id,
            total_limit=15,
            include_reasons=True
        )
        
        print(f"Strategy: {result['strategy']}")
        print(f"Sources Used: {', '.join(result['sources_used'])}")
        print_recommendations(result['recommendations'], "POST-PURCHASE RECOMMENDATIONS", db=db)
        
        # Debug: Check what Neo4j has for this product
        print("\n🔍 Debugging complementary products:")
        print(f"   Checking Neo4j for purchase patterns of product {purchased_product.product_id}")
        
        # Check if anyone in Neo4j bought this product
        neo4j_results = neo4j.get_complementary_products(
            product_id=purchased_product.product_id,
            limit=20
        )
        print(f"   Neo4j found {len(neo4j_results)} co-purchase patterns")
        if neo4j_results:
            print(f"   Sample: {neo4j_results[:3]}")
        
        # Check total purchases in Neo4j
        stats = neo4j.get_product_stats(purchased_product.product_id)
        if stats:
            print(f"   Product stats in Neo4j: {stats}")
        else:
            print(f"   ⚠ Product {purchased_product.product_id} not found in Neo4j!")
        
        # Show complementary products specifically
        print("\n🔗 Specific complementary products for purchased item:")
        complementary = orchestrator.get_complementary_products(
            purchased_product_id=purchased_product.product_id,
            user_id=user_id,
            limit=10
        )
        
        if complementary:
            for i, comp in enumerate(complementary[:5], 1):
                print(f"{i}. Product #{comp['product_id']}")
                print(f"   Score: {comp['score']:.4f}")
                print(f"   {comp['reason']}\n")
        else:
            print("  (No complementary products found - may need more purchase data)")
        
        time.sleep(2)
        
        # ===================================================================
        # PHASE 5: FOR YOU PAGE - Personalized feed
        # ===================================================================
        print_separator("✨ PHASE 5: FOR YOU PAGE")
        print("Scenario: User visits their personalized 'For You' page")
        print("Expected: Paginated, fully personalized recommendations\n")
        
        for_you = orchestrator.get_for_you_page(
            user_id=user_id,
            page=1,
            page_size=10,
            mmr_diversity=0.7
        )
        
        print(f"Mode: {for_you['mode']}")
        print(f"Strategy: {for_you['strategy']}")
        print(f"Has More: {for_you['has_more']}")
        print_recommendations(for_you['recommendations'], "FOR YOU PAGE (Page 1)", db=db)
        
        if for_you['has_more']:
            print("\n📄 Fetching page 2...\n")
            time.sleep(1)
            
            for_you_page2 = orchestrator.get_for_you_page(
                user_id=user_id,
                page=2,
                page_size=10
            )
            print_recommendations(for_you_page2['recommendations'], "FOR YOU PAGE (Page 2)", show_details=False, db=db)
        
        # ===================================================================
        # SUMMARY
        # ===================================================================
        print_separator("📊 JOURNEY SUMMARY")
        
        print(f"User ID: {user_id}")
        print(f"Total Products Viewed: {len(viewed_products) + len(additional_products)}")
        print(f"Total Purchases: 1")
        print(f"Final Mode: {mode}\n")
        
        # Get final user statistics
        history = neo4j.get_user_history(user_id, limit=100)
        view_count = sum(1 for h in history if h.get('event_type') == 'view')
        purchase_count = sum(1 for h in history if h.get('event_type') == 'purchase')
        
        print(f"Total Events Logged:")
        print(f"  - Views: {view_count}")
        print(f"  - Purchases: {purchase_count}")
        print(f"  - Total: {len(history)}\n")
        
        print("✅ Demo completed successfully!")
        print(f"End Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        
    except Exception as e:
        print(f"\n❌ Error during demo: {e}")
        import traceback
        traceback.print_exc()
        
    finally:
        db.close()
        print_separator("END OF DEMO")


if __name__ == "__main__":
    test_orchestrator_user_journey_demo()
