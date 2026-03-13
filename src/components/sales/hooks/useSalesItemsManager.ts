import { useCallback, useState } from 'react';
import { salesItemSchema } from '@/lib/validation/schemas';
import { safeValidate } from '@/lib/validation/utils';

export type SalesItemDraft = {
  sku: string;
  quantity: string;
  price_per_case: string;
  amount: string;
  description: string;
};

export type SalesItem = SalesItemDraft & {
  id: string;
};

type SingleSkuData = {
  sku: string;
  price_per_case: number;
} | null;

type UseSalesItemsManagerOptions = {
  onValidationError: (message: string) => void;
  onItemAdded: (sku: string) => void;
  onItemLoadedForEdit: (sku: string) => void;
};

const EMPTY_ITEM: SalesItemDraft = {
  sku: '',
  quantity: '',
  price_per_case: '',
  amount: '',
  description: '',
};

const safeCalculateAmount = (qty: string, price: string): string => {
  const q = parseFloat(qty);
  const p = parseFloat(price);
  if (isNaN(q) || isNaN(p)) return '';
  const result = q * p;
  return isNaN(result) ? '' : result.toFixed(2);
};

export function useSalesItemsManager({
  onValidationError,
  onItemAdded,
  onItemLoadedForEdit,
}: UseSalesItemsManagerOptions) {
  const [salesItems, setSalesItems] = useState<SalesItem[]>([]);
  const [currentItem, setCurrentItem] = useState<SalesItemDraft>(EMPTY_ITEM);
  const [isSingleSKUMode, setIsSingleSKUMode] = useState(false);
  const [singleSKUData, setSingleSKUData] = useState<SingleSkuData>(null);

  const resetItemsState = useCallback(() => {
    setSalesItems([]);
    setCurrentItem(EMPTY_ITEM);
    setIsSingleSKUMode(false);
    setSingleSKUData(null);
  }, []);

  const addItemToSales = useCallback(() => {
    const validationResult = safeValidate(salesItemSchema, currentItem);
    if (!validationResult.success) {
      onValidationError(validationResult.error);
      return false;
    }

    setSalesItems((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        ...currentItem,
      },
    ]);
    setCurrentItem((prev) => ({
      ...prev,
      quantity: '',
      amount: '',
      price_per_case: '',
    }));
    onItemAdded(currentItem.sku);
    return true;
  }, [currentItem, onItemAdded, onValidationError]);

  const removeItemFromSales = useCallback((itemId: string) => {
    setSalesItems((prev) => prev.filter((item) => item.id !== itemId));
  }, []);

  const editItemFromSales = useCallback((itemId: string) => {
    setSalesItems((prev) => {
      const itemToEdit = prev.find((item) => item.id === itemId);
      if (!itemToEdit) return prev;

      setCurrentItem({
        sku: itemToEdit.sku,
        quantity: itemToEdit.quantity,
        price_per_case: itemToEdit.price_per_case,
        amount: itemToEdit.amount,
        description: itemToEdit.description,
      });
      onItemLoadedForEdit(itemToEdit.sku);

      return prev.filter((item) => item.id !== itemId);
    });
  }, [onItemLoadedForEdit]);

  const calculateTotalAmount = useCallback(() => {
    return salesItems.reduce((total, item) => total + (parseFloat(item.amount) || 0), 0);
  }, [salesItems]);

  const handleCurrentItemSKUChange = useCallback((
    sku: string,
    getPricePerCase: (sku: string) => string
  ) => {
    setCurrentItem((prev) => {
      const pricePerCase = prev.quantity ? getPricePerCase(sku) : '';
      const amount = prev.quantity && pricePerCase
        ? safeCalculateAmount(prev.quantity, pricePerCase)
        : '';

      return {
        ...prev,
        sku,
        amount,
        price_per_case: pricePerCase,
      };
    });
  }, []);

  const handleCurrentItemQuantityChange = useCallback((
    quantity: string,
    getPricePerCase: (sku: string) => string
  ) => {
    setCurrentItem((prev) => {
      const pricePerCase = prev.sku ? getPricePerCase(prev.sku) : '';
      const amount = prev.sku && pricePerCase
        ? safeCalculateAmount(quantity, pricePerCase)
        : prev.amount;

      return {
        ...prev,
        quantity,
        amount,
        price_per_case: pricePerCase || prev.price_per_case,
      };
    });
  }, []);

  const syncSingleSkuMode = useCallback((availableSkus: Array<{ sku: string; price_per_case: number }>) => {
    if (availableSkus.length === 1) {
      setIsSingleSKUMode(true);
      setSingleSKUData({
        sku: availableSkus[0].sku,
        price_per_case: availableSkus[0].price_per_case,
      });
      setCurrentItem((prev) => ({
        ...prev,
        sku: availableSkus[0].sku,
        price_per_case: availableSkus[0].price_per_case.toString(),
      }));
      return;
    }

    setIsSingleSKUMode(false);
    setSingleSKUData(null);
    setCurrentItem(EMPTY_ITEM);
  }, []);

  return {
    currentItem,
    setCurrentItem,
    salesItems,
    setSalesItems,
    isSingleSKUMode,
    setIsSingleSKUMode,
    singleSKUData,
    setSingleSKUData,
    resetItemsState,
    addItemToSales,
    removeItemFromSales,
    editItemFromSales,
    calculateTotalAmount,
    handleCurrentItemSKUChange,
    handleCurrentItemQuantityChange,
    syncSingleSkuMode,
  };
}
