-- ==============================================
-- VIEW ALL ALLEY 91 TRANSACTIONS
-- ==============================================
-- Complete transaction list for manual verification
-- ==============================================

WITH alley91_customer AS (
    SELECT id 
    FROM customers 
    WHERE LOWER(client_name) LIKE '%alley%91%' 
       OR LOWER(client_name) = 'alley 91'
    LIMIT 1
)
SELECT 
    st.transaction_date,
    st.transaction_type,
    st.amount,
    st.quantity,
    st.sku,
    st.description,
    st.branch,
    -- Calculate cumulative outstanding chronologically
    SUM(
        CASE 
            WHEN st.transaction_type = 'sale' THEN st.amount
            WHEN st.transaction_type = 'payment' THEN -st.amount
            ELSE 0
        END
    ) OVER (
        PARTITION BY st.customer_id 
        ORDER BY st.transaction_date ASC, st.created_at ASC
        ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
    ) as customer_outstanding,
    st.created_at,
    st.id as transaction_id
FROM sales_transactions st
WHERE st.customer_id IN (SELECT id FROM alley91_customer)
ORDER BY st.transaction_date ASC, st.created_at ASC;
