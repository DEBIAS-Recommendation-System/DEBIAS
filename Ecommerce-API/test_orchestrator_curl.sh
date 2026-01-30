#!/bin/bash

# Orchestrator Demo - Same Scenario with curl Commands
# This replicates the test_orchestrator_demo.py flow using API calls

set -e  # Exit on error

API_BASE="http://localhost:8000"
USER_ID=4  # Use a different user to avoid conflicts

echo "================================================================================"
echo "  🚀 ORCHESTRATOR SERVICE USER JOURNEY DEMO (CURL VERSION)"
echo "================================================================================"
echo ""
echo "API Base URL: $API_BASE"
echo "User ID: $USER_ID"
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Helper function to print section headers
print_section() {
    echo ""
    echo "================================================================================"
    echo "  $1"
    echo "================================================================================"
    echo ""
}

# Helper function to pretty print JSON
print_json() {
    echo "$1" | python3 -m json.tool 2>/dev/null || echo "$1"
}

# ============================================================================
# SETUP: Clean previous test data
# ============================================================================
print_section "📋 SETUP"

echo "🧹 Cleaning up previous test data for user $USER_ID..."
# We'll use Neo4j directly for cleanup (same as test)
uv run python -c "
from app.services.neo4j_service import get_neo4j_service
neo4j = get_neo4j_service()
with neo4j.driver.session() as session:
    result = session.run('''
        MATCH (u:User {user_id: \$user_id})-[r:INTERACTED]->()
        DELETE r
        RETURN count(r) as deleted
    ''', user_id=$USER_ID)
    deleted = result.single()['deleted']
    print('   Deleted {} previous interactions from Neo4j'.format(deleted))
" 2>/dev/null || echo "   Warning: Could not clean Neo4j data"

echo "✓ Setup complete"
sleep 1

# ============================================================================
# PHASE 1: COLD START - New user
# ============================================================================
print_section "🆕 PHASE 1: COLD START"

echo "Scenario: New user just landed on the site"
echo "Expected: Popular/trending products"
echo ""

echo -e "${BLUE}Checking user mode...${NC}"
MODE_RESPONSE=$(curl -s "$API_BASE/orchestrator/user-mode/$USER_ID")
echo "User Mode:"
print_json "$MODE_RESPONSE"
echo ""

echo -e "${BLUE}Getting initial recommendations...${NC}"
RECS_RESPONSE=$(curl -s "$API_BASE/orchestrator/recommendations/$USER_ID?limit=10&include_reasons=true")
echo "Recommendations:"
echo "$RECS_RESPONSE" | python3 -c "
import sys, json
data = json.load(sys.stdin)
print('Mode: {}'.format(data.get('mode')))
print('Sources: {}'.format(', '.join(data.get('sources_used', []))))
print('Total: {} recommendations'.format(data.get('total_count')))
print('\\nTop 5 recommendations:')
for i, rec in enumerate(data.get('recommendations', [])[:5], 1):
    payload = rec.get('payload', {})
    title = payload.get('title', 'Product #{}'.format(rec['product_id']))[:60]
    print('  {}. {}'.format(i, title))
    print('     Source: {} | Score: {:.2f}'.format(rec['source'], rec['score']))
" 2>/dev/null || print_json "$RECS_RESPONSE"

sleep 2

# ============================================================================
# PHASE 2: BROWSING - User views products
# ============================================================================
print_section "🔍 PHASE 2: BROWSING"

echo "Scenario: User starts browsing and viewing products"
echo "Expected: Diverse recommendations based on viewed items"
echo ""

# View 5 products (electronics/toys)
PRODUCT_IDS=(100063161 1307136 10201665 12300082 28705191)

echo "User is browsing the following products:"
echo ""

for i in "${!PRODUCT_IDS[@]}"; do
    PRODUCT_ID=${PRODUCT_IDS[$i]}
    SESSION_ID="session_${USER_ID}_$(date +%s)"
    
    # Get product name
    PRODUCT_NAME=$(curl -s "$API_BASE/products/$PRODUCT_ID" | python3 -c "import sys, json; d=json.load(sys.stdin); print(d.get('title', 'Unknown')[:60])" 2>/dev/null || echo "Product #$PRODUCT_ID")
    
    echo -e "${YELLOW}$((i+1)). Viewing: $PRODUCT_NAME${NC}"
    echo "   (Product ID: $PRODUCT_ID)"
    
    # Track view event
    VIEW_RESPONSE=$(curl -s -X POST "$API_BASE/events/" \
        -H "Content-Type: application/json" \
        -d "{
            \"user_id\": $USER_ID,
            \"product_id\": $PRODUCT_ID,
            \"event_type\": \"view\",
            \"user_session\": \"$SESSION_ID\"
        }")
    
    if echo "$VIEW_RESPONSE" | grep -q "message"; then
        echo "  ✓ Logged view event"
    else
        echo "  ✗ Failed to log view"
        echo "$VIEW_RESPONSE"
    fi
    
    sleep 0.5
