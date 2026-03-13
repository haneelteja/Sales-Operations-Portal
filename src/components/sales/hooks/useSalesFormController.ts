import { useCallback, useMemo } from 'react';
import type { Customer } from '@/types';
import type { SalesItem } from '@/components/sales/hooks/useSalesItemsManager';

type CustomerDirectoryRecord = Customer & {
  client_name?: string | null;
  branch?: string | null;
};

type SaleFormState = {
  customer_id: string;
  amount: string;
  quantity: string;
  sku: string;
  description: string;
  transaction_date: string;
  area: string;
  price_per_case?: string;
};

type EditFormState = {
  customer_id: string;
  amount: string;
  quantity: string;
  sku: string;
  description: string;
  transaction_date: string;
  area: string;
  price_per_case?: string;
};

type CurrentItemState = {
  sku: string;
  quantity: string;
  price_per_case: string;
  amount: string;
  description: string;
};

type AvailableSku = {
  id: string;
  sku: string;
  dealer_name: string;
  area: string | null;
  price_per_case: number;
};

type UseSalesFormControllerOptions = {
  customers?: CustomerDirectoryRecord[];
  saleForm: SaleFormState;
  editForm: EditFormState;
  currentItem: CurrentItemState;
  setSaleForm: React.Dispatch<React.SetStateAction<SaleFormState>>;
  setEditForm: React.Dispatch<React.SetStateAction<EditFormState>>;
  setCurrentItem: React.Dispatch<React.SetStateAction<CurrentItemState>>;
  setSalesItems: React.Dispatch<React.SetStateAction<SalesItem[]>>;
  getAvailableBranches: (customerId?: string) => string[];
  getAvailableSkus: (customerId?: string, branch?: string) => AvailableSku[];
  getCustomerName: (customer?: CustomerDirectoryRecord | null) => string;
  getCustomerBranch: (customer?: CustomerDirectoryRecord | null) => string;
  getUniqueCustomerNames: () => string[];
  normalizeLookupValue: (value: string | null | undefined) => string;
  findCustomerById: (customerId?: string) => CustomerDirectoryRecord | undefined;
  findCustomerRecord: (params: {
    customerId?: string;
    customerName?: string;
    branch?: string;
    sku?: string;
  }) => CustomerDirectoryRecord | undefined;
};

const EMPTY_ITEM: CurrentItemState = {
  sku: '',
  quantity: '',
  price_per_case: '',
  amount: '',
  description: '',
};

