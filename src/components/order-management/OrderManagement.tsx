*** Begin Patch
*** Update File: src/components/order-management/OrderManagement.tsx
@@
-  const clearAllOrdersFilters = useCallback(() => {
+  const clearAllOrdersFilters = useCallback(() => {
     setOrdersSearchTerm("");
     setOrdersColumnFilters({
       client: "",
       branch: "",
       sku: "",
       number_of_cases: "",
       tentative_delivery_date: "",
       status: "",
     });
     setOrdersColumnSorts({
       client: null,
       branch: null,
       sku: null,
       number_of_cases: null,
       tentative_delivery_date: null,
       status: null,
     });
-  };
+  }, []);
@@
-  const handleDispatchColumnFilterChange = useCallback((columnKey: string, value: string) => {
+  const handleDispatchColumnFilterChange = useCallback((columnKey: string, value: string) => {
     setDispatchColumnFilters(prev => ({
       ...prev,
       [columnKey]: value
     }));
-  };
+  }, []);
@@
-  const handleDelete = useCallback((id: string) => {
-    if (window.confirm('Are you sure you want to delete this order?')) {
-      deleteOrderMutation.mutate(id);
-    }
-  };
+  const handleDelete = useCallback((id: string) => {
+    if (window.confirm('Are you sure you want to delete this order?')) {
+      deleteOrderMutation.mutate(id);
+    }
+  }, [deleteOrderMutation]);
*** End Patch