done

echo ""
echo "⏳ Processing events..."
sleep 1

echo ""
echo -e "${BLUE}Getting recommendations after browsing...${NC}"
BROWSING_RECS=$(curl -s "$API_BASE/orchestrator/recommendations/$USER_ID?limit=15&include_reasons=true")
echo "$BROWSING_RECS" | python3 -c "
import sys, json
data = json.load(sys.stdin)
print('Mode: {}'.format(data.get('mode')))
print('Sources: {}'.format(', '.join(data.get('sources_used', []))))
print('Strategy: {}...'.format(str(data.get('strategy', ''))[:100]))
print('\\nTop 10 recommendations:')
for i, rec in enumerate(data.get('recommendations', [])[:10], 1):
    payload = rec.get('payload') or {}
    title = payload.get('title', 'Product #{}'.format(rec['product_id']))[:60]
    print('  {}. {}'.format(i, title))
    print('     Source: {} | Score: {:.2f}'.format(rec['source'], rec['score']))
" 2>/dev/null || print_json "$BROWSING_RECS"

sleep 2

# ============================================================================
# PHASE 3: CONTINUED BROWSING
# ============================================================================
print_section "🔍 PHASE 3: CONTINUED BROWSING"

echo "Scenario: User views more products in different categories"
echo ""

# View 3 more products (apparel)
MORE_PRODUCTS=(32403555 45600181 28102023)

echo "User continues browsing:"
echo ""

for i in "${!MORE_PRODUCTS[@]}"; do
    PRODUCT_ID=${MORE_PRODUCTS[$i]}
    SESSION_ID="session_${USER_ID}_$(date +%s)"
    
    # Get product name
    PRODUCT_NAME=$(curl -s "$API_BASE/products/$PRODUCT_ID" | python3 -c "import sys, json; d=json.load(sys.stdin); print(d.get('title', 'Unknown')[:60])" 2>/dev/null || echo "Product #$PRODUCT_ID")
    
    echo -e "${YELLOW}$((i+1)). Viewing: $PRODUCT_NAME${NC}"
    echo "   (Product ID: $PRODUCT_ID)"
    
    curl -s -X POST "$API_BASE/events/" \
        -H "Content-Type: application/json" \
        -d "{
            \"user_id\": $USER_ID,
            \"product_id\": $PRODUCT_ID,
            \"event_type\": \"view\",
            \"user_session\": \"$SESSION_ID\"
        }" > /dev/null
    
    echo "  ✓ Logged view event"
    sleep 0.5
done

echo ""
echo "⏳ Processing events..."
sleep 1

echo ""
echo -e "${BLUE}Getting updated recommendations...${NC}"
UPDATED_RECS=$(curl -s "$API_BASE/orchestrator/recommendations/$USER_ID?limit=15")
echo "$UPDATED_RECS" | python3 -c "
import sys, json
data = json.load(sys.stdin)
print('Mode: {}'.format(data.get('mode')))
print('Sources: {}'.format(', '.join(data.get('sources_used', []))))
print('Total: {} recommendations'.format(data.get('total_count')))
" 2>/dev/null

sleep 2

# ============================================================================
# PHASE 4: POST-PURCHASE
# ============================================================================
print_section "🛒 PHASE 4: POST-PURCHASE"

echo "Scenario: User makes a purchase"
echo "Expected: Complementary products that pair well with purchase"
echo ""

