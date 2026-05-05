import { useCallback, useMemo } from 'react';
import type { Customer } from '@/types';

type CustomerDirectoryRecord = Customer & {
  client_name?: string | null;
  branch?: string | null;
};

type TransactionLike = {
  branch?: string | null;
  area?: string | null;
  customers?: {
    branch?: string | null;
    area?: string | null;
  } | null;
};

type CustomerLookupParams = {
  customerId?: string;
  customerName?: string;
  branch?: string;
  sku?: string;
};

type AvailableSku = {
  id: string;
  sku: string;
  dealer_name: string;
  area: string | null;
  price_per_case: number;
};

const normalizeLookupValue = (value: string | null | undefined): string =>
  (value ?? '').trim().toLowerCase();

export function useCustomerDirectory(customers: CustomerDirectoryRecord[] | undefined) {
  const customerById = useMemo(() => {
    const index = new Map<string, CustomerDirectoryRecord>();
    customers?.forEach((customer) => {
      index.set(customer.id, customer);
    });
    return index;
  }, [customers]);

  const getCustomerName = useCallback((customer?: CustomerDirectoryRecord | null) => {
    return customer?.client_name || customer?.dealer_name || '';
  }, []);

  const getCustomerBranch = useCallback((customer?: CustomerDirectoryRecord | null) => {
    return customer?.branch || customer?.area || '';
  }, []);

  const getTransactionBranch = useCallback((transaction?: TransactionLike | null) => {
    return (
      transaction?.branch ||
      transaction?.area ||
      transaction?.customers?.branch ||
      transaction?.customers?.area ||
      ''
    );
  }, []);

  const findCustomerById = useCallback((customerId?: string) => {
    return customerId ? customerById.get(customerId) : undefined;
  }, [customerById]);

  const findCustomerRecord = useCallback((params: CustomerLookupParams) => {
    if (!customers?.length) return undefined;

    const selectedCustomer = params.customerId ? customerById.get(params.customerId) : undefined;
    const normalizedName = normalizeLookupValue(
      params.customerName || getCustomerName(selectedCustomer)
    );
    const normalizedBranch = normalizeLookupValue(params.branch);
    const normalizedSku = normalizeLookupValue(params.sku);

    const matches = customers.filter((customer) => {
      const nameMatches = normalizedName
        ? normalizeLookupValue(getCustomerName(customer)) === normalizedName
        : true;
      const branchMatches = normalizedBranch
        ? normalizeLookupValue(getCustomerBranch(customer)) === normalizedBranch
        : true;
      const skuMatches = normalizedSku
        ? normalizeLookupValue(customer.sku) === normalizedSku
        : true;

      return nameMatches && branchMatches && skuMatches;
    });

    if (matches.length === 0) return undefined;
    // When multiple rows exist (different pricing_date), return the latest
    return matches.reduce((latest, current) => {
      const latestDate = new Date(latest.pricing_date || 0).getTime();
      const currentDate = new Date(current.pricing_date || 0).getTime();
      return currentDate > latestDate ? current : latest;
    });
  }, [customerById, customers, getCustomerBranch, getCustomerName]);

  const getUniqueCustomerNames = useCallback(() => {
    if (!customers?.length) return [];

    const seenNames = new Set<string>();
    const uniqueNames: string[] = [];

    customers.forEach((customer) => {
      const customerName = getCustomerName(customer);
      const normalizedName = normalizeLookupValue(customerName);

      if (customerName && !seenNames.has(normalizedName)) {
        seenNames.add(normalizedName);
        uniqueNames.push(customerName);
      }
    });

    return uniqueNames.sort((a, b) => a.localeCompare(b));
  }, [customers, getCustomerName]);

  const getAvailableBranches = useCallback((customerId?: string) => {
    const selectedCustomer = findCustomerById(customerId);
    if (!selectedCustomer || !customers?.length) return [];

    const selectedCustomerName = normalizeLookupValue(getCustomerName(selectedCustomer));
    const branchMap = new Map<string, string>();

    customers.forEach((customer) => {
      const customerNameMatches =
        normalizeLookupValue(getCustomerName(customer)) === selectedCustomerName;
      const customerBranch = getCustomerBranch(customer);
      const normalizedBranch = normalizeLookupValue(customerBranch);

      if (customerNameMatches && customerBranch && !branchMap.has(normalizedBranch)) {
        branchMap.set(normalizedBranch, customerBranch.trim());
      }
    });

    return Array.from(branchMap.values()).sort((a, b) => a.localeCompare(b));
  }, [customers, findCustomerById, getCustomerBranch, getCustomerName]);

  const getAvailableSkus = useCallback((customerId?: string, branch?: string): AvailableSku[] => {
    const selectedCustomer = findCustomerById(customerId);
    if (!selectedCustomer || !customers?.length || !branch) return [];

    const selectedCustomerName = normalizeLookupValue(getCustomerName(selectedCustomer));
    const normalizedBranch = normalizeLookupValue(branch);

    const matchingRecords = customers.filter((customer) => {
      return (
        normalizeLookupValue(getCustomerName(customer)) === selectedCustomerName &&
        normalizeLookupValue(getCustomerBranch(customer)) === normalizedBranch &&
        !!customer.sku?.trim()
      );
    });

    // Deduplicate by SKU — when the same SKU has multiple rows (different pricing_date),
    // keep only the row with the latest pricing_date so the current price is shown.
    const skuMap = new Map<string, CustomerDirectoryRecord>();
    matchingRecords.forEach((customer) => {
      const normalizedSku = normalizeLookupValue(customer.sku);
      const existing = skuMap.get(normalizedSku);
      if (!existing) {
        skuMap.set(normalizedSku, customer);
      } else {
        const existingDate = new Date(existing.pricing_date || 0).getTime();
        const currentDate = new Date(customer.pricing_date || 0).getTime();
        if (currentDate > existingDate) skuMap.set(normalizedSku, customer);
      }
    });

    return Array.from(skuMap.values()).map((customer) => ({
      id: `sku-${customer.sku}`,
      sku: customer.sku ?? '',
      dealer_name: customer.dealer_name,
      area: customer.area,
      price_per_case: customer.price_per_case || 0,
    }));
  }, [customers, findCustomerById, getCustomerBranch, getCustomerName]);

  const resolveCustomerIdForBranch = useCallback((customerId?: string, branch?: string) => {
    if (!customerId || !branch) return customerId;
    return findCustomerRecord({ customerId, branch })?.id || customerId;
  }, [findCustomerRecord]);

  const buildTransportDescription = useCallback((
    customer?: CustomerDirectoryRecord | null,
    fallbackBranch?: string
  ) => {
    const customerName = getCustomerName(customer);
    const customerBranch = getCustomerBranch(customer) || fallbackBranch || '';

    return customerName
      ? `${customerName}-${customerBranch} Transport`
      : 'Client-Branch Transport';
  }, [getCustomerBranch, getCustomerName]);

  return {
    findCustomerById,
    findCustomerRecord,
    getAvailableBranches,
    getAvailableSkus,
    getCustomerBranch,
    getCustomerName,
    getTransactionBranch,
    getUniqueCustomerNames,
    normalizeLookupValue,
    resolveCustomerIdForBranch,
    buildTransportDescription,
  };
}