export function useSalesFormController({
  customers,
  saleForm,
  editForm,
  currentItem,
  setSaleForm,
  setEditForm,
  setCurrentItem,
  setSalesItems,
  getAvailableBranches,
  getAvailableSkus,
  getCustomerName,
  getCustomerBranch,
  getUniqueCustomerNames,
  normalizeLookupValue,
  findCustomerById,
  findCustomerRecord,
}: UseSalesFormControllerOptions) {
  const handleCustomerChange = useCallback((customerName: string) => {
    const dealerCustomers = customers?.filter((customer) =>
      normalizeLookupValue(getCustomerName(customer)) === normalizeLookupValue(customerName)
    ) || [];
    const selectedCustomer = dealerCustomers[0];
    const branches = [...new Set(dealerCustomers.map((customer) => getCustomerBranch(customer)).filter(Boolean))];
    const autoArea = branches.length === 1 ? branches[0] : '';
    const customerForArea = autoArea
      ? dealerCustomers.find((customer) =>
          normalizeLookupValue(getCustomerBranch(customer)) === normalizeLookupValue(autoArea)
        )
      : selectedCustomer;

    setSaleForm((prev) => ({
      ...prev,
      customer_id: customerForArea?.id || selectedCustomer?.id || '',
      area: autoArea,
    }));

    setCurrentItem(EMPTY_ITEM);
    setSalesItems([]);
  }, [
    customers,
    getCustomerBranch,
    getCustomerName,
    normalizeLookupValue,
    setCurrentItem,
    setSaleForm,
    setSalesItems,
  ]);

  const handleAreaChange = useCallback((area: string) => {
    const selectedCustomer = findCustomerById(saleForm.customer_id);

    if (selectedCustomer) {
      const matchingCustomer = findCustomerRecord({
        customerName: getCustomerName(selectedCustomer),
        branch: area,
      });

      setSaleForm((prev) => ({
        ...prev,
        area,
        customer_id: matchingCustomer?.id || prev.customer_id,
      }));
    } else {
      setSaleForm((prev) => ({ ...prev, area }));
    }

    setCurrentItem((prev) => ({ ...prev, sku: '', price_per_case: '', amount: '' }));
    setSalesItems([]);
  }, [
    findCustomerById,
    findCustomerRecord,
    getCustomerName,
    saleForm.customer_id,
    setCurrentItem,
    setSaleForm,
    setSalesItems,
  ]);

  const handleEditCustomerChange = useCallback((customerName: string) => {
    const selectedCustomer = customers?.find((customer) =>
      normalizeLookupValue(getCustomerName(customer)) === normalizeLookupValue(customerName)
    );

    setEditForm((prev) => ({
      ...prev,
      customer_id: selectedCustomer?.id || '',
      area: '',
      sku: '',
      amount: '',
      price_per_case: '',
    }));
  }, [customers, getCustomerName, normalizeLookupValue, setEditForm]);

  const availableSkus = useMemo(() => {
    return getAvailableSkus(saleForm.customer_id, saleForm.area);
  }, [getAvailableSkus, saleForm.area, saleForm.customer_id]);

  const availableAreas = useMemo(() => {
    return getAvailableBranches(saleForm.customer_id);
  }, [getAvailableBranches, saleForm.customer_id]);

  const availableAreasForEdit = useMemo(() => {
    return getAvailableBranches(editForm.customer_id);
  }, [editForm.customer_id, getAvailableBranches]);

  const uniqueCustomersForForm = useMemo(() => {
    return getUniqueCustomerNames();
  }, [getUniqueCustomerNames]);

  const getBranchesForCustomer = useCallback((customerId: string) => {
    if (!customers || !customerId) return [];

    const customer = findCustomerById(customerId);
    if (!customer) return [];

    return customers
      .filter((entry) =>
        normalizeLookupValue(getCustomerName(entry)) ===
        normalizeLookupValue(getCustomerName(customer))
      )
      .map((entry) => getCustomerBranch(entry))
      .filter((branch, index, self) => !!branch && self.indexOf(branch) === index)
      .sort();
  }, [customers, findCustomerById, getCustomerBranch, getCustomerName, normalizeLookupValue]);

  const getPricePerCaseForCurrentItem = useCallback(() => {
    if (!saleForm.customer_id || !saleForm.area || !currentItem.sku) return '';

    const customerPricing = findCustomerRecord({
      customerId: saleForm.customer_id,
      branch: saleForm.area,
      sku: currentItem.sku,
    });

    return customerPricing?.price_per_case?.toString() || '';
  }, [currentItem.sku, findCustomerRecord, saleForm.area, saleForm.customer_id]);

  const getPricePerCaseForEdit = useCallback(() => {
    if (!editForm.customer_id || !editForm.area) return '';

    const customer = findCustomerRecord({
      customerId: editForm.customer_id,
      branch: editForm.area,
    });

    return customer?.price_per_case?.toString() || '';
  }, [editForm.area, editForm.customer_id, findCustomerRecord]);

  return {
    availableAreas,
    availableAreasForEdit,
    availableSkus,
    uniqueCustomersForForm,
    getBranchesForCustomer,
    getPricePerCaseForCurrentItem,
    getPricePerCaseForEdit,
    handleAreaChange,
    handleCustomerChange,
    handleEditCustomerChange,
  };
}