# Find a product with co-purchase data (use trending product)
echo "🔍 Finding a product with rich purchase history..."
TRENDING=$(curl -s "$API_BASE/orchestrator/trending?limit=5&event_type=purchase")
PURCHASE_PRODUCT=$(echo "$TRENDING" | python3 -c "
import sys, json
data = json.load(sys.stdin)
recs = data.get('recommendations', [])
if recs:
    print(recs[0]['product_id'])
else:
    print('3701134')  # Fallback
" 2>/dev/null || echo "3701134")

# Get product name
PURCHASE_NAME=$(curl -s "$API_BASE/products/$PURCHASE_PRODUCT" | python3 -c "import sys, json; d=json.load(sys.stdin); print(d.get('title', 'Unknown')[:70])" 2>/dev/null || echo "Product #$PURCHASE_PRODUCT")

echo "✓ Selected: $PURCHASE_NAME"
echo "   (Product ID: $PURCHASE_PRODUCT)"
echo ""

SESSION_ID="session_${USER_ID}_$(date +%s)"

echo -e "${GREEN}🎉 Purchasing: $PURCHASE_NAME${NC}"

# Track purchase event
PURCHASE_RESPONSE=$(curl -s -X POST "$API_BASE/events/" \
    -H "Content-Type: application/json" \
    -d "{
        \"user_id\": $USER_ID,
        \"product_id\": $PURCHASE_PRODUCT,
        \"event_type\": \"purchase\",
        \"user_session\": \"$SESSION_ID\"
    }")

if echo "$PURCHASE_RESPONSE" | grep -q "message"; then
    echo "  ✓ Logged purchase event"
else
    echo "  ✗ Failed to log purchase"
fi

echo ""
echo "⏳ Processing purchase event..."
sleep 1

echo ""
echo -e "${BLUE}Getting recommendations after purchase...${NC}"
POST_PURCHASE_RECS=$(curl -s "$API_BASE/orchestrator/recommendations/$USER_ID?limit=15&include_reasons=true")

echo "$POST_PURCHASE_RECS" | python3 -c "
import sys, json
data = json.load(sys.stdin)
print('Mode: {}'.format(data.get('mode')))
print('Mode Context: {}'.format(data.get('mode_context')))
print('Sources: {}'.format(', '.join(data.get('sources_used', []))))
print('Strategy: {}...'.format(str(data.get('strategy', ''))[:100]))
print('\\nTop 10 recommendations:')
complementary_count = 0
for i, rec in enumerate(data.get('recommendations', [])[:10], 1):
    payload = rec.get('payload') or {}
    title = payload.get('title', 'Product #{}'.format(rec['product_id']))[:60]
    source = rec['source']
    if source == 'complementary':
        complementary_count += 1
        print('  {}. {} ⭐'.format(i, title))
    else:
        print('  {}. {}'.format(i, title))
    print('     Source: {} | Score: {:.2f}'.format(source, rec['score']))

print('\\n✅ Found {} COMPLEMENTARY recommendations in top 10'.format(complementary_count))
" 2>/dev/null || print_json "$POST_PURCHASE_RECS"

echo ""
echo "🔗 Getting specific complementary products:"
COMPLEMENTARY=$(curl -s -X POST "$API_BASE/orchestrator/complementary" \
    -H "Content-Type: application/json" \
    -d "{
        \"user_id\": $USER_ID,
        \"purchased_product_id\": $PURCHASE_PRODUCT,
        \"limit\": 5
    }")

echo "$COMPLEMENTARY" | python3 -c "
import sys, json
data = json.load(sys.stdin)
recs = data.get('recommendations', [])
print('Found {} complementary products:'.format(len(recs)))
for i, rec in enumerate(recs[:5], 1):
    print('  {}. Product #{}'.format(i, rec['product_id']))
    print('     Score: {:.2f} | {}'.format(rec['score'], rec['reason']))
" 2>/dev/null || print_json "$COMPLEMENTARY"

sleep 2

# ============================================================================
# PHASE 5: FOR YOU PAGE
# ============================================================================
print_section "✨ PHASE 5: FOR YOU PAGE"

echo "Scenario: User visits their personalized 'For You' page"
echo "Expected: Paginated, fully personalized recommendations"
echo ""

FOR_YOU=$(curl -s "$API_BASE/orchestrator/for-you/$USER_ID?page=1&page_size=10")
echo "$FOR_YOU" | python3 -c "
import sys, json
data = json.load(sys.stdin)
print('Mode: {}'.format(data.get('mode')))
print('Page: {} | Page Size: {}'.format(data.get('page'), data.get('page_size')))
print('Has More: {}'.format(data.get('has_more')))
print('\\nTop 10 For You recommendations:')
complementary_count = 0
for i, rec in enumerate(data.get('recommendations', []), 1):
    payload = rec.get('payload') or {}
    title = payload.get('title', 'Product #{}'.format(rec['product_id']))[:60]
    source = rec['source']
    if source == 'complementary':
        complementary_count += 1
    print('  {}. {}'.format(i, title))
    print('     Source: {}'.format(source))

print('\\n✅ COMPLEMENTARY source appears: {}'.format('YES' if complementary_count > 0 else 'NO'))
print('   Count: {} complementary products'.format(complementary_count))
" 2>/dev/null || print_json "$FOR_YOU"

# ============================================================================
# SUMMARY
# ============================================================================
print_section "📊 JOURNEY SUMMARY"

echo "User ID: $USER_ID"
echo "Total Products Viewed: 8"
echo "Total Purchases: 1"
echo ""

# Get final stats
FINAL_MODE=$(curl -s "$API_BASE/orchestrator/user-mode/$USER_ID")
echo "Final Mode:"
print_json "$FINAL_MODE"

echo ""
echo "✅ Demo completed successfully!"
echo ""
echo "================================================================================"
echo "  END OF DEMO"
echo "================================================================================"
